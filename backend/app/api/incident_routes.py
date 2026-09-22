"""CloudGuard AI - API Routes: Security Incidents & Investigations"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, UserRole
from app.services.auth_service import get_current_user
from app.models.incident import Incident, IncidentTimeline
from app.schemas.analytics import IncidentResponse, IncidentTimelineResponse

router = APIRouter(prefix="/incidents", tags=["Incidents & Forensics"])


@router.get("", response_model=List[IncidentResponse])
def list_incidents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List correlated multi-vector security incidents scoped to authenticated user."""
    query = db.query(Incident)
    if current_user.role != UserRole.ADMIN:
        query = query.filter(Incident.user_id == current_user.id)
    return query.order_by(Incident.created_at.desc()).all()


@router.get("/{incident_id}", response_model=IncidentResponse)
def get_incident_detail(
    incident_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve deep forensic investigation details for an incident with IDOR protection."""
    query = db.query(Incident).filter(Incident.id == incident_id)
    if current_user.role != UserRole.ADMIN:
        query = query.filter(Incident.user_id == current_user.id)
    inc = query.first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    return inc


@router.get("/{incident_id}/timeline", response_model=List[IncidentTimelineResponse])
def get_incident_timeline(
    incident_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve chronological event timeline for incident triage with IDOR protection."""
    inc_query = db.query(Incident).filter(Incident.id == incident_id)
    if current_user.role != UserRole.ADMIN:
        inc_query = inc_query.filter(Incident.user_id == current_user.id)
    inc = inc_query.first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    return db.query(IncidentTimeline).filter(
        IncidentTimeline.incident_id == incident_id
    ).order_by(IncidentTimeline.created_at.asc()).all()
