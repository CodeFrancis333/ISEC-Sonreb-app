# backend/apps/projects/views.py
from django.db.models import Avg, Count, Min, Max
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Project, Member
from .serializers import (
    ProjectSerializer,
    MemberSerializer,
    ProjectSummarySerializer,
)
from apps.readings.models import Reading


class ProjectListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Project.objects.filter(owner=request.user).order_by("-created_at")
        serializer = ProjectSerializer(qs, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = ProjectSerializer(data=request.data)
        if serializer.is_valid():
            project = serializer.save(owner=request.user)
            return Response(
                ProjectSerializer(project).data,
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProjectDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk, user):
        return Project.objects.filter(pk=pk, owner=user).first()

    def get(self, request, pk):
        project = self.get_object(pk, request.user)
        if not project:
            return Response(status=status.HTTP_404_NOT_FOUND)
        serializer = ProjectSerializer(project)
        return Response(serializer.data)


class ProjectMembersView(APIView):
    permission_classes = [IsAuthenticated]

    def get_project(self, pk, user):
        return Project.objects.filter(pk=pk, owner=user).first()

    def get(self, request, pk):
        project = self.get_project(pk, request.user)
        if not project:
            return Response(status=status.HTTP_404_NOT_FOUND)

        members = project.members.all()
        serializer = MemberSerializer(members, many=True)
        return Response(serializer.data)

    def post(self, request, pk):
        project = self.get_project(pk, request.user)
        if not project:
            return Response(status=status.HTTP_404_NOT_FOUND)

        data = request.data.copy()
        data["project"] = project.id
        serializer = MemberSerializer(data=data)
        if serializer.is_valid():
            member = serializer.save()
            return Response(
                MemberSerializer(member).data,
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProjectSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        project = Project.objects.filter(pk=pk, owner=request.user).first()
        if not project:
            return Response(status=status.HTTP_404_NOT_FOUND)

        readings_qs = Reading.objects.filter(project=project)

        agg = readings_qs.aggregate(
            readings_count=Count("id"),
            min_fc=Min("estimated_fc"),
            max_fc=Max("estimated_fc"),
            avg_fc=Avg("estimated_fc"),
        )

        rating_counts = readings_qs.values("rating").annotate(count=Count("id"))
        good_count = next(
            (r["count"] for r in rating_counts if r["rating"] == "GOOD"), 0
        )
        fair_count = next(
            (r["count"] for r in rating_counts if r["rating"] == "FAIR"), 0
        )
        poor_count = next(
            (r["count"] for r in rating_counts if r["rating"] == "POOR"), 0
        )

        payload = {
            "project_id": project.id,
            "readings_count": agg["readings_count"] or 0,
            "min_fc": agg["min_fc"],
            "max_fc": agg["max_fc"],
            "avg_fc": agg["avg_fc"],
            "good_count": good_count,
            "fair_count": fair_count,
            "poor_count": poor_count,
        }

        serializer = ProjectSummarySerializer(payload)
        return Response(serializer.data)
