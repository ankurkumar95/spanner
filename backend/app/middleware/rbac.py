from fastapi import HTTPException, status, Depends
from ..models import User, Permission, Role, role_permissions, user_roles
from .auth import get_current_user
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..database import get_db

def require_permission(module: str, action: str):
    async def permission_checker(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
        # Join User -> user_roles -> Role -> role_permissions -> Permission
        query = (
            select(Permission)
            .join(role_permissions, Permission.id == role_permissions.c.permission_id)
            .join(Role, Role.id == role_permissions.c.role_id)
            .join(user_roles, Role.id == user_roles.c.role_id)
            .where(user_roles.c.user_id == user.id)
            .where(Permission.module == module)
            .where(Permission.action == action)
        )

        result = await db.execute(query)
        permission = result.scalar_one_or_none()

        if not permission:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Operation not permitted"
            )
        return True
    return permission_checker
