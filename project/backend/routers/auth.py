from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas
from auth import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post(
    "/register",
    response_model=schemas.Token,
    status_code=status.HTTP_201_CREATED,
)
def register(
    payload: schemas.UserCreate,
    db: Session = Depends(get_db),
):
    existing = (
        db.query(models.User)
        .filter(models.User.email == payload.email)
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail="An account with this email already exists",
        )

    if payload.role not in ("candidate", "organization", "admin"):
        raise HTTPException(
            status_code=400,
            detail="Invalid account type",
        )

    user = models.User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        name=payload.name,
        phone=payload.phone,
        role=payload.role,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(subject=str(user.id))

    return schemas.Token(
        access_token=token,
        user=user,
    )


@router.post("/login", response_model=schemas.Token)
def login(
    payload: schemas.UserLogin,
    db: Session = Depends(get_db),
):
    user = (
        db.query(models.User)
        .filter(models.User.email == payload.email)
        .first()
    )

    if not user or not verify_password(
        payload.password,
        user.password_hash,
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    if payload.role == "admin":
        if user.role != "admin":
            raise HTTPException(
                status_code=403,
                detail="This account is not registered as admin",
            )

    else:
        if user.role not in (
            "user",
            "candidate",
            "organization",
        ):
            raise HTTPException(
                status_code=403,
                detail="This account is not registered as a user",
            )

    token = create_access_token(subject=str(user.id))

    return schemas.Token(
        access_token=token,
        user=user,
    )