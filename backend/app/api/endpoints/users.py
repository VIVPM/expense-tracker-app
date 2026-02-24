from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.crud import crud
from app.db import database, models
from app.schemas import schemas
from app.core import security as auth

router = APIRouter()

@router.post("/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db=db, user=user)

@router.get("/me", response_model=schemas.User)
async def read_users_me(current_user: models.User = Depends(auth.get_current_active_user)):
    return current_user

@router.put("/me", response_model=schemas.User)
def update_user_me(user_update: schemas.UserUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    user = crud.update_user(db, current_user.id, user_update)
@router.get("/", response_model=list[schemas.UserSummary])
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    # Optional: ensure only admins (grade == 0) can see all users
    # if current_user.grade != 0:
    #     raise HTTPException(status_code=403, detail="Not authorized")
    users = crud.get_users(db, skip=skip, limit=limit)
    return users

@router.put("/{user_id}/grade", response_model=schemas.UserSummary)
def update_user_grade(user_id: int, grade_update: schemas.UserGradeUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    # Optional: ensure only admins (grade == 0) can change grades
    # if current_user.grade != 0:
    #     raise HTTPException(status_code=403, detail="Not authorized")
    try:
        updated_user = crud.update_user_grade(db, user_id=user_id, grade_update=grade_update)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
        
    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found")
    return updated_user
