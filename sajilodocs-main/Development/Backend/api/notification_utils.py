from __future__ import annotations

from datetime import timedelta

from django.db.models import Q
from django.utils import timezone

from .models import File, Notification, NotificationType


def create_expiry_notifications(*, user=None) -> int:
    today = timezone.now().date()
    reminder_cutoff = today + timedelta(days=30)

    due_files = File.objects.filter(
        status=File.FileStatus.ACTIVE,
        expiry_date__isnull=False,
        expiry_date__lte=reminder_cutoff,
    ).filter(Q(expiry_notification_sent_at__isnull=True))

    if user is not None:
        due_files = due_files.filter(owner=user)

    created_count = 0
    for file_obj in due_files.select_related("owner"):
        expiry_date = file_obj.expiry_date
        if not expiry_date:
            continue

        Notification.objects.create(
            user=file_obj.owner,
            title="Document Expiry Reminder",
            message=f"'{file_obj.name}' is due to expire on {expiry_date:%B %d, %Y}. Please review it soon.",
            type=NotificationType.EXPIRY,
        )
        file_obj.expiry_notification_sent_at = timezone.now()
        file_obj.save(update_fields=["expiry_notification_sent_at"])
        created_count += 1

    return created_count
