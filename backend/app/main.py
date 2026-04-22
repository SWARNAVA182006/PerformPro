from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi import APIRouter
from contextlib import asynccontextmanager

# Import all models to ensure they are registered with SQLAlchemy
import app.models
from app.database import engine, SessionLocal

# Automatically create tables (crucial for first-time cloud DB deployments)
app.models.Base.metadata.create_all(bind=engine)

def seed_departments():
    """Auto-seed standard departments if they don't exist."""
    from app.models.department import Department
    import os
    
    # Simple check to avoid running this 4 times in parallel on worker startup if possible
    # We only run if we can get a clean DB connection
    try:
        db = SessionLocal()
        try:
            standard_depts = [
                ("Engineering", "Software Engineering & Architecture Team"),
                ("Sales", "Enterprise Sales & Account Management"),
                ("Human Resources", "HR & People Operations"),
                ("Marketing", "Digital Marketing & Brand Management"),
                ("Finance", "Finance & Business Operations"),
            ]
            for name, desc in standard_depts:
                if not db.query(Department).filter(Department.name == name).first():
                    db.add(Department(name=name, description=desc))
            db.commit()
        finally:
            db.close()
    except Exception as e:
        # In multi-worker environments (Gunicorn), some workers might hit transient SSL errors on startup
        # during the lifespan event. We log and ignore as other workers will likely succeed.
        print(f"[seed_departments] Skipping seed in this worker/process due to transient error: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Removing auto-seed from startup to prevent SSL gunicorn worker conflicts on Render.
    # Manual master-reset endpoint should be used to populate production data.
    yield

app = FastAPI(
    title="PerformPro – Smart Employee Performance Tracker",
    version="1.2.1",
    description="Industry-grade employee performance, appraisal & HR analytics system",
    lifespan=lifespan
)

@app.get("/version")
def get_version():
    return {"version": "1.2.1", "status": "updated"}

# CORS configuration
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
    "https://performpro-tau.vercel.app",
    "https://performpro.vercel.app",
    "https://performpro-swarnava182006.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://performpro-.*\.vercel\.app", # Allow all vercel preview branches
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import os
os.makedirs("app/uploads", exist_ok=True)
app.mount("/files", StaticFiles(directory="app/uploads"), name="files")

@app.get("/")
def root():
    return {"message": "PerformPro API is live and modularized!", "docs": "/docs"}

from app.api import api_router

app.include_router(api_router)
