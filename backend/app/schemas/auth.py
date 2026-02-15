from pydantic import BaseModel, EmailStr
from typing import List, Optional
import uuid

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    name: str
    roles: List[str]

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    user: UserResponse

class RefreshRequest(BaseModel):
    refresh_token: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str
