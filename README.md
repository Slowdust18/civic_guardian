# Civic Guardian Setup Guide

This document explains how to set up the Civic Guardian project locally.  
It includes installation steps for **PostgreSQL + PostGIS**, **backend (FastAPI)**, and **frontend (React)**.

---

## 1. Prerequisites

- [Python 3.9+](https://www.python.org/downloads/)
- [Node.js 18+](https://nodejs.org/)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- [PostgreSQL 14+](https://www.postgresql.org/download/) with [PostGIS](https://postgis.net/)

---

## 2. Database Setup (PostgreSQL + PostGIS)

1. **Start PostgreSQL shell**
   ```sh
   psql -U postgres
   ```

2. **Create database and user**
   ```sql
   CREATE DATABASE civic_guardian;
   CREATE USER civic_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE civic_guardian TO civic_user;
   ```

3. **Enable PostGIS**
   ```sql
   \c civic_guardian;
   CREATE EXTENSION postgis;
   ```

4. **Verify extension**
   ```sql
   \dx
   ```

---

## 3. Backend Setup (FastAPI)

1. Navigate to backend folder:
   ```sh
   cd backend
   ```

2. Create virtual environment:
   ```sh
   python -m venv venv
   ```

3. Activate venv:
   - **Windows (PowerShell)**:
     ```sh
     venv\Scripts\activate
     ```
   - **Mac/Linux**:
     ```sh
     source venv/bin/activate
     ```

4. Install dependencies:
   ```sh
   pip install -r requirements.txt
   ```

5. Run backend server:
   ```sh
   uvicorn main:app --reload
   ```

   - Server will be running at:  
     👉 http://127.0.0.1:8000  
   - API docs available at:  
     👉 http://127.0.0.1:8000/docs

---

## 4. Frontend Setup (React)

1. Navigate to frontend folder:
   ```sh
   cd frontend
   ```

2. Install dependencies:
   ```sh
   npm install
   ```

3. Start frontend server:
   ```sh
   npm start
   ```

   - React app will be available at:  
     👉 http://localhost:3000

---

## 5. Connecting Frontend & Backend

- The frontend fetches API data from the backend (http://127.0.0.1:8000).
- Example: complaints are fetched from  
  👉 http://127.0.0.1:8000/complaints/all

---

## 6. Common Issues

- **FastAPI not found inside venv**  
  → Make sure you installed dependencies inside the backend `venv`.

- **npm install errors**  
  → Try deleting `node_modules` and re-running:
  ```sh
  rm -rf node_modules package-lock.json
  npm install
  ```

- **Database connection issues**  
  → Ensure Postgres is running and your credentials in `database.py` are correct.

---

## 7. Folder Structure

```
civic_guardian_backend/
│── backend/
│   ├── venv/                # Python virtual environment
│   ├── main.py              # FastAPI entry point
│   ├── complaints.py        # Complaints router
│   ├── models.py            # SQLAlchemy models
│   ├── database.py          # DB config
│   └── requirements.txt
│
│── frontend/
│   ├── node_modules/
│   ├── public/
│   ├── src/
│   │   ├── components/      # React components (LoginPage, MapPage, etc.)
│   │   ├── App.js
│   │   └── index.js
│   ├── package.json
│   └── README.md
│
└── uploads/                 # Complaint images (ignored in git)
```

---

## 8. Running Both Together

- Start backend:
  ```sh
  cd backend
  venv\Scripts\activate
  uvicorn main:app --reload
  ```

- Start frontend (new terminal):
  ```sh
  cd frontend
  npm start
  ```

Now visit **http://localhost:3000** — the frontend will talk to your backend APIs 🎉


## 9. Add any issues below
  ```sh
  cd frontend
  npm start
  ```

Now visit **http://localhost:3000** — the frontend will talk to your backend APIs 🎉
