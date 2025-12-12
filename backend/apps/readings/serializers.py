# backend/apps/readings/serializers.py
from rest_framework import serializers
from .models import Reading


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
