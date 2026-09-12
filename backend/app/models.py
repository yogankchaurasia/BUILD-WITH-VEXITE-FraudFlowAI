"""ORM tables. Every table here is synthetic-data-only for this prototype —
no real account numbers, UPI IDs, or PII are ever stored."""
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, ForeignKey, Boolean, JSON
)
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String)  # police | analyst | admin
    full_name = Column(String)
    status = Column(String, default="Active")


class Account(Base):
    __tablename__ = "accounts"
    id = Column(String, primary_key=True)  # e.g. ACC-0001
    masked_number = Column(String)
    holder_alias = Column(String)
    account_type = Column(String)  # Source | Mule | Wallet | Destination
    bank_name = Column(String)
    risk_score = Column(Integer)
    opened_days_ago = Column(Integer)


class Location(Base):
    __tablename__ = "locations"
    id = Column(String, primary_key=True)  # e.g. LOC-001
    name = Column(String)
    location_type = Column(String)  # ATM | Bank Branch | Merchant
    zone = Column(String)
    x = Column(Float)  # stylized map coordinate (0-100)
    y = Column(Float)
    risk_zone = Column(String)  # LOW | MEDIUM | HIGH | CRITICAL
    withdrawals_last_30d = Column(Integer)


class Complaint(Base):
    __tablename__ = "complaints"
    id = Column(String, primary_key=True)  # e.g. CYB-20240412-006
    date = Column(String)
    fraud_type = Column(String)
    amount = Column(Float)
    victim_alias = Column(String)
    source_account_id = Column(String, ForeignKey("accounts.id"))
    dest_account_id = Column(String, ForeignKey("accounts.id"))
    upi_wallet_id = Column(String)
    txn_count = Column(Integer)
    txn_timestamp = Column(String)
    origin_location_id = Column(String, ForeignKey("locations.id"))
    status = Column(String, default="New")
    risk_score = Column(Integer, default=0)
    risk_level = Column(String, default="LOW")
    assigned_officer = Column(String)
    analyzed = Column(Boolean, default=False)


class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True, autoincrement=True)
    complaint_id = Column(String, ForeignKey("complaints.id"))
    from_account_id = Column(String)
    to_account_id = Column(String)
    amount = Column(Float)
    timestamp = Column(String)
    frequency = Column(Integer, default=1)
    hop_index = Column(Integer)


class MoneyTrailNode(Base):
    __tablename__ = "money_trail_nodes"
    id = Column(Integer, primary_key=True, autoincrement=True)
    complaint_id = Column(String, ForeignKey("complaints.id"))
    node_key = Column(String)   # victim | source | muleA | muleB | wallet | withdrawal
    label = Column(String)
    sub_label = Column(String)
    node_type = Column(String)
    order_index = Column(Integer)


class Prediction(Base):
    __tablename__ = "predictions"
    id = Column(Integer, primary_key=True, autoincrement=True)
    complaint_id = Column(String, ForeignKey("complaints.id"))
    rank = Column(Integer)
    location_id = Column(String, ForeignKey("locations.id"))
    probability = Column(Float)
    risk_score = Column(Integer)
    expected_window = Column(String)
    reason = Column(String)
    factors = Column(JSON)  # explainable-AI factor breakdown
    created_at = Column(DateTime, default=datetime.utcnow)


class RiskScoreRecord(Base):
    __tablename__ = "risk_scores"
    id = Column(Integer, primary_key=True, autoincrement=True)
    complaint_id = Column(String, ForeignKey("complaints.id"))
    composite_score = Column(Integer)
    risk_level = Column(String)
    factors = Column(JSON)  # {factor_name: value}
    created_at = Column(DateTime, default=datetime.utcnow)


class Alert(Base):
    __tablename__ = "alerts"
    id = Column(Integer, primary_key=True, autoincrement=True)
    complaint_id = Column(String, ForeignKey("complaints.id"))
    severity = Column(String)  # CRITICAL | HIGH | MEDIUM
    text = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)


class Report(Base):
    __tablename__ = "reports"
    id = Column(Integer, primary_key=True, autoincrement=True)
    complaint_id = Column(String, ForeignKey("complaints.id"))
    content = Column(JSON)
    generated_by = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)


class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String)
    action = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
