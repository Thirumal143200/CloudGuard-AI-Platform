"""CloudGuard AI - API Routes: Security Incidents & Investigations"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
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
    return (
        db.query(Incident)
        .filter(Incident.user_id == current_user.id)
        .order_by(Incident.created_at.desc())
        .all()
    )


@router.get("/{incident_id}", response_model=IncidentResponse)
def get_incident_detail(
    incident_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve deep forensic investigation details for an incident with IDOR protection."""
    inc = db.query(Incident).filter(
        Incident.id == incident_id,
        Incident.user_id == current_user.id
    ).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    return inc


@router.delete("/{incident_id}")
def delete_incident(
    incident_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an incident belonging to the authenticated user with IDOR protection."""
    inc = db.query(Incident).filter(
        Incident.id == incident_id,
        Incident.user_id == current_user.id
    ).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    db.query(IncidentTimeline).filter(IncidentTimeline.incident_id == incident_id).delete(synchronize_session=False)
    db.delete(inc)
    db.commit()
    return {"status": "DELETED", "id": incident_id}


@router.get("/{incident_id}/timeline", response_model=List[IncidentTimelineResponse])
def get_incident_timeline(
    incident_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve chronological event timeline for incident triage with IDOR protection."""
    inc = db.query(Incident).filter(
        Incident.id == incident_id,
        Incident.user_id == current_user.id
    ).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    return db.query(IncidentTimeline).filter(
        IncidentTimeline.incident_id == incident_id
    ).order_by(IncidentTimeline.created_at.asc()).all()
