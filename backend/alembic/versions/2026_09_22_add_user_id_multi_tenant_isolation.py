"""add_user_id_multi_tenant_isolation

Revision ID: 4a8e219f8d10
Revises: 3f5f159e3b50
Create Date: 2026-09-22 21:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4a8e219f8d10'
down_revision: Union[str, None] = '3f5f159e3b50'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    tables = [
        'cloud_accounts',
        'data_sources',
        'ingestion_jobs',
        'cloud_resources',
        'findings',
        'incidents',
        'remediation_plans',
        'verification_scans',
        'gemini_audit_logs',
    ]
    for table_name in tables:
        try:
            op.add_column(table_name, sa.Column('user_id', sa.String(length=64), nullable=True))
            op.create_foreign_key(f'fk_{table_name}_user_id', table_name, 'users', ['user_id'], ['id'])
            op.create_index(f'ix_{table_name}_user_id', table_name, ['user_id'])
        except Exception:
            pass


def downgrade() -> None:
    tables = [
        'gemini_audit_logs',
        'verification_scans',
        'remediation_plans',
        'incidents',
        'findings',
        'cloud_resources',
        'ingestion_jobs',
        'data_sources',
        'cloud_accounts',
    ]
    for table_name in tables:
        try:
            op.drop_index(f'ix_{table_name}_user_id', table_name=table_name)
            op.drop_constraint(f'fk_{table_name}_user_id', table_name=table_name, type_='foreignkey')
            op.drop_column(table_name, 'user_id')
        except Exception:
            pass
