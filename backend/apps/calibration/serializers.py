# backend/apps/calibration/serializers.py
from rest_framework import serializers
from .models import CalibrationPoint, CalibrationModel


class CalibrationPointSerializer(serializers.ModelSerializer):
    class Meta:
        model = CalibrationPoint
        fields = [
            "id",
            "project",
            "member",
            "upv",
            "rh_index",
            "carbonation_depth",
            "core_fc",
            "notes",
            "created_at",
        ]


class CalibrationModelSerializer(serializers.ModelSerializer):
    class Meta:
        model = CalibrationModel
        fields = [
            "id",
            "project",
            "a0",
            "a1",
            "a2",
            "a3",
            "r2",
            "points_used",
            "use_carbonation",
            "created_at",
        ]
