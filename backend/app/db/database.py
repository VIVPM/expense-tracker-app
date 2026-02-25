import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Due to Render.com build limitations with Rust/libsql, we fall back to a local disk SQLite file. 
# Note: On Render free tier, this file is ephemeral and will reset on deploy. 
# Ideally, upgrade to Render Postgres for a persistent database.
SQLALCHEMY_DATABASE_URL = "sqlite:///./expenses.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal() # opens a session
    try:
        yield db # yields the session to the endpoint/route
    finally:
        db.close() # closes a session
