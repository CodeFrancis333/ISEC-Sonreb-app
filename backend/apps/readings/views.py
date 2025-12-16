# backend/apps/readings/views.py
from rest_framework import status
from django.db import models
from django.db.models import Q, Count
import numpy as np
from io import BytesIO
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.utils import ImageReader
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.http import FileResponse
from django.conf import settings
from django.urls import reverse
import os
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.utils.text import slugify
import io
import tempfile

from .models import Reading, Report, ReportPhoto, ReadingFolder
from .serializers import (
    ReadingSerializer,
    ReportSerializer,
    ReportPhotoSerializer,
    ReadingFolderSerializer,
)
from .utils import compute_estimated_fc, get_rating
from apps.projects.models import Project, Member
from apps.calibration.models import CalibrationModel, CalibrationPoint


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


class ReportListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        project_id = request.query_params.get("project")
        qs = Report.objects.all()
        if project_id:
            qs = qs.filter(project_id=project_id)
        qs = qs.order_by("-created_at")
        serializer = ReportSerializer(qs, many=True)
        return Response(serializer.data)

    def post(self, request):
        data = request.data
        project_id = data.get("project")
        if not project_id:
            return Response({"detail": "Project is required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            project = Project.objects.get(id=project_id, owner=request.user)
        except Project.DoesNotExist:
            return Response({"detail": "Project not found."}, status=status.HTTP_404_NOT_FOUND)

        # capture active model id/version if present
        try:
            model = CalibrationModel.objects.get(project=project)
            data["active_model_id"] = str(model.id)
        except CalibrationModel.DoesNotExist:
            pass

        serializer = ReportSerializer(data=data)
        if serializer.is_valid():
            report = serializer.save(project=project)
            return Response(ReportSerializer(report).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ReportDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk, user):
        try:
            report = Report.objects.select_related("project").get(pk=pk)
            if report.project.owner != user:
                return None
            return report
        except Report.DoesNotExist:
            return None

    def patch(self, request, pk):
        report = self.get_object(pk, request.user)
        if not report:
            return Response(status=status.HTTP_404_NOT_FOUND)
        serializer = ReportSerializer(report, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        report = self.get_object(pk, request.user)
        if not report:
            return Response(status=status.HTTP_404_NOT_FOUND)
        report.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ReportPhotoListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        data = request.data
        report_id = data.get("report")
        if not report_id:
            return Response({"detail": "Report is required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            report = Report.objects.select_related("project").get(id=report_id, project__owner=request.user)
        except Report.DoesNotExist:
            return Response({"detail": "Report not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = ReportPhotoSerializer(data=data)
        if serializer.is_valid():
            photo = serializer.save(report=report)
            return Response(ReportPhotoSerializer(photo).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ReportPhotoDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        try:
            photo = ReportPhoto.objects.select_related("report__project").get(pk=pk)
        except ReportPhoto.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        if photo.report.project.owner != request.user:
            return Response(status=status.HTTP_403_FORBIDDEN)
        photo.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ReportFolderListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # distinct non-empty folders from reports owned by user
        folders = (
            Report.objects.filter(project__owner=request.user)
            .exclude(folder__exact="")
            .values_list("folder", flat=True)
            .distinct()
        )
        return Response({"folders": list(folders)})


class ReadingFolderListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        project_id = request.query_params.get("project")
        qs = ReadingFolder.objects.filter(project__owner=request.user)
        if project_id:
            qs = qs.filter(project_id=project_id)
        serializer = ReadingFolderSerializer(qs, many=True)
        return Response(serializer.data)

    def post(self, request):
        project_id = request.data.get("project")
        if not project_id:
            return Response({"detail": "project is required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            project = Project.objects.get(id=project_id, owner=request.user)
        except Project.DoesNotExist:
            return Response({"detail": "Project not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = ReadingFolderSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(project=project)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ReadingFolderDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk, user):
        return ReadingFolder.objects.get(pk=pk, project__owner=user)

    def patch(self, request, pk):
        try:
            folder = self.get_object(pk, request.user)
        except ReadingFolder.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        serializer = ReadingFolderSerializer(folder, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        try:
            folder = self.get_object(pk, request.user)
        except ReadingFolder.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        folder.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ReadingFolderDerivedView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        project_id = request.query_params.get("project")
        if not project_id:
            return Response({"detail": "project is required"}, status=status.HTTP_400_BAD_REQUEST)
        qs = (
            Reading.objects.filter(project_id=project_id, project__owner=request.user)
            .exclude(location_tag__exact="")
            .values("location_tag")
            .annotate(count=Count("id"))
            .order_by("location_tag")
        )
        return Response({"derived": list(qs)})


class ReportUploadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        upload_type = request.data.get("type")  # logo, signature, photo
        file_obj = request.FILES.get("file")
        report_id = request.data.get("report")
        caption = request.data.get("caption", "")
        location_tag = request.data.get("location_tag", "")

        if upload_type not in ["logo", "signature", "photo"]:
            return Response({"detail": "type must be one of logo|signature|photo"}, status=status.HTTP_400_BAD_REQUEST)
        if not file_obj:
            return Response({"detail": "file is required"}, status=status.HTTP_400_BAD_REQUEST)
        if file_obj.size and file_obj.size > 10 * 1024 * 1024:
            return Response({"detail": "File too large (max 10MB)."}, status=status.HTTP_400_BAD_REQUEST)
        ctype = str(file_obj.content_type or "")
        if not ctype.startswith("image/"):
            return Response({"detail": "Only image uploads are allowed."}, status=status.HTTP_400_BAD_REQUEST)

        report = None
        if report_id:
            try:
                report = Report.objects.select_related("project").get(id=report_id, project__owner=request.user)
            except Report.DoesNotExist:
                return Response({"detail": "Report not found."}, status=status.HTTP_404_NOT_FOUND)

        # save file
        base_name = slugify(os.path.splitext(file_obj.name)[0]) or "upload"
        ext = os.path.splitext(file_obj.name)[1] or ".bin"
        subdir = f"reports/{upload_type}"
        filename = default_storage.save(os.path.join(subdir, base_name + ext), ContentFile(file_obj.read()))
        file_url = request.build_absolute_uri(default_storage.url(filename))

        if upload_type == "photo":
            if not report:
                return Response({"detail": "report is required for photo uploads"}, status=status.HTTP_400_BAD_REQUEST)
            photo = ReportPhoto.objects.create(
                report=report,
                image_url=file_url,
                caption=caption,
                location_tag=location_tag,
            )
            return Response(ReportPhotoSerializer(photo).data, status=status.HTTP_201_CREATED)

        # logo or signature: just return the URL (caller can PATCH report)
        return Response({"url": file_url}, status=status.HTTP_201_CREATED)


class ReportExportView(APIView):
    permission_classes = [IsAuthenticated]

    def _matplotlib_available(self):
        try:
            import matplotlib  # noqa
            return True
        except Exception:
            return False

    def _plot_scatter(self, points):
        if not self._matplotlib_available() or not points:
            return None
        import matplotlib.pyplot as plt
        import numpy as np

        plt.switch_backend("Agg")
        fig, ax = plt.subplots(figsize=(4, 3))
        xs = [p[0] for p in points]
        ys = [p[1] for p in points]
        ax.scatter(xs, ys, c="#34d399", edgecolors="#0f172a")
        min_xy, max_xy = min(xs + ys), max(xs + ys)
        # identity reference
        ax.plot([min_xy, max_xy], [min_xy, max_xy], "k--", lw=1, alpha=0.5, label="y = x")
        # regression line
        if len(xs) >= 2 and len(ys) >= 2:
            coeffs = np.polyfit(xs, ys, 1)
            m, b = coeffs[0], coeffs[1]
            reg_y0 = m * min_xy + b
            reg_y1 = m * max_xy + b
            ax.plot([min_xy, max_xy], [reg_y0, reg_y1], color="#60a5fa", lw=1.2, alpha=0.9, label="Regression")
            ax.legend(fontsize=7)
        ax.set_xlabel("Measured fc'")
        ax.set_ylabel("Predicted fc'")
        buf = io.BytesIO()
        fig.tight_layout()
        fig.savefig(buf, format="png")
        plt.close(fig)
        buf.seek(0)
        return ImageReader(buf)

    def _plot_histogram(self, values):
        if not self._matplotlib_available() or not values:
            return None
        import matplotlib.pyplot as plt

        plt.switch_backend("Agg")
        fig, ax = plt.subplots(figsize=(4, 3))
        ax.hist(values, bins=8, color="#34d399", edgecolor="#0f172a")
        ax.set_xlabel("Estimated fc' (MPa)")
        ax.set_ylabel("Count")
        buf = io.BytesIO()
        fig.tight_layout()
        fig.savefig(buf, format="png")
        plt.close(fig)
        buf.seek(0)
        return ImageReader(buf)

    def _plot_pass_fail(self, passed: int, failed: int):
        total = passed + failed
        if not self._matplotlib_available() or total == 0:
            return None
        import matplotlib.pyplot as plt

        plt.switch_backend("Agg")
        fig, ax = plt.subplots(figsize=(3, 2.2))
        data = [passed, failed]
        labels = [f"Pass {passed}", f"Fail {failed}"]
        colors = ["#34d399", "#f87171"]
        ax.pie(
            data,
            labels=labels,
            colors=colors,
            autopct=lambda pct: f"{pct:.1f}%",
            startangle=90,
            textprops={"fontsize": 8, "color": "#0f172a"},
        )
        ax.axis("equal")
        buf = io.BytesIO()
        fig.tight_layout()
        fig.savefig(buf, format="png")
        plt.close(fig)
        buf.seek(0)
        return ImageReader(buf)

    def _plot_warning_breakdown(self, warnings_breakdown: dict):
        total = sum(warnings_breakdown.values())
        if not self._matplotlib_available() or total == 0:
            return None
        import matplotlib.pyplot as plt

        labels = []
        data = []
        colors = []
        mapping = [
            ("RH < min", "rh_low", "#fbbf24"),
            ("RH > max", "rh_high", "#d97706"),
            ("UPV < min", "upv_low", "#22d3ee"),
            ("UPV > max", "upv_high", "#0891b2"),
        ]
        for label, key, color in mapping:
            val = warnings_breakdown.get(key, 0)
            if val > 0:
                labels.append(f"{label} ({val})")
                data.append(val)
                colors.append(color)

        if not data:
            return None

        plt.switch_backend("Agg")
        fig, ax = plt.subplots(figsize=(3, 2.2))
        ax.pie(
            data,
            labels=labels,
            colors=colors,
            autopct=lambda pct: f"{pct:.1f}%",
            startangle=90,
            textprops={"fontsize": 8, "color": "#0f172a"},
        )
        ax.axis("equal")
        buf = io.BytesIO()
        fig.tight_layout()
        fig.savefig(buf, format="png")
        plt.close(fig)
        buf.seek(0)
        return ImageReader(buf)

    def _export_path(self, report_id: str, fmt: str) -> str:
        base = os.path.join(getattr(settings, "MEDIA_ROOT", settings.BASE_DIR), "exports")
        os.makedirs(base, exist_ok=True)
        return os.path.join(base, f"report_{report_id}.{fmt}")

    def _image_from_url(self, url: str):
        if not url:
            return None
        media_prefix = getattr(settings, "MEDIA_URL", None)
        media_root = getattr(settings, "MEDIA_ROOT", None)
        if media_prefix and media_root and media_prefix in url:
            rel = url.split(media_prefix, 1)[-1]
            path = os.path.join(media_root, rel.replace("/", os.sep))
            if os.path.exists(path):
                try:
                    return ImageReader(path)
                except Exception:
                    return None
        return None

    def get(self, request):
        report_id = request.query_params.get("report_id")
        fmt = (request.query_params.get("format") or "pdf").lower()
        if not report_id:
            return Response({"detail": "report_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            report = Report.objects.select_related("project").get(pk=report_id, project__owner=request.user)
        except Report.DoesNotExist:
            return Response({"detail": "Report not found."}, status=status.HTTP_404_NOT_FOUND)

        path = None
        media_prefix = getattr(settings, "MEDIA_URL", "")
        media_root = getattr(settings, "MEDIA_ROOT", "")
        url_field = report.pdf_url if fmt == "pdf" else report.csv_url
        if url_field and media_prefix and media_prefix in url_field:
            rel = url_field.split(media_prefix, 1)[-1]
            candidate = os.path.join(media_root, rel.replace("/", os.sep))
            if os.path.exists(candidate):
                path = candidate
        if path is None:
            candidate = self._export_path(report.id, fmt)
            if os.path.exists(candidate):
                path = candidate
        if path is None or not os.path.exists(path):
            return Response({"detail": "Export file not found. Run export first."}, status=status.HTTP_404_NOT_FOUND)

        content_type = "application/pdf" if fmt == "pdf" else "text/csv"
        filename = f"report_{report.id}.{fmt}"
        return FileResponse(open(path, "rb"), content_type=content_type, as_attachment=True, filename=filename)

    def post(self, request):
        report_id = request.data.get("report_id")
        fmt = request.data.get("format", "pdf")
        folder = request.data.get("folder")
        filter_element = request.data.get("filter_element")
        filter_location = request.data.get("filter_location")
        fc_min = request.data.get("filter_fc_min")
        fc_max = request.data.get("filter_fc_max")
        exclusion_notes = request.data.get("exclusion_notes", "")
        try:
            report = Report.objects.select_related("project").get(pk=report_id, project__owner=request.user)
        except Report.DoesNotExist:
            return Response({"detail": "Report not found."}, status=status.HTTP_404_NOT_FOUND)

        project = report.project
        readings = Reading.objects.filter(project=project).order_by("created_at")
        cores = CalibrationPoint.objects.filter(project=project).order_by("created_at")
        model = CalibrationModel.objects.filter(project=project).first()
        photos = ReportPhoto.objects.filter(report=report).order_by("created_at")
        pass_count = fail_count = 0
        design_fc = project.design_fc or None
        if design_fc:
            pass_count = readings.filter(estimated_fc__gte=design_fc).count()
            fail_count = readings.filter(estimated_fc__lt=design_fc).count()

        # Apply folder/filters to readings
        if folder:
            readings = readings.filter(location_tag__icontains=folder)
        if filter_element:
            readings = readings.filter(
                Q(member_text__icontains=filter_element) | Q(member__member_id__icontains=filter_element)
            )
        if filter_location:
            readings = readings.filter(location_tag__icontains=filter_location)
        if fc_min not in [None, ""]:
            try:
                readings = readings.filter(estimated_fc__gte=float(fc_min))
            except ValueError:
                pass
        if fc_max not in [None, ""]:
            try:
                readings = readings.filter(estimated_fc__lte=float(fc_max))
            except ValueError:
                pass

        # Pass/fail vs design fc using filtered readings
        pass_fail = {"pass": 0, "fail": 0}
        pass_pct = fail_pct = None
        if design_fc:
            pass_fail["pass"] = readings.filter(estimated_fc__gte=design_fc).count()
            pass_fail["fail"] = readings.filter(estimated_fc__lt=design_fc).count()
            total_pf = pass_fail["pass"] + pass_fail["fail"]
            if total_pf > 0:
                pass_pct = pass_fail["pass"] / total_pf
                fail_pct = pass_fail["fail"] / total_pf

        # Basic warnings count for out-of-range readings against the active model
        warnings = 0
        warnings_breakdown = {"rh_low": 0, "rh_high": 0, "upv_low": 0, "upv_high": 0}
        if model:
            for r in readings:
                if r.rh_index is not None:
                    if model.rh_min is not None and r.rh_index < model.rh_min:
                        warnings += 1
                        warnings_breakdown["rh_low"] += 1
                    if model.rh_max is not None and r.rh_index > model.rh_max:
                        warnings += 1
                        warnings_breakdown["rh_high"] += 1
                if r.upv is not None:
                    if model.upv_min is not None and r.upv < model.upv_min:
                        warnings += 1
                        warnings_breakdown["upv_low"] += 1
                    if model.upv_max is not None and r.upv > model.upv_max:
                        warnings += 1
                        warnings_breakdown["upv_high"] += 1

        fmt_lower = fmt.lower()

        # CSV export
        if fmt_lower == "csv":
            import io, csv

            buffer = io.StringIO()
            writer = csv.writer(buffer)

            writer.writerow(["Report", report.title])
            writer.writerow(["Project", report.project.name])
            writer.writerow(["Structure age (years)", project.structure_age])
            writer.writerow(["Coordinates", f"{project.latitude}, {project.longitude}"])
            writer.writerow(["Folder", report.folder or ""])
            writer.writerow(["Date Range", report.date_range or ""])
            writer.writerow(["Engineer", report.engineer_name or ""])
            writer.writerow(["Logo URL", report.logo_url or ""])
            writer.writerow(["Signature URL", report.signature_url or ""])
            if photos.exists():
                writer.writerow(["Photos"])
                writer.writerow(["Image URL", "Caption", "Location"])
                for ph in photos:
                    writer.writerow([ph.image_url, ph.caption or "", ph.location_tag or ""])
            writer.writerow([])
            writer.writerow([])

            # Summary
            writer.writerow(["Summary"])
            writer.writerow(["Total readings", readings.count()])
            writer.writerow(["Total cores", cores.count()])
            if readings.exists():
                writer.writerow(
                    ["Mean estimated fc", f"{readings.aggregate(models.Avg('estimated_fc')).get('estimated_fc__avg'):.2f}"]
                )
            writer.writerow(["Warnings", warnings])
            if warnings_breakdown:
                writer.writerow(["Warnings breakdown"])
                writer.writerow(
                    [
                        f"RH below min: {warnings_breakdown.get('rh_low', 0)}",
                        f"RH above max: {warnings_breakdown.get('rh_high', 0)}",
                        f"UPV below min: {warnings_breakdown.get('upv_low', 0)}",
                        f"UPV above max: {warnings_breakdown.get('upv_high', 0)}",
                    ]
                )
            if project.design_fc:
                writer.writerow(["Pass/Fail vs design fc", project.design_fc])
                writer.writerow(["Category", "Count", "Percent"])
                writer.writerow(
                    [
                        "Pass",
                        pass_fail["pass"],
                        f"{(pass_pct * 100):.1f}%" if pass_pct is not None else "",
                    ]
                )
                writer.writerow(
                    [
                        "Fail",
                        pass_fail["fail"],
                        f"{(fail_pct * 100):.1f}%" if fail_pct is not None else "",
                    ]
                )
            writer.writerow([])
            # Filters / exclusion log
            writer.writerow(["Filters / Exclusion Log"])
            writer.writerow(["Folder filter", folder or ""])
            writer.writerow(["Filter element", filter_element or ""])
            writer.writerow(["Filter location", filter_location or ""])
            writer.writerow(["fc_min", fc_min or ""])
            writer.writerow(["fc_max", fc_max or ""])
            writer.writerow(["Exclusion notes", exclusion_notes or ""])
            writer.writerow([])

            # Active model
            writer.writerow(["Active Model"])
            if model:
                writer.writerow(
                    [
                        "Equation",
                        f"fc = {model.a0} * UPV^{model.a2} * RH^{model.a1}"
                        + (f" * Carb^{model.a3}" if model.use_carbonation and model.a3 else ""),
                    ]
                )
                writer.writerow(["r2", model.r2, "rmse", model.rmse])
            else:
                writer.writerow(["No active model"])
            writer.writerow([])

            # Cores
            writer.writerow(["Core Verification"])
            writer.writerow(["ID", "Measured_fc", "Predicted_fc", "% Error", "UPV", "RH", "Carb"])
            for c in cores:
                predicted = None
                if model and c.upv > 0 and c.rh_index > 0:
                    predicted = model.a0 * (c.upv ** model.a1) * (c.rh_index ** model.a2)
                    if model.use_carbonation and model.a3 and c.carbonation_depth:
                        predicted *= c.carbonation_depth ** model.a3
                err_pct = None
                if predicted and c.core_fc:
                    err_pct = (predicted - c.core_fc) / c.core_fc * 100.0
                writer.writerow(
                    [
                        c.id,
                        c.core_fc,
                        f"{predicted:.2f}" if predicted else "",
                        f"{err_pct:.1f}" if err_pct is not None else "",
                        c.upv,
                        c.rh_index,
                        c.carbonation_depth or "",
                    ]
                )
            writer.writerow([])

            # Readings
            writer.writerow(["Field Readings"])
            writer.writerow(["ID", "Location", "Member", "UPV", "RH", "Carb", "Estimated_fc", "Rating"])
            for r in readings:
                writer.writerow(
                    [
                        r.id,
                        r.location_tag or "",
                        r.member_text or (r.member.member_id if r.member else ""),
                        r.upv,
                        r.rh_index,
                        r.carbonation_depth or "",
                        r.estimated_fc,
                        r.rating,
                    ]
                )

            csv_bytes = buffer.getvalue().encode("utf-8")
            buffer.close()

            saved_path = default_storage.save(os.path.join("exports", f"report_{report.id}.csv"), ContentFile(csv_bytes))
            file_url = request.build_absolute_uri(default_storage.url(saved_path))

            report.status = "ready"
            report.csv_url = file_url
            report.save(update_fields=["status", "csv_url"])

            return FileResponse(
                default_storage.open(saved_path, "rb"),
                content_type="text/csv",
                as_attachment=True,
                filename=f"report_{report.id}.csv",
            )

        # PDF export (simple summary)
        buffer = BytesIO()
        p = canvas.Canvas(buffer, pagesize=letter)
        width, height = letter

        y = height - 72
        p.setFont("Helvetica-Bold", 16)
        p.drawString(72, y, f"Report: {report.title}")
        logo_reader = self._image_from_url(report.logo_url)
        if logo_reader:
            try:
                p.drawImage(logo_reader, width - 140, y - 10, width=64, height=32, preserveAspectRatio=True, mask="auto")
            except Exception:
                pass
        y -= 20
        p.setFont("Helvetica", 10)
        p.drawString(72, y, f"Project: {report.project.name}")
        p.drawString(72, y - 14, f"Age: {project.structure_age} years  |  Lat/Long: {project.latitude}, {project.longitude}")
        y -= 14
        y -= 14
        if report.folder:
            p.drawString(72, y, f"Folder: {report.folder}")
            y -= 14
        if report.date_range:
            p.drawString(72, y, f"Date Range: {report.date_range}")
            y -= 14
        if report.company:
            p.drawString(72, y, f"Company: {report.company}")
            y -= 14
        if report.client_name:
            p.drawString(72, y, f"Client: {report.client_name}")
            y -= 14
        p.drawString(72, y, f"Engineer: {report.engineer_name or ''} {report.engineer_title or ''} {report.engineer_license or ''}")
        y -= 20
        if design_fc is not None:
            badge_color = (0.2, 0.8, 0.5) if pass_count >= fail_count else (0.8, 0.3, 0.3)
            p.setFillColorRGB(*badge_color)
            p.rect(72, y - 10, 140, 12, fill=1, stroke=0)
            p.setFillColorRGB(0, 0, 0)
            p.drawString(74, y, f"Pass {pass_count} / Fail {fail_count}")
            y -= 16

        if model:
            p.setFont("Helvetica-Bold", 12)
            p.drawString(72, y, "Active Model")
            y -= 14
            p.setFont("Helvetica", 10)
            eq = f"fc = {model.a0:.4f} * UPV^{model.a2:.3f} * RH^{model.a1:.3f}"
            if model.use_carbonation and model.a3:
                eq += f" * Carb^{model.a3:.3f}"
            p.drawString(72, y, eq)
            y -= 14
            p.drawString(72, y, f"r2 {model.r2 or 0:.2f} | rmse {model.rmse or 0:.2f} | points {model.points_used}")
            y -= 14

        p.setFont("Helvetica-Bold", 12)
        p.drawString(72, y, "Summary")
        y -= 14
        p.setFont("Helvetica", 10)
        # warnings badge + pass/fail badge
        warn_text = f"Warnings: {warnings}"
        if warnings > 0:
            p.setFillColorRGB(0.8, 0.3, 0.3)
        else:
            p.setFillColorRGB(0.2, 0.8, 0.5)
        p.rect(72, y - 10, 80, 12, fill=1, stroke=0)
        p.setFillColorRGB(0, 0, 0)
        p.drawString(74, y, warn_text)
        # warnings breakdown line
        if warnings_breakdown:
            y -= 12
            p.setFont("Helvetica-Bold", 10)
            p.drawString(72, y, "Warnings breakdown")
            y -= 12
            p.setFont("Helvetica", 9)
            total_warn = max(warnings, 1)
            rh_low = warnings_breakdown.get("rh_low", 0)
            rh_high = warnings_breakdown.get("rh_high", 0)
            upv_low = warnings_breakdown.get("upv_low", 0)
            upv_high = warnings_breakdown.get("upv_high", 0)
            rows = [
                ("RH < min", rh_low),
                ("RH > max", rh_high),
                ("UPV < min", upv_low),
                ("UPV > max", upv_high),
            ]
            p.drawString(72, y, "Reason")
            p.drawString(180, y, "Count")
            p.drawString(240, y, "Percent")
            y -= 12
            for label, val in rows:
                p.drawString(72, y, label)
                p.drawString(180, y, str(val))
                p.drawString(240, y, f"{(val/total_warn)*100:.1f}%")
                y -= 12
            p.setFont("Helvetica", 10)
            wb_img = self._plot_warning_breakdown(warnings_breakdown)
            if wb_img:
                if y < 150:
                    p.showPage()
                    y = height - 72
                p.drawImage(wb_img, 72, y - 120, width=180, height=120, preserveAspectRatio=True, mask="auto")
                y -= 130
        # pass/fail badge next to warnings
        if project and project.design_fc:
            passed = readings.filter(estimated_fc__gte=project.design_fc).count()
            failed = readings.filter(estimated_fc__lt=project.design_fc).count()
            total_pf = max(passed + failed, 1)
            pass_pct = passed / total_pf
            badge_color = (0.2, 0.8, 0.5) if pass_pct >= 0.5 else (0.8, 0.3, 0.3)
            p.setFillColorRGB(*badge_color)
            p.rect(160, y - 10, 120, 12, fill=1, stroke=0)
            p.setFillColorRGB(0, 0, 0)
            p.drawString(162, y, f"Pass {passed} / Fail {failed}")
            # mini pass/fail bar and percentages
            y -= 12
            bar_w = 180
            bar_h = 8
            pass_w = int(bar_w * pass_pct)
            fail_w = bar_w - pass_w
            p.setFillColorRGB(0.2, 0.8, 0.5)
            p.rect(72, y - bar_h, pass_w, bar_h, fill=1, stroke=0)
            p.setFillColorRGB(0.8, 0.3, 0.3)
            p.rect(72 + pass_w, y - bar_h, fail_w, bar_h, fill=1, stroke=0)
            p.setFillColorRGB(0, 0, 0)
            p.setFont("Helvetica", 8)
            p.drawString(72, y - bar_h - 10, f"Pass {pass_pct*100:.1f}% | Fail {(1-pass_pct)*100:.1f}%")
            p.setFont("Helvetica", 10)
            y -= 16
            # pass/fail table
            p.setFont("Helvetica-Bold", 10)
            p.drawString(72, y, "Pass/Fail vs design fc table")
            y -= 12
            p.setFont("Helvetica", 9)
            p.drawString(72, y, "Category")
            p.drawString(180, y, "Count")
            p.drawString(250, y, "Percent")
            y -= 12
            p.drawString(72, y, "Pass")
            p.drawString(180, y, str(passed))
            p.drawString(250, y, f"{pass_pct*100:.1f}%")
            y -= 12
            p.drawString(72, y, "Fail")
            p.drawString(180, y, str(failed))
            p.drawString(250, y, f"{(1-pass_pct)*100:.1f}%")
            y -= 16
            # quality table row
            p.drawString(72, y, f"Design fc {project.design_fc} MPa -> Pass {passed} ({pass_pct*100:.1f}%) / Fail {failed} ({(1-pass_pct)*100:.1f}%)")
            y -= 14
            pf_img = self._plot_pass_fail(passed, failed)
            if pf_img:
                if y < 140:
                    p.showPage()
                    y = height - 72
                p.drawImage(pf_img, 72, y - 120, width=180, height=120, preserveAspectRatio=True, mask="auto")
                y -= 130
        y -= 14
        p.drawString(72, y, f"Total readings: {readings.count()} | Total cores: {cores.count()}")
        y -= 14
        mean_fc = readings.aggregate(models.Avg("estimated_fc")).get("estimated_fc__avg")
        if mean_fc is not None:
            p.drawString(72, y, f"Mean estimated fc: {mean_fc:.2f} MPa")
            y -= 14
        good = readings.filter(rating="GOOD").count()
        fair = readings.filter(rating="FAIR").count()
        poor = readings.filter(rating="POOR").count()
        p.drawString(72, y, f"Quality: GOOD {good} / FAIR {fair} / POOR {poor}")
        y -= 20
        # Filters / Exclusion log
        p.setFont("Helvetica-Bold", 11)
        p.drawString(72, y, "Filters / Exclusion Log")
        y -= 12
        p.setFont("Helvetica", 9)
        p.drawString(72, y, f"Folder: {folder or ''}  | Element: {filter_element or ''}  | Location: {filter_location or ''}")
        y -= 12
        p.drawString(72, y, f"fc_min: {fc_min or ''}  | fc_max: {fc_max or ''}")
        y -= 12
        if exclusion_notes:
          p.drawString(72, y, f"Exclusion notes: {exclusion_notes}")
          y -= 12
        if project and project.design_fc:
            passed = readings.filter(estimated_fc__gte=project.design_fc).count()
            failed = readings.filter(estimated_fc__lt=project.design_fc).count()
            p.drawString(72, y, f"Pass/Fail vs design fc {project.design_fc} MPa: PASS {passed} / FAIL {failed}")
            y -= 14
            # simple pass/fail bar
            total_pf = max(passed + failed, 1)
            bar_width = 250
            pass_width = bar_width * passed / total_pf
            p.setFillColorRGB(0.2, 0.8, 0.5)
            p.rect(72, y - 10, pass_width, 8, fill=1, stroke=0)
            p.setFillColorRGB(0.8, 0.3, 0.3)
            p.rect(72 + pass_width, y - 10, bar_width - pass_width, 8, fill=1, stroke=0)
            p.setFillColorRGB(0, 0, 0)
            y -= 16
        p.drawString(72, y, f"Warnings: {warnings}")
        y -= 20

        # Charts (if matplotlib is available)
        scatter_points = []
        if model:
            for c in cores:
                predicted = None
                if c.upv and c.rh_index:
                    predicted = model.a0 * (c.upv ** model.a1) * (c.rh_index ** model.a2)
                    if model.use_carbonation and model.a3 and c.carbonation_depth:
                        predicted *= c.carbonation_depth ** model.a3
                if predicted and c.core_fc:
                    scatter_points.append((c.core_fc, predicted))
        hist_values = list(readings.values_list("estimated_fc", flat=True))

        scatter_img = self._plot_scatter(scatter_points) if scatter_points else None
        hist_img = self._plot_histogram(hist_values) if hist_values else None

        if scatter_img:
            p.setFont("Helvetica-Bold", 12)
            p.drawString(72, y, "Scatter (Measured vs Predicted)")
            y -= 14
            p.drawImage(scatter_img, 72, y - 180, width=250, height=180, preserveAspectRatio=True, mask="auto")
            y -= 190
        if hist_img:
            p.setFont("Helvetica-Bold", 12)
            p.drawString(72, y, "Histogram of Estimated fc'")
            y -= 14
            p.drawImage(hist_img, 72, y - 180, width=250, height=180, preserveAspectRatio=True, mask="auto")
            y -= 190

        # Photos grouped by location/tag
        if photos.exists():
            p.setFont("Helvetica-Bold", 12)
            p.drawString(72, y, "Photos by Location")
            y -= 16
            photos_by_loc = {}
            for ph in photos:
                key = ph.location_tag or "Unspecified"
                photos_by_loc.setdefault(key, []).append(ph)
            thumb_w, thumb_h = 120, 80
            gap = 10
            for loc, plist in photos_by_loc.items():
                p.setFont("Helvetica-Bold", 10)
                p.drawString(72, y, f"Location: {loc}")
                y -= 14
                x = 72
                p.setFont("Helvetica", 8)
                for ph in plist[:4]:
                    img_reader = self._image_from_url(ph.image_url)
                    if img_reader:
                        try:
                            p.drawImage(
                                img_reader,
                                x,
                                y - thumb_h,
                                width=thumb_w,
                                height=thumb_h,
                                preserveAspectRatio=True,
                                mask="auto",
                            )
                            p.drawString(x, y - thumb_h - 10, (ph.caption or ph.location_tag or "Photo")[:30])
                            x += thumb_w + gap
                            if x + thumb_w > width - 72:
                                x = 72
                                y -= thumb_h + 24
                        except Exception:
                            continue
                y -= thumb_h + 16
                extra = len(plist) - min(len(plist), 4)
                if extra > 0:
                    p.setFont("Helvetica", 9)
                    p.drawString(72, y, f"Additional photos at {loc}: {extra}")
                    y -= 12
                if y < 120:
                    p.showPage()
                    y = height - 72

        p.setFont("Helvetica-Bold", 12)
        p.drawString(72, y, "Core Verification (first 5)")
        y -= 14
        p.setFont("Helvetica", 10)
        for c in cores[:5]:
            predicted = None
            if model and c.upv > 0 and c.rh_index > 0:
                predicted = model.a0 * (c.upv ** model.a1) * (c.rh_index ** model.a2)
                if model.use_carbonation and model.a3 and c.carbonation_depth:
                    predicted *= c.carbonation_depth ** model.a3
            err_pct = None
            if predicted and c.core_fc:
                err_pct = (predicted - c.core_fc) / c.core_fc * 100.0
            pred_str = f"{predicted:.2f}" if predicted else "0.00"
            err_str = f"{err_pct:.1f}%" if err_pct is not None else "N/A"
            p.drawString(72, y, f"Core {c.id}: lab {c.core_fc:.2f} / est {pred_str} / err {err_str}")
            y -= 14
            if y < 100:
                p.showPage()
                y = height - 72

        # Field assessment grid (all readings) as a paginated table
        if readings.exists():
            p.setFont("Helvetica-Bold", 12)
            p.drawString(72, y, "Field Assessment Grid")
            y -= 14
            def draw_grid_header():
                nonlocal y
                p.setFont("Helvetica-Bold", 9)
                p.drawString(72, y, "ID")
                p.drawString(110, y, "Location")
                p.drawString(220, y, "Member")
                p.drawString(330, y, "R")
                p.drawString(370, y, "UPV")
                p.drawString(430, y, "fc est")
                y -= 12
                p.setFont("Helvetica", 9)
            draw_grid_header()
            for r in readings:
                if y < 100:
                    p.showPage()
                    y = height - 72
                    p.setFont("Helvetica-Bold", 12)
                    p.drawString(72, y, "Field Assessment Grid (cont.)")
                    y -= 14
                    draw_grid_header()
                p.drawString(72, y, str(r.id))
                p.drawString(110, y, (r.location_tag or "-")[:18])
                p.drawString(220, y, (r.member_text or (r.member.member_id if r.member else "-"))[:14])
                p.drawString(330, y, f"{r.rh_index or 0:.1f}")
                p.drawString(370, y, f"{r.upv or 0:.0f}")
                p.drawString(430, y, f"{r.estimated_fc or 0:.2f}")
                y -= 12

        # Charts (text summary placeholders)
        p.setFont("Helvetica-Bold", 12)
        p.drawString(72, y, "Charts Overview")
        y -= 14
        p.setFont("Helvetica", 10)
        p.drawString(72, y, "Scatter (Measured vs Estimated cores) – see app for visuals.")
        y -= 14
        if cores.exists():
            sample_scatter = cores[:5]
            for c in sample_scatter:
                predicted = None
                if model and c.upv > 0 and c.rh_index > 0:
                    predicted = model.a0 * (c.upv ** model.a1) * (c.rh_index ** model.a2)
                    if model.use_carbonation and model.a3 and c.carbonation_depth:
                        predicted *= c.carbonation_depth ** model.a3
                p.drawString(72, y, f"Core {c.id}: measured {c.core_fc:.2f} / predicted {predicted or 0:.2f}")
                y -= 14
                if y < 100:
                    p.showPage()
                    y = height - 72
        p.drawString(72, y, "Histogram (estimated fc') – see app for visuals.")
        y -= 14
        p.drawString(72, y, "Add photos/signature on cover:")
        y -= 14
        if report.signature_url:
            sig_reader = self._image_from_url(report.signature_url)
            if sig_reader:
                try:
                    p.drawImage(sig_reader, 72, y - 40, width=80, height=40, preserveAspectRatio=True, mask="auto")
                    y -= 50
                except Exception:
                    p.drawString(72, y, f"Signature: {report.signature_url}")
                    y -= 14
            else:
                p.drawString(72, y, f"Signature: {report.signature_url}")
                y -= 14

        p.showPage()
        p.save()
        pdf_value = buffer.getvalue()
        buffer.close()

        saved_path = default_storage.save(os.path.join("exports", f"report_{report.id}.pdf"), ContentFile(pdf_value))
        file_url = request.build_absolute_uri(default_storage.url(saved_path))

        report.status = "ready"
        report.pdf_url = file_url
        report.save(update_fields=["status", "pdf_url"])

        return FileResponse(
            default_storage.open(saved_path, "rb"),
            content_type="application/pdf",
            as_attachment=True,
            filename=f"report_{report.id}.pdf",
        )


class ReportSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        project_id = request.query_params.get("project")
        folder = request.query_params.get("folder")
        filter_element = request.query_params.get("filter_element")
        filter_location = request.query_params.get("filter_location")
        fc_min = request.query_params.get("filter_fc_min")
        fc_max = request.query_params.get("filter_fc_max")

        if not project_id:
            return Response({"detail": "project query parameter is required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            project = Project.objects.get(id=project_id, owner=request.user)
        except Project.DoesNotExist:
            return Response({"detail": "Project not found."}, status=status.HTTP_404_NOT_FOUND)

        readings = Reading.objects.filter(project=project)
        cores = CalibrationPoint.objects.filter(project=project)
        model = CalibrationModel.objects.filter(project=project).first()

        # Apply folder and filters (best-effort; folder is treated as a location label)
        if folder:
            readings = readings.filter(location_tag__icontains=folder)
        if filter_element:
            readings = readings.filter(
                Q(member_text__icontains=filter_element) | Q(member__member_id__icontains=filter_element)
            )
        if filter_location:
            readings = readings.filter(location_tag__icontains=filter_location)
        if fc_min not in [None, ""]:
            try:
                readings = readings.filter(estimated_fc__gte=float(fc_min))
            except ValueError:
                pass
        if fc_max not in [None, ""]:
            try:
                readings = readings.filter(estimated_fc__lte=float(fc_max))
            except ValueError:
                pass

        total_readings = readings.count()
        total_cores = cores.count()
        mean_fc = readings.aggregate(models.Avg("estimated_fc")).get("estimated_fc__avg")

        good = readings.filter(rating="GOOD").count()
        fair = readings.filter(rating="FAIR").count()
        poor = readings.filter(rating="POOR").count()

        warnings = 0
        warnings_breakdown = {"rh_low": 0, "rh_high": 0, "upv_low": 0, "upv_high": 0}
        if model:
            for r in readings:
                if model.rh_min and r.rh_index < model.rh_min:
                    warnings += 1
                    warnings_breakdown["rh_low"] += 1
                if model.rh_max and r.rh_index > model.rh_max:
                    warnings += 1
                    warnings_breakdown["rh_high"] += 1
                if model.upv_min and r.upv < model.upv_min:
                    warnings += 1
                    warnings_breakdown["upv_low"] += 1
                if model.upv_max and r.upv > model.upv_max:
                    warnings += 1
                    warnings_breakdown["upv_high"] += 1
        design_fc = project.design_fc or 0
        pass_fail = {"pass": 0, "fail": 0}
        if design_fc:
            pass_fail["pass"] = readings.filter(estimated_fc__gte=design_fc).count()
            pass_fail["fail"] = readings.filter(estimated_fc__lt=design_fc).count()
        pass_pct = fail_pct = None
        total_pf = pass_fail["pass"] + pass_fail["fail"]
        if total_pf > 0:
            pass_pct = pass_fail["pass"] / total_pf
            fail_pct = pass_fail["fail"] / total_pf
        # Core verification: measured vs predicted from calibration points (filtered not applied to cores)
        core_table = []
        for c in cores:
            predicted = None
            if model and c.upv > 0 and c.rh_index > 0:
                predicted = model.a0 * (c.upv ** model.a1) * (c.rh_index ** model.a2)
                if model.use_carbonation and model.a3 and c.carbonation_depth:
                    predicted *= c.carbonation_depth ** model.a3
            err_pct = None
            if predicted:
                try:
                    err_pct = (predicted - c.core_fc) / c.core_fc * 100.0
                except ZeroDivisionError:
                    err_pct = None
            core_table.append(
                {
                    "id": c.id,
                    "measured_fc": c.core_fc,
                    "predicted_fc": predicted,
                    "error_pct": err_pct,
                    "upv": c.upv,
                    "rh_index": c.rh_index,
                    "carbonation_depth": c.carbonation_depth,
                }
            )

        # Field grid from readings
        field_grid = [
            {
                "id": r.id,
                "location": r.location_tag,
                "member": r.member_text or (r.member.member_id if r.member else None),
                "upv": r.upv,
                "rh_index": r.rh_index,
                "estimated_fc": r.estimated_fc,
            }
            for r in readings
        ]

        # Histogram of estimated fc
        hist_data = []
        if total_readings:
            values = np.array([r.estimated_fc for r in readings], dtype=float)
            if len(values) > 0:
                bin_size = 2.0
                vmin, vmax = float(values.min()), float(values.max())
                bins = np.arange(vmin, vmax + bin_size, bin_size)
                counts, edges = np.histogram(values, bins=bins)
                for i in range(len(counts)):
                    hist_data.append(
                        {
                            "lower": float(edges[i]),
                            "upper": float(edges[i + 1]),
                            "count": int(counts[i]),
                        }
                    )

        # Scatter: measured vs predicted from calibration points
        scatter = []
        for c in cores:
            predicted = None
            if model and c.upv > 0 and c.rh_index > 0:
                predicted = model.a0 * (c.upv ** model.a1) * (c.rh_index ** model.a2)
                if model.use_carbonation and model.a3 and c.carbonation_depth:
                    predicted *= c.carbonation_depth ** model.a3
            scatter.append(
                {
                    "measured": c.core_fc,
                    "predicted": predicted,
                }
            )

        payload = {
            "project": {"id": project.id, "name": project.name},
            "active_model_id": str(model.id) if model else None,
            "summary": {
                "total_readings": total_readings,
                "total_cores": total_cores,
                "mean_estimated_fc": mean_fc,
                "quality": {"good": good, "fair": fair, "poor": poor},
                "warnings": warnings,
                "warnings_breakdown": warnings_breakdown,
                "design_fc": design_fc,
                "pass_fail": pass_fail,
                "pass_pct": pass_pct,
                "fail_pct": fail_pct,
            },
            "core_verification": core_table,
            "field_grid": field_grid,
            "histogram": hist_data,
            "scatter": scatter,
        }
        return Response(payload)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
