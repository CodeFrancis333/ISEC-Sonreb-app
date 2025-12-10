# backend/apps/calibration/urls.py
from django.urls import path
from .views import CalibrationPointsView, GenerateModelView, ActiveModelView, CalibrationDiagnosticsView

urlpatterns = [
    path("points/", CalibrationPointsView.as_view(), name="calibration-points"),
    path("generate/", GenerateModelView.as_view(), name="calibration-generate"),
    path("model/", ActiveModelView.as_view(), name="calibration-model"),
    path("diagnostics/", CalibrationDiagnosticsView.as_view(), name="calibration-diagnostics"),
]
