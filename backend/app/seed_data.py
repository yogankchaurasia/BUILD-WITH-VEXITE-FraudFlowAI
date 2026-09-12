"""
Generates a fully synthetic dataset and loads it into fraudflow.db:
  - 15 accounts, 20 locations, 20 complaints, ~50 transactions,
    money-trail nodes, an initial risk score + prediction per complaint,
    and a handful of alerts.

Run with:  python -m app.seed_data
"""
import random
from datetime import datetime, timedelta, timezone

from .database import Base, engine, SessionLocal
from . import models
from .ml.predictor import composite_risk_score, rank_withdrawal_locations, risk_level

rng = random.Random(87231)

FRAUD_TYPES = ["UPI Fraud", "Phishing Link", "Investment Scam", "Loan App Fraud",
               "OTP Fraud", "Fake Job Offer", "Romance Scam", "Card Skimming",
               "SIM Swap", "Fake E-commerce"]
ZONES = ["Sector 4", "Sector 7", "Sector 9", "Sector 12", "Old Town", "Riverside",
         "Tech Park", "Highway Junction", "University Belt", "North Ring",
         "Harbor Road", "Central Market"]
LOCATION_TYPES = ["ATM", "Bank Branch", "Merchant"]
ACCOUNT_TYPES = ["Source", "Mule", "Mule", "Wallet", "Destination"]
STATUSES = ["New", "Under Investigation", "High Risk", "Action Required", "Resolved"]
OFFICERS = ["Insp. R. Mehta", "SI A. Kulkarni", "Insp. P. Nair", "SI D. Verma", "ACP S. Rao"]
BANKS = ["Nimbus Bank", "Anchorage Financial", "Wellgate Bank", "Coral Trust", "Meridian Coop"]


def build_locations():
    locations = []
    for i in range(20):
        loc_type = rng.choice(LOCATION_TYPES)
        zone = ZONES[i % len(ZONES)]
        name = (f"{zone} ATM Cluster {'II' if i % 3 == 0 else 'I'}" if loc_type == "ATM"
                else f"{zone} Branch Office" if loc_type == "Bank Branch"
                else f"{zone} Merchant Row")
        locations.append(models.Location(
            id=f"LOC-{i+1:03d}", name=name, location_type=loc_type, zone=zone,
            x=round(8 + (i * 137 + rng.randint(0, 40)) % 84, 1),
            y=round(10 + (i * 211 + rng.randint(0, 40)) % 80, 1),
            risk_zone=rng.choice(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
            withdrawals_last_30d=rng.randint(2, 46),
        ))
    return locations


def build_accounts():
    accounts = []
    for i in range(15):
        acc_type = ACCOUNT_TYPES[i % len(ACCOUNT_TYPES)]
        accounts.append(models.Account(
            id=f"ACC-{i+1:04d}",
            masked_number=f"XXXX-XXXX-{rng.randint(1000, 9999)}",
            holder_alias=f"Subject-{chr(65 + i % 26)}{rng.randint(10, 99)}",
            account_type=acc_type,
            bank_name=rng.choice(BANKS),
            risk_score=rng.randint(20, 98),
            opened_days_ago=rng.randint(3, 900),
        ))
    return accounts


def build_complaints(accounts, locations):
    sources = [a for a in accounts if a.account_type == "Source"]
    dests = [a for a in accounts if a.account_type == "Destination"]
    complaints = []
    for i in range(20):
        days_ago = rng.randint(0, 45)
        date = datetime.now(timezone.utc) - timedelta(days=days_ago)
        score = rng.randint(18, 99)
        complaints.append(models.Complaint(
            id=f"CYB-{2024_0000 + rng.randint(1000, 9999)}-{i+1:03d}",
            date=date.strftime("%Y-%m-%d"),
            fraud_type=rng.choice(FRAUD_TYPES),
            amount=float(rng.randint(8, 480) * 1000),
            victim_alias=f"Victim-{i+1:03d} (masked)",
            source_account_id=rng.choice(sources).id if sources else None,
            dest_account_id=rng.choice(dests).id if dests else None,
            upi_wallet_id=f"syn.user{rng.randint(100, 999)}@mockpay",
            txn_count=rng.randint(2, 11),
            txn_timestamp=date.strftime("%Y-%m-%d %H:%M"),
            origin_location_id=rng.choice(locations).id,
            status=rng.choice(STATUSES),
            risk_score=score,
            risk_level=risk_level(score),
            assigned_officer=rng.choice(OFFICERS),
            analyzed=False,
        ))
    return complaints


def build_money_trail_and_transactions(complaint, accounts, locations, db):
    mules = [a for a in accounts if a.account_type == "Mule"]
    wallets = [a for a in accounts if a.account_type == "Wallet"]
    mule_a, mule_b = rng.sample(mules, 2) if len(mules) >= 2 else (mules[0], mules[0])
    wallet = rng.choice(wallets) if wallets else accounts[0]
    other_locs = [l for l in locations if l.id != complaint.origin_location_id]
    predicted_loc = rng.choice(other_locs)

    nodes = [
        ("victim", "Victim", complaint.victim_alias, "victim"),
        ("source", "Source Account", complaint.source_account_id, "source"),
        ("muleA", "Suspicious Account A", mule_a.id, "mule"),
        ("muleB", "Suspicious Account B", mule_b.id, "mule"),
        ("wallet", "Wallet / UPI", complaint.upi_wallet_id, "wallet"),
        ("withdrawal", "Predicted Withdrawal", predicted_loc.name, "predicted"),
    ]
    for idx, (key, label, sub, ntype) in enumerate(nodes):
        db.add(models.MoneyTrailNode(
            complaint_id=complaint.id, node_key=key, label=label,
            sub_label=sub, node_type=ntype, order_index=idx,
        ))

    remaining = complaint.amount
    chain = [("victim", "source"), ("source", "muleA"), ("muleA", "muleB"),
             ("muleB", "wallet"), ("wallet", "withdrawal")]
    fracs = [1.0, 0.94, 0.88, 0.81, 0.74]
    base_time = datetime.strptime(complaint.txn_timestamp, "%Y-%m-%d %H:%M")
    for i, (frm, to) in enumerate(chain):
        db.add(models.Transaction(
            complaint_id=complaint.id, from_account_id=frm, to_account_id=to,
            amount=round(remaining * fracs[i], 2),
            timestamp=(base_time + timedelta(minutes=i * 20)).strftime("%Y-%m-%d %H:%M"),
            frequency=rng.randint(1, 4), hop_index=i,
        ))
    return predicted_loc


def build_alerts(complaints, locations, db):
    templates = [
        ("CRITICAL", "High-probability cash withdrawal predicted at {loc}."),
        ("HIGH", "Suspicious account routed funds through multiple intermediary accounts."),
        ("MEDIUM", "Unusual transaction velocity detected on wallet node."),
        ("HIGH", "New mule account linked to existing money-trail network."),
        ("CRITICAL", "Predicted withdrawal window closing in under 30 minutes."),
        ("MEDIUM", "Complaint reopened after new transaction activity."),
    ]
    for i in range(10):
        sev, text = rng.choice(templates)
        c = rng.choice(complaints)
        loc = rng.choice(locations)
        db.add(models.Alert(
            complaint_id=c.id, severity=sev,
            text=text.replace("{loc}", loc.name),
        ))


def run():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        locations = build_locations()
        accounts = build_accounts()
        db.add_all(locations)
        db.add_all(accounts)
        db.flush()

        complaints = build_complaints(accounts, locations)
        db.add_all(complaints)
        db.flush()

        for c in complaints:
            predicted_loc = build_money_trail_and_transactions(c, accounts, locations, db)
            risk = composite_risk_score(c, hop_count=4)
            db.add(models.RiskScoreRecord(
                complaint_id=c.id, composite_score=risk["score"],
                risk_level=risk["level"], factors=risk["factors"],
            ))
            ranked = rank_withdrawal_locations(c, [predicted_loc] + rng.sample(
                [l for l in locations if l.id != predicted_loc.id], 4
            ))
            for r in ranked:
                db.add(models.Prediction(
                    complaint_id=c.id, rank=r["rank"], location_id=r["location_id"],
                    probability=r["probability"], risk_score=r["risk_score"],
                    expected_window=r["expected_window"], reason=r["reason"],
                    factors={"note": "see /predictions/{case_id} for full explainability breakdown"},
                ))

        build_alerts(complaints, locations, db)

        db.add(models.User(username="admin.control", hashed_password="demo", role="admin", full_name="System Administrator"))
        db.add(models.User(username="officer.mehta", hashed_password="demo", role="police", full_name="Insp. R. Mehta"))
        db.add(models.User(username="analyst.kulkarni", hashed_password="demo", role="analyst", full_name="SI A. Kulkarni"))

        db.commit()
        print(f"Seeded {len(complaints)} complaints, {len(accounts)} accounts, {len(locations)} locations.")
    finally:
        db.close()


if __name__ == "__main__":
    run()
