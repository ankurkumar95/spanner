"""
Authentication and user management service layer.

Handles business logic for user authentication, user CRUD operations, and role management.
"""

from uuid import UUID
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password, verify_password


async def authenticate_user(db: AsyncSession, email: str, password: str) -> dict | None:
    """
    Authenticate a user by email and password.

    Args:
        db: Database session
        email: User email address
        password: Plain-text password to verify

    Returns:
        User dictionary if authentication successful, None otherwise
    """
    query = text("""
        SELECT
            u.id,
            u.email,
            u.name,
            u.password_hash,
            u.status,
            COALESCE(
                json_agg(ur.role) FILTER (WHERE ur.role IS NOT NULL),
                '[]'::json
            ) as roles
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        WHERE u.email = :email
        GROUP BY u.id, u.email, u.name, u.password_hash, u.status
    """)

    result = await db.execute(query, {"email": email})
    user_row = result.fetchone()

    if user_row is None:
        return None

    # Verify password
    if not verify_password(password, user_row[3]):
        return None

    # Check if user is active
    if user_row[4] != "active":
        return None

    user = {
        "id": str(user_row[0]),
        "email": user_row[1],
        "name": user_row[2],
        "status": user_row[4],
        "roles": user_row[5] if user_row[5] else []
    }

    return user


async def create_user(
    db: AsyncSession,
    email: str,
    name: str,
    password: str,
    roles: list[str] | None = None,
    status: str = "active"
) -> dict:
    """
    Create a new user with optional roles and user preferences.

    Args:
        db: Database session
        email: User email address (must be unique)
        name: User full name
        password: Plain-text password (will be hashed)
        roles: List of role names to assign (optional)
        status: User status ('active' or 'deactivated')

    Returns:
        Created user dictionary with id, email, name, status, and roles

    Raises:
        Exception: If email already exists or role assignment fails
    """
    password_hash = hash_password(password)

    # Insert user
    insert_user_query = text("""
        INSERT INTO users (email, name, password_hash, status)
        VALUES (:email, :name, :password_hash, :status)
        RETURNING id, email, name, status, created_at, updated_at
    """)

    result = await db.execute(
        insert_user_query,
        {
            "email": email,
            "name": name,
            "password_hash": password_hash,
            "status": status
        }
    )
    user_row = result.fetchone()
    user_id = user_row[0]

    # Assign roles if provided
    assigned_roles = []
    if roles:
        for role in roles:
            insert_role_query = text("""
                INSERT INTO user_roles (user_id, role)
                VALUES (:user_id, :role)
                ON CONFLICT (user_id, role) DO NOTHING
                RETURNING role
            """)
            role_result = await db.execute(insert_role_query, {"user_id": user_id, "role": role})
            role_row = role_result.fetchone()
            if role_row:
                assigned_roles.append(role_row[0])

    # Create default user preferences
    insert_prefs_query = text("""
        INSERT INTO user_preferences (user_id, sidebar_theme)
        VALUES (:user_id, 'light')
        ON CONFLICT (user_id) DO NOTHING
    """)
    await db.execute(insert_prefs_query, {"user_id": user_id})

    await db.commit()

    return {
        "id": str(user_id),
        "email": user_row[1],
        "name": user_row[2],
        "status": user_row[3],
        "roles": assigned_roles,
        "created_at": user_row[4].isoformat(),
        "updated_at": user_row[5].isoformat()
    }


async def update_user(
    db: AsyncSession,
    user_id: UUID,
    name: str | None = None,
    email: str | None = None,
    password: str | None = None,
    status: str | None = None
) -> dict:
    """
    Update user fields.

    Args:
        db: Database session
        user_id: User UUID
        name: New name (optional)
        email: New email (optional)
        password: New plain-text password (optional, will be hashed)
        status: New status (optional)

    Returns:
        Updated user dictionary

    Raises:
        Exception: If user not found or update fails
    """
    # Build dynamic update query
    update_parts = []
    params: dict[str, Any] = {"user_id": user_id}

    if name is not None:
        update_parts.append("name = :name")
        params["name"] = name

    if email is not None:
        update_parts.append("email = :email")
        params["email"] = email

    if password is not None:
        update_parts.append("password_hash = :password_hash")
        params["password_hash"] = hash_password(password)

    if status is not None:
        update_parts.append("status = :status")
        params["status"] = status

    if not update_parts:
        # No updates requested, just fetch and return current user
        return await get_user_by_id(db, user_id)

    update_query = text(f"""
        UPDATE users
        SET {', '.join(update_parts)}
        WHERE id = :user_id
        RETURNING id, email, name, status, created_at, updated_at
    """)

    result = await db.execute(update_query, params)
    user_row = result.fetchone()

    if user_row is None:
        raise ValueError(f"User with id {user_id} not found")

    await db.commit()

    # Fetch roles
    roles = await _get_user_roles(db, user_id)

    return {
        "id": str(user_row[0]),
        "email": user_row[1],
        "name": user_row[2],
        "status": user_row[3],
        "roles": roles,
        "created_at": user_row[4].isoformat(),
        "updated_at": user_row[5].isoformat()
    }


async def deactivate_user(db: AsyncSession, user_id: UUID) -> None:
    """
    Soft deactivate a user by setting status to 'deactivated'.

    Args:
        db: Database session
        user_id: User UUID to deactivate

    Raises:
        Exception: If user not found
    """
    query = text("""
        UPDATE users
        SET status = 'deactivated'
        WHERE id = :user_id
        RETURNING id
    """)

    result = await db.execute(query, {"user_id": user_id})
    user_row = result.fetchone()

    if user_row is None:
        raise ValueError(f"User with id {user_id} not found")

    await db.commit()


async def activate_user(db: AsyncSession, user_id: UUID) -> None:
    """
    Activate a user by setting status to 'active'.

    Args:
        db: Database session
        user_id: User UUID to activate

    Raises:
        Exception: If user not found
    """
    query = text("""
        UPDATE users
        SET status = 'active'
        WHERE id = :user_id
        RETURNING id
    """)

    result = await db.execute(query, {"user_id": user_id})
    user_row = result.fetchone()

    if user_row is None:
        raise ValueError(f"User with id {user_id} not found")

    await db.commit()


async def get_user_by_id(db: AsyncSession, user_id: UUID) -> dict | None:
    """
    Fetch user by ID with roles.

    Args:
        db: Database session
        user_id: User UUID

    Returns:
        User dictionary if found, None otherwise
    """
    query = text("""
        SELECT
            u.id,
            u.email,
            u.name,
            u.status,
            u.created_at,
            u.updated_at,
            COALESCE(
                json_agg(ur.role) FILTER (WHERE ur.role IS NOT NULL),
                '[]'::json
            ) as roles
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        WHERE u.id = :user_id
        GROUP BY u.id, u.email, u.name, u.status, u.created_at, u.updated_at
    """)

    result = await db.execute(query, {"user_id": user_id})
    user_row = result.fetchone()

    if user_row is None:
        return None

    return {
        "id": str(user_row[0]),
        "email": user_row[1],
        "name": user_row[2],
        "status": user_row[3],
        "created_at": user_row[4].isoformat(),
        "updated_at": user_row[5].isoformat(),
        "roles": user_row[6] if user_row[6] else []
    }


async def get_user_by_email(db: AsyncSession, email: str) -> dict | None:
    """
    Fetch user by email with roles.

    Args:
        db: Database session
        email: User email address

    Returns:
        User dictionary if found, None otherwise
    """
    query = text("""
        SELECT
            u.id,
            u.email,
            u.name,
            u.status,
            u.created_at,
            u.updated_at,
            COALESCE(
                json_agg(ur.role) FILTER (WHERE ur.role IS NOT NULL),
                '[]'::json
            ) as roles
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        WHERE u.email = :email
        GROUP BY u.id, u.email, u.name, u.status, u.created_at, u.updated_at
    """)

    result = await db.execute(query, {"email": email})
    user_row = result.fetchone()

    if user_row is None:
        return None

    return {
        "id": str(user_row[0]),
        "email": user_row[1],
        "name": user_row[2],
        "status": user_row[3],
        "created_at": user_row[4].isoformat(),
        "updated_at": user_row[5].isoformat(),
        "roles": user_row[6] if user_row[6] else []
    }


async def list_users(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 50,
    status_filter: str | None = None
) -> list[dict]:
    """
    List users with pagination and optional status filter.

    Args:
        db: Database session
        skip: Number of records to skip (for pagination)
        limit: Maximum number of records to return
        status_filter: Optional status filter ('active' or 'deactivated')

    Returns:
        List of user dictionaries
    """
    status_condition = "WHERE u.status = :status_filter" if status_filter else ""

    query = text(f"""
        SELECT
            u.id,
            u.email,
            u.name,
            u.status,
            u.created_at,
            u.updated_at,
            COALESCE(
                json_agg(ur.role) FILTER (WHERE ur.role IS NOT NULL),
                '[]'::json
            ) as roles
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        {status_condition}
        GROUP BY u.id, u.email, u.name, u.status, u.created_at, u.updated_at
        ORDER BY u.created_at DESC
        LIMIT :limit OFFSET :skip
    """)

    params = {"skip": skip, "limit": limit}
    if status_filter:
        params["status_filter"] = status_filter

    result = await db.execute(query, params)
    rows = result.fetchall()

    users = []
    for row in rows:
        users.append({
            "id": str(row[0]),
            "email": row[1],
            "name": row[2],
            "status": row[3],
            "created_at": row[4].isoformat(),
            "updated_at": row[5].isoformat(),
            "roles": row[6] if row[6] else []
        })

    return users


async def count_users(db: AsyncSession, status_filter: str | None = None) -> int:
    """
    Count total users with optional status filter.

    Args:
        db: Database session
        status_filter: Optional status filter ('active' or 'deactivated')

    Returns:
        Total count of users
    """
    status_condition = "WHERE status = :status_filter" if status_filter else ""

    query = text(f"""
        SELECT COUNT(*)
        FROM users
        {status_condition}
    """)

    params = {}
    if status_filter:
        params["status_filter"] = status_filter

    result = await db.execute(query, params)
    count = result.scalar()

    return count or 0


async def update_user_roles(db: AsyncSession, user_id: UUID, roles: list[str]) -> dict:
    """
    Replace user's roles with new set of roles.

    Args:
        db: Database session
        user_id: User UUID
        roles: List of role names to assign (replaces existing roles)

    Returns:
        Updated user dictionary with new roles

    Raises:
        Exception: If user not found or role assignment fails
    """
    # First, delete all existing roles for the user
    delete_query = text("""
        DELETE FROM user_roles
        WHERE user_id = :user_id
    """)
    await db.execute(delete_query, {"user_id": user_id})

    # Insert new roles
    assigned_roles = []
    if roles:
        for role in roles:
            insert_role_query = text("""
                INSERT INTO user_roles (user_id, role)
                VALUES (:user_id, :role)
                ON CONFLICT (user_id, role) DO NOTHING
                RETURNING role
            """)
            role_result = await db.execute(insert_role_query, {"user_id": user_id, "role": role})
            role_row = role_result.fetchone()
            if role_row:
                assigned_roles.append(role_row[0])

    await db.commit()

    # Fetch updated user
    user = await get_user_by_id(db, user_id)
    if user is None:
        raise ValueError(f"User with id {user_id} not found")

    return user


async def get_user_permissions(db: AsyncSession, user_id: UUID) -> list[str]:
    """
    Get all granted permission actions for user's roles.

    Args:
        db: Database session
        user_id: User UUID

    Returns:
        List of permission action strings that the user has access to
    """
    query = text("""
        SELECT DISTINCT rg.action
        FROM user_roles ur
        JOIN role_grants rg ON ur.role = rg.role
        WHERE ur.user_id = :user_id
        AND rg.granted = true
        ORDER BY rg.action
    """)

    result = await db.execute(query, {"user_id": user_id})
    rows = result.fetchall()

    return [row[0] for row in rows]


# Internal helper functions

async def _get_user_roles(db: AsyncSession, user_id: UUID) -> list[str]:
    """
    Internal helper to fetch user roles.

    Args:
        db: Database session
        user_id: User UUID

    Returns:
        List of role names
    """
    query = text("""
        SELECT role
        FROM user_roles
        WHERE user_id = :user_id
        ORDER BY role
    """)

    result = await db.execute(query, {"user_id": user_id})
    rows = result.fetchall()

    return [row[0] for row in rows]
