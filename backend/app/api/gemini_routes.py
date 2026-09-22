"""CloudGuard AI - API Routes: Gemini AI Deep Threat Investigation & Assistant"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.services.auth_service import get_current_user
from app.models.finding import Finding
from app.models.resource import CloudResource
from app.schemas.analytics import GeminiAnalysisRequest, GeminiAnalysisResponse
from app.services.gemini_service import gemini_service

router = APIRouter(prefix="/ai", tags=["AI Copilot & GenAI Analysis"])


@router.post("/analyze-finding", response_model=GeminiAnalysisResponse)
def analyze_finding_ai(
    req: GeminiAnalysisRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Run GenAI deep-dive threat analysis with finding ownership verification."""
    if not req.target_id:
        raise HTTPException(status_code=400, detail="Finding target_id is required")

    finding = db.query(Finding).filter(
        Finding.id == req.target_id,
        Finding.user_id == current_user.id
    ).first()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")

    resource = db.query(CloudResource).filter(
        CloudResource.id == finding.resource_id,
        CloudResource.user_id == current_user.id
    ).first()
    res_config = resource.configuration if resource else {}

    analysis = gemini_service.analyze_finding(
        finding_data={
            "id": finding.id,
            "rule_id": finding.rule_id,
            "title": finding.title,
            "severity": finding.severity.value
        },
        resource_config=res_config
    )
    return analysis
