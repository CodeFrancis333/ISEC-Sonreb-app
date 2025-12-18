from django.contrib import admin
from .models import Reading, Report, ReportPhoto


@admin.register(Reading)
class ReadingAdmin(admin.ModelAdmin):
    """
    Show only the free-text member field (named "Member") in the admin,
    hiding the FK dropdown to avoid duplicate inputs.
    """

    fields = [
        "project",
        "member_text",
        "location_tag",
        "upv",
        "rh_index",
        "carbonation_depth",
        "estimated_fc",
        "rating",
        "model_used",
    ]
    readonly_fields = ["estimated_fc", "rating", "model_used"]
    exclude = ["member"]


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
  list_display = ("title", "project", "folder", "date_range", "created_at")
  search_fields = ("title", "project__name", "folder")

@admin.register(ReportPhoto)
class ReportPhotoAdmin(admin.ModelAdmin):
  list_display = ("report", "caption", "location_tag", "created_at")
  search_fields = ("report__title", "caption", "location_tag")
