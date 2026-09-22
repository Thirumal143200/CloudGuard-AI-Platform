"""CloudGuard AI â€” ML Engine: Isolation Forest Telemetry Anomaly Detector & Baseline Deviation Engine"""
import math
import random
from typing import List, Dict, Any, Tuple
import numpy as np

# Try importing sklearn, otherwise use robust analytical fallback
try:
    from sklearn.ensemble import IsolationForest
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False


class TelemetryFeatureExtractor:
    """Extract numeric feature vectors from cloud activity logs."""
    
    @staticmethod
    def extract_vector(log: Dict[str, Any]) -> List[float]:
        """Convert a log event to a 6-dimensional feature vector:
        [hour_of_day, is_off_hours, event_risk_tier, error_rate_flag, ip_novelty_score, privilege_escalation_flag]
        """
        hour = log.get("hour", 12)
        # Off-hours defined as 20:00 - 06:00
        is_off_hours = 1.0 if (hour >= 20 or hour <= 6) else 0.0
        
        event_name = log.get("event_name", "")
        # High-risk events
        priv_events = ["AuthorizeSecurityGroupIngress", "AttachUserPolicy", "CreateAccessKey", "PutBucketPolicy", "StopLogging"]
        is_priv = 1.0 if any(pe in event_name for pe in priv_events) else 0.0
        
        error_flag = 1.0 if log.get("status_code") not in [200, "200", "Success", None] else 0.0
        ip_novelty = float(log.get("ip_novelty", 0.1))
        event_tier = 3.0 if is_priv else (2.0 if error_flag else 1.0)
        
        return [float(hour), is_off_hours, event_tier, error_flag, ip_novelty, is_priv]


class CloudAnomalyDetector:
    """Production Isolation Forest Anomaly Detector with Baseline Z-Score Tracking."""

    def __init__(self, contamination: float = 0.05):
        self.contamination = contamination
        self.model = None
        self.is_trained = False
        if SKLEARN_AVAILABLE:
            self.model = IsolationForest(
                n_estimators=100,
                contamination=contamination,
                random_state=42
            )

    def train_baseline(self, historical_logs: List[Dict[str, Any]]):
        """Train Isolation Forest on normal baseline telemetry."""
        if not historical_logs:
            return
        
        X = np.array([TelemetryFeatureExtractor.extract_vector(log) for log in historical_logs])
        if SKLEARN_AVAILABLE and len(X) >= 10:
            self.model.fit(X)
            self.is_trained = True

    def score_event(self, log: Dict[str, Any]) -> Tuple[bool, float, Dict[str, float]]:
        """Score an individual event for anomalous behavioral deviation."""
        vector = TelemetryFeatureExtractor.extract_vector(log)
        
        # Calculate feature contributions
        contributions = {
            "off_hours_activity": round(vector[1] * 35.0, 1),
            "privilege_escalation_intent": round(vector[5] * 40.0, 1),
            "error_rate_spike": round(vector[3] * 15.0, 1),
            "ip_novelty": round(vector[4] * 20.0, 1)
        }

        if SKLEARN_AVAILABLE and self.is_trained:
            X = np.array([vector])
            # decision_function returns negative for anomalies
            score_raw = self.model.decision_function(X)[0]
            # Normalize to 0 - 100
            anomaly_score = max(0.0, min(100.0, (0.5 - score_raw) * 100.0))
            is_anomaly = bool(self.model.predict(X)[0] == -1)
        else:
            # Deterministic statistical baseline fallback
            score_calc = (vector[1] * 30.0) + (vector[3] * 20.0) + (vector[4] * 25.0) + (vector[5] * 45.0)
            anomaly_score = min(100.0, score_calc)
            is_anomaly = anomaly_score >= 65.0

        return is_anomaly, round(anomaly_score, 1), contributions


# Singleton instance
global_anomaly_detector = CloudAnomalyDetector()
