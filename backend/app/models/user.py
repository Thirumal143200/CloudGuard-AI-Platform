"""CloudGuard AI — ORM Models: Users, Roles, Authentication"""
import enum
from datetime import datetime
from typing import Optional
from sqlalchemy import Column, String, Integer, Boolean, DateTime, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base, TimestampMixin, generate_uuid


class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    SECURITY_ANALYST = "SECURITY_ANALYST"
    VIEWER = "VIEWER"


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=generate_uuid)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        SAEnum(UserRole), nullable=False, default=UserRole.VIEWER
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_locked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    failed_login_attempts: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    last_login_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    @property
    def username(self) -> str:
        return self.email

    @property
    def password_hash(self) -> str:
        return self.hashed_password

    def __repr__(self):
        return f"<User {self.email} ({self.role})>"


class PasswordResetOTP(Base, TimestampMixin):
    """Cryptographically protected single-use OTP for secure password resets."""
    __tablename__ = "password_reset_otps"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    otp_hash: Mapped[str] = mapped_column(String(128), nullable=False)
    attempts_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    max_attempts: Mapped[int] = mapped_column(Integer, default=5, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    is_used: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    def __repr__(self):
        return f"<PasswordResetOTP for {self.email} (used={self.is_used}, attempts={self.attempts_count})>"
