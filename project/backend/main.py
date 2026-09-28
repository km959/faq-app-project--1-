import os
import uuid
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from database import Base, engine, SessionLocal
import models
from routers import auth, faqs, tickets, jobs
from routers import chat as chat_router
from routers import profile as profile_router

load_dotenv()

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Healthcare Portal API")

FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in FRONTEND_ORIGIN.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(faqs.router)
app.include_router(tickets.router)
app.include_router(jobs.router)
app.include_router(chat_router.router)
app.include_router(profile_router.router)

SAMPLE_JOBS = [
    {"title": "Duty Doctor", "organization": "Arrow Diagnostics LLP", "location": "Chennai", "job_type": "Full Time", "salary": "780000/Annual", "description": "Conduct patient consultations and basic clinical examinations. Review lab and diagnostic reports."},
    {"title": "Radiologist", "organization": "NT Talent Healthcare", "location": "Chennai", "job_type": "Full Time", "salary": "As per company norms", "description": "Perform and interpret diagnostic imaging including X-rays, CT scans, and MRIs."},
    {"title": "Consultant Dermatologist", "organization": "Carves Skin Clinic", "location": "Chennai", "job_type": "Full Time", "salary": "900000/Annual", "description": "Diagnose and treat skin conditions, run consultations, and manage patient treatment plans."},
    {"title": "ICU Staff Nurse", "organization": "Apollo Hospitals", "location": "Chennai", "job_type": "Full Time", "salary": "420000/Annual", "description": "Provide critical care nursing support in the intensive care unit."},
    {"title": "Physiotherapist", "organization": "MedPlus Care", "location": "Bangalore", "job_type": "Part Time", "salary": "35000/Month", "description": "Assess and treat patients through physical rehabilitation techniques."},
    {"title": "Pharmacist", "organization": "Sunrise Hospitals", "location": "Bangalore", "job_type": "Full Time", "salary": "380000/Annual", "description": "Dispense medications, verify prescriptions, and counsel patients on drug usage."},
    {"title": "Lab Technician", "organization": "Paramitha Hospitals", "location": "Hyderabad", "job_type": "Full Time", "salary": "300000/Annual", "description": "Perform diagnostic tests and maintain laboratory equipment and records."},
    {"title": "Hospital Administrator", "organization": "Remedy Hospitals", "location": "Hyderabad", "job_type": "Full Time", "salary": "650000/Annual", "description": "Oversee daily hospital operations, staffing, and compliance."},
]


def seed_jobs():
    db = SessionLocal()
    try:
        existing_count = db.query(models.Job).count()
        if existing_count == 0:
            for job_data in SAMPLE_JOBS:
                db.add(models.Job(id=uuid.uuid4(), **job_data))
            db.commit()
    finally:
        db.close()


seed_jobs()


@app.get("/health")
def health():
    return {"status": "ok"}