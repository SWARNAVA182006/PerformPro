from fastapi import APIRouter
from .routes import employee, appraisal, dashboard, auth, notifications, reports, departments, uploads, goals, analytics, search, skills, feedback, chatbot


api_router = APIRouter()

api_router.include_router(skills.router, prefix="/employee/skills", tags=["skills"])
api_router.include_router(feedback.router, prefix="/employee/feedback", tags=["feedback"])
api_router.include_router(employee.router, prefix="/employee", tags=["employee"])
api_router.include_router(appraisal.router, prefix="/appraisals", tags=["appraisals"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(search.router, prefix="/search", tags=["search"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
api_router.include_router(departments.router, prefix="/departments", tags=["departments"])
api_router.include_router(uploads.router, prefix="/uploads", tags=["uploads"])
api_router.include_router(goals.router, prefix="/goals", tags=["goals"])
api_router.include_router(chatbot.router, prefix="/chatbot", tags=["chatbot"])
