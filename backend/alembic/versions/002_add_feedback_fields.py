"""Add feedback fields: research_filter_requirements, approved_by/at

Revision ID: 002
Revises: 001
Create Date: 2026-02-20

Adds:
- segments.research_filter_requirements (TEXT NOT NULL DEFAULT '')
- companies.approved_by (UUID FK -> users.id)
- companies.approved_at (TIMESTAMPTZ)
- contacts.approved_by (UUID FK -> users.id)
- contacts.approved_at (TIMESTAMPTZ)
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic
revision: str = '002'
down_revision: Union[str, None] = '001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Segments: research filter requirements
    op.add_column('segments', sa.Column(
        'research_filter_requirements', sa.Text(), nullable=False, server_default=''
    ))

    # Companies: approval audit
    op.add_column('companies', sa.Column(
        'approved_by', sa.dialects.postgresql.UUID(as_uuid=True), nullable=True
    ))
    op.add_column('companies', sa.Column(
        'approved_at', sa.DateTime(timezone=True), nullable=True
    ))
    op.create_foreign_key(
        'fk_companies_approved_by_users',
        'companies', 'users',
        ['approved_by'], ['id'],
        ondelete='SET NULL'
    )

    # Contacts: approval audit
    op.add_column('contacts', sa.Column(
        'approved_by', sa.dialects.postgresql.UUID(as_uuid=True), nullable=True
    ))
    op.add_column('contacts', sa.Column(
        'approved_at', sa.DateTime(timezone=True), nullable=True
    ))
    op.create_foreign_key(
        'fk_contacts_approved_by_users',
        'contacts', 'users',
        ['approved_by'], ['id'],
        ondelete='SET NULL'
    )


def downgrade() -> None:
    op.drop_constraint('fk_contacts_approved_by_users', 'contacts', type_='foreignkey')
    op.drop_column('contacts', 'approved_at')
    op.drop_column('contacts', 'approved_by')

    op.drop_constraint('fk_companies_approved_by_users', 'companies', type_='foreignkey')
    op.drop_column('companies', 'approved_at')
    op.drop_column('companies', 'approved_by')

    op.drop_column('segments', 'research_filter_requirements')
