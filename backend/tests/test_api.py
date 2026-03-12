import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database import Base, get_db
from app.models.user import User, RoleEnum
from app.core.security import get_password_hash, create_access_token

# Use in-memory SQLite for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    
    # Create Admin Test User
    admin = User(email="admin@company.com", hashed_password=get_password_hash("test"), role=RoleEnum.ADMIN)
    # Create Manager Test User
    manager = User(email="manager@company.com", hashed_password=get_password_hash("test"), role=RoleEnum.MANAGER)
    # Create Employee Test User
    employee = User(email="employee@company.com", hashed_password=get_password_hash("test"), role=RoleEnum.EMPLOYEE)
    
    db.add_all([admin, manager, employee])
    db.commit()
    db.refresh(admin)
    db.refresh(manager)
    db.refresh(employee)
    
    yield
    
    db.close()
    Base.metadata.drop_all(bind=engine)

def get_auth_headers(user_id: int):
    token = create_access_token(subject=user_id)
    return {"Authorization": f"Bearer {token}"}

def test_register_user():
    response = client.post(
        "/api/v1/auth/register",
        json={"email": "new@company.com", "password": "newpassword", "role": "Employee"},
    )
    assert response.status_code == 200
    assert response.json()["email"] == "new@company.com"

def test_login_user():
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "employee@company.com", "password": "test"},
    )
    assert response.status_code == 200
    assert response.json()["success"] is True
    assert "access_token" in response.json()["data"]

def test_rbac_admin_access():
    headers = get_auth_headers(1) # Admin is ID 1
    # Adding an employee requires Admin or Manager
    response = client.post(
        "/api/v1/employees/",
        json={"name": "John Doe", "email": "johndoe@test.com", "role": "Developer"},
        headers=headers
    )
    assert response.status_code == 200
    assert response.json()["success"] is True

def test_rbac_employee_denied():
    headers = get_auth_headers(3) # Employee is ID 3
    # Employee cannot add an employee
    response = client.post(
        "/api/v1/employees/",
        json={"name": "Jane", "email": "j@test.com", "role": "DEV"},
        headers=headers
    )
    assert response.status_code == 403 # Forbidden
    
def test_dashboard_stats():
    # Anyone authenticated can view stats
    headers = get_auth_headers(3)
    response = client.get("/api/v1/dashboard/stats", headers=headers)
    assert response.status_code == 200
    assert "stats" in response.json()
