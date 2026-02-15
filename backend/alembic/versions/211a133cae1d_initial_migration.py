"""Initial migration

Revision ID: 211a133cae1d
Revises:
Create Date: 2024-03-24 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy.dialects.postgresql import UUID

# revision identifiers, used by Alembic.
revision: str = '211a133cae1d'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. users
    op.create_table(
        'users',
        sa.Column('id', UUID(), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email')
    )

    # 2. roles
    op.create_table(
        'roles',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=50), nullable=False),
        sa.Column('description', sa.String(length=255), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )

    # 3. user_roles
    op.create_table(
        'user_roles',
        sa.Column('user_id', UUID(), nullable=False),
        sa.Column('role_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['role_id'], ['roles.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('user_id', 'role_id')
    )

    # 4. permissions
    op.create_table(
        'permissions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('module', sa.String(length=100), nullable=False),
        sa.Column('action', sa.String(length=100), nullable=False),
        sa.Column('description', sa.String(length=255), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('module', 'action', name='unique_permission')
    )

    # 5. role_permissions
    op.create_table(
        'role_permissions',
        sa.Column('role_id', sa.Integer(), nullable=False),
        sa.Column('permission_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['permission_id'], ['permissions.id'], ),
        sa.ForeignKeyConstraint(['role_id'], ['roles.id'], ),
        sa.PrimaryKeyConstraint('role_id', 'permission_id')
    )

    # 6. segments
    op.create_table(
        'segments',
        sa.Column('id', UUID(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('status', sa.String(length=20), server_default='active', nullable=False),
        sa.Column('created_by', UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.CheckConstraint("status IN ('active', 'archived')"),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )

    # 7. offerings
    op.create_table(
        'offerings',
        sa.Column('id', UUID(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('status', sa.String(length=20), server_default='active', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.CheckConstraint("status IN ('active', 'inactive')"),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )

    # 8. segment_offerings
    op.create_table(
        'segment_offerings',
        sa.Column('segment_id', UUID(), nullable=False),
        sa.Column('offering_id', UUID(), nullable=False),
        sa.ForeignKeyConstraint(['offering_id'], ['offerings.id'], ),
        sa.ForeignKeyConstraint(['segment_id'], ['segments.id'], ),
        sa.PrimaryKeyConstraint('segment_id', 'offering_id')
    )

    # 9. upload_batches
    op.create_table(
        'upload_batches',
        sa.Column('id', UUID(), nullable=False),
        sa.Column('entity_type', sa.String(length=20), nullable=False),
        sa.Column('file_name', sa.String(length=500), nullable=False),
        sa.Column('file_size_bytes', sa.Integer(), nullable=False),
        sa.Column('total_rows', sa.Integer(), server_default='0', nullable=False),
        sa.Column('valid_rows', sa.Integer(), server_default='0', nullable=False),
        sa.Column('invalid_rows', sa.Integer(), server_default='0', nullable=False),
        sa.Column('status', sa.String(length=20), server_default='processing', nullable=False),
        sa.Column('uploader_id', UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.CheckConstraint("entity_type IN ('company', 'contact')"),
        sa.CheckConstraint("status IN ('processing', 'completed', 'failed')"),
        sa.ForeignKeyConstraint(['uploader_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # 10. companies
    op.create_table(
        'companies',
        sa.Column('id', UUID(), nullable=False),
        sa.Column('name', sa.String(length=500), nullable=False),
        sa.Column('website', sa.String(length=500), nullable=True),
        sa.Column('phone', sa.String(length=50), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('linkedin_url', sa.String(length=500), nullable=True),
        sa.Column('industry', sa.String(length=200), nullable=True),
        sa.Column('sub_industry', sa.String(length=200), nullable=True),
        sa.Column('address_street', sa.String(length=500), nullable=True),
        sa.Column('address_city', sa.String(length=200), nullable=True),
        sa.Column('address_state', sa.String(length=200), nullable=True),
        sa.Column('address_country', sa.String(length=200), nullable=True),
        sa.Column('address_zip', sa.String(length=50), nullable=True),
        sa.Column('founded_year', sa.Integer(), nullable=True),
        sa.Column('revenue_range', sa.String(length=200), nullable=True),
        sa.Column('employee_size_range', sa.String(length=200), nullable=True),
        sa.Column('segment_id', UUID(), nullable=False),
        sa.Column('status', sa.String(length=20), server_default='pending', nullable=False),
        sa.Column('rejection_reason', sa.Text(), nullable=True),
        sa.Column('is_duplicate', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('batch_id', UUID(), nullable=True),
        sa.Column('created_by', UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.CheckConstraint("status IN ('pending', 'approved', 'rejected')"),
        sa.ForeignKeyConstraint(['batch_id'], ['upload_batches.id'], ),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['segment_id'], ['segments.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # 11. contacts
    op.create_table(
        'contacts',
        sa.Column('id', UUID(), nullable=False),
        sa.Column('first_name', sa.String(length=200), nullable=False),
        sa.Column('last_name', sa.String(length=200), nullable=False),
        sa.Column('mobile_phone', sa.String(length=50), nullable=True),
        sa.Column('job_title', sa.String(length=500), nullable=True),
        sa.Column('company_id', UUID(), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('direct_phone', sa.String(length=50), nullable=True),
        sa.Column('email_2', sa.String(length=255), nullable=True),
        sa.Column('email_active_status', sa.String(length=100), nullable=True),
        sa.Column('lead_source', sa.String(length=200), nullable=True),
        sa.Column('management_level', sa.String(length=200), nullable=True),
        sa.Column('address_street', sa.String(length=500), nullable=True),
        sa.Column('address_city', sa.String(length=200), nullable=True),
        sa.Column('address_state', sa.String(length=200), nullable=True),
        sa.Column('address_country', sa.String(length=200), nullable=True),
        sa.Column('address_zip', sa.String(length=50), nullable=True),
        sa.Column('primary_timezone', sa.String(length=100), nullable=True),
        sa.Column('linkedin_url', sa.String(length=500), nullable=True),
        sa.Column('linkedin_summary', sa.Text(), nullable=True),
        sa.Column('data_requester_details', sa.String(length=500), nullable=True),
        sa.Column('segment_id', UUID(), nullable=False),
        sa.Column('status', sa.String(length=30), server_default='uploaded', nullable=False),
        sa.Column('assigned_sdr_id', UUID(), nullable=True),
        sa.Column('is_duplicate', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('batch_id', UUID(), nullable=True),
        sa.Column('created_by', UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.CheckConstraint("status IN ('uploaded', 'approved', 'assigned_to_sdr', 'meeting_scheduled')"),
        sa.ForeignKeyConstraint(['assigned_sdr_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['batch_id'], ['upload_batches.id'], ),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['segment_id'], ['segments.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # 12. assignments
    op.create_table(
        'assignments',
        sa.Column('id', UUID(), nullable=False),
        sa.Column('entity_type', sa.String(length=50), nullable=False),
        sa.Column('entity_id', UUID(), nullable=False),
        sa.Column('assigned_to', UUID(), nullable=False),
        sa.Column('assigned_by', UUID(), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.CheckConstraint("entity_type IN ('segment', 'company', 'contact')"),
        sa.ForeignKeyConstraint(['assigned_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['assigned_to'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('entity_type', 'entity_id', 'assigned_to', name='unique_assignment')
    )

    # 13. upload_errors
    op.create_table(
        'upload_errors',
        sa.Column('id', UUID(), nullable=False),
        sa.Column('batch_id', UUID(), nullable=False),
        sa.Column('row_number', sa.Integer(), nullable=False),
        sa.Column('column_name', sa.String(length=200), nullable=False),
        sa.Column('value', sa.Text(), nullable=True),
        sa.Column('error_message', sa.String(length=500), nullable=False),
        sa.Column('is_corrected', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['batch_id'], ['upload_batches.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # 14. audit_logs
    op.create_table(
        'audit_logs',
        sa.Column('id', UUID(), nullable=False),
        sa.Column('actor_id', UUID(), nullable=False),
        sa.Column('action', sa.String(length=100), nullable=False),
        sa.Column('entity_type', sa.String(length=50), nullable=False),
        sa.Column('entity_id', UUID(), nullable=False),
        sa.Column('details', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['actor_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # 15. marketing_collaterals
    op.create_table(
        'marketing_collaterals',
        sa.Column('id', UUID(), nullable=False),
        sa.Column('title', sa.String(length=500), nullable=False),
        sa.Column('url', sa.String(length=1000), nullable=False),
        sa.Column('scope_type', sa.String(length=50), nullable=False),
        sa.Column('scope_id', UUID(), nullable=False),
        sa.Column('created_by', UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.CheckConstraint("scope_type IN ('segment', 'offering', 'lead')"),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Indexes
    op.create_index('idx_companies_lookup', 'companies', ['name', 'website', 'segment_id'])
    op.create_index('idx_companies_segment_id', 'companies', ['segment_id'])
    op.create_index('idx_companies_status', 'companies', ['status'])
    op.create_index('idx_companies_created_by', 'companies', ['created_by'])
    op.create_index('idx_companies_active_duplicate', 'companies', ['is_duplicate', 'is_active'])
    op.create_index('idx_companies_created_at', 'companies', ['created_at'])
    op.create_index('idx_companies_batch_id', 'companies', ['batch_id'])

    op.create_index('idx_contacts_lookup', 'contacts', ['email', 'company_id'])
    op.create_index('idx_contacts_company_id', 'contacts', ['company_id'])
    op.create_index('idx_contacts_segment_id', 'contacts', ['segment_id'])
    op.create_index('idx_contacts_status', 'contacts', ['status'])
    op.create_index('idx_contacts_assigned_sdr', 'contacts', ['assigned_sdr_id'])
    op.create_index('idx_contacts_created_by', 'contacts', ['created_by'])
    op.create_index('idx_contacts_active_duplicate', 'contacts', ['is_duplicate', 'is_active'])
    op.create_index('idx_contacts_created_at', 'contacts', ['created_at'])
    op.create_index('idx_contacts_batch_id', 'contacts', ['batch_id'])

    op.create_index('idx_assignments_entity', 'assignments', ['entity_type', 'entity_id'])
    op.create_index('idx_assignments_assignee', 'assignments', ['assigned_to'])

    op.create_index('idx_upload_errors_batch', 'upload_errors', ['batch_id'])

    op.create_index('idx_audit_logs_entity', 'audit_logs', ['entity_type', 'entity_id'])
    op.create_index('idx_audit_logs_actor', 'audit_logs', ['actor_id'])
    op.create_index('idx_audit_logs_created_at', 'audit_logs', ['created_at'])


def downgrade() -> None:
    op.drop_table('marketing_collaterals')
    op.drop_table('audit_logs')
    op.drop_table('upload_errors')
    op.drop_table('assignments')
    op.drop_table('contacts')
    op.drop_table('companies')
    op.drop_table('upload_batches')
    op.drop_table('segment_offerings')
    op.drop_table('offerings')
    op.drop_table('segments')
    op.drop_table('role_permissions')
    op.drop_table('permissions')
    op.drop_table('user_roles')
    op.drop_table('roles')
    op.drop_table('users')
