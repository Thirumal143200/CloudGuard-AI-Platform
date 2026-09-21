"""CloudGuard AI — API Routes: Security Findings & Rules Catalog"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.finding import Finding, SecurityRule, SeverityEnum, FindingStatusEnum
from app.schemas.cloud import FindingResponse, SecurityRuleResponse

router = APIRouter(prefix="/findings", tags=["Security Findings"])


@router.get("", response_model=List[FindingResponse])
def list_findings(
    severity: Optional[SeverityEnum] = Query(None),
    status: Optional[FindingStatusEnum] = Query(None),
    account_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """List all detected security vulnerabilities with multi-criteria filters."""
    query = db.query(Finding)
    if severity:
        query = query.filter(Finding.severity == severity)
    if status:
        query = query.filter(Finding.status == status)
    if account_id:
        query = query.filter(Finding.cloud_account_id == account_id)
    return query.order_by(Finding.risk_score_contribution.desc()).all()


@router.get("/rules", response_model=List[SecurityRuleResponse])
def list_rules(db: Session = Depends(get_db)):
    """Retrieve catalog of all active security detection rules."""
    return db.query(SecurityRule).all()


@router.get("/{finding_id}", response_model=FindingResponse)
def get_finding(finding_id: str, db: Session = Depends(get_db)):
    """Get single finding detail including raw evidence and remediation guidance."""
    f = db.query(Finding).filter(Finding.id == finding_id).first()
    if not f:
        raise HTTPException(status_code=404, detail="Finding not found")
    return f
