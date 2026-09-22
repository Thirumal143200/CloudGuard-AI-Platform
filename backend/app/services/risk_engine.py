"""CloudGuard AI â€” Risk Engine: 4-Pillar Evidence-Driven Risk Scoring (40/30/20/10)"""
from typing import Dict, Any, List
from app.models.finding import SeverityEnum


SEVERITY_SCORES = {
    SeverityEnum.CRITICAL: 100.0,
    SeverityEnum.HIGH: 75.0,
    SeverityEnum.MEDIUM: 45.0,
    SeverityEnum.LOW: 20.0,
    SeverityEnum.INFORMATIONAL: 5.0,
}


def calculate_finding_risk(
    severity: SeverityEnum,
    is_publicly_exposed: bool = False,
    asset_criticality: float = 50.0,  # 0 to 100
    ml_anomaly_score: float = 0.0     # 0 to 100
) -> Dict[str, Any]:
    """Calculate normalized risk score (0-100) using 4 distinct mathematical pillars:
    - 40% Pillar 1: Finding Severity Base
    - 30% Pillar 2: Exploitability & Network Reachability
    - 20% Pillar 3: Asset Criticality & Environment Tier
    - 10% Pillar 4: ML Telemetry Anomaly & Active Attack Signals
    """
    p1_severity = SEVERITY_SCORES.get(severity, 30.0)
    
    # Reachability
    p2_exploitability = 95.0 if is_publicly_exposed else 35.0
    
    # Criticality
    p3_criticality = max(0.0, min(100.0, asset_criticality))
    
    # Anomaly
    p4_anomaly = max(0.0, min(100.0, ml_anomaly_score))
    
    total_score = (
        (0.40 * p1_severity) +
        (0.30 * p2_exploitability) +
        (0.20 * p3_criticality) +
        (0.10 * p4_anomaly)
    )
    
    return {
        "final_risk_score": round(total_score, 1),
        "breakdown": {
            "p1_severity_contrib": round(0.40 * p1_severity, 1),
            "p2_reachability_contrib": round(0.30 * p2_exploitability, 1),
            "p3_criticality_contrib": round(0.20 * p3_criticality, 1),
            "p4_anomaly_contrib": round(0.10 * p4_anomaly, 1)
        },
        "raw_components": {
            "severity_base": p1_severity,
            "exploitability": p2_exploitability,
            "asset_criticality": p3_criticality,
            "ml_anomaly": p4_anomaly
        }
    }


def aggregate_account_risk(findings_list: List[Dict[str, Any]], ml_account_anomaly: float = 0.0) -> Dict[str, Any]:
    """Aggregate overall posture risk across all cloud account assets."""
    if not findings_list:
        return {
            "posture_score": 10.0,
            "security_grade": "A+",
            "critical_count": 0,
            "high_count": 0,
            "medium_count": 0,
            "low_count": 0,
            "total_open_findings": 0
        }

    crit = sum(1 for f in findings_list if f.get("severity") in [SeverityEnum.CRITICAL, "CRITICAL"])
    high = sum(1 for f in findings_list if f.get("severity") in [SeverityEnum.HIGH, "HIGH"])
    med = sum(1 for f in findings_list if f.get("severity") in [SeverityEnum.MEDIUM, "MEDIUM"])
    low = sum(1 for f in findings_list if f.get("severity") in [SeverityEnum.LOW, "LOW"])

    # Weighted cumulative penalty
    raw_penalty = (crit * 30.0) + (high * 15.0) + (med * 6.0) + (low * 2.0) + (ml_account_anomaly * 0.15)
    posture_score = min(100.0, max(0.0, raw_penalty))

    if posture_score >= 80:
        grade = "F"
    elif posture_score >= 60:
        grade = "D"
    elif posture_score >= 40:
        grade = "C"
    elif posture_score >= 20:
        grade = "B"
    else:
        grade = "A"

    return {
        "posture_score": round(posture_score, 1),
        "security_grade": grade,
        "critical_count": crit,
        "high_count": high,
        "medium_count": med,
        "low_count": low,
        "total_open_findings": len(findings_list)
    }
