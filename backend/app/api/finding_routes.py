"""CloudGuard AI - API Routes: Security Findings & Rules Catalog"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, UserRole
from app.services.auth_service import get_current_user
from app.models.finding import Finding, SecurityRule, SeverityEnum, FindingStatusEnum
from app.schemas.cloud import FindingResponse, SecurityRuleResponse

router = APIRouter(prefix="/findings", tags=["Security Findings"])


@router.get("", response_model=List[FindingResponse])
def list_findings(
    severity: Optional[SeverityEnum] = Query(None),
    status: Optional[FindingStatusEnum] = Query(None),
    account_id: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List detected security vulnerabilities scoped to the authenticated user."""
    query = db.query(Finding)
    if current_user.role != UserRole.ADMIN:
        query = query.filter(Finding.user_id == current_user.id)
    if severity:
        query = query.filter(Finding.severity == severity)
    if status:
        query = query.filter(Finding.status == status)
    if account_id:
        query = query.filter(Finding.cloud_account_id == account_id)
    return query.order_by(Finding.risk_score_contribution.desc()).all()


@router.get("/rules", response_model=List[SecurityRuleResponse])
def list_rules(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve catalog of all active security detection rules."""
    return db.query(SecurityRule).all()


@router.get("/{finding_id}", response_model=FindingResponse)
def get_finding(
    finding_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get single finding detail with IDOR verification."""
    query = db.query(Finding).filter(Finding.id == finding_id)
    if current_user.role != UserRole.ADMIN:
        query = query.filter(Finding.user_id == current_user.id)
    f = query.first()
    if not f:
        raise HTTPException(status_code=404, detail="Finding not found")
    return f


@router.patch("/{finding_id}/status", response_model=FindingResponse)
def update_finding_status(
    finding_id: str,
    status_update: FindingStatusEnum = Body(..., embed=True),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update status of a security finding with IDOR protection."""
    query = db.query(Finding).filter(Finding.id == finding_id)
    if current_user.role != UserRole.ADMIN:
        query = query.filter(Finding.user_id == current_user.id)
    f = query.first()
    if not f:
        raise HTTPException(status_code=404, detail="Finding not found")
    f.status = status_update
    db.commit()
    db.refresh(f)
    return f
