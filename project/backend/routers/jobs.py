from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.get("", response_model=list[schemas.JobOut])
def list_jobs(
    q: str | None = Query(default=None, description="Search by job title"),
    location: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    query = db.query(models.Job)
    if q:
        query = query.filter(models.Job.title.ilike(f"%{q}%"))
    if location:
        query = query.filter(models.Job.location.ilike(f"%{location}%"))
    return query.order_by(models.Job.created_at.desc()).all()