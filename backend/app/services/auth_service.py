"""CloudGuard AI — Auth Service: Argon2id Password Hashing & JWT Management

Strict adherence:
- Passwords are NEVER encrypted; they are irreversibly hashed using Argon2id
- Salt is cryptographically unique per user
- JWT access tokens signed with JWT_SECRET_KEY
- JWT refresh tokens signed with dedicated JWT_REFRESH_SECRET_KEY
- RBAC role enforcement on protected endpoints
"""
import os
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
import jwt
from fastapi import HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.config import settings
from app.models.user import UserRole

# Attempt import of Argon2
try:
    from argon2 import PasswordHasher
    from argon2.exceptions import VerifyMismatchError
    # Standard Argon2id configuration
    ph = PasswordHasher(
        time_cost=2,
        memory_cost=65536,  # 64 MB
        parallelism=1,
        hash_len=32
    )
    ARGON2_AVAILABLE = True
except ImportError:
    ARGON2_AVAILABLE = False

security_scheme = HTTPBearer()


def hash_password(password: str) -> str:
    """Hash password using Argon2id with cryptographically secure random salt."""
    if ARGON2_AVAILABLE:
        return ph.hash(password)
    else:
        # Secure PBKDF2-HMAC-SHA256 fallback (100,000 iterations)
        salt = secrets.token_bytes(16)
        key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100_000)
        return f"pbkdf2:sha256:100000${salt.hex()}${key.hex()}"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify plaintext password against stored hash (Argon2id or PBKDF2)."""
    if not hashed_password:
        return False

    # Check if Argon2 hash (starts with $argon2)
    if hashed_password.startswith("$argon2"):
        if ARGON2_AVAILABLE:
            try:
                return ph.verify(hashed_password, plain_password)
            except VerifyMismatchError:
                return False
            except Exception:
                return False
        return False

    # Check if PBKDF2 hash
    if hashed_password.startswith("pbkdf2:sha256:"):
        try:
            parts = hashed_password.split("$")
            if len(parts) != 3:
                return False
            meta, salt_hex, key_hex = parts
            salt = bytes.fromhex(salt_hex)
            iters = int(meta.split(":")[2])
            computed_key = hashlib.pbkdf2_hmac("sha256", plain_password.encode("utf-8"), salt, iters)
            return secrets.compare_digest(computed_key.hex(), key_hex)
        except Exception:
            return False

    return False


def create_access_token(user_id: str, email: str, role: str) -> str:
    """Generate signed JWT access token using JWT_SECRET_KEY."""
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "token_type": "access",
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    """Generate signed JWT refresh token using dedicated JWT_REFRESH_SECRET_KEY."""
    expire = datetime.now(timezone.utc) + timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS)
    payload = {
        "sub": user_id,
        "token_type": "refresh",
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, settings.JWT_REFRESH_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str, is_refresh: bool = False) -> Dict[str, Any]:
    """Decode and cryptographically validate JWT access or refresh token."""
    key = settings.JWT_REFRESH_SECRET_KEY if is_refresh else settings.JWT_SECRET_KEY
    try:
        payload = jwt.decode(token, key, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Authentication token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid authentication token signature")


def get_current_user_token(credentials: HTTPAuthorizationCredentials = Security(security_scheme)) -> Dict[str, Any]:
    """FastAPI dependency extracting and validating bearer JWT token."""
    return decode_token(credentials.credentials, is_refresh=False)


def require_role(allowed_roles: list[UserRole]):
    """RBAC authorization guard verifying user role claim."""
    def role_checker(token_data: Dict[str, Any] = Depends(get_current_user_token)):
        role_str = token_data.get("role")
        if not role_str or role_str not in [r.value for r in allowed_roles]:
            raise HTTPException(
                status_code=403,
                detail=f"Forbidden: Insufficient privileges. Requires one of {[r.value for r in allowed_roles]}"
            )
        return token_data
    return role_checker
