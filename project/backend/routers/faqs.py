import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas
from auth import get_current_user

router = APIRouter(prefix="/faqs", tags=["faqs"])


@router.get("", response_model=list[schemas.FAQOut])
def list_faqs(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    # Only this user's saved questions - this is what makes the data
    # "remembered" the next time they log in.
    return (
        db.query(models.FAQ)
        .filter(models.FAQ.user_id == current_user.id)
        .order_by(models.FAQ.created_at.asc())
        .all()
    )


@router.post("", response_model=schemas.FAQOut, status_code=201)
def save_faq_answer(
    payload: schemas.FAQCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    # Save-or-update: since the app uses a fixed set of questions,
    # saving an answer to a question the user already answered updates
    # it in place instead of creating a duplicate row.
    existing = (
        db.query(models.FAQ)
        .filter(
            models.FAQ.user_id == current_user.id,
            models.FAQ.question == payload.question,
        )
        .first()
    )
    if existing:
        existing.answer = payload.answer
        db.commit()
        db.refresh(existing)
        return existing

    faq = models.FAQ(
        user_id=current_user.id,
        question=payload.question,
        answer=payload.answer,
    )
    db.add(faq)
    db.commit()
    db.refresh(faq)
    return faq


@router.delete("/{faq_id}", status_code=204)
def delete_faq(
    faq_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    faq = (
        db.query(models.FAQ)
        .filter(models.FAQ.id == faq_id, models.FAQ.user_id == current_user.id)
        .first()
    )
    if not faq:
        raise HTTPException(status_code=404, detail="FAQ not found")
    db.delete(faq)
    db.commit()
    return None