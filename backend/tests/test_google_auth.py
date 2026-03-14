import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base, get_db
from app.main import app
from app.models.user import User, RoleEnum

# Setup test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

@pytest.fixture
def db_session():
    db = TestingSessionLocal()
    yield db
    db.query(User).delete()
    db.commit()
    db.close()

@patch("app.api.routes.auth.id_token.verify_oauth2_token")
def test_google_auth_new_user(mock_verify, db_session):
    # Mock Google token info
    mock_verify.return_value = {
        "email": "newuser@gmail.com",
        "sub": "google123",
        "email_verified": True
    }

    response = client.post(
        "/api/v1/auth/google",
        json={"credential": "mock_token"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["role"] == "Employee"
    
    # Verify user created in DB
    user = db_session.query(User).filter(User.email == "newuser@gmail.com").first()
    assert user is not None
    assert user.provider == "google"
    assert user.provider_id == "google123"

@patch("app.api.routes.auth.id_token.verify_oauth2_token")
@patch("app.api.routes.auth.google_requests.Request")
def test_google_auth_existing_user(mock_request, mock_verify, db_session):
    # Create existing user
    existing_user = User(
        email="existing@gmail.com",
        provider="local",
        hashed_password="hashed_pw",
        role=RoleEnum.MANAGER
    )
    db_session.add(existing_user)
    db_session.commit()

    # Mock Google token info
    mock_verify.return_value = {
        "email": "existing@gmail.com",
        "sub": "google456",
        "email_verified": True
    }

    response = client.post(
        "/api/v1/auth/google",
        json={"credential": "mock_token"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["data"]["role"] == "Manager"
    
    # Verify user updated in DB
    user = db_session.query(User).filter(User.email == "existing@gmail.com").first()
    assert user.provider == "google"
    assert user.provider_id == "google456"

@patch("app.api.routes.auth.id_token.verify_oauth2_token")
def test_google_auth_invalid_token(mock_verify, db_session):
    mock_verify.side_effect = ValueError("Invalid token")

    response = client.post(
        "/api/v1/auth/google",
        json={"credential": "invalid_token"}
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid Google credentials"
