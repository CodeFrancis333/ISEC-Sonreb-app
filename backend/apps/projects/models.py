# backend/apps/projects/models.py
from django.conf import settings
from django.db import models


class Project(models.Model):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="projects",
    )
    name = models.CharField(max_length=255)
    location = models.CharField(max_length=255)
    client = models.CharField(max_length=255, blank=True)
    structure_age = models.PositiveIntegerField(default=0)
    latitude = models.FloatField(default=0.0)
    longitude = models.FloatField(default=0.0)
    design_fc = models.FloatField(null=True, blank=True)  # MPa
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class Member(models.Model):
    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, related_name="members"
    )
    member_id = models.CharField(max_length=50)  # e.g. C1, B1
    type = models.CharField(max_length=50)       # Beam, Column, etc.
    level = models.CharField(max_length=50, blank=True)
    gridline = models.CharField(max_length=50, blank=True)
    notes = models.TextField(blank=True)

    def __str__(self):
        return f"{self.project.name} - {self.member_id}"
