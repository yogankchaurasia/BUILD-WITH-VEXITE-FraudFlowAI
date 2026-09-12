from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models

router = APIRouter(tags=["money-trail"])


@router.get("/money-trail/{case_id}")
def get_money_trail(case_id: str, db: Session = Depends(get_db)):
    complaint = db.get(models.Complaint, case_id)
    if not complaint:
        raise HTTPException(status_code=404, detail="Case not found")

    nodes = (db.query(models.MoneyTrailNode)
             .filter(models.MoneyTrailNode.complaint_id == case_id)
             .order_by(models.MoneyTrailNode.order_index).all())
    transactions = (db.query(models.Transaction)
                     .filter(models.Transaction.complaint_id == case_id)
                     .order_by(models.Transaction.hop_index).all())

    return {
        "case_id": case_id,
        "hops": len(transactions),
        "nodes": [
            {"key": n.node_key, "label": n.label, "sub_label": n.sub_label, "type": n.node_type}
            for n in nodes
        ],
        "edges": [
            {"from": t.from_account_id, "to": t.to_account_id, "amount": t.amount,
             "timestamp": t.timestamp, "frequency": t.frequency, "predicted": t.hop_index == len(transactions) - 1}
            for t in transactions
        ],
    }
