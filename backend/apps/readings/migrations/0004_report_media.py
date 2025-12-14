from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("readings", "0003_report_export_fields"),
    ]

    operations = [
        migrations.AddField(
            model_name="report",
            name="logo_url",
            field=models.CharField(blank=True, max_length=512),
        ),
        migrations.AddField(
            model_name="report",
            name="signature_url",
            field=models.CharField(blank=True, max_length=512),
        ),
        migrations.CreateModel(
            name="ReportPhoto",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("image_url", models.CharField(max_length=512)),
                ("caption", models.CharField(blank=True, max_length=255)),
                ("location_tag", models.CharField(blank=True, max_length=255)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "report",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, related_name="photos", to="readings.report"
                    ),
                ),
            ],
        ),
    ]
