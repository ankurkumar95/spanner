from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any, Optional
import base64

async def cursor_paginate(
    db: AsyncSession,
    query: Any,
    model: Any, # We need the model to know the sort column
    limit: int = 20,
    cursor: Optional[str] = None,
    sort_column: str = "created_at"
):
    # Sort column attribute
    attr = getattr(model, sort_column)

    # 1. Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar()

    # 2. Apply cursor filtering if provided
    if cursor:
        try:
            # Simple cursor: base64 encoded value of the sort column
            decoded_cursor = base64.b64decode(cursor).decode('utf-8')
            query = query.where(attr < decoded_cursor)
        except Exception:
            pass # Fallback to start if cursor is invalid

    # 3. Apply sorting and limit
    query = query.order_by(desc(attr)).limit(limit)

    # 4. Execute
    result = await db.execute(query)
    items = result.scalars().all()

    # 5. Generate next cursor
    next_cursor = None
    if len(items) == limit:
        last_item = items[-1]
        last_val = str(getattr(last_item, sort_column))
        next_cursor = base64.b64encode(last_val.encode('utf-8')).decode('utf-8')

    return items, next_cursor, total
