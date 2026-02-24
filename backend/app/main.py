from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.database import engine
from app.db import models
from app.api.endpoints import auth, users, expenses, chats

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Expense Tracker API", description="API for the Expense Tracker App with modular architecture")

# CORS configuration (Crucial for React frontend)
origins = ["*"] # Allow all for demo
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, tags=["Authentication"])
app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(expenses.router, prefix="/expenses", tags=["Expenses"])
app.include_router(chats.router, prefix="/chats", tags=["Chats"])
