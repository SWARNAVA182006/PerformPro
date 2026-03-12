from fastapi import APIRouter
from .routes import employees, appraisal, dashboard, auth, notifications, reports, departments, uploads

api_router = APIRouter()
api_router.include_router(employees.router, prefix="/employees", tags=["employees"])
api_router.include_router(appraisal.router, prefix="/appraisal", tags=["appraisals"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
api_router.include_router(departments.router, prefix="/departments", tags=["departments"])
api_router.include_router(uploads.router, prefix="/uploads", tags=["uploads"])
