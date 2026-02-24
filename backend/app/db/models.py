from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float, DateTime
from sqlalchemy.orm import relationship
from app.db.database import Base
from datetime import datetime, timezone, timedelta

IST = timezone(timedelta(hours=5, minutes=30))
def now_ist():
    return datetime.now(IST)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    full_name = Column(String)
    hashed_password = Column(String)
    grade = Column(Integer, default=1) # Employee Grade (e.g., 1-10)

    expenses = relationship("Expense", back_populates="owner") # user gets all expenses and expense gets its user data
    chats = relationship("Chat", back_populates="owner")

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Float)
    category = Column(String)
    description = Column(String)
    date = Column(DateTime, default=datetime.utcnow)
    receipt_url = Column(String, nullable=True)
    # Validations will be handled in business logic, but status tracks approval
    status = Column(String, default="Pending") 
    owner_id = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User", back_populates="expenses")

class Chat(Base):
    __tablename__ = "chats"

    id = Column(Integer, primary_key=True, index=True)
    message = Column(String)
    is_support = Column(Boolean, default=False) # True if message is from support
    timestamp = Column(DateTime, default=now_ist)
    owner_id = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User", back_populates="chats")
