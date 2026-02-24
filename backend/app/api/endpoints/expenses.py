from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.crud import crud
from app.db import database, models
from app.schemas import schemas
from app.core import security as auth

router = APIRouter()

@router.post("/", response_model=schemas.Expense)
def create_expense(
    expense: schemas.ExpenseCreate, 
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    return crud.create_user_expense(db=db, expense=expense, user_id=current_user.id)

@router.get("/", response_model=List[schemas.Expense])
def read_expenses(
    skip: int = 0, limit: int = 100, 
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    if current_user.grade == 0:
        return crud.get_expenses(db, skip=skip, limit=limit)
    return crud.get_expenses(db, skip=skip, limit=limit, user_id=current_user.id)

@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(expense_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    success = crud.delete_user_expense(db, expense_id=expense_id, user_id=current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Expense not found")
    return None

@router.put("/{expense_id}", response_model=schemas.Expense)
def update_expense(expense_id: int, expense: schemas.ExpenseCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    updated_expense = crud.update_user_expense(db, expense_id=expense_id, expense_update=expense, user_id=current_user.id)
    if not updated_expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    return updated_expense
