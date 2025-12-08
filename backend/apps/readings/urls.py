# backend/apps/readings/urls.py
from django.urls import path
from .views import ReadingListCreateView, ReadingDetailView

urlpatterns = [
    path("", ReadingListCreateView.as_view(), name="reading-list-create"),
    path("<int:pk>/", ReadingDetailView.as_view(), name="reading-detail"),
]
