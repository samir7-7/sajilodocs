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
        
        return Response({
            "message": "Registration successful. You can now login.",
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

    def perform_create(self, serializer):
        file_obj = self.request.FILES.get('file')
        size = str(file_obj.size) if file_obj else "0"
        file_type = file_obj.content_type if file_obj else "unknown"
        serializer.save(owner=self.request.user, size=size, type=file_type)

    def perform_update(self, serializer):
        instance = serializer.save()
        AuditLog.objects.create(
            user=self.request.user,
            file=instance,
            action='RENAME' if 'name' in self.request.data else 'GRANT', # Simplified for now
            details={'updated_fields': list(self.request.data.keys())}
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
            new_docx = Document()
            new_parser = HtmlToDocx()
            new_parser.add_html_to_document(html_content, new_docx)
            
            buffer = io.BytesIO()
            new_docx.save(buffer)
            buffer.seek(0)
            
            # Save back to file field - ensuring we overwrite the existing file
            import os
            from django.conf import settings
            
            # Get the relative path for storage
            old_path = file.file.name
            
            # Save new content - using the same name to encourage overwriting
            # but Django FileField.save often appends suffixes if the file exists.
            # To be sure, we delete the previous one if it exists.
            if file.file.storage.exists(old_path):
                file.file.storage.delete(old_path)
            
            file.file.save(os.path.basename(old_path), ContentFile(buffer.read()), save=True)
            
            # Update size
            file.size = str(file.file.size)
            file.save()

            AuditLog.objects.create(
                user=request.user,
                file=file,
                action=AuditLog.Action.EDIT,
                details={'action': 'save_content'}
            )
            
            return Response({"status": "Content saved successfully", "size": file.size})
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def perform_destroy(self, instance):
        instance.status = 'DELETED'
        instance.save()
        AuditLog.objects.create(
            user=self.request.user,
            file=instance,
            action=AuditLog.Action.DELETE
        )

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
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        self.get_queryset().update(is_read=True)
        return Response({'status': 'marked all as read'})
