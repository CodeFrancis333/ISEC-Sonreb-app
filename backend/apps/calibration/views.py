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

        # Build regression data in log-space for power-law:
        # ln(fc) = A + b*ln(V) + c*ln(S) [+ d*ln(carbonation)]
        X_rows: List[List[float]] = []
        y_rows: List[float] = []

        for p in points:
            if p.upv <= 0 or p.rh_index <= 0:
                # skip invalid values for log-space
                continue
            row = [1.0, np.log(p.upv), np.log(p.rh_index)]
            if use_carbonation and p.carbonation_depth not in [None, 0]:
                row.append(np.log(p.carbonation_depth))
            elif use_carbonation:
                # if carbonation required but missing, skip
                continue
            X_rows.append(row)
            y_rows.append(np.log(p.core_fc))

        X = np.array(X_rows, dtype=float)
        y = np.array(y_rows, dtype=float)

        if len(y) < min_points:
            return Response(
                {"detail": f"Not enough calibration points with valid data. Need at least {min_points} points."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        beta, residuals, rank, s = np.linalg.lstsq(X, y, rcond=None)

        y_pred = X.dot(beta)
        ss_res = float(np.sum((y - y_pred) ** 2))
        ss_tot = float(np.sum((y - y.mean()) ** 2)) if len(y) > 1 else 0.0
        r2 = 1.0 - ss_res / ss_tot if ss_tot > 0 else 1.0
        rmse = float(np.sqrt(np.mean((y - y_pred) ** 2))) if len(y) > 0 else 0.0

        # Back-transform coefficients: a = exp(A), b = beta[1], c = beta[2], optional d
        a = float(np.exp(beta[0]))
        b = float(beta[1])
        c = float(beta[2])
        d = float(beta[3]) if use_carbonation and len(beta) > 3 else None

        upv_values = [p.upv for p in points]
        rh_values = [p.rh_index for p in points]
        carbonation_values = [
            p.carbonation_depth
            for p in points
            if use_carbonation and p.carbonation_depth is not None
        ]

        model_data = {
            # store power-law coefficients in existing fields
            "a0": a,   # pre-exponential
            "a1": b,   # exponent for RH
            "a2": c,   # exponent for UPV
            "a3": d,   # exponent for carbonation (optional)
            "r2": r2,
            "rmse": rmse,
            "points_used": points.count(),
            "use_carbonation": use_carbonation,
            "upv_min": min(upv_values) if upv_values else None,
            "upv_max": max(upv_values) if upv_values else None,
            "rh_min": min(rh_values) if rh_values else None,
            "rh_max": max(rh_values) if rh_values else None,
            "carbonation_min": min(carbonation_values)
            if carbonation_values
            else None,
            "carbonation_max": max(carbonation_values)
            if carbonation_values
            else None,
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

    def post(self, request):
        project_id = request.data.get("project")
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

        try:
            model = project.calibration_model
        except CalibrationModel.DoesNotExist:
            return Response(
                {"detail": "No calibration model found to activate."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = CalibrationModelSerializer(model)
        return Response(serializer.data, status=status.HTTP_200_OK)


class CalibrationDiagnosticsView(APIView):
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

        points = CalibrationPoint.objects.filter(project=project).order_by("-created_at")
        data_points = []
        for p in points:
            # predicted using active model
            if model.use_carbonation and p.carbonation_depth is not None:
                predicted = (
                    model.a0
                    + model.a1 * p.rh_index
                    + model.a2 * p.upv
                    + (model.a3 or 0.0) * p.carbonation_depth
                )
            else:
                predicted = model.a0 + model.a1 * p.rh_index + model.a2 * p.upv

            data_points.append(
                {
                    "id": p.id,
                    "measured_fc": p.core_fc,
                    "predicted_fc": predicted,
                    "upv": p.upv,
                    "rh_index": p.rh_index,
                    "carbonation_depth": p.carbonation_depth,
                    "created_at": p.created_at,
                }
            )

        payload = {
            "model": CalibrationModelSerializer(model).data,
            "points": data_points,
        }
        return Response(payload)


class CalibrationPointDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        point = CalibrationPoint.objects.filter(pk=pk, project__owner=request.user).first()
        if not point:
            return Response(status=status.HTTP_404_NOT_FOUND)
        point.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def patch(self, request, pk):
        point = CalibrationPoint.objects.filter(pk=pk, project__owner=request.user).first()
        if not point:
            return Response(status=status.HTTP_404_NOT_FOUND)
        serializer = CalibrationPointSerializer(point, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
