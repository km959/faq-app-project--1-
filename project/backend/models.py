import uuid

from sqlalchemy import (
    Column,
    String,
    ForeignKey,
    DateTime,
    Text,
    Integer,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    email = Column(
        String,
        unique=True,
        nullable=False,
        index=True,
    )

    password_hash = Column(
        String,
        nullable=False,
    )

    name = Column(
        String,
        nullable=True,
    )

    phone = Column(
        String,
        nullable=True,
    )

    resume_filename = Column(
        String,
        nullable=True,
    )

    resume_data = Column(
        Text,
        nullable=True,
    )

    role = Column(
        String,
        nullable=False,
        default="candidate",
    )  # "candidate", "organization", or "admin"

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    faqs = relationship(
        "FAQ",
        back_populates="owner",
        cascade="all, delete-orphan",
    )


class FAQ(Base):
    __tablename__ = "faqs"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey(
            "users.id",
            ondelete="CASCADE",
        ),
        nullable=True,
    )

    question = Column(
        Text,
        nullable=False,
    )

    answer = Column(
        Text,
        nullable=False,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    owner = relationship(
        "User",
        back_populates="faqs",
    )


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    ticket_number = Column(
        Integer,
        nullable=True,
    )

    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey(
            "users.id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )

    contact_name = Column(
        String,
        nullable=False,
    )

    contact_email = Column(
        String,
        nullable=False,
    )

    contact_phone = Column(
        String,
        nullable=True,
    )

    subject = Column(
        Text,
        nullable=False,
    )

    description = Column(
        Text,
        nullable=True,
    )

    status = Column(
        String,
        nullable=False,
        default="open",
    )

    admin_remark = Column(
        Text,
        nullable=True,
    )

    channel = Column(
        String,
        nullable=True,
        default="Bot",
    )

    priority = Column(
        String,
        nullable=True,
    )

    company = Column(
        String,
        nullable=True,
    )

    preferred_call_time = Column(
        String,
        nullable=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )


class Job(Base):
    __tablename__ = "jobs"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    title = Column(
        String,
        nullable=False,
    )

    organization = Column(
        String,
        nullable=False,
    )

    location = Column(
        String,
        nullable=False,
    )

    job_type = Column(
        String,
        nullable=False,
        default="Full Time",
    )

    salary = Column(
        String,
        nullable=True,
    )

    description = Column(
        Text,
        nullable=False,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )


class KnowledgeBaseFAQ(Base):
    __tablename__ = "knowledge_base"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    category = Column(
        String,
        nullable=False,
    )

    question = Column(
        Text,
        nullable=False,
    )

    answer = Column(
        Text,
        nullable=False,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )