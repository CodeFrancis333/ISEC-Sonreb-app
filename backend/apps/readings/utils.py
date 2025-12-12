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

    # Model is power-law: fc = a * RH^b * UPV^c (* carbonation^d if applicable)
    a = model.a0
    b = model.a1
    c = model.a2
    d = model.a3 if model.use_carbonation else None

    if upv <= 0 or rh_index <= 0:
        raise ValueError("UPV and RH must be positive to apply the SonReb model.")

    # fc = a * UPV^b * RH^c (* carb^d if applicable)
    estimated = a * (upv ** b) * (rh_index ** c)
    if model.use_carbonation and carbonation_depth is not None and carbonation_depth > 0 and d is not None:
        estimated *= carbonation_depth ** d

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
