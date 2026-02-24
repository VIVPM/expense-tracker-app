from sqlalchemy.orm import Session
from app.db import models
from app.schemas import schemas
from datetime import datetime


def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    from app.core import security as auth
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(
        email=user.email, 
        hashed_password=hashed_password, 
        full_name=user.full_name,
        grade=user.grade
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    db.refresh(db_user)
    return db_user

def update_user(db: Session, user_id: int, user_update: schemas.UserUpdate):
    db_user = get_user(db, user_id)
    if not db_user:
        return None
    
    if user_update.full_name is not None:
        db_user.full_name = user_update.full_name
    if user_update.email is not None:
        db_user.email = user_update.email
    if user_update.password:
        from app.core import security as auth
        db_user.hashed_password = auth.get_password_hash(user_update.password)
    
    db.commit()
    db.refresh(db_user)
    return db_user

def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.User).offset(skip).limit(limit).all()

def update_user_grade(db: Session, user_id: int, grade_update: schemas.UserGradeUpdate):
    db_user = get_user(db, user_id)
    if not db_user:
        return None
    db_user.grade = grade_update.grade
    if grade_update.email:
        # Check if email is already taken by a different user
        existing_user = get_user_by_email(db, grade_update.email)
        if existing_user and existing_user.id != user_id:
            raise ValueError("Email already in use")
        db_user.email = grade_update.email
    db.commit()
    db.refresh(db_user)
    return db_user

def get_expenses(db: Session, skip: int = 0, limit: int = 100, user_id: int = None):
    query = db.query(models.Expense)
    if user_id:
        query = query.filter(models.Expense.owner_id == user_id)
    return query.order_by(models.Expense.date.desc(), models.Expense.id.desc()).offset(skip).limit(limit).all()

def get_budget(grade: int) -> float:
    budgets = {
        1: 100, 2: 200, 3: 300, 4: 400, 5: 500,
        6: 600, 7: 700, 8: 800, 9: 900, 10: 1000
    }
    return budgets.get(grade, 300.0)

def create_user_expense(db: Session, expense: schemas.ExpenseCreate, user_id: int):
    user = get_user(db, user_id)
    daily_limit = get_budget(user.grade)

    # Calculate sum of 'Approved' expenses for this category today
    expense_date_str = expense.date.strftime('%Y-%m-%d')
    today_approved_expenses = db.query(models.Expense).filter(
        models.Expense.owner_id == user_id,
        models.Expense.category == expense.category,
        models.Expense.status == "Approved"
    ).all()
    
    current_spent = sum(e.amount for e in today_approved_expenses if e.date.strftime('%Y-%m-%d') == expense_date_str)
    
    remaining_balance = daily_limit - current_spent
    
    if expense.amount <= remaining_balance:
        status = "Approved"
    else:
        status = "Pending"

    db_expense = models.Expense(**expense.dict(), owner_id=user_id, status=status)
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    return db_expense

def create_user_chat(db: Session, chat: schemas.ChatCreate, user_id: int):
    db_chat = models.Chat(**chat.dict(), owner_id=user_id)
    db.add(db_chat)
    db.commit()
    db.refresh(db_chat)
    db.refresh(db_chat)
    return db_chat

def delete_user_expense(db: Session, expense_id: int, user_id: int):
    expense = db.query(models.Expense).filter(models.Expense.id == expense_id, models.Expense.owner_id == user_id).first()
    if expense:
        db.delete(expense)
        db.commit()
        return True
    return False

def update_user_expense(db: Session, expense_id: int, expense_update: schemas.ExpenseCreate, user_id: int):
    expense = db.query(models.Expense).filter(models.Expense.id == expense_id, models.Expense.owner_id == user_id).first()
    if not expense:
        return None
    
    user = get_user(db, user_id)
    daily_limit = get_budget(user.grade)
    
    # Calculate sum of 'Approved' expenses for this category today, EXCLUDING the current expense being edited
    expense_date_str = expense_update.date.strftime('%Y-%m-%d')
    today_approved_expenses = db.query(models.Expense).filter(
        models.Expense.owner_id == user_id,
        models.Expense.category == expense_update.category,
        models.Expense.status == "Approved",
        models.Expense.id != expense_id
    ).all()
    
    current_spent = sum(e.amount for e in today_approved_expenses if e.date.strftime('%Y-%m-%d') == expense_date_str)
    
    remaining_balance = daily_limit - current_spent
    
    if expense_update.amount <= remaining_balance:
        expense.status = "Approved"
    else:
        expense.status = "Pending"
    
    # Update fields
    expense.amount = expense_update.amount
    expense.category = expense_update.category
    expense.description = expense_update.description
    expense.date = expense_update.date

    db.commit()
    db.refresh(expense)
    return expense
