# backend/apps/readings/urls.py
from django.urls import path
from .views import (
    ReadingListCreateView,
    ReadingDetailView,
    ReportListCreateView,
    ReportDetailView,
    ReportExportView,
    ReportFolderListView,
    ReportUploadView,
    ReportSummaryView,
    ReportPhotoListCreateView,
    ReportPhotoDetailView,
    ReadingFolderListCreateView,
    ReadingFolderDetailView,
)

urlpatterns = [
    path("", ReadingListCreateView.as_view(), name="reading-list-create"),
    path("<int:pk>/", ReadingDetailView.as_view(), name="reading-detail"),
    path("reports/", ReportListCreateView.as_view(), name="report-list-create"),
    path("reports/<int:pk>/", ReportDetailView.as_view(), name="report-detail"),
    path("reports/export/", ReportExportView.as_view(), name="report-export"),
    path("reports/folders/", ReportFolderListView.as_view(), name="report-folders"),
    path("readings/folders/", ReadingFolderListCreateView.as_view(), name="reading-folders"),
    path("reports/upload/", ReportUploadView.as_view(), name="report-upload"),
    path("reports/summary/", ReportSummaryView.as_view(), name="report-summary"),
    path("reports/photos/", ReportPhotoListCreateView.as_view(), name="report-photo-create"),
    path("reports/photos/<int:pk>/", ReportPhotoDetailView.as_view(), name="report-photo-delete"),
    path("folders/", ReadingFolderListCreateView.as_view(), name="reading-folder-list"),
    path("folders/<int:pk>/", ReadingFolderDetailView.as_view(), name="reading-folder-detail"),
]
