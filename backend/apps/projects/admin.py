from django.contrib import admin
from .models import Project, Member


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ("name", "location", "client", "design_fc", "created_at")
    search_fields = ("name", "location", "client")
    list_filter = ("location",)


@admin.register(Member)
class MemberAdmin(admin.ModelAdmin):
    list_display = ("member_id", "type", "project", "level", "gridline")
    search_fields = ("member_id", "project__name", "level", "gridline")
    list_filter = ("type", "project")
