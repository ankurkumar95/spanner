import pytest
from backend.app.models import User, Role, Permission
from backend.app.utils.security import hash_password
from backend.app.middleware.rbac import require_permission
from fastapi import APIRouter, Depends
from backend.app.main import app

# Create a temporary router for testing RBAC
rbac_test_router = APIRouter()

@rbac_test_router.get("/protected")
async def protected_route(allowed: bool = Depends(require_permission("test", "read"))):
    return {"message": "Success"}

app.include_router(rbac_test_router, prefix="/api/test", tags=["test"])

@pytest.mark.asyncio
async def test_login_success(client, db_session):
    # Setup
    hashed_pwd = hash_password("password123")
    user = User(email="login_success@example.com", name="Test User", password_hash=hashed_pwd, is_active=True)
    db_session.add(user)
    await db_session.commit()

    # Action
    response = await client.post("/api/auth/login", json={
        "email": "login_success@example.com",
        "password": "password123"
    })

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "login_success@example.com"

@pytest.mark.asyncio
async def test_login_wrong_password(client, db_session):
    # Setup
    hashed_pwd = hash_password("password123")
    user = User(email="wrong_pwd@example.com", name="Test User", password_hash=hashed_pwd, is_active=True)
    db_session.add(user)
    await db_session.commit()

    # Action
    response = await client.post("/api/auth/login", json={
        "email": "wrong_pwd@example.com",
        "password": "wrongpassword"
    })

    # Assert
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_rbac_permission_allowed(client, db_session):
    # Setup: Create permission, role, and user
    perm = Permission(module="test", action="read", description="test read")
    role = Role(name="Tester")
    role.permissions.append(perm)

    hashed_pwd = hash_password("password123")
    user = User(email="tester@example.com", name="Tester User", password_hash=hashed_pwd, is_active=True)
    user.roles.append(role)

    db_session.add(perm)
    db_session.add(role)
    db_session.add(user)
    await db_session.commit()

    # Action: Login to get token
    login_res = await client.post("/api/auth/login", json={
        "email": "tester@example.com",
        "password": "password123"
    })
    token = login_res.json()["access_token"]

    # Action: Access protected route
    response = await client.get("/api/test/protected", headers={"Authorization": f"Bearer {token}"})

    # Assert
    assert response.status_code == 200
    assert response.json()["message"] == "Success"

@pytest.mark.asyncio
async def test_rbac_permission_denied(client, db_session):
    # Setup: Create user with role but WITHOUT the specific permission
    role = Role(name="NoPermissionRole")

    hashed_pwd = hash_password("password123")
    user = User(email="noperm@example.com", name="No Perm User", password_hash=hashed_pwd, is_active=True)
    user.roles.append(role)

    db_session.add(role)
    db_session.add(user)
    await db_session.commit()

    # Action: Login to get token
    login_res = await client.post("/api/auth/login", json={
        "email": "noperm@example.com",
        "password": "password123"
    })
    token = login_res.json()["access_token"]

    # Action: Access protected route
    response = await client.get("/api/test/protected", headers={"Authorization": f"Bearer {token}"})

    # Assert
    assert response.status_code == 403
    assert response.json()["detail"] == "Operation not permitted"
