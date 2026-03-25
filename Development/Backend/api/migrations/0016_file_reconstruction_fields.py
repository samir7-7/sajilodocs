from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0015_merge_20260315_1042"),
    ]

    operations = [
        migrations.AddField(
            model_name="file",
            name="corrected_ocr_text",
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="file",
            name="document_type",
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AddField(
            model_name="file",
            name="document_type_confidence",
            field=models.FloatField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="file",
            name="document_type_source",
            field=models.CharField(blank=True, max_length=20, null=True),
        ),
        migrations.AddField(
            model_name="file",
            name="extracted_fields",
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AddField(
            model_name="file",
            name="expiry_date",
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="file",
            name="expiry_notification_sent_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="file",
            name="expiry_text",
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name="file",
            name="notarized_generated_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
