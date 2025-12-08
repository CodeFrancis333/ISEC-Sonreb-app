# backend/apps/calibration/models.py
from django.db import models
from apps.projects.models import Project, Member


class CalibrationPoint(models.Model):
    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, related_name="calibration_points"
    )
    member = models.ForeignKey(
        Member,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="calibration_points",
    )
    upv = models.FloatField()
    rh_index = models.FloatField()
    carbonation_depth = models.FloatField(null=True, blank=True)
    core_fc = models.FloatField()  # MPa
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.project.name} - {self.core_fc:.1f} MPa"


class CalibrationModel(models.Model):
    project = models.OneToOneField(
        Project, on_delete=models.CASCADE, related_name="calibration_model"
    )
    a0 = models.FloatField()
    a1 = models.FloatField()
    a2 = models.FloatField()
    a3 = models.FloatField(null=True, blank=True)
    r2 = models.FloatField()
    points_used = models.PositiveIntegerField()
    use_carbonation = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Model for {self.project.name} (R² = {self.r2:.3f})"
