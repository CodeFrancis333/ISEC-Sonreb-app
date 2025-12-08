# backend/apps/projects/serializers.py
from rest_framework import serializers
from .models import Project, Member


class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = [
            "id",
            "name",
            "location",
            "client",
            "design_fc",
            "notes",
            "created_at",
            "updated_at",
        ]


class MemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = Member
        fields = [
            "id",
            "project",
            "member_id",
            "type",
            "level",
            "gridline",
            "notes",
        ]


class ProjectSummarySerializer(serializers.Serializer):
    project_id = serializers.IntegerField()
    readings_count = serializers.IntegerField()
    min_fc = serializers.FloatField(allow_null=True)
    max_fc = serializers.FloatField(allow_null=True)
    avg_fc = serializers.FloatField(allow_null=True)
    good_count = serializers.IntegerField()
    fair_count = serializers.IntegerField()
    poor_count = serializers.IntegerField()
