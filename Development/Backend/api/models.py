from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
import uuid

class User(AbstractUser):
    avatar = models.TextField(blank=True, null=True) # Base64 or URL
    bio = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.username

class Folder(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    color = models.CharField(max_length=50, default='#3B82F6')
    tags = models.JSONField(default=list, blank=True)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='children')
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='folders')
    created_at = models.DateTimeField(auto_now_add=True)
    is_deleted = models.BooleanField(default=False)

    def __str__(self):
        return self.name

class File(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    file = models.FileField(upload_to='uploads/')
    name = models.CharField(max_length=255)
    size = models.CharField(max_length=50) # e.g., "2.4 MB"
    type = models.CharField(max_length=50) # e.g., "pdf", "image"
    folder = models.ForeignKey(Folder, on_delete=models.CASCADE, null=True, blank=True, related_name='files')
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='files')
    description = models.TextField(blank=True)
    tags = models.JSONField(default=list, blank=True)
    metadata = models.JSONField(default=dict, blank=True) # For arbitrary metadata like author
    created_at = models.DateTimeField(auto_now_add=True)
    is_deleted = models.BooleanField(default=False)
    
    # Advanced Features
    expiry_date = models.DateField(null=True, blank=True)
    is_notarized = models.BooleanField(default=False)
    notarized_file = models.FileField(upload_to='notarized/', null=True, blank=True)

    def __str__(self):
        return self.name

class SharePermission(models.TextChoices):
    VIEW = 'VIEW', 'View Only'
    EDIT = 'EDIT', 'Edit'

class FolderShare(models.Model):
    folder = models.ForeignKey(Folder, on_delete=models.CASCADE, related_name='shares')
    shared_with = models.ForeignKey(User, on_delete=models.CASCADE, related_name='shared_folders')
    permission = models.CharField(max_length=10, choices=SharePermission.choices, default=SharePermission.VIEW)
    expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

class FileShare(models.Model):
    file = models.ForeignKey(File, on_delete=models.CASCADE, related_name='shares')
    shared_with = models.ForeignKey(User, on_delete=models.CASCADE, related_name='shared_files')
    permission = models.CharField(max_length=10, choices=SharePermission.choices, default=SharePermission.VIEW)
    expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

class NotificationType(models.TextChoices):
    EXPIRY = 'EXPIRY', 'Expiry Reminder'
    SHARE = 'SHARE', 'Document Shared'
    SYSTEM = 'SYSTEM', 'System Alert'

class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    message = models.TextField()
    type = models.CharField(max_length=20, choices=NotificationType.choices, default=NotificationType.SYSTEM)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - {self.user.username}"
