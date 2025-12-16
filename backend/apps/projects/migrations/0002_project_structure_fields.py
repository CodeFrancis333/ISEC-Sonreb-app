from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("projects", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="project",
            name="structure_age",
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AddField(
            model_name="project",
            name="latitude",
            field=models.FloatField(default=0.0),
        ),
        migrations.AddField(
            model_name="project",
            name="longitude",
            field=models.FloatField(default=0.0),
        ),
    ]
