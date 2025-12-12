# backend/apps/readings/views.py
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Reading
from .serializers import ReadingSerializer
from .utils import compute_estimated_fc, get_rating
from apps.projects.models import Project, Member


class ReadingListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        project_id = request.query_params.get("project")
        qs = Reading.objects.all().select_related("project", "member")

        if project_id:
            qs = qs.filter(project_id=project_id)

        qs = qs.order_by("-created_at")
        serializer = ReadingSerializer(qs, many=True)
        return Response(serializer.data)

    def post(self, request):
        data = request.data

        project_id = data.get("project")
        member_id = data.get("member")

        try:
            project = Project.objects.get(id=project_id, owner=request.user)
        except Project.DoesNotExist:
            return Response(
                {"detail": "Project not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        member = None
        member_text = data.get("member_text") or ""
        if member_id:
            # If the incoming "member" looks like an ID and exists, use FK; otherwise treat as free text.
            try:
                if str(member_id).isdigit():
                    member = Member.objects.get(id=member_id, project=project)
                else:
                    member_text = str(member_id)
            except Member.DoesNotExist:
                member_text = str(member_id)

        upv = float(data.get("upv"))
        rh_index = float(data.get("rh_index"))
        carbonation = data.get("carbonation_depth")
        carbonation_depth = float(carbonation) if carbonation not in [None, ""] else None

        try:
            estimated_fc, model_used = compute_estimated_fc(
                project=project,
                upv=upv,
                rh_index=rh_index,
                carbonation_depth=carbonation_depth,
            )
        except ValueError as exc:
            return Response(
                {"detail": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        rating = get_rating(estimated_fc, project.design_fc)

        payload = {
            "project": project.id,
            "member": member.id if member else None,
            "member_text": member_text,
            "location_tag": data.get("location_tag", ""),
            "upv": upv,
            "rh_index": rh_index,
            "carbonation_depth": carbonation_depth,
        }

        serializer = ReadingSerializer(data=payload)
        if serializer.is_valid():
            reading = serializer.save(
                estimated_fc=estimated_fc,
                rating=rating,
                model_used=model_used,
            )
            return Response(
                ReadingSerializer(reading).data,
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ReadingDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            reading = Reading.objects.select_related("project").get(pk=pk)
        except Reading.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        # Optional: check project.owner == request.user
        if reading.project.owner != request.user:
            return Response(status=status.HTTP_403_FORBIDDEN)

        serializer = ReadingSerializer(reading)
        return Response(serializer.data)

    def delete(self, request, pk):
        try:
            reading = Reading.objects.select_related("project").get(pk=pk)
        except Reading.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        if reading.project.owner != request.user:
            return Response(status=status.HTTP_403_FORBIDDEN)
        reading.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def patch(self, request, pk):
        try:
            reading = Reading.objects.select_related("project").get(pk=pk)
        except Reading.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        if reading.project.owner != request.user:
            return Response(status=status.HTTP_403_FORBIDDEN)

        serializer = ReadingSerializer(reading, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
