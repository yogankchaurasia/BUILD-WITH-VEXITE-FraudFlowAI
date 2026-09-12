from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models

router = APIRouter(tags=["locations"])


@router.get("/locations")
def list_locations(db: Session = Depends(get_db)):
    return db.query(models.Location).all()


@router.get("/locations/predicted/{case_id}")
def predicted_locations(case_id: str, db: Session = Depends(get_db)):
    complaint = db.get(models.Complaint, case_id)
    if not complaint:
        raise HTTPException(status_code=404, detail="Case not found")

    predictions = (db.query(models.Prediction)
                   .filter(models.Prediction.complaint_id == case_id)
                   .order_by(models.Prediction.rank).all())
    results = []
    for p in predictions:
        loc = db.get(models.Location, p.location_id)
        results.append({
            "rank": p.rank,
            "location": {
                "id": loc.id, "name": loc.name, "type": loc.location_type,
                "zone": loc.zone, "x": loc.x, "y": loc.y, "risk_zone": loc.risk_zone,
            } if loc else None,
            "probability": p.probability,
            "risk_score": p.risk_score,
            "expected_window": p.expected_window,
            "reason": p.reason,
        })
    return {"case_id": case_id, "predictions": results}


@router.get("/predictions/{case_id}")
def get_predictions(case_id: str, db: Session = Depends(get_db)):
    return predicted_locations(case_id, db)
