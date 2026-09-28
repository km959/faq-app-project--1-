import base64
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from database import get_db
import models
from auth import get_current_user

router = APIRouter(prefix="/profile", tags=["profile"])

ALLOWED_EXTENSIONS = (".pdf", ".doc", ".docx", ".txt")
MAX_SIZE_BYTES = 1 * 1024 * 1024


@router.post("/resume")
async def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    filename_lower = file.filename.lower()
    if not filename_lower.endswith(ALLOWED_EXTENSIONS):
        raise HTTPException(status_code=400, detail="Unsupported file type. Use PDF, DOC, DOCX, or TXT.")

    content = await file.read()
    if len(content) > MAX_SIZE_BYTES:
        raise HTTPException(status_code=400, detail="File too large. Max size is 1MB.")

    user = db.query(models.User).filter(models.User.id == current_user.id).first()
    user.resume_filename = file.filename
    user.resume_data = base64.b64encode(content).decode("utf-8")
    db.commit()

    return {"filename": file.filename, "message": "Resume uploaded successfully"}