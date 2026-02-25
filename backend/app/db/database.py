import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

turso_url = os.environ.get("TURSO_DATABASE_URL")
turso_auth_token = os.environ.get("TURSO_AUTH_TOKEN")

if turso_url and turso_auth_token:
    SQLALCHEMY_DATABASE_URL = f"sqlite+libsql://{turso_url.replace('libsql://', '').replace('https://', '')}/?authToken={turso_auth_token}&secure=true"
else:
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
