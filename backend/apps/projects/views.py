# backend/apps/projects/views.py
import io
from math import ceil, floor
from django.db.models import Avg, Count, Min, Max
from django.http import HttpResponse
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
from reportlab.lib.pagesizes import A4  # noqa: E402
from reportlab.lib.utils import ImageReader  # noqa: E402
from reportlab.pdfgen import canvas  # noqa: E402

from .models import Project, Member
from .serializers import (
    ProjectSerializer,
    MemberSerializer,
    ProjectSummarySerializer,
)
from apps.readings.models import Reading
from apps.calibration.models import CalibrationModel, CalibrationPoint


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


class ProjectRatingsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        project = Project.objects.filter(pk=pk, owner=request.user).first()
        if not project:
            return Response(status=status.HTTP_404_NOT_FOUND)

        readings_qs = Reading.objects.filter(project=project)
        rating_counts = readings_qs.values("rating").annotate(count=Count("id"))

        good = next((r["count"] for r in rating_counts if r["rating"] == "GOOD"), 0)
        fair = next((r["count"] for r in rating_counts if r["rating"] == "FAIR"), 0)
        poor = next((r["count"] for r in rating_counts if r["rating"] == "POOR"), 0)
        total = good + fair + poor

        payload = {
            "project_id": project.id,
            "good": good,
            "fair": fair,
            "poor": poor,
            "total": total,
        }
        return Response(payload)


class ProjectHistogramView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        project = Project.objects.filter(pk=pk, owner=request.user).first()
        if not project:
            return Response(status=status.HTTP_404_NOT_FOUND)

        try:
            bin_size = float(request.query_params.get("bin_size", 2.0))
        except (TypeError, ValueError):
            return Response(
                {"detail": "bin_size must be numeric."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if bin_size <= 0:
            return Response(
                {"detail": "bin_size must be greater than zero."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        readings_qs = Reading.objects.filter(project=project).exclude(
            estimated_fc__isnull=True
        )
        values = list(readings_qs.values_list("estimated_fc", flat=True))

        if not values:
            return Response(
                {
                    "project_id": project.id,
                    "bin_size": bin_size,
                    "bins": [],
                    "min_fc": None,
                    "max_fc": None,
                    "avg_fc": None,
                }
            )

        min_fc = min(values)
        max_fc = max(values)
        avg_fc = readings_qs.aggregate(avg=Avg("estimated_fc"))["avg"]

        start = floor(min_fc / bin_size) * bin_size
        end = ceil(max_fc / bin_size) * bin_size
        bins = []

        current = start
        while current <= end:
            upper = current + bin_size
            count = sum(
                1
                for v in values
                if (v >= current and v < upper) or (upper == end and v == max_fc)
            )
            bins.append({"lower": current, "upper": upper, "count": count})
            current = upper

        payload = {
            "project_id": project.id,
            "bin_size": bin_size,
            "bins": bins,
            "min_fc": min_fc,
            "max_fc": max_fc,
            "avg_fc": avg_fc,
        }
        return Response(payload)


class ProjectReportView(APIView):
    permission_classes = [IsAuthenticated]

    def _pie_image(self, good: int, fair: int, poor: int):
        fig, ax = plt.subplots(figsize=(3, 3))
        counts = [good, fair, poor]
        labels = ["GOOD", "FAIR", "POOR"]
        colors = ["#34d399", "#fbbf24", "#f87171"]
        if sum(counts) == 0:
            counts = [1, 0, 0]
            labels = ["NO DATA", "", ""]
            colors = ["#94a3b8", "#ffffff00", "#ffffff00"]
        ax.pie(counts, labels=labels, colors=colors, autopct="%1.0f%%")
        buf = io.BytesIO()
        fig.savefig(buf, format="png", bbox_inches="tight", transparent=True)
        plt.close(fig)
        buf.seek(0)
        return buf

    def _hist_image(self, values, bin_size: float):
        fig, ax = plt.subplots(figsize=(4, 3))
        if values:
            bins = max(1, int((max(values) - min(values)) / bin_size))
            ax.hist(values, bins=bins, color="#34d399", alpha=0.8)
            ax.set_xlabel("Estimated fc' (MPa)")
            ax.set_ylabel("Count")
        else:
            ax.text(0.5, 0.5, "No readings", ha="center", va="center")
        buf = io.BytesIO()
        fig.savefig(buf, format="png", bbox_inches="tight", transparent=True)
        plt.close(fig)
        buf.seek(0)
        return buf

    def _scatter_image(self, measured, predicted):
        fig, ax = plt.subplots(figsize=(4, 3))
        if measured and predicted:
            ax.scatter(predicted, measured, color="#10b981", edgecolors="#0f172a")
            mn = min(min(measured), min(predicted))
            mx = max(max(measured), max(predicted))
            ax.plot([mn, mx], [mn, mx], linestyle="--", color="#94a3b8")
            ax.set_xlabel("Predicted fc' (MPa)")
            ax.set_ylabel("Measured fc' (MPa)")
        else:
            ax.text(0.5, 0.5, "No calibration points", ha="center", va="center")
        buf = io.BytesIO()
        fig.savefig(buf, format="png", bbox_inches="tight", transparent=True)
        plt.close(fig)
        buf.seek(0)
        return buf

    def get(self, request, pk):
        project = Project.objects.filter(pk=pk, owner=request.user).first()
        if not project:
            return Response(status=status.HTTP_404_NOT_FOUND)

        # Summary data
        readings_qs = Reading.objects.filter(project=project)
        agg = readings_qs.aggregate(
            readings_count=Count("id"),
            min_fc=Min("estimated_fc"),
            max_fc=Max("estimated_fc"),
            avg_fc=Avg("estimated_fc"),
        )

        rating_counts = readings_qs.values("rating").annotate(count=Count("id"))
        good = next((r["count"] for r in rating_counts if r["rating"] == "GOOD"), 0)
        fair = next((r["count"] for r in rating_counts if r["rating"] == "FAIR"), 0)
        poor = next((r["count"] for r in rating_counts if r["rating"] == "POOR"), 0)

        # Histogram values
        values = list(
            readings_qs.exclude(estimated_fc__isnull=True).values_list(
                "estimated_fc", flat=True
            )
        )

        # Calibration diagnostics
        model = (
            CalibrationModel.objects.filter(project=project).first()
        )
        calib_points = CalibrationPoint.objects.filter(project=project)
        measured = []
        predicted = []
        if model:
            for p in calib_points:
                if model.use_carbonation and p.carbonation_depth is not None:
                    pred = (
                        model.a0
                        + model.a1 * p.rh_index
                        + model.a2 * p.upv
                        + (model.a3 or 0.0) * p.carbonation_depth
                    )
                else:
                    pred = model.a0 + model.a1 * p.rh_index + model.a2 * p.upv
                measured.append(p.core_fc)
                predicted.append(pred)

        # Build charts
        pie_buf = self._pie_image(good, fair, poor)
        hist_buf = self._hist_image(values, bin_size=2.0)
        scatter_buf = self._scatter_image(measured, predicted)

        # Build PDF
        pdf_buf = io.BytesIO()
        c = canvas.Canvas(pdf_buf, pagesize=A4)
        width, height = A4

        y = height - 40
        c.setFont("Helvetica-Bold", 14)
        c.drawString(40, y, f"SONREB Report - {project.name}")
        y -= 18
        c.setFont("Helvetica", 10)
        c.drawString(40, y, f"Location: {project.location}")
        y -= 14
        c.drawString(40, y, f"Readings: {agg['readings_count'] or 0}")
        y -= 14
        c.drawString(
            40,
            y,
            f"fc' avg: {agg['avg_fc'] or '--'} | min: {agg['min_fc'] or '--'} | max: {agg['max_fc'] or '--'}",
        )
        y -= 20

        if model:
            c.setFont("Helvetica-Bold", 12)
            c.drawString(40, y, "Calibration Model")
            y -= 14
            c.setFont("Helvetica", 10)
            c.drawString(
                40,
                y,
                f"fc' = {model.a0:.3f} + {model.a1:.4f}*RH + {model.a2:.4f}*UPV"
                + (f" + {model.a3:.4f}*cd" if model.use_carbonation and model.a3 else ""),
            )
            y -= 12
            c.drawString(
                40,
                y,
                f"R²: {model.r2:.3f} | RMSE: {(model.rmse if model.rmse is not None else '--')}"
                f" | Points: {model.points_used}",
            )
            y -= 12
            c.drawString(
                40,
                y,
                f"UPV range: {model.upv_min or '--'}–{model.upv_max or '--'} | RH range: {model.rh_min or '--'}–{model.rh_max or '--'}",
            )
            if model.use_carbonation:
                y -= 12
                c.drawString(
                    40,
                    y,
                    f"Carbonation range: {model.carbonation_min or '--'}–{model.carbonation_max or '--'}",
                )
            y -= 10
        else:
            c.drawString(40, y, "No calibration model for this project.")
            y -= 10

        # Charts placement
        c.setFont("Helvetica-Bold", 12)
        c.drawString(40, y, "Charts")
        y -= 12

        c.drawImage(ImageReader(pie_buf), 40, y - 170, width=160, height=160, mask="auto")
        c.drawImage(ImageReader(hist_buf), 220, y - 160, width=200, height=150, mask="auto")
        y -= 180
        c.drawImage(ImageReader(scatter_buf), 40, y - 170, width=320, height=160, mask="auto")

        c.showPage()
        c.save()
        pdf_buf.seek(0)

        response = HttpResponse(pdf_buf.getvalue(), content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="sonreb-report-{project.id}.pdf"'
        return response
