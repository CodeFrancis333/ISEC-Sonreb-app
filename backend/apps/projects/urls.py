# backend/apps/projects/urls.py
from django.urls import path
from .views import (
    ProjectListCreateView,
    ProjectDetailView,
    ProjectMembersView,
    ProjectSummaryView,
    ProjectRatingsView,
    ProjectHistogramView,
    ProjectReportView,
)

urlpatterns = [
    path("", ProjectListCreateView.as_view(), name="project-list-create"),
    path("<int:pk>/", ProjectDetailView.as_view(), name="project-detail"),
    path("<int:pk>/members/", ProjectMembersView.as_view(), name="project-members"),
    path("<int:pk>/summary/", ProjectSummaryView.as_view(), name="project-summary"),
    path("<int:pk>/stats/ratings/", ProjectRatingsView.as_view(), name="project-ratings"),
    path(
        "<int:pk>/stats/fc-histogram/",
        ProjectHistogramView.as_view(),
        name="project-fc-histogram",
    ),
    path(
        "<int:pk>/reports/summary/",
        ProjectReportView.as_view(),
        name="project-report-summary",
    ),
]
