from rest_framework import viewsets, permissions, status, generics
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Q
from django.utils import timezone
from .models import Folder, File, FolderShare, FileShare, Notification
from .serializers import (
    UserSerializer, RegisterSerializer, FolderSerializer, FileSerializer,
    FolderShareSerializer, FileShareSerializer, NotificationSerializer
)

class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

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
        return Folder.objects.filter(
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
        return File.objects.filter(
            Q(owner=user) | 
            Q(shares__shared_with=user, shares__expires_at__gt=timezone.now()) |
            Q(shares__shared_with=user, shares__expires_at__isnull=True)
        ).distinct()

    def perform_create(self, serializer):
        file_obj = self.request.FILES.get('file')
        size = f"{file_obj.size / 1024 / 1024:.2f} MB" if file_obj else "0 MB"
        file_type = file_obj.content_type if file_obj else "unknown"
        serializer.save(owner=self.request.user, size=size, type=file_type)

class FolderShareViewSet(viewsets.ModelViewSet):
    serializer_class = FolderShareSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Users can see shares they created or shares sent to them
        return FolderShare.objects.filter(
            Q(folder__owner=self.request.user) | Q(shared_with=self.request.user)
        )

    def perform_create(self, serializer):
        # Ensure only owner can share
        folder = serializer.validated_data['folder']
        if folder.owner != self.request.user:
            raise permissions.PermissionDenied("You do not own this folder.")
        
        share = serializer.save()
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
        if file.owner != self.request.user:
            raise permissions.PermissionDenied("You do not own this file.")
        
        share = serializer.save()
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
