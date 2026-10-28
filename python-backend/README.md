# InternPilot AI – Python Flask & SQLite Backend

This directory contains the standalone Python Flask backend implementation for **InternPilot AI – Smart Intern Task Assistant**.

## Features Included
1. **SQLite Database (`database.sqlite`)**: Persistent tables for `users`, `tasks`, `submissions`, `evaluations`, `reviews`, and `email_logs`.
2. **Gemini AI Integration**: Uses `google-genai` Python SDK for task Q&A and work evaluation against module requirements.
3. **File Uploads**: Handles PDF, DOCX, TXT, ZIP, and source-code files with file inspection.
4. **Email Notifications**: Real SMTP sending via `smtplib` and automatic Demo Mode with outbox logging when SMTP is unconfigured.
5. **Sample Interns & Mentors**: Pre-seeded with Alex Rivera, Maya Chen, Liam Patel, and Sarah Connor.

---

## Quick Setup in VS Code

### 1. Open Terminal & Create Virtual Environment
```bash
cd python-backend
python3 -m venv venv

# On macOS/Linux:
source venv/bin/activate

# On Windows:
venv\Scripts\activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Add your `GEMINI_API_KEY` (optional; if omitted, the backend runs in Smart Demo Evaluation mode).

### 4. Seed Database
```bash
python seed_data.py
```

### 5. Run the Server
```bash
python app.py
```
The Flask API will run on `http://127.0.0.1:5000`.

---

## Test Accounts
- **Alex Rivera (Full-Stack Intern)**: `alex@internpilot.ai` / `intern123`
- **Maya Chen (Frontend Intern)**: `maya@internpilot.ai` / `intern123`
- **Liam Patel (ML Intern)**: `liam@internpilot.ai` / `intern123`
- **Sarah Connor (Mentor)**: `mentor@internpilot.ai` / `mentor123`
