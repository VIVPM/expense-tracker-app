import os
import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.crud import crud
from app.db import database, models
from app.schemas import schemas
from app.core import security as auth
from datetime import datetime, timedelta, timezone
from pydantic import BaseModel, Field

from dotenv import load_dotenv, find_dotenv
import os
load_dotenv(find_dotenv())

from google import genai
from google.genai import types

router = APIRouter()

IST = timezone(timedelta(hours=5, minutes=30))
CATEGORIES = ['food', 'travel', 'supplies', 'other']

class ChatAction(BaseModel):
    is_expense: bool = Field(description="True if the user's message is a request to log/create a new expense, False otherwise.")
    category: str = Field(None, description="If is_expense is true, the category of the expense. Must be exactly one of: food, travel, supplies, other.")
    amount: float = Field(None, description="If is_expense is true, the amount of the expense as a number.")
    description: str = Field(None, description="If is_expense is true, a short description of the expense.")
    reply_message: str = Field(description="The conversational text reply to the user. E.g. answering a question or confirming expense creation.")

def get_today_ist():
    return datetime.now(IST).strftime('%Y-%m-%d')

def get_gemini_client():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return None
    return genai.Client(api_key=api_key)

def handle_gemini_query(db, current_user, user_message: str):
    client = get_gemini_client()
    if not client:
        return schemas.ChatCreate(message="⚠️ Gemini API Key is missing. Please set GEMINI_API_KEY in the environment.", is_support=True), None
    
    today_str = get_today_ist()
    # Let's get up to 50 recent expenses for context
    user_expenses = db.query(models.Expense).filter(
        models.Expense.owner_id == current_user.id
    ).order_by(models.Expense.date.desc()).limit(50).all()
    
    daily_limit = crud.get_budget(current_user.grade)
    
    spent_today = sum(e.amount for e in user_expenses if e.date.strftime('%Y-%m-%d') == today_str and e.status == "Approved")
    remaining = daily_limit - spent_today
    
    expense_history = []
    for e in user_expenses:
        date_str = e.date.strftime('%Y-%m-%d %H:%M') if e.date else 'Unknown'
        expense_history.append(f"[{date_str}] {e.category} - ₹{e.amount} ({e.status}): {e.description}")
    
    expense_context = "\n".join(expense_history) if expense_history else "No expenses found."
    
    system_instruction = f"""
You are FinBot, an AI expense tracking assistant. 
The user relies on you to log expenses and answer questions about their spending.

User Info:
- Daily Limit: ₹{daily_limit}
- Spent Today: ₹{spent_today}
- Remaining Today: ₹{remaining}
- Today's Date: {today_str}

Recent Expenses (last 50):
{expense_context}

Your Task:
Analyze the user's message.
1. If the user wants to log/create a new expense (e.g., "I ate lunch for 500", "Spent 200 on travel", "Expense: Food 500"):
   - Set is_expense = True
   - Extract category (must map to one of: food, travel, supplies, other). Try your best to categorize.
   - Extract amount (number).
   - Extract description. Formulate a short description if one isn't explicitly provided.
   - Provide a friendly confirmation reply message.

2. If the user is asking a question (e.g., "What is my limit?", "How much did I spend today?", "Show my last 3 expenses"):
   - Set is_expense = False
   - Answer their question concisely and nicely in the reply_message based strictly on the User Info and Recent Expenses context above.
   - You can use markdown to format the reply_message.
   - IMPORTANT: For Indian currency, use the ₹ symbol. No $ symbol.

Return a JSON strictly matching the schema.
"""

    try:
        result = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=f"User's Message: {user_message}",
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                response_schema=ChatAction,
                temperature=0.0
            ),
        )
        
        parsed = json.loads(result.text)
        action = ChatAction(**parsed)
        
        expense_to_create = None
        if action.is_expense and action.amount is not None and action.category:
            cat = action.category.lower()
            if cat not in CATEGORIES:
                cat = 'other'
            
            # Capitalize properly for the database/frontend (e.g., 'Food')
            final_cat = cat.capitalize()
                
            expense_to_create = schemas.ExpenseCreate(
                amount=action.amount,
                category=final_cat,
                description=action.description or "Added via FinBot",
                date=datetime.now(IST)
            )
            
        return schemas.ChatCreate(message=action.reply_message, is_support=True), expense_to_create

    except Exception as e:
        print(f"Gemini error: {e}")
        return schemas.ChatCreate(message="❌ Sorry, I encountered an error while processing your request.", is_support=True), None

@router.post("/", response_model=schemas.Chat)
def create_chat(
    chat: schemas.ChatCreate, 
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    # Save the user's message FIRST
    user_chat = crud.create_user_chat(db=db, chat=chat, user_id=current_user.id)
    
    bot_reply, expense_to_create = handle_gemini_query(db, current_user, chat.message)
    
    if expense_to_create:
        try:
            crud.create_user_expense(db=db, expense=expense_to_create, user_id=current_user.id)
        except Exception as e:
            bot_reply = schemas.ChatCreate(message=f"❌ Failed to create expense. Database error: {str(e)}", is_support=True)
            
    if bot_reply:
        crud.create_user_chat(db, bot_reply, current_user.id)
        
    return user_chat

@router.get("/", response_model=List[schemas.Chat])
def read_chats(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    return current_user.chats
