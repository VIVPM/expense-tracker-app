from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ExpenseBase(BaseModel):
    amount: float
    category: str
    description: str
    receipt_url: Optional[str] = None
    date: datetime

class ExpenseCreate(ExpenseBase):
    pass

class UserSummary(BaseModel):
    id: int
    full_name: Optional[str] = None
    email: str
    grade: int = 1

    class Config:
        from_attributes = True

class Expense(ExpenseBase):
    id: int
    owner_id: int
    status: str
    owner: Optional[UserSummary] = None

    class Config:
        from_attributes = True

class ChatBase(BaseModel):
    message: str
    is_support: bool = False

class ChatCreate(ChatBase):
    pass

class Chat(ChatBase):
    id: int
    owner_id: int
    timestamp: datetime

    class Config: # used to read objects attributes since sqlalchemy returns objects instead of plain dictionary
        from_attributes = True
        
class UserBase(BaseModel):
    email: str
    full_name: Optional[str] = None
    grade: int = 1

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserGradeUpdate(BaseModel):
    grade: int
    email: Optional[str] = None

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None

class User(UserBase):
    id: int
    expenses: List[Expense] = []
    chats: List[Chat] = []

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
