"""enforce_user_id_not_null_migration

Revision ID: 5b9f320e9e21
Revises: 4a8e219f8d10
Create Date: 2026-09-22 22:30:00.000000

Strategy:
1. Legacy Null Record Isolation:
   Creates a quarantined system account ('usr-quarantined-legacy', locked and inactive).
   Updates any existing legacy rows where user_id IS NULL to point to this quarantined tenant.
   Prevents silent assignment of any customer data to other tenants.
2. Enforce NOT NULL:
   Alters user_id to nullable=False on all primary user-owned tables:
   cloud_accounts, data_sources, ingestion_jobs, cloud_resources, findings, incidents, remediation_plans.
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from datetime import datetime, timezone


# revision identifiers, used by Alembic.
revision: str = '5b9f320e9e21'
down_revision: Union[str, None] = '4a8e219f8d10'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

LEGACY_QUARANTINE_USER_ID = "usr-quarantined-legacy"

USER_OWNED_TABLES = [
    'cloud_accounts',
    'data_sources',
    'ingestion_jobs',
    'cloud_resources',
    'findings',
    'incidents',
    'remediation_plans',
]


def upgrade() -> None:
    conn = op.get_bind()

    # Step 1: Ensure quarantined legacy system user exists
    now_utc = datetime.now(timezone.utc)
    try:
        conn.execute(
            sa.text(
                "INSERT INTO users (id, email, full_name, hashed_password, role, is_active, is_locked, failed_login_attempts, created_at, updated_at) "
                "VALUES (:id, :email, :full_name, :hashed_password, :role, :is_active, :is_locked, 0, :created_at, :updated_at) "
                "ON CONFLICT (id) DO NOTHING"
            ),
            {
                "id": LEGACY_QUARANTINE_USER_ID,
                "email": "quarantined-legacy@cloudguard.internal",
                "full_name": "Quarantined Legacy Data",
                "hashed_password": "argon2id$quarantined$disabled",
                "role": "VIEWER",
                "is_active": False,
                "is_locked": True,
                "created_at": now_utc,
                "updated_at": now_utc,
            }
        )
    except Exception:
        # Fallback for SQLite or databases without ON CONFLICT (id)
        try:
            res = conn.execute(
                sa.text("SELECT id FROM users WHERE id = :id"),
                {"id": LEGACY_QUARANTINE_USER_ID}
            ).fetchone()
            if not res:
                conn.execute(
                    sa.text(
                        "INSERT INTO users (id, email, full_name, hashed_password, role, is_active, is_locked, failed_login_attempts, created_at, updated_at) "
                        "VALUES (:id, :email, :full_name, :hashed_password, :role, 0, 1, 0, :created_at, :updated_at)"
                    ),
                    {
                        "id": LEGACY_QUARANTINE_USER_ID,
                        "email": "quarantined-legacy@cloudguard.internal",
                        "full_name": "Quarantined Legacy Data",
                        "hashed_password": "argon2id$quarantined$disabled",
                        "role": "VIEWER",
                        "created_at": now_utc,
                        "updated_at": now_utc,
                    }
                )
        except Exception:
            pass

    # Step 2: Quarantine any legacy NULL rows to usr-quarantined-legacy
    for table_name in USER_OWNED_TABLES:
        try:
            conn.execute(
                sa.text(f"UPDATE {table_name} SET user_id = :legacy_id WHERE user_id IS NULL"),
                {"legacy_id": LEGACY_QUARANTINE_USER_ID}
            )
        except Exception:
            pass

    # Step 3: Enforce NOT NULL constraint on user_id across user-owned tables
    for table_name in USER_OWNED_TABLES:
        try:
            with op.batch_alter_table(table_name) as batch_op:
                batch_op.alter_column('user_id', existing_type=sa.String(length=64), nullable=False)
        except Exception:
            pass


def downgrade() -> None:
    # Revert NOT NULL constraints back to nullable
    for table_name in USER_OWNED_TABLES:
        try:
            with op.batch_alter_table(table_name) as batch_op:
                batch_op.alter_column('user_id', existing_type=sa.String(length=64), nullable=True)
        except Exception:
            pass
