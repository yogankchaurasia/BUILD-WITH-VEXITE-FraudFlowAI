import random
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models, schemas
from ..ml.predictor import composite_risk_score, rank_withdrawal_locations, risk_level

router = APIRouter(prefix="/complaints", tags=["complaints"])


@router.get("", response_model=list[schemas.ComplaintOut])
def list_complaints(db: Session = Depends(get_db)):
    return db.query(models.Complaint).order_by(models.Complaint.date.desc()).all()


@router.post("", response_model=schemas.ComplaintOut)
def create_complaint(payload: schemas.ComplaintCreate, db: Session = Depends(get_db)):
    new_id = f"CYB-{random.randint(20240000, 20249999)}-{random.randint(1, 999):03d}"
    complaint = models.Complaint(
        id=new_id,
        date=datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        fraud_type=payload.fraud_type,
        amount=payload.amount,
        victim_alias=payload.victim_alias,
        source_account_id=payload.source_account_id,
        dest_account_id=payload.dest_account_id,
        upi_wallet_id=payload.upi_wallet_id,
        txn_count=payload.txn_count,
        txn_timestamp=payload.txn_timestamp,
        origin_location_id=payload.origin_location_id,
        status="New",
        risk_score=0,
        risk_level="LOW",
        assigned_officer=payload.assigned_officer,
        analyzed=False,
    )
    db.add(complaint)
    db.add(models.AuditLog(username="system", action=f"Complaint {new_id} registered"))
    db.commit()
    db.refresh(complaint)
    return complaint


@router.get("/{complaint_id}", response_model=schemas.ComplaintOut)
def get_complaint(complaint_id: str, db: Session = Depends(get_db)):
    complaint = db.get(models.Complaint, complaint_id)
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return complaint


@router.post("/{complaint_id}/analyze")
def analyze_complaint(complaint_id: str, db: Session = Depends(get_db)):
    """Runs risk scoring against the money-trail hop count and stores the result."""
    complaint = db.get(models.Complaint, complaint_id)
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    hop_count = db.query(models.Transaction).filter(models.Transaction.complaint_id == complaint_id).count() or 4
    result = composite_risk_score(complaint, hop_count=hop_count)

    complaint.risk_score = result["score"]
    complaint.risk_level = result["level"]
    complaint.analyzed = True
    if complaint.status == "New":
        complaint.status = "Under Investigation"

    db.add(models.RiskScoreRecord(
        complaint_id=complaint_id, composite_score=result["score"],
        risk_level=result["level"], factors=result["factors"],
    ))
    db.add(models.AuditLog(username="system", action=f"Analyzed complaint {complaint_id}"))
    db.commit()
    return {"complaint_id": complaint_id, "risk_score": result["score"], "risk_level": result["level"], "factors": result["factors"]}


@router.post("/{complaint_id}/predict")
def predict_complaint(complaint_id: str, db: Session = Depends(get_db)):
    """Ranks candidate withdrawal locations for this case."""
    complaint = db.get(models.Complaint, complaint_id)
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    all_locations = db.query(models.Location).all()
    if not all_locations:
        raise HTTPException(status_code=400, detail="No locations seeded — run seed_data.py first")

    candidates = random.sample(all_locations, min(5, len(all_locations)))
    ranked = rank_withdrawal_locations(complaint, candidates, top_n=3)

    db.query(models.Prediction).filter(models.Prediction.complaint_id == complaint_id).delete()
    for r in ranked:
        db.add(models.Prediction(
            complaint_id=complaint_id, rank=r["rank"], location_id=r["location_id"],
            probability=r["probability"], risk_score=r["risk_score"],
            expected_window=r["expected_window"], reason=r["reason"],
        ))
    if ranked and ranked[0]["risk_level"] in ("CRITICAL", "HIGH") and complaint.status not in ("Action Required", "Resolved"):
        complaint.status = "High Risk"

    db.add(models.AuditLog(username="system", action=f"Generated prediction for {complaint_id}"))
    db.commit()
    return {"complaint_id": complaint_id, "predictions": ranked}
