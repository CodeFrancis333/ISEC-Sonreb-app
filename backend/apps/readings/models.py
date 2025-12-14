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
    member_text = models.CharField("Member", max_length=255, blank=True)
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
        label = self.member.member_id if self.member else (self.member_text or "No member")
        return f"{self.project.name} - {label} - {self.estimated_fc:.1f} MPa"


class Report(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="reports")
    title = models.CharField(max_length=255)
    folder = models.CharField(max_length=255, blank=True)  # readings folder label
    date_range = models.CharField(max_length=255, blank=True)
    company = models.CharField(max_length=255, blank=True)
    client_name = models.CharField(max_length=255, blank=True)
    engineer_name = models.CharField(max_length=255, blank=True)
    engineer_title = models.CharField(max_length=255, blank=True)
    engineer_license = models.CharField(max_length=255, blank=True)
    active_model_id = models.CharField(max_length=255, blank=True)
    notes = models.TextField(blank=True)
    logo_url = models.CharField(max_length=512, blank=True)
    signature_url = models.CharField(max_length=512, blank=True)
    status = models.CharField(
        max_length=20,
        choices=[("draft", "Draft"), ("processing", "Processing"), ("ready", "Ready")],
        default="draft",
    )
    pdf_url = models.CharField(max_length=512, blank=True)
    csv_url = models.CharField(max_length=512, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Report: {self.title} ({self.project.name})"


class ReportPhoto(models.Model):
    report = models.ForeignKey(Report, on_delete=models.CASCADE, related_name="photos")
    image_url = models.CharField(max_length=512)
    caption = models.CharField(max_length=255, blank=True)
    location_tag = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Photo for {self.report.title}"


class ReadingFolder(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="reading_folders")
    name = models.CharField(max_length=255)
    date_range = models.CharField(max_length=255, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("project", "name")
        ordering = ["name"]

    def __str__(self):
        return f"{self.project.name} - {self.name}"
