from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from ..database import get_db
from .. import models, schemas
from ..ml.predictor import explainability_factors

router = APIRouter(prefix="/reports", tags=["reports"])


@router.post("/generate")
def generate_report(payload: schemas.ReportRequest, db: Session = Depends(get_db)):
    case_id = payload.case_id
    complaint = db.get(models.Complaint, case_id)
    if not complaint:
        raise HTTPException(status_code=404, detail="Case not found")

    trail_nodes = (db.query(models.MoneyTrailNode)
                   .filter(models.MoneyTrailNode.complaint_id == case_id)
                   .order_by(models.MoneyTrailNode.order_index).all())
    predictions = (db.query(models.Prediction)
                   .filter(models.Prediction.complaint_id == case_id)
                   .order_by(models.Prediction.rank).all())
    risk = (db.query(models.RiskScoreRecord)
            .filter(models.RiskScoreRecord.complaint_id == case_id)
            .order_by(models.RiskScoreRecord.created_at.desc()).first())

    top_prediction = predictions[0] if predictions else None
    content = {
        "case_id": case_id,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "complaint_summary": {
            "fraud_type": complaint.fraud_type, "amount": complaint.amount,
            "date": complaint.date, "status": complaint.status,
        },
        "money_trail": [{"label": n.label, "sub_label": n.sub_label} for n in trail_nodes],
        "risk_score": risk.composite_score if risk else complaint.risk_score,
        "risk_level": risk.risk_level if risk else complaint.risk_level,
        "predicted_locations": [
            {"rank": p.rank, "location_id": p.location_id, "probability": p.probability,
             "risk_score": p.risk_score, "window": p.expected_window}
            for p in predictions
        ],
        "key_factors": explainability_factors(),
        "recommended_actions": [
            "Alert nearest cybercrime/police unit",
            "Monitor predicted location during expected window",
            "Flag suspicious transaction via authorized procedure",
            "Continue transaction monitoring",
            "Verify new transaction activity",
        ],
        "disclaimer": "Decision-support information only. Investigators must verify before acting.",
    }

    report = models.Report(complaint_id=case_id, content=content, generated_by="system")
    db.add(report)
    db.add(models.AuditLog(username="system", action=f"Generated intelligence report for {case_id}"))
    db.commit()
    db.refresh(report)
    return {"report_id": report.id, **content}
