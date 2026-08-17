import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas
from auth import get_current_user, require_role

router = APIRouter(prefix="/tickets", tags=["tickets"])


@router.get("", response_model=list[schemas.TicketOut])
def list_my_tickets(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    # Regular users only ever see their own tickets - never anyone else's.
    tickets = (
        db.query(models.Ticket)
        .filter(models.Ticket.user_id == current_user.id)
        .order_by(models.Ticket.created_at.desc())
        .all()
    )
    return tickets


@router.get("/all", response_model=list[schemas.TicketOut])
def list_all_tickets(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role("admin")),
):
    # Admin-only: every ticket from every user, with the owner's email
    # attached so the admin table can show who raised it.
    tickets = (
        db.query(models.Ticket, models.User.email)
        .join(models.User, models.User.id == models.Ticket.user_id)
        .order_by(models.Ticket.created_at.desc())
        .all()
    )
    result = []
    for ticket, user_email in tickets:
        out = schemas.TicketOut.model_validate(ticket)
        out.user_email = user_email
        result.append(out)
    return result


@router.post("", response_model=schemas.TicketOut, status_code=201)
def create_ticket(
    payload: schemas.TicketCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    ticket = models.Ticket(
        user_id=current_user.id,
        contact_name=payload.contact_name,
        contact_email=payload.contact_email,
        contact_phone=payload.contact_phone,
        subject=payload.subject,
        description=payload.description,
        status="open",
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return ticket


@router.delete("/{ticket_id}", status_code=204)
def delete_ticket(
    ticket_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    ticket = (
        db.query(models.Ticket)
        .filter(models.Ticket.id == ticket_id, models.Ticket.user_id == current_user.id)
        .first()
    )
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    db.delete(ticket)
    db.commit()
    return None