"""
Mock predictive-analytics pipeline for FraudFlow AI.

This is intentionally a transparent, rule-based/heuristic "model" rather than
a trained scikit-learn classifier — for a hackathon demo with synthetic data,
a trained model would just be fitting noise, and a heuristic is honest about
that while still exercising the full pipeline described in the brief:

  1. data preprocessing        -> _extract_features()
  2. feature extraction        -> _extract_features()
  3. transaction pattern       -> features["velocity"], features["amount_norm"]
  4. risk scoring              -> composite_risk_score()
  5. money-trail graph         -> features["hop_count"], features["intermediaries"]
  6. location-based analysis   -> _score_location()
  7. "ML" prediction           -> rank_withdrawal_locations()
  8. ranked withdrawal output  -> rank_withdrawal_locations()

To swap in a real trained model later: keep the function signatures the same
(they take a `Complaint` ORM row + list of `Location` rows and a random seed),
and replace the body of `rank_withdrawal_locations` with `model.predict_proba`.
scikit-learn is included in requirements.txt so you can drop a fitted
StandardScaler + GradientBoostingClassifier / RandomForestClassifier in here
without touching the API layer.
"""
import hashlib
import random
from typing import List, Dict, Any

RISK_THRESHOLDS = [(81, "CRITICAL"), (61, "HIGH"), (31, "MEDIUM"), (0, "LOW")]


def risk_level(score: int) -> str:
    for threshold, label in RISK_THRESHOLDS:
        if score >= threshold:
            return label
    return "LOW"


def _seeded_rng(complaint_id: str) -> random.Random:
    # Deterministic per-case randomness so repeated calls are stable,
    # mimicking a real model's reproducibility.
    seed = int(hashlib.sha256(complaint_id.encode()).hexdigest(), 16) % (2**31)
    return random.Random(seed)


def _extract_features(complaint, hop_count: int) -> Dict[str, float]:
    rng = _seeded_rng(complaint.id)
    amount_norm = min(100, complaint.amount / 5000)
    velocity = min(100, complaint.txn_count * 9 + rng.uniform(0, 15))
    intermediaries = min(100, hop_count * 16 + rng.uniform(0, 10))
    time_pattern = rng.uniform(30, 85)
    geo_distance = rng.uniform(25, 80)
    cashout_history = rng.uniform(35, 90)
    network_depth = min(100, hop_count * 14 + rng.uniform(5, 20))
    prior_suspicious = rng.uniform(30, 90)
    return {
        "velocity": round(velocity, 1),
        "amount_norm": round(amount_norm, 1),
        "intermediaries": round(intermediaries, 1),
        "time_pattern": round(time_pattern, 1),
        "geo_distance": round(geo_distance, 1),
        "cashout_history": round(cashout_history, 1),
        "network_depth": round(network_depth, 1),
        "prior_suspicious": round(prior_suspicious, 1),
    }


def composite_risk_score(complaint, hop_count: int = 4) -> Dict[str, Any]:
    """Weighted combination of transaction, network and behavioral factors."""
    f = _extract_features(complaint, hop_count)
    weights = {
        "velocity": 0.16, "amount_norm": 0.12, "intermediaries": 0.16,
        "time_pattern": 0.10, "geo_distance": 0.10, "cashout_history": 0.14,
        "network_depth": 0.12, "prior_suspicious": 0.10,
    }
    score = sum(f[k] * w for k, w in weights.items())
    score = int(max(5, min(99, round(score))))
    return {"score": score, "level": risk_level(score), "factors": f}


EXPLAIN_FACTORS = [
    ("Transaction Pattern", 32), ("Location Pattern", 24), ("Time Pattern", 18),
    ("Network Connections", 15), ("Previous Cash-out Pattern", 11),
]


def _score_location(complaint, location, rng: random.Random) -> float:
    """Heuristic location-affinity score in [0, 1] used to rank candidates."""
    base = rng.uniform(0.35, 0.95)
    if location.risk_zone in ("HIGH", "CRITICAL"):
        base += 0.08
    if location.location_type == "ATM":
        base += 0.04
    return min(0.98, base)


def rank_withdrawal_locations(complaint, candidate_locations: List, top_n: int = 3) -> List[Dict[str, Any]]:
    """Returns top_n ranked (location, probability, risk, window, reason) dicts."""
    rng = _seeded_rng(complaint.id)
    scored = [(_score_location(complaint, loc, rng), loc) for loc in candidate_locations]
    scored.sort(key=lambda t: t[0], reverse=True)
    top = scored[:top_n]

    windows = ["30–60 minutes", "1–2 hours", "2–4 hours"]
    reasons = [
        "Matches historical cash-out pattern and short hop-distance from wallet node.",
        "Secondary pattern match based on network-adjacent withdrawal history.",
        "Lower-confidence match from broader zone-level withdrawal trends.",
    ]
    results = []
    for i, (raw_score, loc) in enumerate(top):
        probability = round(raw_score * 100, 1)
        risk = int(min(99, probability * 0.95 + rng.uniform(2, 10)))
        results.append({
            "rank": i + 1,
            "location_id": loc.id,
            "location_name": loc.name,
            "zone": loc.zone,
            "location_type": loc.location_type,
            "probability": probability,
            "risk_score": risk,
            "risk_level": risk_level(risk),
            "expected_window": windows[min(i, len(windows) - 1)],
            "reason": reasons[min(i, len(reasons) - 1)],
        })
    return results


def explainability_factors() -> List[Dict[str, Any]]:
    return [{"factor": name, "weight_pct": pct} for name, pct in EXPLAIN_FACTORS]
