"""CloudGuard AI — API Routes: Authentication & User Management"""
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, UserRole
from app.schemas.auth import UserCreate, UserLogin, UserResponse, TokenResponse
from app.services.auth_service import hash_password, verify_password, create_access_token, create_refresh_token, get_current_user_token
from app.services.audit_service import log_action, AuditActionEnum
from app.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """Register a new user account."""
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    new_user = User(
        id=f"usr-{uuid.uuid4().hex[:8]}",
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=hash_password(user_in.password),
        role=user_in.role,
        is_active=True,
        is_locked=False
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    log_action(
        db=db,
        action=AuditActionEnum.USER_REGISTER,
        entity_type="USER",
        entity_id=new_user.id,
        details={"email": new_user.email, "role": new_user.role.value},
        actor_email=new_user.email
    )
    return new_user


@router.post("/login", response_model=TokenResponse)
def login(creds: UserLogin, db: Session = Depends(get_db)):
    """Authenticate user and issue signed JWT access/refresh tokens."""
    user = db.query(User).filter(User.email == creds.email).first()
    if not user or not verify_password(creds.password, user.hashed_password):
        if user:
            user.failed_login_attempts += 1
            if user.failed_login_attempts >= 5:
                user.is_locked = True
            db.commit()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    if user.is_locked or not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is locked or inactive")

    # Reset failed attempts
    user.failed_login_attempts = 0
    user.last_login_at = datetime.now(timezone.utc)
    db.commit()

    access_tok = create_access_token(user.id, user.email, user.role.value)
    refresh_tok = create_refresh_token(user.id)

    log_action(
        db=db,
        action=AuditActionEnum.USER_LOGIN,
        entity_type="USER",
        entity_id=user.id,
        details={"email": user.email, "role": user.role.value},
        actor_email=user.email
    )

    return TokenResponse(
        access_token=access_tok,
        refresh_token=refresh_tok,
        expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserResponse.model_validate(user)
    )


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(token_data: dict = Depends(get_current_user_token), db: Session = Depends(get_db)):
    """Retrieve active authenticated user profile."""
    user = db.query(User).filter(User.id == token_data.get("sub")).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
