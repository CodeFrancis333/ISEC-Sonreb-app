# backend/apps/readings/serializers.py
from rest_framework import serializers
from .models import Reading, Report, ReportPhoto, ReadingFolder


class ReadingSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source="project.name", read_only=True)
    member_label = serializers.SerializerMethodField()

    def get_member_label(self, obj):
        if obj.member:
            return obj.member.member_id
        if obj.member_text:
            return obj.member_text
        return None

    class Meta:
        model = Reading
        fields = [
            "id",
            "project",
            "member",
            "member_text",
            "location_tag",
            "upv",
            "rh_index",
            "carbonation_depth",
            "estimated_fc",
            "rating",
            "model_used",
            "created_at",
            "project_name",
            "member_label",
        ]
        read_only_fields = [
            "estimated_fc",
            "rating",
            "model_used",
            "created_at",
            "project_name",
            "member_label",
        ]


class ReportSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source="project.name", read_only=True)
    photos = serializers.SerializerMethodField()

    def get_photos(self, obj):
        return ReportPhotoSerializer(obj.photos.all(), many=True).data

    class Meta:
        model = Report
        fields = [
            "id",
            "project",
            "project_name",
            "title",
            "folder",
            "date_range",
            "company",
            "client_name",
            "engineer_name",
            "engineer_title",
            "engineer_license",
            "active_model_id",
            "notes",
            "logo_url",
            "signature_url",
            "photos",
            "status",
            "pdf_url",
            "csv_url",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at", "project_name", "status", "pdf_url", "csv_url"]


class ReportPhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReportPhoto
        fields = ["id", "report", "image_url", "caption", "location_tag", "created_at"]
        read_only_fields = ["created_at"]


class ReadingFolderSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReadingFolder
        fields = ["id", "project", "name", "date_range", "notes", "created_at"]
        read_only_fields = ["created_at"]
