import uuid

from datetime import datetime
from typing import Optional

from pydantic import (
    BaseModel,
    EmailStr,
    Field,
)


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str = Field(min_length=1)
    phone: str = Field(min_length=1)
    role: str = Field(default="user")
   


class UserLogin(BaseModel):
    email: EmailStr
    password: str
    role: str


class UserOut(BaseModel):
    id: uuid.UUID
    email: EmailStr
    name: Optional[str] = None
    phone: Optional[str] = None
    role: str
    user_type: Optional[str] = None

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class FAQCreate(BaseModel):
    question: str = Field(
        min_length=1
    )
    answer: str = Field(
        min_length=1
    )


class FAQOut(BaseModel):
    id: uuid.UUID
    question: str
    answer: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TicketCreate(BaseModel):
    contact_name: str = Field(
        min_length=1
    )

    contact_email: EmailStr

    contact_phone: Optional[str] = None

    subject: str = Field(
        min_length=1
    )

    description: Optional[str] = None

    channel: Optional[str] = "Bot"

    priority: Optional[str] = "Medium"

    company: str = Field(
        min_length=1
    )

    preferred_call_time: Optional[str] = None

class PublicTicketCreate(BaseModel):
    contact_name: str = Field(
        min_length=1
    )

    contact_email: EmailStr

    contact_phone: str = Field(
        min_length=1
    )

    subject: str = Field(
        min_length=1
    )

    description: str = Field(
        min_length=1
    )

class TicketStatusUpdate(BaseModel):
    status: str
    admin_remark: Optional[str] = None


class TicketRemarkUpdate(BaseModel):
    admin_remark: Optional[str] = None


class TicketOut(BaseModel):
    id: uuid.UUID
    contact_name: str
    ticket_number: Optional[int] = None
    contact_email: EmailStr
    contact_phone: Optional[str] = None
    subject: str
    description: str
    status: str
    channel: Optional[str] = None
    priority: Optional[str] = None
    company: Optional[str] = None
    preferred_call_time: Optional[str] = None
    admin_remark: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    user_email: Optional[str] = None

    class Config:
        from_attributes = True


class TicketListOut(BaseModel):
    tickets: list[TicketOut]
    total: int
    open_count: int
    closed_count: int
    page: int
    page_size: int


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


class ChatHistoryItem(BaseModel):
    role: str
    text: str


class ChatQuery(BaseModel):
    query: str = Field(
        min_length=1
    )

    history: Optional[
        list[ChatHistoryItem]
    ] = None

    is_suggestion: bool = False


class ChatResponse(BaseModel):
    source: str
    answer: str
    matched_question: Optional[str] = None
    suggestions: Optional[list[str]] = None
    related_label: Optional[str] = None
    related_questions: Optional[list[str]] = None
    ticket: Optional[TicketOut] = None