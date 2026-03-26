from rest_framework import viewsets, permissions, status, generics
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Q
from django.utils import timezone
from django.contrib.auth import get_user_model
from .models import Folder, File, FolderShare, FileShare, Notification

User = get_user_model()
from .serializers import (
    UserSerializer, RegisterSerializer, FolderSerializer, FileSerializer,
    FolderShareSerializer, FileShareSerializer, NotificationSerializer
)
from .models import Folder, File, FolderShare, FileShare, Notification, OTPVerification, AuditLog
from .utils import generate_otp, send_otp_email
from datetime import timedelta
import io
from docx import Document
from htmldocx import HtmlToDocx
from django.core.files.base import ContentFile
from .document_reconstruction import (
    analyze_document,
    apply_analysis_to_file,
    get_supported_document_types,
    save_reconstructed_pdf,
    should_require_manual_document_type,
)
from .notification_utils import create_expiry_notifications

class IsOwnerOrEditor(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if obj.owner == request.user:
            return True
        
        # Check if user has EDIT permission via share
        if isinstance(obj, File):
            return FileShare.objects.filter(
                file=obj, 
                shared_with=request.user, 
                permission='EDIT',
                expires_at__gt=timezone.now()
            ).exists() or FileShare.objects.filter(
                file=obj, 
                shared_with=request.user, 
                permission='EDIT',
                expires_at__isnull=True
            ).exists()
        
        if isinstance(obj, Folder):
            return FolderShare.objects.filter(
                folder=obj, 
                shared_with=request.user, 
                permission='EDIT',
                expires_at__gt=timezone.now()
            ).exists() or FolderShare.objects.filter(
                folder=obj, 
                shared_with=request.user, 
                permission='EDIT',
                expires_at__isnull=True
            ).exists()
        return False

class IsViewer(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        # Viewers can only READ (GET, HEAD, OPTIONS)
        if request.method in permissions.SAFE_METHODS:
            return True
        return False

class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # generate & send OTP so that user can verify email before logging in
        from .utils import generate_otp, send_otp_email
        from .models import OTPVerification

        otp_code = generate_otp()
        # set expiry 10 minutes ahead (same as email message)
        from django.utils import timezone
        from datetime import timedelta
        expires = timezone.now() + timedelta(minutes=10)
        OTPVerification.objects.create(user=user, otp_code=otp_code, expires_at=expires)
        send_otp_email(user.email, otp_code)

        return Response({
            "message": "Registration successful. Please check your inbox for a verification code.",
            "email": user.email
        }, status=status.HTTP_201_CREATED)

class VerifyOTPView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        otp_code = request.data.get('otp')
        
        if not email or not otp_code:
            return Response({"error": "Email and OTP are required."}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)
            
        try:
            verification = user.otp_verification
        except OTPVerification.DoesNotExist:
            return Response({"error": "No OTP found for this user."}, status=status.HTTP_400_BAD_REQUEST)
            
        if verification.otp_code != otp_code:
            return Response({"error": "Invalid OTP."}, status=status.HTTP_400_BAD_REQUEST)
            
        if verification.is_expired():
            return Response({"error": "OTP has expired."}, status=status.HTTP_400_BAD_REQUEST)
            
        # Activate user
        user.is_active = True
        user.save()
        
        # Delete OTP record
        verification.delete()
        
        return Response({"message": "Email verified successfully. You can now login."}, status=status.HTTP_200_OK)

class UserView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

class FolderViewSet(viewsets.ModelViewSet):
    serializer_class = FolderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Return folders owned by user OR shared with user (and not expired)
        return Folder.objects.filter(status='ACTIVE').filter(
            Q(owner=user) | 
            Q(shares__shared_with=user, shares__expires_at__gt=timezone.now()) |
            Q(shares__shared_with=user, shares__expires_at__isnull=True)
        ).distinct()

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

class FileViewSet(viewsets.ModelViewSet):
    serializer_class = FileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        category = self.request.query_params.get('category', 'all')
        
        base_query = File.objects.filter(status='ACTIVE')
        
        if category == 'mine':
            return base_query.filter(owner=user)
        elif category == 'shared':
            return base_query.filter(
                shares__shared_with=user,
                shares__expires_at__gt=timezone.now()
            ).distinct() | base_query.filter(
                shares__shared_with=user,
                shares__expires_at__isnull=True
            ).distinct()
        
        # Default: both (My Files + Shared With Me separately identified is handled in serializer)
        return (base_query.filter(owner=user) | 
                base_query.filter(shares__shared_with=user, shares__expires_at__gt=timezone.now()) |
                base_query.filter(shares__shared_with=user, shares__expires_at__isnull=True)).distinct()

    def get_permissions(self):
        if self.action in ['update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsOwnerOrEditor()]
        return [permissions.IsAuthenticated()]

    def _user_can_edit(self, file, user):
        if file.owner == user:
            return True
        return FileShare.objects.filter(
            file=file,
            shared_with=user,
            permission='EDIT'
        ).filter(Q(expires_at__gt=timezone.now()) | Q(expires_at__isnull=True)).exists()

    def perform_create(self, serializer):
        file_obj = self.request.FILES.get('file')
        size = str(file_obj.size) if file_obj else "0"
        file_type = file_obj.content_type if file_obj else "unknown"
        serializer.save(owner=self.request.user, size=size, type=file_type)

    def perform_update(self, serializer):
        instance = serializer.save()
        updated_fields = list(self.request.data.keys())
        action = AuditLog.Action.RENAME if updated_fields == ['name'] else AuditLog.Action.EDIT
        AuditLog.objects.create(
            user=self.request.user,
            file=instance,
            action=action,
            details={'updated_fields': updated_fields}
        )

    @action(detail=True, methods=['post'])
    def lock(self, request, pk=None):
        file = self.get_object()
        if file.locked_by and file.locked_by != request.user:
            return Response({"error": f"File is locked by {file.locked_by.username}"}, status=status.HTTP_409_CONFLICT)
        
        file.locked_by = request.user
        file.locked_at = timezone.now()
        file.save()
        return Response({"status": "File locked successfully"})

    @action(detail=True, methods=['post'])
    def unlock(self, request, pk=None):
        file = self.get_object()
        if file.locked_by and file.locked_by != request.user:
             return Response({"error": "You do not hold the lock for this file"}, status=status.HTTP_403_FORBIDDEN)
        
        file.locked_by = None
        file.locked_at = None
        file.save()
        return Response({"status": "File unlocked successfully"})

    @action(detail=True, methods=['post'])
    def save_content(self, request, pk=None):
        file = self.get_object()
        
        # Check permission and lock
        if file.owner != request.user:
            # Check share permission
            can_edit = FileShare.objects.filter(
                file=file, shared_with=request.user, permission='EDIT'
            ).filter(Q(expires_at__gt=timezone.now()) | Q(expires_at__isnull=True)).exists()
            if not can_edit:
                return Response({"error": "No edit permission"}, status=status.HTTP_403_FORBIDDEN)
        
        if file.locked_by and file.locked_by != request.user:
            return Response({"error": "File is locked by another user"}, status=status.HTTP_409_CONFLICT)

        html_content = request.data.get('content')
        if not html_content:
            return Response({"error": "No content provided"}, status=status.HTTP_400_BAD_REQUEST)

        # Convert HTML to DOCX
        try:
            print(f"DEBUG: Received content length: {len(html_content)}")
            new_docx = Document()
            new_parser = HtmlToDocx()
            new_parser.add_html_to_document(html_content, new_docx)
            
            buffer = io.BytesIO()
            new_docx.save(buffer)
            buffer.seek(0)
            
            # Save back to file field - ensuring we overwrite the existing file
            import os
            
            # Get the path for storage
            old_path = file.file.name
            
            # To ensure overwriting and prevent Django from adding suffixes like _1, _2
            # we explicitly delete the old file if it exists in storage.
            if file.file.storage.exists(old_path):
                file.file.storage.delete(old_path)
            
            # Save the new content with the EXACT same filename
            file.file.save(os.path.basename(old_path), ContentFile(buffer.read()), save=True)
            
            # Update size manually just to be sure
            file.size = str(file.file.size)
            file.save()

            print(f"DEBUG: Saved file size: {file.size}")

            AuditLog.objects.create(
                user=request.user,
                file=file,
                action=AuditLog.Action.EDIT,
                details={'action': 'save_content', 'size': file.size}
            )
            
            return Response({"status": "Content saved successfully", "size": file.size})
        except Exception as e:
            print(f"DEBUG: Save failed with error: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def perform_destroy(self, instance):
        instance.status = 'DELETED'
        instance.save()
        AuditLog.objects.create(
            user=self.request.user,
            file=instance,
            action=AuditLog.Action.DELETE
        )

    @action(detail=True, methods=['post'])
    def run_ocr(self, request, pk=None):
        file = self.get_object()
        
        # Check permissions
        if not self._user_can_edit(file, request.user):
            return Response({"error": "No permission to run OCR"}, status=status.HTTP_403_FORBIDDEN)

        if file.ocr_status == 'PROCESSING':
            return Response({"error": "OCR is already in progress"}, status=status.HTTP_409_CONFLICT)

        # Update status to processing
        file.ocr_status = 'PROCESSING'
        file.save()

        # Create persistent notification for start
        from .models import Notification
        Notification.objects.create(
            user=request.user,
            title="OCR Started",
            message=f"Text extraction for '{file.name}' has started. You can continue working; we'll notify you when it's done.",
            type='INFO'
        )

        # Run OCR in a background thread
        import threading
        from .ocr import OCRProcessor
        
        def process_ocr_task(file_id, user_id):
            curr_user = None
            try:
                from .models import File, Notification
                curr_file = File.objects.get(id=file_id)
                curr_user = User.objects.get(id=user_id)
                
                # Perform OCR
                text = OCRProcessor.process_file(curr_file.file.path)
                text = text.strip() if text else ""
                analysis = analyze_document(
                    tags=curr_file.tags,
                    metadata=curr_file.metadata,
                    text=text,
                    file_name=curr_file.name,
                    preserve_manual_document_type=curr_file.document_type if curr_file.document_type_source == 'MANUAL' else None,
                    preferred_document_type_source=curr_file.document_type_source if curr_file.document_type_source == 'MANUAL' else None,
                )
                
                # Update file
                curr_file.ocr_text = text
                curr_file.corrected_ocr_text = text
                curr_file.ocr_status = 'COMPLETED'
                curr_file.ocr_extracted_at = timezone.now()
                apply_analysis_to_file(curr_file, analysis, reviewed_text=text)
                curr_file.save()
                
                # Create notification
                if text:
                    expiry_note = ""
                    if curr_file.expiry_text:
                        expiry_note = f" Expiry detected: {curr_file.expiry_text}."
                    Notification.objects.create(
                        user=curr_user,
                        title="OCR Completed",
                        message=f"Text extraction for '{curr_file.name}' is complete.{expiry_note}",
                        type='SUCCESS'
                    )
                else:
                    Notification.objects.create(
                        user=curr_user,
                        title="OCR Processed",
                        message=f"Processing finished for '{curr_file.name}', but no text was detected.",
                        type='INFO'
                    )
                
                print(f"DEBUG: OCR completed for {curr_file.name} (Text found: {bool(text)})")
                
            except Exception as e:
                print(f"DEBUG: OCR task failed: {str(e)}")
                try:
                    failed_file = File.objects.get(id=file_id)
                    failed_file.ocr_status = 'FAILED'
                    failed_file.save()
                    
                    if curr_user:
                        Notification.objects.create(
                            user=curr_user,
                            title="OCR Failed",
                            message=f"Text extraction for '{failed_file.name}' failed: {str(e)}",
                            type='ERROR'
                        )
                except Exception:
                    pass

        thread = threading.Thread(target=process_ocr_task, args=(file.id, request.user.id))
        thread.start()

        return Response({"status": "OCR started in background", "ocr_status": "PROCESSING"})

    @action(detail=True, methods=['post'])
    def generate_notarized(self, request, pk=None):
        file = self.get_object()

        if not self._user_can_edit(file, request.user):
            return Response({"error": "No permission to generate reconstructed PDF"}, status=status.HTTP_403_FORBIDDEN)

        reviewed_text = (request.data.get('corrected_ocr_text') or file.corrected_ocr_text or file.ocr_text or "").strip()
        if not reviewed_text:
            return Response({"error": "No OCR text available. Run OCR first."}, status=status.HTTP_400_BAD_REQUEST)

        selected_document_type = (request.data.get('document_type') or "").strip() or None
        preferred_document_type = None
        preferred_document_type_source = None
        if file.document_type and not selected_document_type:
            if file.document_type_source == 'MANUAL':
                preferred_document_type = file.document_type
                preferred_document_type_source = 'MANUAL'
            elif (file.document_type_confidence or 0) >= 0.72:
                preferred_document_type = file.document_type
                preferred_document_type_source = file.document_type_source or 'CONTENT'

        analysis = analyze_document(
            tags=file.tags,
            metadata=file.metadata,
            text=reviewed_text,
            file_name=file.name,
            selected_document_type=selected_document_type,
            preserve_manual_document_type=preferred_document_type,
            preferred_document_type_source=preferred_document_type_source,
        )

        if selected_document_type is None and should_require_manual_document_type(file, analysis):
            return Response(
                {
                    "error": "Document type selection is required before generating the reconstructed version.",
                    "requires_document_type": True,
                    "detected_document_type": analysis.get("detected_document_type"),
                    "detected_document_type_label": analysis.get("detected_document_type_label"),
                    "document_type_confidence": analysis.get("document_type_confidence"),
                    "supported_document_types": get_supported_document_types(),
                    "candidates": analysis.get("detection_candidates", []),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        apply_analysis_to_file(file, analysis, reviewed_text=reviewed_text)
        save_reconstructed_pdf(file)
        file.save()

        AuditLog.objects.create(
            user=request.user,
            file=file,
            action=AuditLog.Action.EDIT,
            details={
                'action': 'generate_notarized',
                'document_type': file.document_type,
                'expiry_date': file.expiry_date.isoformat() if file.expiry_date else None,
            }
        )

        Notification.objects.create(
            user=request.user,
            title="Reconstructed PDF Ready",
            message=f"Your reconstructed copy for '{file.name}' is ready to download.",
            type='SUCCESS'
        )

        serializer = self.get_serializer(file)
        return Response(
            {
                "status": "generated",
                "file": serializer.data,
                "notarized_file_url": serializer.data.get("notarized_file_url"),
                "supported_document_types": get_supported_document_types(),
            }
        )

    @action(detail=True, methods=['post'])
    def translate(self, request, pk=None):
        file = self.get_object()
        target_lang = request.data.get('target_language')
        
        if not target_lang:
            return Response({"error": "target_language is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        if not file.ocr_text:
            return Response({"error": "No OCR text found for translation. Run OCR first."}, status=status.HTTP_400_BAD_REQUEST)

        # Check permissions
        if file.owner != request.user:
            can_edit = FileShare.objects.filter(
                file=file, shared_with=request.user, permission='EDIT'
            ).filter(Q(expires_at__gt=timezone.now()) | Q(expires_at__isnull=True)).exists()
            if not can_edit:
                return Response({"error": "No permission to translate"}, status=status.HTTP_403_FORBIDDEN)

        if file.translation_status == 'PROCESSING':
            return Response({"error": "Translation is already in progress"}, status=status.HTTP_409_CONFLICT)

        # Update status to processing
        file.translation_status = 'PROCESSING'
        file.translation_language = target_lang
        file.save()

        # Create notification
        from .models import Notification
        Notification.objects.create(
            user=request.user,
            title="Translation Started",
            message=f"Translating '{file.name}' to {target_lang}...",
            type='INFO'
        )

        import threading
        from .translation import TranslationProcessor
        
        def process_translation_task(file_id, user_id, language):
            curr_file = None
            curr_user = None
            try:
                from .models import File, Notification
                curr_file = File.objects.get(id=file_id)
                curr_user = User.objects.get(id=user_id)
                
                # Perform Translation
                translated_text = TranslationProcessor.translate_text(curr_file.ocr_text, language)
                
                # Update file
                curr_file.translated_text = translated_text
                curr_file.translation_status = 'COMPLETED'
                curr_file.save()
                
                # Create notification
                Notification.objects.create(
                    user=curr_user,
                    title="Translation Completed",
                    message=f"Translation for '{curr_file.name}' to {language} is complete.",
                    type='SUCCESS'
                )
                
            except Exception as e:
                print(f"DEBUG: Translation task failed: {str(e)}")
                try:
                    from .models import File, Notification
                    if curr_file is None:
                        curr_file = File.objects.get(id=file_id)
                    if curr_user is None:
                        curr_user = User.objects.get(id=user_id)
                    
                    curr_file.translation_status = 'FAILED'
                    curr_file.save()
                    
                    Notification.objects.create(
                        user=curr_user,
                        title="Translation Failed",
                        message=f"Translation for '{curr_file.name}' failed: {str(e)}",
                        type='ERROR'
                    )
                except Exception as inner_e:
                    print(f"DEBUG: Error handling failed: {str(inner_e)}")
                    pass

        thread = threading.Thread(target=process_translation_task, args=(file.id, request.user.id, target_lang))
        thread.start()

        return Response({"status": "Translation started in background", "translation_status": "PROCESSING"})

class FolderShareViewSet(viewsets.ModelViewSet):
    serializer_class = FolderShareSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Users can see shares they created or shares sent to them
        return FolderShare.objects.filter(
            Q(folder__owner=self.request.user) | Q(shared_with=self.request.user)
        )

    def perform_create(self, serializer):
        folder = serializer.validated_data['folder']
        # Check if Owner OR Editor
        is_owner = folder.owner == self.request.user
        is_editor = FolderShare.objects.filter(
            folder=folder, shared_with=self.request.user, permission='EDIT'
        ).filter(Q(expires_at__gt=timezone.now()) | Q(expires_at__isnull=True)).exists()

        if not (is_owner or is_editor):
            raise permissions.PermissionDenied("You do not have permission to share this folder.")
        
        share = serializer.save(granted_by=self.request.user)
        # Create notification
        Notification.objects.create(
            user=share.shared_with,
            title="Folder Shared",
            message=f"{self.request.user.username} shared folder '{folder.name}' with you.",
            type='SHARE'
        )

class FileShareViewSet(viewsets.ModelViewSet):
    serializer_class = FileShareSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return FileShare.objects.filter(
            Q(file__owner=self.request.user) | Q(shared_with=self.request.user)
        )

    def perform_create(self, serializer):
        file = serializer.validated_data['file']
        # Check if Owner OR Editor
        is_owner = file.owner == self.request.user
        is_editor = FileShare.objects.filter(
            file=file, shared_with=self.request.user, permission='EDIT'
        ).filter(Q(expires_at__gt=timezone.now()) | Q(expires_at__isnull=True)).exists()

        if not (is_owner or is_editor):
            raise permissions.PermissionDenied("You do not have permission to share this file.")
        
        share = serializer.save(granted_by=self.request.user)
        Notification.objects.create(
            user=share.shared_with,
            title="File Shared",
            message=f"{self.request.user.username} shared file '{file.name}' with you.",
            type='SHARE'
        )

class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        create_expiry_notifications(user=self.request.user)
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'status': 'marked as read'})

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        self.get_queryset().update(is_read=True)
        return Response({'status': 'marked all as read'})
