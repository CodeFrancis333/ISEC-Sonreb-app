# backend/apps/readings/models.py
from django.db import models
from apps.projects.models import Project, Member


class Reading(models.Model):
    RATING_CHOICES = [
        ("GOOD", "GOOD"),
        ("FAIR", "FAIR"),
        ("POOR", "POOR"),
    ]

    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, related_name="readings"
    )
    member = models.ForeignKey(
        Member, on_delete=models.SET_NULL, null=True, blank=True, related_name="readings"
    )
    location_tag = models.CharField(max_length=255, blank=True)

    upv = models.FloatField()               # m/s
    rh_index = models.FloatField()          # rebound index
    carbonation_depth = models.FloatField(null=True, blank=True)  # mm

    estimated_fc = models.FloatField()      # MPa
    rating = models.CharField(
        max_length=10, choices=RATING_CHOICES
    )
    model_used = models.CharField(max_length=50)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.project.name} - {self.member} - {self.estimated_fc:.1f} MPa"
