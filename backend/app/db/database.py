import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Fetch database URL from environment, defaulting to local SQLite
DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./expenses.db")

# SQLAlchemy requires "postgresql://" but some platforms provide "postgres://"
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# PostgreSQL does not need "check_same_thread"
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal() # opens a session
    try:
        yield db # yields the session to the endpoint/route
    finally:
        db.close() # closes a session
