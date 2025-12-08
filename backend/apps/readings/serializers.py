# backend/apps/readings/serializers.py
from rest_framework import serializers
from .models import Reading


class ReadingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reading
        fields = [
            "id",
            "project",
            "member",
            "location_tag",
            "upv",
            "rh_index",
            "carbonation_depth",
            "estimated_fc",
            "rating",
            "model_used",
            "created_at",
        ]
        read_only_fields = ["estimated_fc", "rating", "model_used", "created_at"]
