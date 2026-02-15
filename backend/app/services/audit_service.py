from sqlalchemy.ext.asyncio import AsyncSession
from ..models import AuditLog
import uuid
from typing import Any, Optional

async def log_action(
    db: AsyncSession,
    actor_id: uuid.UUID,
    action: str,
    entity_type: str,
    entity_id: uuid.UUID,
    details: Optional[dict] = None
):
    audit_entry = AuditLog(
        actor_id=actor_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=details
    )
    db.add(audit_entry)
    await db.flush()
    return audit_entry
