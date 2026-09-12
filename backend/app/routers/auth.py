from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException
from jose import jwt
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models, schemas

router = APIRouter(prefix="/auth", tags=["auth"])

SECRET_KEY = "fraudflow-demo-secret-not-for-production"
ALGORITHM = "HS256"
TOKEN_TTL_MINUTES = 60 * 8


@router.post("/login", response_model=schemas.LoginResponse)
def login(payload: schemas.LoginRequest, db: Session = Depends(get_db)):
    """Demo auth: any username with password 'demo' logs in for the chosen role.
    In production, verify a hashed password and read the role from the DB
    rather than trusting the client-supplied role."""
    if payload.password != "demo":
        raise HTTPException(status_code=401, detail="Invalid credentials (demo password is 'demo')")

    user = db.query(models.User).filter(models.User.username == payload.username).first()
    role = user.role if user else payload.role

    token = jwt.encode(
        {"sub": payload.username, "role": role, "exp": datetime.now(timezone.utc) + timedelta(minutes=TOKEN_TTL_MINUTES)},
        SECRET_KEY, algorithm=ALGORITHM,
    )
    db.add(models.AuditLog(username=payload.username, action=f"Logged in as {role}"))
    db.commit()
    return schemas.LoginResponse(access_token=token, role=role, username=payload.username)
