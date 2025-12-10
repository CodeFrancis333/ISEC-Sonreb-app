from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("calibration", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="calibrationmodel",
            name="rmse",
            field=models.FloatField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="calibrationmodel",
            name="upv_min",
            field=models.FloatField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="calibrationmodel",
            name="upv_max",
            field=models.FloatField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="calibrationmodel",
            name="rh_min",
            field=models.FloatField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="calibrationmodel",
            name="rh_max",
            field=models.FloatField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="calibrationmodel",
            name="carbonation_min",
            field=models.FloatField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="calibrationmodel",
            name="carbonation_max",
            field=models.FloatField(blank=True, null=True),
        ),
    ]
