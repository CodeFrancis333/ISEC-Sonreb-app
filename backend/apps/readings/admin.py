from django.contrib import admin
from .models import Reading


@admin.register(Reading)
class ReadingAdmin(admin.ModelAdmin):
    list_display = (
        "project",
        "member",
        "estimated_fc",
        "rating",
        "upv",
        "rh_index",
        "created_at",
    )
    search_fields = ("project__name", "member__member_id", "location_tag")
    list_filter = ("rating", "project")
