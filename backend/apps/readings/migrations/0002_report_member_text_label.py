from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("readings", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="reading",
            name="member_text",
            field=models.CharField(blank=True, max_length=255, verbose_name="Member"),
        ),
        migrations.CreateModel(
            name="Report",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("title", models.CharField(max_length=255)),
                ("folder", models.CharField(blank=True, max_length=255)),
                ("date_range", models.CharField(blank=True, max_length=255)),
                ("company", models.CharField(blank=True, max_length=255)),
                ("client_name", models.CharField(blank=True, max_length=255)),
                ("engineer_name", models.CharField(blank=True, max_length=255)),
                ("engineer_title", models.CharField(blank=True, max_length=255)),
                ("engineer_license", models.CharField(blank=True, max_length=255)),
                ("active_model_id", models.CharField(blank=True, max_length=255)),
                ("notes", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "project",
                    models.ForeignKey(
                        on_delete=models.deletion.CASCADE,
                        related_name="reports",
                        to="projects.project",
                    ),
                ),
            ],
        ),
    ]
