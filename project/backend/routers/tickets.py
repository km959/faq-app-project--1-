import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_, text
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
    tickets = (
        db.query(models.Ticket)
        .filter(models.Ticket.user_id == current_user.id)
        .order_by(models.Ticket.created_at.desc())
        .all()
    )

    return tickets


@router.get("/all", response_model=schemas.TicketListOut)
def list_all_tickets(
    page: int = 1,
    page_size: int = 10,
    search: str = "",
    status: str = "all",
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role("admin")),
):
    if page < 1:
        page = 1

    if page_size < 1:
        page_size = 10

    status = status.lower().strip()

    if status not in ["all", "open", "closed"]:
        raise HTTPException(
            status_code=400,
            detail="Status must be all, open, or closed",
        )

    base_query = (
        db.query(models.Ticket, models.User.email)
        .outerjoin(
            models.User,
            models.User.id == models.Ticket.user_id,
        )
    )

    open_count = (
        db.query(models.Ticket)
        .filter(models.Ticket.status == "open")
        .count()
    )

    closed_count = (
        db.query(models.Ticket)
        .filter(models.Ticket.status == "closed")
        .count()
    )

    filtered_query = base_query

    if status == "open":
        filtered_query = filtered_query.filter(
            models.Ticket.status == "open"
        )

    elif status == "closed":
        filtered_query = filtered_query.filter(
            models.Ticket.status == "closed"
        )

    if search and search.strip():
        search_value = search.strip()

        search_conditions = [
            models.Ticket.subject.ilike(
                f"%{search_value}%"
            ),
            models.Ticket.contact_name.ilike(
                f"%{search_value}%"
            ),
            models.Ticket.contact_email.ilike(
                f"%{search_value}%"
            ),
            models.Ticket.contact_phone.ilike(
                f"%{search_value}%"
            ),
            models.User.email.ilike(
                f"%{search_value}%"
            ),
        ]

        try:
            search_uuid = uuid.UUID(search_value)

            search_conditions.append(
                models.Ticket.id == search_uuid
            )
        except ValueError:
            pass

        filtered_query = filtered_query.filter(
            or_(*search_conditions)
        )

    total = filtered_query.count()

    offset = (page - 1) * page_size

    rows = (
        filtered_query
        .order_by(models.Ticket.created_at.desc())
        .offset(offset)
        .limit(page_size)
        .all()
    )

    tickets = []

    for ticket, user_email in rows:
        out = schemas.TicketOut.model_validate(ticket)
        out.user_email = user_email or ticket.contact_email
        tickets.append(out)

    return {
        "tickets": tickets,
        "total": total,
        "open_count": open_count,
        "closed_count": closed_count,
        "page": page,
        "page_size": page_size,
    }


@router.get("/by-code/{short_code}", response_model=schemas.TicketOut)
def get_ticket_by_code(
    short_code: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role("admin")),
):
    try:
        num = int(short_code)
    except ValueError:
        raise HTTPException(status_code=404, detail="Ticket not found")

    result = (
        db.query(models.Ticket, models.User.email)
        .outerjoin(
            models.User,
            models.User.id == models.Ticket.user_id
        )
        .filter(models.Ticket.ticket_number == num)
        .first()
    )

    if not result:
        raise HTTPException(status_code=404, detail="Ticket not found")

    ticket, user_email = result
    out = schemas.TicketOut.model_validate(ticket)
    out.user_email = user_email or ticket.contact_email
    return out


@router.get(
    "/{ticket_id}",
    response_model=schemas.TicketOut,
)
def get_ticket(
    ticket_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role("admin")),
):
    result = (
        db.query(
            models.Ticket,
            models.User.email,
        )
        .outerjoin(
            models.User,
            models.User.id == models.Ticket.user_id,
        )
        .filter(models.Ticket.id == ticket_id)
        .first()
    )

    if not result:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found",
        )

    ticket, user_email = result

    out = schemas.TicketOut.model_validate(ticket)
    out.user_email = user_email

    return out


@router.post(
    "",
    response_model=schemas.TicketOut,
    status_code=201,
)
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
    channel=payload.channel or "Bot",
    priority=payload.priority,
    company=payload.company,
    preferred_call_time=payload.preferred_call_time,
    ticket_number=db.execute(
    text("SELECT nextval('ticket_number_seq')")
).scalar(),
)

    db.add(ticket)
    db.commit()
    db.refresh(ticket)

    return ticket


@router.patch(
    "/{ticket_id}/status",
    response_model=schemas.TicketOut,
)
def update_ticket_status(
    ticket_id: uuid.UUID,
    payload: schemas.TicketStatusUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role("admin")),
):
    if payload.status.lower() not in ["open", "closed"]:
        raise HTTPException(
            status_code=400,
            detail="Status must be either open or closed",
        )

    ticket = (
        db.query(models.Ticket)
        .filter(models.Ticket.id == ticket_id)
        .first()
    )

    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found",
        )

    ticket.status = payload.status.lower()

    if payload.admin_remark is not None:
        ticket.admin_remark = payload.admin_remark

    db.commit()
    db.refresh(ticket)

    return ticket