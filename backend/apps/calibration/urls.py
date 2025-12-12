# backend/apps/calibration/urls.py
from django.urls import path
from .views import (
    CalibrationPointsView,
    CalibrationPointDetailView,
    GenerateModelView,
    ActiveModelView,
    CalibrationDiagnosticsView,
)

urlpatterns = [
    path("points/", CalibrationPointsView.as_view(), name="calibration-points"),
    path("points/<int:pk>/", CalibrationPointDetailView.as_view(), name="calibration-point-detail"),
    path("generate/", GenerateModelView.as_view(), name="calibration-generate"),
    path("model/", ActiveModelView.as_view(), name="calibration-model"),
    path("active/", ActiveModelView.as_view(), name="calibration-active"),
    path("diagnostics/", CalibrationDiagnosticsView.as_view(), name="calibration-diagnostics"),
]
