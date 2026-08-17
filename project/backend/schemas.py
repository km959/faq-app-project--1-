import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str = Field(min_length=1)
    phone: str = Field(min_length=1)
    role: str = Field(default="user")  # "user" or "admin"


class UserLogin(BaseModel):
    email: EmailStr
    password: str
    role: str  # the role the person is trying to log in as


class UserOut(BaseModel):
    id: uuid.UUID
    email: EmailStr
    name: Optional[str] = None
    phone: Optional[str] = None
    role: str

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class FAQCreate(BaseModel):
    question: str = Field(min_length=1)
    answer: str = Field(min_length=1)


class FAQOut(BaseModel):
    id: uuid.UUID
    question: str
    answer: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TicketCreate(BaseModel):
    contact_name: str = Field(min_length=1)
    contact_email: EmailStr
    contact_phone: Optional[str] = None
    subject: str = Field(min_length=1)
    description: str = Field(min_length=1)


class TicketOut(BaseModel):
    id: uuid.UUID
    contact_name: str
    contact_email: str
    contact_phone: Optional[str] = None
    subject: str
    description: str
    status: str
    created_at: datetime
    user_email: Optional[str] = None  # filled in only for the admin view

    class Config:
        from_attributes = True


class JobOut(BaseModel):
    id: uuid.UUID
    title: str
    organization: str
    location: str
    job_type: str
    salary: Optional[str] = None
    description: str

    class Config:
        from_attributes = True