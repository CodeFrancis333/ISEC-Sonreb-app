# backend/apps/calibration/views.py
from typing import List

import numpy as np
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import CalibrationPoint, CalibrationModel
from .serializers import CalibrationPointSerializer, CalibrationModelSerializer
from apps.projects.models import Project


class CalibrationPointsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        project_id = request.query_params.get("project")
        if not project_id:
            return Response(
                {"detail": "project query parameter is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            project = Project.objects.get(id=project_id, owner=request.user)
        except Project.DoesNotExist:
            return Response(
                {"detail": "Project not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        points = CalibrationPoint.objects.filter(project=project).order_by("-created_at")
        serializer = CalibrationPointSerializer(points, many=True)
        return Response(serializer.data)

    def post(self, request):
        data = request.data.copy()
        project_id = data.get("project")
        if not project_id:
            return Response(
                {"detail": "Project is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            project = Project.objects.get(id=project_id, owner=request.user)
        except Project.DoesNotExist:
            return Response(
                {"detail": "Project not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = CalibrationPointSerializer(data=data)
        if serializer.is_valid():
            point = serializer.save()
            return Response(
                CalibrationPointSerializer(point).data,
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class GenerateModelView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        project_id = request.data.get("project")
        use_carbonation = bool(request.data.get("use_carbonation", False))

        if not project_id:
            return Response(
                {"detail": "Project is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            project = Project.objects.get(id=project_id, owner=request.user)
        except Project.DoesNotExist:
            return Response(
                {"detail": "Project not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        points = CalibrationPoint.objects.filter(project=project)

        if use_carbonation:
            min_points = 8
        else:
            min_points = 5

        if points.count() < min_points:
            return Response(
                {
                    "detail": f"Not enough calibration points. Need at least {min_points} points."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Build regression data
        X_rows: List[List[float]] = []
        y_rows: List[float] = []

        for p in points:
            row = [1.0, p.rh_index, p.upv]
            if use_carbonation:
                row.append(p.carbonation_depth or 0.0)
            X_rows.append(row)
            y_rows.append(p.core_fc)

        X = np.array(X_rows, dtype=float)
        y = np.array(y_rows, dtype=float)

        # Solve least squares
        beta, residuals, rank, s = np.linalg.lstsq(X, y, rcond=None)

        # Predicted values
        y_pred = X.dot(beta)
        ss_res = float(np.sum((y - y_pred) ** 2))
        ss_tot = float(np.sum((y - y.mean()) ** 2)) if len(y) > 1 else 0.0
        r2 = 1.0 - ss_res / ss_tot if ss_tot > 0 else 1.0

        a0 = float(beta[0])
        a1 = float(beta[1])
        a2 = float(beta[2])
        a3 = float(beta[3]) if use_carbonation and len(beta) > 3 else None

        model_data = {
            "project": project.id,
            "a0": a0,
            "a1": a1,
            "a2": a2,
            "a3": a3,
            "r2": r2,
            "points_used": points.count(),
            "use_carbonation": use_carbonation,
        }

        # Upsert model (one per project)
        CalibrationModel.objects.update_or_create(
            project=project,
            defaults=model_data,
        )

        model = CalibrationModel.objects.get(project=project)
        serializer = CalibrationModelSerializer(model)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ActiveModelView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        project_id = request.query_params.get("project")
        if not project_id:
            return Response(
                {"detail": "project query parameter is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            project = Project.objects.get(id=project_id, owner=request.user)
        except Project.DoesNotExist:
            return Response(
                {"detail": "Project not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            model = project.calibration_model
        except CalibrationModel.DoesNotExist:
            return Response(
                {"detail": "No active calibration model for this project."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = CalibrationModelSerializer(model)
        return Response(serializer.data)
