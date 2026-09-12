from pydantic import BaseModel
from typing import Optional, List, Dict, Any


class LoginRequest(BaseModel):
    username: str
    password: str
    role: str  # police | analyst | admin


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    username: str


class ComplaintCreate(BaseModel):
    fraud_type: str
    amount: float
    victim_alias: Optional[str] = "Victim (masked)"
    source_account_id: Optional[str] = None
    dest_account_id: Optional[str] = None
    upi_wallet_id: Optional[str] = None
    txn_count: int = 1
    txn_timestamp: Optional[str] = None
    origin_location_id: Optional[str] = None
    assigned_officer: Optional[str] = None
    notes: Optional[str] = None


class ComplaintOut(BaseModel):
    id: str
    date: str
    fraud_type: str
    amount: float
    victim_alias: str
    source_account_id: Optional[str]
    dest_account_id: Optional[str]
    upi_wallet_id: Optional[str]
    txn_count: int
    txn_timestamp: Optional[str]
    origin_location_id: Optional[str]
    status: str
    risk_score: int
    risk_level: str
    assigned_officer: Optional[str]
    analyzed: bool

    class Config:
        from_attributes = True


class ReportRequest(BaseModel):
    case_id: str
