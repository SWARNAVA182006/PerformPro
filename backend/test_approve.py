import sys
import os
import json
sys.path.append(os.getcwd())

from fastapi.testclient import TestClient
from app.main import app
from app.api.dependencies import get_db, get_current_user
from app.models.user import User, RoleEnum
from app.models.goal import Goal
from app.database import SessionLocal

db = SessionLocal()
admin_user = db.query(User).filter(User.role == RoleEnum.ADMIN).first()

if not admin_user:
    print("No admin user found")
    sys.exit(1)

def override_get_current_user():
    return admin_user

app.dependency_overrides[get_current_user] = override_get_current_user

client = TestClient(app)
try:
    print("Testing GET /goals/")
    res = client.get("/goals/")
    print(res.status_code)
    # print(res.json())

    # Get a goal ID that is Pending
    goal = db.query(Goal).first()
    if goal:
        print(f"Testing PUT /goals/{goal.id}/approve")
        res = client.put(f"/goals/{goal.id}/approve")
        print(res.status_code)
        print(res.text)
    else:
        print("No goals exist to test")
except Exception as e:
    print("Exception", e)
