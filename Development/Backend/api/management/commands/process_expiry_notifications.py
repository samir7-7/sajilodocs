from django.core.management.base import BaseCommand

from api.notification_utils import create_expiry_notifications


class Command(BaseCommand):
    help = "Create in-app expiry reminder notifications for documents expiring within 30 days."

    def handle(self, *args, **options):
        created_count = create_expiry_notifications()
        self.stdout.write(self.style.SUCCESS(f"Created {created_count} expiry reminder notification(s)."))
