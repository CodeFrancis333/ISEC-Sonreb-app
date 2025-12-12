from django.contrib import admin
from .models import Reading


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
