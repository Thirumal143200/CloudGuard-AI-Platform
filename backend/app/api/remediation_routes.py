"""CloudGuard AI - API Routes: Remediation Plans, Dry Runs, and Automated Execution"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.services.auth_service import get_current_user
from app.models.remediation import RemediationPlan
from app.models.resource import CloudResource
from app.schemas.analytics import RemediationPlanResponse, RemediationExecuteRequest
from app.services.remediation_service import execute_dry_run, execute_remediation

router = APIRouter(prefix="/remediations", tags=["Remediation & Automation"])


@router.get("", response_model=List[RemediationPlanResponse])
def list_remediation_plans(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all proposed, approved, and executed remediation actions scoped to authenticated user."""
    return (
        db.query(RemediationPlan)
        .filter(RemediationPlan.user_id == current_user.id)
        .order_by(RemediationPlan.created_at.desc())
        .all()
    )


@router.get("/{plan_id}", response_model=RemediationPlanResponse)
def get_remediation_plan(
    plan_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve detail of a remediation plan with IDOR protection."""
    plan = db.query(RemediationPlan).filter(
        RemediationPlan.id == plan_id,
        RemediationPlan.user_id == current_user.id
    ).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    return plan


@router.post("/{plan_id}/dry-run")
def run_dry_run(
    plan_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Simulate execution of remediation plan with IDOR verification."""
    plan = db.query(RemediationPlan).filter(
        RemediationPlan.id == plan_id,
        RemediationPlan.user_id == current_user.id
    ).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
        
    res_query = db.query(CloudResource).filter(CloudResource.user_id == current_user.id)
    if plan.cloud_account_id:
        res_query = res_query.filter(CloudResource.cloud_account_id == plan.cloud_account_id)
    resource = res_query.first()
    if not resource:
        resource = db.query(CloudResource).filter(CloudResource.user_id == current_user.id).first()

    if not resource:
        raise HTTPException(status_code=404, detail="Target resource not found")

    result = execute_dry_run(plan, resource)
    plan.dry_run_output = result
    plan.dry_run_success = result.get("dry_run_success", False)
    db.commit()
    return result


@router.post("/{plan_id}/execute")
def trigger_execution(
    plan_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Execute remediation against target cloud resource with IDOR verification."""
    plan = db.query(RemediationPlan).filter(
        RemediationPlan.id == plan_id,
        RemediationPlan.user_id == current_user.id
    ).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    plan.executed_by = current_user.id
    try:
        result = execute_remediation(db, plan_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
