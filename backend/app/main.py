from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi import APIRouter

# Import all models to ensure they are registered with SQLAlchemy
import app.models
from app.database import engine

# Automatically create tables (crucial for first-time cloud DB deployments)
app.models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="PerformPro – Smart Employee Performance Tracker",
    version="1.1.0",
    description="Industry-grade employee performance, appraisal & HR analytics system"
)

# CORS configuration
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://performpro-tau.vercel.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
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
