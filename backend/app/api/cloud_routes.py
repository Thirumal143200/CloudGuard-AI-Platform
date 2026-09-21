"""CloudGuard AI — API Routes: Cloud Accounts & Discovered Assets"""
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.cloud import CloudAccount
from app.models.resource import CloudResource
from app.schemas.cloud import CloudAccountCreate, CloudAccountResponse, CloudResourceResponse

router = APIRouter(prefix="/cloud", tags=["Cloud Accounts & Resources"])


@router.get("/accounts", response_model=List[CloudAccountResponse])
def list_accounts(db: Session = Depends(get_db)):
    """List all connected cloud accounts."""
    return db.query(CloudAccount).all()


@router.post("/accounts", response_model=CloudAccountResponse)
def connect_account(acc_in: CloudAccountCreate, db: Session = Depends(get_db)):
    """Connect a new AWS / Azure / GCP cloud account."""
    acc = CloudAccount(
        id=f"acc-{uuid.uuid4().hex[:8]}",
        name=acc_in.name,
        provider=acc_in.provider,
        account_id=acc_in.account_id,
        environment=acc_in.environment,
        is_active=True,
        is_simulated=True
    )
    db.add(acc)
    db.commit()
    db.refresh(acc)
    return acc


@router.get("/resources", response_model=List[CloudResourceResponse])
def list_resources(
    account_id: Optional[str] = Query(None),
    provider: Optional[str] = Query(None),
    resource_type: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """List cloud inventory assets with optional multi-cloud filtering."""
    query = db.query(CloudResource)
    if account_id:
        query = query.filter(CloudResource.cloud_account_id == account_id)
    if provider:
        query = query.filter(CloudResource.provider == provider)
    if resource_type:
        query = query.filter(CloudResource.resource_type == resource_type)
    return query.all()


@router.get("/resources/{resource_id}", response_model=CloudResourceResponse)
def get_resource_detail(resource_id: str, db: Session = Depends(get_db)):
    """Retrieve full configuration and state of a single cloud resource."""
    res = db.query(CloudResource).filter(CloudResource.id == resource_id).first()
    if not res:
        raise HTTPException(status_code=404, detail="Resource not found")
    return res
