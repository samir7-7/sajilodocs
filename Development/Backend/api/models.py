from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
import uuid

class User(AbstractUser):
    avatar = models.TextField(blank=True, null=True) # Base64 or URL
    bio = models.TextField(blank=True, null=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)

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
    updated_at = models.DateTimeField(auto_now=True)
    class FolderStatus(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Active'
        DELETED = 'DELETED', 'Deleted'
        ARCHIVED = 'ARCHIVED', 'Archived'

    status = models.CharField(max_length=10, choices=FolderStatus.choices, default=FolderStatus.ACTIVE)

    def __str__(self):
        return self.name

class File(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    file = models.FileField(upload_to='uploads/')
    name = models.CharField(max_length=255)
    size = models.CharField(max_length=100) # e.g., "2.4 MB"
    type = models.CharField(max_length=255) # e.g., "pdf", "image"
    folder = models.ForeignKey(Folder, on_delete=models.CASCADE, null=True, blank=True, related_name='files')
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='files')
    description = models.TextField(blank=True)
    tags = models.JSONField(default=list, blank=True)
    metadata = models.JSONField(default=dict, blank=True) # For arbitrary metadata like author
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class FileStatus(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Active'
        DELETED = 'DELETED', 'Deleted'
        ARCHIVED = 'ARCHIVED', 'Archived'

    status = models.CharField(max_length=10, choices=FileStatus.choices, default=FileStatus.ACTIVE)
    locked_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='locked_files')
    locked_at = models.DateTimeField(null=True, blank=True)
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
    granted_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='granted_folder_shares')
    message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

class FileShare(models.Model):
    file = models.ForeignKey(File, on_delete=models.CASCADE, related_name='shares')
    shared_with = models.ForeignKey(User, on_delete=models.CASCADE, related_name='shared_files')
    permission = models.CharField(max_length=10, choices=SharePermission.choices, default=SharePermission.VIEW)
    expires_at = models.DateTimeField(null=True, blank=True)
    granted_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='granted_file_shares')
    message = models.TextField(blank=True)
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

class AuditLog(models.Model):
    class Action(models.TextChoices):
        GRANT = 'GRANT', 'Access Granted'
        REVOKE = 'REVOKE', 'Access Revoked'
        EXPIRY = 'EXPIRY', 'Access Expired'
        TRANSFER = 'TRANSFER', 'Ownership Transferred'
        RENAME = 'RENAME', 'File Renamed'
        DELETE = 'DELETE', 'File Deleted'
        EDIT = 'EDIT', 'File Content Modified'

    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    file = models.ForeignKey(File, on_delete=models.CASCADE, null=True, blank=True)
    folder = models.ForeignKey(Folder, on_delete=models.CASCADE, null=True, blank=True)
    action = models.CharField(max_length=20, choices=Action.choices)
    details = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.action} by {self.user.username if self.user else 'System'}"

class OTPVerification(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='otp_verification')
    otp_code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    def is_expired(self):
        return timezone.now() > self.expires_at

    def __str__(self):
        return f"OTP for {self.user.username}"
