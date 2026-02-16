"""Initial schema for Spanner CRM

Revision ID: 001
Revises:
Create Date: 2026-02-16

This migration creates the complete database schema for Spanner CRM including:
- All enum types
- All core tables (users, segments, offerings, companies, contacts, etc.)
- Supporting tables (assignments, upload_batches, audit_logs, notifications, etc.)
- All indexes (including manual FK indexes)
- Triggers for auto-updating updated_at timestamps
- Seed data (default admin user and role grants)
"""
from typing import Sequence, Union
from pathlib import Path

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic
revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Apply the initial schema by executing the SQL file."""

    # Get the SQL file path (in the same directory as this migration)
    sql_file_path = Path(__file__).parent / '001_initial_schema.sql'

    # Read the SQL file
    with open(sql_file_path, 'r', encoding='utf-8') as f:
        sql_statements = f.read()

    # Execute the SQL
    # We use execute with text() to handle the raw SQL properly
    op.execute(sa.text(sql_statements))


def downgrade() -> None:
    """Rollback the initial schema by dropping all objects in reverse order."""

    # Drop all tables (order matters due to foreign key constraints)
    op.execute(sa.text('DROP TABLE IF EXISTS marketing_collateral CASCADE'))
    op.execute(sa.text('DROP TABLE IF EXISTS notifications CASCADE'))
    op.execute(sa.text('DROP TABLE IF EXISTS user_preferences CASCADE'))
    op.execute(sa.text('DROP TABLE IF EXISTS audit_logs CASCADE'))
    op.execute(sa.text('DROP TABLE IF EXISTS upload_batches CASCADE'))
    op.execute(sa.text('DROP TABLE IF EXISTS assignments CASCADE'))
    op.execute(sa.text('DROP TABLE IF EXISTS contacts CASCADE'))
    op.execute(sa.text('DROP TABLE IF EXISTS companies CASCADE'))
    op.execute(sa.text('DROP TABLE IF EXISTS segment_offerings CASCADE'))
    op.execute(sa.text('DROP TABLE IF EXISTS offerings CASCADE'))
    op.execute(sa.text('DROP TABLE IF EXISTS segments CASCADE'))
    op.execute(sa.text('DROP TABLE IF EXISTS role_grants CASCADE'))
    op.execute(sa.text('DROP TABLE IF EXISTS user_roles CASCADE'))
    op.execute(sa.text('DROP TABLE IF EXISTS users CASCADE'))

    # Drop the trigger function
    op.execute(sa.text('DROP FUNCTION IF EXISTS update_updated_at_column CASCADE'))

    # Drop all enum types
    op.execute(sa.text('DROP TYPE IF EXISTS notification_type CASCADE'))
    op.execute(sa.text('DROP TYPE IF EXISTS entity_type CASCADE'))
    op.execute(sa.text('DROP TYPE IF EXISTS upload_type CASCADE'))
    op.execute(sa.text('DROP TYPE IF EXISTS batch_status CASCADE'))
    op.execute(sa.text('DROP TYPE IF EXISTS contact_status CASCADE'))
    op.execute(sa.text('DROP TYPE IF EXISTS company_status CASCADE'))
    op.execute(sa.text('DROP TYPE IF EXISTS offering_status CASCADE'))
    op.execute(sa.text('DROP TYPE IF EXISTS segment_status CASCADE'))
    op.execute(sa.text('DROP TYPE IF EXISTS user_status CASCADE'))
    op.execute(sa.text('DROP TYPE IF EXISTS user_role CASCADE'))

    # Note: We don't drop extensions as they may be used by other databases/schemas
    # op.execute(sa.text('DROP EXTENSION IF EXISTS pgcrypto'))
    # op.execute(sa.text('DROP EXTENSION IF EXISTS "uuid-ossp"'))
