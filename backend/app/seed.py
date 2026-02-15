import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from .database import AsyncSessionLocal, engine, Base
from .models import User, Role, Permission
from .utils.security import hash_password
import uuid

ROLES = ["Admin", "Segment Owner", "Researcher", "Approver", "SDR", "Marketing"]

# (module, action)
PERMISSIONS = [
    ("segments", "create"), ("segments", "archive"), ("segments", "read"),
    ("companies", "create"), ("companies", "read"), ("companies", "edit"),
    ("companies", "approve"), ("companies", "reject"), ("companies", "upload_csv"),
    ("contacts", "create"), ("contacts", "read"), ("contacts", "edit"),
    ("contacts", "approve"), ("contacts", "assign"), ("contacts", "upload_csv"),
    ("contacts", "schedule_meeting"), ("assignments", "create"), ("collaterals", "manage"),
    ("exports", "companies"), ("exports", "contacts"), ("audit", "read_global"),
    ("uploads", "read"), ("users", "manage")
]

ROLE_PERMISSIONS = {
    "Admin": ["users:manage", "segments:read", "companies:read", "contacts:read", "exports:companies", "exports:contacts", "audit:read_global"],
    "Segment Owner": ["segments:create", "segments:archive", "segments:read", "companies:read", "contacts:read", "assignments:create", "exports:companies", "exports:contacts"],
    "Researcher": ["segments:read", "companies:create", "companies:read", "companies:edit", "companies:upload_csv", "contacts:create", "contacts:read", "contacts:edit", "contacts:upload_csv", "uploads:read", "exports:companies", "exports:contacts"],
    "Approver": ["segments:read", "companies:create", "companies:read", "companies:edit", "companies:approve", "companies:reject", "companies:upload_csv", "contacts:create", "contacts:read", "contacts:edit", "contacts:approve", "contacts:assign", "contacts:upload_csv", "assignments:create", "uploads:read", "exports:companies", "exports:contacts"],
    "SDR": ["segments:read", "companies:read", "contacts:read", "companies:approve", "companies:reject", "contacts:approve", "contacts:schedule_meeting", "exports:companies", "exports:contacts"],
    "Marketing": ["segments:read", "collaterals:manage"]
}

USERS = [
    {"email": "admin@spanner.app", "name": "Admin User", "role": "Admin"},
    {"email": "prashant@spanner.app", "name": "Prashant Agarwal", "role": "Segment Owner"},
    {"email": "jane@spanner.app", "name": "Jane Researcher", "role": "Researcher"},
    {"email": "bob@spanner.app", "name": "Bob Approver", "role": "Approver"},
    {"email": "alice@spanner.app", "name": "Alice SDR", "role": "SDR"},
    {"email": "maria@spanner.app", "name": "Maria Marketing", "role": "Marketing"},
]

async def seed():
    async with AsyncSessionLocal() as db:
        # 1. Create Permissions
        perm_map = {}
        for mod, act in PERMISSIONS:
            name = f"{mod}:{act}"
            p = Permission(module=mod, action=act, description=f"Can {act} {mod}")
            db.add(p)
            perm_map[name] = p

        await db.flush()

        # 2. Create Roles and map Permissions
        role_map = {}
        for r_name in ROLES:
            role = Role(name=r_name)
            db.add(role)
            role_map[r_name] = role

            # Map permissions
            for p_name in ROLE_PERMISSIONS.get(r_name, []):
                if p_name in perm_map:
                    role.permissions.append(perm_map[p_name])

        await db.flush()

        # 3. Create Users
        for u_data in USERS:
            user = User(
                email=u_data["email"],
                name=u_data["name"],
                password_hash=hash_password("password123"),
                is_active=True
            )
            db.add(user)
            if u_data["role"] in role_map:
                user.roles.append(role_map[u_data["role"]])

        await db.commit()
        print("Database seeded successfully!")

if __name__ == "__main__":
    import os
    if not os.getenv("DATABASE_URL"):
        print("DATABASE_URL not set")
    else:
        asyncio.run(seed())
