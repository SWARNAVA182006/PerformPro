from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

import os

# We will check if we are in production by looking for Render's environment variable or a DATABASE_URL
DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./performpro.db")

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    DATABASE_URL, connect_args=connect_args
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()
