from django.contrib import admin
from .models import CalibrationPoint, CalibrationModel


@admin.register(CalibrationPoint)
class CalibrationPointAdmin(admin.ModelAdmin):
    list_display = (
        "project",
        "member",
        "core_fc",
        "upv",
        "rh_index",
        "carbonation_depth",
        "created_at",
    )
    search_fields = ("project__name", "member__member_id")
    list_filter = ("project",)


@admin.register(CalibrationModel)
class CalibrationModelAdmin(admin.ModelAdmin):
    list_display = (
        "project",
        "a0",
        "a1",
        "a2",
        "a3",
        "r2",
        "points_used",
        "use_carbonation",
        "created_at",
    )
    list_filter = ("project", "use_carbonation")
