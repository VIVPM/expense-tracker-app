# Expense Tracker App

A full-stack Expense Tracker application designed to help users manage their finances. The application includes a modern React frontend and a powerful FastAPI backend, providing features to track expenses, manage budgets, and visualize financial data.

## Tech Stack

### Frontend
- **Framework:** React 19 (via Vite)
- **Styling:** Tailwind CSS
- **Routing:** React Router DOM
- **Icons:** Lucide React
- **Charts:** Recharts
- **HTTP Client:** Axios

### Backend
- **Framework:** FastAPI
- **Server:** Uvicorn
- **Database ORM:** SQLAlchemy
- **Data Validation:** Pydantic
- **Authentication & Security:** python-jose, passlib, bcrypt
- **AI Integration:** Google GenAI (for advanced insights)
- **Environment Management:** python-dotenv

## Project Structure

```text
expense-tracker-app/
├── backend/               # FastAPI backend application
│   ├── app/               # Core application module (API, CRUD, DB, Schemas)
│   ├── create_admin.py    # Utilities
│   └── requirements.txt   # Python dependencies
├── frontend/              # React frontend application
│   ├── src/               # React components, pages, hooks, etc.
│   ├── package.json       # Node dependencies and scripts
│   ├── vite.config.js     # Vite configuration
│   └── tailwind.config.js # Tailwind CSS configuration
└── README.md              # Project documentation
```

## Getting Started

Follow these instructions to set up and run the application locally.

### Prerequisites
- [Node.js](https://nodejs.org/) (v16+ recommended)
- [Python](https://www.python.org/) (v3.8+ recommended)

### Backend Setup

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create and activate a virtual environment:**
   ```bash
   python -m venv venv
   # On Windows
   venv\Scripts\activate
   # On macOS/Linux
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment Variables:**
   Make sure you have a `.env` file in the `backend` directory containing the necessary local configuration overrides (e.g., database configuration, Google GenAI API key for AI features).

5. **Run the FastAPI server:**
   ```bash
   uvicorn app.main:app --reload
   ```
   The backend API will be available at `http://localhost:8000`. You can test the endpoints using the interactive Swagger UI at `http://localhost:8000/docs`.

### Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```
   The frontend will be accessible at `http://localhost:5173`. Make sure the backend server is running simultaneously so the frontend can interact with the API.

## Features Let 
- **Expense Tracking:** Log and categorize expenses.
- **Data Visualization:** View spending habits through elegant charts (Recharts).
- **Authentication:** Secure user login and registration system.
- **AI Insights:** Leverage Google GenAI for specific expense insights.