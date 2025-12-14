from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("readings", "0002_report_member_text_label"),
    ]

    operations = [
        migrations.AddField(
            model_name="report",
            name="csv_url",
            field=models.CharField(blank=True, max_length=512),
        ),
        migrations.AddField(
            model_name="report",
            name="pdf_url",
            field=models.CharField(blank=True, max_length=512),
        ),
        migrations.AddField(
            model_name="report",
            name="status",
            field=models.CharField(
                choices=[("draft", "Draft"), ("processing", "Processing"), ("ready", "Ready")],
                default="draft",
                max_length=20,
            ),
        ),
    ]
