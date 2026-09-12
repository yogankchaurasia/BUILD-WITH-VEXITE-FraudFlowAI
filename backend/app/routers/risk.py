from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models
from ..ml.predictor import explainability_factors

router = APIRouter(tags=["risk"])


@router.get("/risk-score/{case_id}")
def get_risk_score(case_id: str, db: Session = Depends(get_db)):
    complaint = db.get(models.Complaint, case_id)
    if not complaint:
        raise HTTPException(status_code=404, detail="Case not found")

    latest = (db.query(models.RiskScoreRecord)
              .filter(models.RiskScoreRecord.complaint_id == case_id)
              .order_by(models.RiskScoreRecord.created_at.desc()).first())

    return {
        "case_id": case_id,
        "composite_score": latest.composite_score if latest else complaint.risk_score,
        "risk_level": latest.risk_level if latest else complaint.risk_level,
        "factors": latest.factors if latest else {},
        "explainability": explainability_factors(),
    }
