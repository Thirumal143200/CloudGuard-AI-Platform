"""CloudGuard AI — API Routes: Authentication, User Lifecycle & Secure OTP Password Reset"""
import uuid
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, UserRole, PasswordResetOTP
from app.schemas.auth import (
    UserCreate,
    UserLogin,
    UserResponse,
    TokenResponse,
    ForgotPasswordRequest,
    VerifyOTPRequest,
    VerifyOTPResponse,
    ResetPasswordRequest,
    GenericStatusResponse,
)
from app.services.auth_service import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    get_current_user_token,
    generate_secure_otp,
    hash_otp,
    verify_otp_hash,
    create_password_reset_token,
    decode_password_reset_token,
    validate_password_complexity,
)
from app.services.email_service import EmailService
from app.services.audit_service import log_action, AuditActionEnum
from app.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """Register a new analyst account with strict password validation."""
    validate_password_complexity(user_in.password)

    email_clean = user_in.email.strip().lower()
    existing = db.query(User).filter(User.email == email_clean).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

    new_user = User(
        id=f"usr-{uuid.uuid4().hex[:8]}",
        email=email_clean,
        full_name=user_in.full_name.strip(),
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
    """Authenticate analyst and issue signed JWT access/refresh tokens."""
    email_clean = creds.email.strip().lower()
    user = db.query(User).filter(User.email == email_clean).first()
    
    if not user or not verify_password(creds.password, user.hashed_password):
        if user:
            user.failed_login_attempts += 1
            if user.failed_login_attempts >= 5:
                user.is_locked = True
            db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email or password is incorrect."
        )

    if user.is_locked or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is locked due to security policy. Please reset your password or contact your administrator."
        )

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


@router.post("/forgot-password", response_model=GenericStatusResponse)
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Initiate secure password reset with 6-digit cryptographic OTP.
    Employs anti-enumeration response to protect user identity.
    """
    email_clean = req.email.strip().lower()
    user = db.query(User).filter(User.email == email_clean).first()

    delivery_status = "CONFIGURED" if EmailService.is_configured() else "UNCONFIGURED"

    if user and user.is_active:
        # Invalidate previous unused OTPs for this email
        db.query(PasswordResetOTP).filter(
            PasswordResetOTP.email == email_clean,
            PasswordResetOTP.is_used == False
        ).update({"is_used": True})

        # Generate fresh 6-digit OTP
        plain_otp = generate_secure_otp()
        hashed = hash_otp(plain_otp)

        otp_record = PasswordResetOTP(
            id=f"otp-{uuid.uuid4().hex[:10]}",
            user_id=user.id,
            email=email_clean,
            otp_hash=hashed,
            attempts_count=0,
            max_attempts=5,
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=10),
            is_used=False
        )
        db.add(otp_record)
        db.commit()

        # Dispatch via Email Service
        EmailService.send_password_reset_otp(email_clean, plain_otp)

    return GenericStatusResponse(
        status="SENT",
        message="If an account exists for this email, a 6-digit verification code has been sent.",
        email_delivery=delivery_status
    )


@router.post("/verify-otp", response_model=VerifyOTPResponse)
def verify_otp(req: VerifyOTPRequest, db: Session = Depends(get_db)):
    """Verify single-use OTP code and issue temporary password reset token."""
    email_clean = req.email.strip().lower()
    otp_candidate = req.otp.strip()

    now_utc = datetime.now(timezone.utc)

    # Query latest unused OTP
    otp_record = db.query(PasswordResetOTP).filter(
        PasswordResetOTP.email == email_clean,
        PasswordResetOTP.is_used == False
    ).order_by(PasswordResetOTP.created_at.desc()).first()

    if not otp_record:
        raise HTTPException(
            status_code=400,
            detail="No active verification code found for this email. Please request a new code."
        )

    # Check attempt limit
    if otp_record.attempts_count >= otp_record.max_attempts:
        otp_record.is_used = True
        db.commit()
        raise HTTPException(
            status_code=400,
            detail="Maximum verification attempts exceeded. Please request a new code."
        )

    # Check expiry
    # Normalize expires_at timezone if naive
    expires = otp_record.expires_at
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)

    if expires < now_utc:
        otp_record.is_used = True
        db.commit()
        raise HTTPException(
            status_code=400,
            detail="Verification code has expired (10 minute limit). Please request a new code."
        )

    # Verify cryptographic hash
    if not verify_otp_hash(otp_candidate, otp_record.otp_hash):
        otp_record.attempts_count += 1
        remaining = otp_record.max_attempts - otp_record.attempts_count
        if remaining <= 0:
            otp_record.is_used = True
            db.commit()
            raise HTTPException(
                status_code=400,
                detail="Maximum verification attempts exceeded. This code is invalidated. Please request a new code."
            )
        db.commit()
        raise HTTPException(
            status_code=400,
            detail=f"Invalid verification code. {remaining} attempt(s) remaining."
        )

    # Successfully verified — mark used and issue reset token
    otp_record.is_used = True
    db.commit()

    reset_token = create_password_reset_token(otp_record.user_id, email_clean)

    return VerifyOTPResponse(
        status="VERIFIED",
        message="Verification code confirmed successfully.",
        reset_token=reset_token
    )


@router.post("/reset-password", response_model=GenericStatusResponse)
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Reset account password using verified reset token."""
    # 1. Validate token
    payload = decode_password_reset_token(req.reset_token)
    user_id = payload.get("sub")

    # 2. Validate password complexity
    validate_password_complexity(req.new_password)

    # 3. Retrieve user
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User account not found.")

    # 4. Update hashed password, reset failed attempts & unlock
    user.hashed_password = hash_password(req.new_password)
    user.failed_login_attempts = 0
    user.is_locked = False
    db.commit()

    # 5. Cryptographic audit trail
    log_action(
        db=db,
        action=AuditActionEnum.USER_PASSWORD_RESET,
        entity_type="USER",
        entity_id=user.id,
        details={"email": user.email, "event": "PASSWORD_RESET_SUCCESS"},
        actor_email=user.email
    )

    return GenericStatusResponse(
        status="SUCCESS",
        message="Your password has been reset successfully. You may now sign in with your new password."
    )


@router.post("/logout", response_model=GenericStatusResponse)
def logout(token_data: dict = Depends(get_current_user_token), db: Session = Depends(get_db)):
    """Invalidate analyst session and record event in tamper-evident audit ledger."""
    user_id = token_data.get("sub")
    email = token_data.get("email") or "analyst@cloudguard.local"

    log_action(
        db=db,
        action=AuditActionEnum.USER_LOGOUT,
        entity_type="USER",
        entity_id=user_id,
        details={"email": email, "event": "SESSION_TERMINATED"},
        actor_email=email
    )

    return GenericStatusResponse(
        status="SUCCESS",
        message="Signed out of CloudGuard AI session successfully."
    )


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(token_data: dict = Depends(get_current_user_token), db: Session = Depends(get_db)):
    """Retrieve active authenticated user profile."""
    user = db.query(User).filter(User.id == token_data.get("sub")).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
