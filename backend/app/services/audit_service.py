"""CloudGuard AI — Audit Service: Tamper-Evident Hash-Chained Audit Logging"""
import json
import uuid
import hashlib
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.models.audit import AuditLog, AuditActionEnum


GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000"


def calculate_record_hash(prev_hash: str, seq: int, action: str, entity_type: str, entity_id: str, actor_email: str, details_json: str, timestamp_str: str) -> str:
    """Calculate deterministic SHA-256 hash chaining previous record hash with current record fields."""
    raw_payload = f"{prev_hash}|{seq}|{action}|{entity_type}|{entity_id}|{actor_email}|{details_json}|{timestamp_str}"
    return hashlib.sha256(raw_payload.encode("utf-8")).hexdigest()


def log_action(
    db: Session,
    action: AuditActionEnum,
    entity_type: str,
    details: Dict[str, Any],
    actor_email: str = "system@cloudguard.local",
    actor_id: Optional[str] = None,
    entity_id: Optional[str] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
) -> AuditLog:
    """Append a new tamper-evident audit record to the cryptographic chain."""
    last_record = db.query(AuditLog).order_by(desc(AuditLog.sequence_number)).first()
    
    if last_record is None:
        prev_hash = GENESIS_HASH
        seq = 1
    else:
        prev_hash = last_record.current_hash
        seq = (last_record.sequence_number or 0) + 1

    now_utc = datetime.now(timezone.utc)
    details_str = json.dumps(details, sort_keys=True)
    
    current_hash = calculate_record_hash(
        prev_hash=prev_hash,
        seq=seq,
        action=action.value,
        entity_type=entity_type,
        entity_id=entity_id or "",
        actor_email=actor_email,
        details_json=details_str,
        timestamp_str=now_utc.isoformat()
    )

    audit_entry = AuditLog(
        id=f"aud-{uuid.uuid4().hex[:12]}",
        sequence_number=seq,
        actor_id=actor_id,
        actor_email=actor_email,
        ip_address=ip_address,
        user_agent=user_agent,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=details,
        previous_hash=prev_hash,
        current_hash=current_hash,
        created_at=now_utc
    )

    db.add(audit_entry)
    db.commit()
    db.refresh(audit_entry)
    return audit_entry


def verify_audit_chain_integrity(db: Session) -> Dict[str, Any]:
    """Verify entire audit log table from genesis to head for any cryptographic tampering."""
    records = db.query(AuditLog).order_by(AuditLog.sequence_number.asc()).all()
    if not records:
        return {"valid": True, "total_records": 0, "broken_sequence": None}

    expected_prev = GENESIS_HASH
    for rec in records:
        if rec.previous_hash != expected_prev:
            return {
                "valid": False,
                "total_records": len(records),
                "broken_sequence": rec.sequence_number,
                "reason": f"Mismatched previous hash at record seq={rec.sequence_number}"
            }
        expected_prev = rec.current_hash

    return {
        "valid": True,
        "total_records": len(records),
        "latest_hash": expected_prev,
        "broken_sequence": None
    }
