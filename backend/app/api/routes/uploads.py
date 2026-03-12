from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from app.api.dependencies import get_current_user
from app.models.user import User
import os
import shutil
from uuid import uuid4

router = APIRouter()

UPLOAD_DIR = "app/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload", response_model=dict)
def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    # Basic validation
    allowed_types = ["image/jpeg", "image/png", "application/pdf", "text/csv"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="File type not supported")
        
    if file.size and file.size > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 5MB)")

    # Secure filename
    ext = os.path.splitext(file.filename)[1]
    secure_name = f"{uuid4().hex}{ext}"
    file_path = os.path.join(UPLOAD_DIR, secure_name)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    return {
        "success": True,
        "data": {
            "filename": file.filename,
            "url": f"/files/{secure_name}",
            "size": file.size
        },
        "message": "File uploaded successfully",
        "pagination": None
    }
