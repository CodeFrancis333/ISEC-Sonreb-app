# backend/apps/readings/utils.py
from typing import Optional
from apps.projects.models import Project
from apps.calibration.models import CalibrationModel


def compute_estimated_fc(
    project: Project,
    upv: float,
    rh_index: float,
    carbonation_depth: Optional[float] = None,
) -> tuple[float, str]:
    """
    Compute estimated fc' using active calibration model if available,
    otherwise fall back to a default simple model.
    Returns (estimated_fc, model_used_label).
    """
    try:
        model = CalibrationModel.objects.filter(project=project).latest("created_at")
    except CalibrationModel.DoesNotExist:
        # Default simple model: fc' = 0.005*UPV + 0.25*RH (tune later)
        estimated = 0.005 * upv + 0.25 * rh_index
        return estimated, "Default SonReb Model"

        a0 = model.a0
        a1 = model.a1
        a2 = model.a2
        a3 = model.a3 if model.use_carbonation else 0.0

        # Validity checks based on calibrated ranges
        out_of_range_fields = []
        if model.upv_min is not None and upv < model.upv_min:
            out_of_range_fields.append("UPV")
        if model.upv_max is not None and upv > model.upv_max:
            out_of_range_fields.append("UPV")
        if model.rh_min is not None and rh_index < model.rh_min:
            out_of_range_fields.append("RH index")
        if model.rh_max is not None and rh_index > model.rh_max:
            out_of_range_fields.append("RH index")
        if model.use_carbonation:
            if (
                model.carbonation_min is not None
                and carbonation_depth is not None
                and carbonation_depth < model.carbonation_min
            ):
                out_of_range_fields.append("carbonation depth")
            if (
                model.carbonation_max is not None
                and carbonation_depth is not None
                and carbonation_depth > model.carbonation_max
            ):
                out_of_range_fields.append("carbonation depth")

        if out_of_range_fields:
            # ACI-aligned guard: do not use the model outside its calibrated range
            raise ValueError(
                "Input values are outside the calibrated range for this project "
                f"({', '.join(sorted(set(out_of_range_fields)))})."
            )

        if model.use_carbonation and carbonation_depth is not None:
            estimated = a0 + a1 * rh_index + a2 * upv + a3 * carbonation_depth
        else:
            estimated = a0 + a1 * rh_index + a2 * upv

    return estimated, "Project Calibrated Model"


def get_rating(
    estimated_fc: float,
    design_fc: Optional[float] = None,
) -> str:
    """
    Basic rating logic:
    - If design_fc is available, use ratio.
    - Else use absolute thresholds.
    """
    if design_fc and design_fc > 0:
        ratio = estimated_fc / design_fc
        if ratio >= 0.85:
            return "GOOD"
        elif ratio >= 0.70:
            return "FAIR"
        else:
            return "POOR"

    # Absolute thresholds (MPa) – adjustable
    if estimated_fc >= 21.0:
        return "GOOD"
    elif estimated_fc >= 17.0:
        return "FAIR"
    return "POOR"
