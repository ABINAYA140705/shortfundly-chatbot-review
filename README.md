# InternPilot AI – Smart Intern Task Assistant

**InternPilot AI** is an intelligent mentorship assistant designed to guide company interns through understanding assigned tasks, submitting work, receiving automated AI-powered evaluations, and preparing for scheduled mentor reviews.

---

## 🌟 Key Features

### 1. Intern & Mentor Authentication
- Individual sign-in for interns and mentors using email and password.
- Each intern accesses their own assigned tasks, module checklist, submission history, and review schedule.
- Quick 1-click test login buttons available for sample accounts.

### 2. Voice-Based Task Explanation
- Built-in natural voice reader powered by browser Web Speech Synthesis.
- Explains task objective, required modules, expected output, and deadline.
- Real-time animated audio wave visualizer, speed controls (0.8x, 1x, 1.25x), voice selector, and script transcript.
- Interactive **AI Task Assistant (Chatbot)** contextualized in the assigned task with voice playback for answers.

### 3. Review Scheduling & Email Notifications
- Mentors and admins can schedule review dates, times, and meeting links (Google Meet / Zoom).
- Automated email invitations containing meeting links, agendas, and deadlines are dispatched to the intern.
- Works with real SMTP or in interactive **Demo Mode** with a full **Email Outbox viewer** when SMTP credentials are not configured.

### 4. Work Submission
- Drag-and-drop submission zone supporting `.py`, `.js`, `.ts`, `.zip`, `.pdf`, `.docx`, `.txt`, `.json`, etc.
- Validates file size (up to 25MB) and file extensions.
- Includes an in-browser **Code & File Previewer**.

### 5. AI-Powered Work Evaluation
- Compares submitted work against original task requirements and expected modules using **Gemini 3.8 Flash**.
- Strict evidence enforcement: does not claim a module is completed unless evidence is verified in the submitted work.
- Produces a structured report:
  - **Completed Modules** (with verified code evidence quotes)
  - **Missing Modules** (with specific missing requirement details)
  - **Incomplete / Partial Parts**
  - **Actionable Improvement Suggestions**
  - **Score (0–100) & Next Steps**
- Automatically emails the evaluation report to the intern.

### 6. Mentor Command Center
- Mentors can view all interns, assign new tasks, schedule milestone reviews, and review past submissions.

---

## 🚀 Running the Project

### Option A: Full-Stack React + Node/Express (Default)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment (optional):**
   ```bash
   cp .env.example .env
   ```
   Add your `GEMINI_API_KEY` (AI Studio injects this automatically). Add optional SMTP credentials for real emails.

3. **Start Development Server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000`.

---

### Option B: Python Flask + SQLite Backend

See `/python-backend/README.md` for complete instructions:
```bash
cd python-backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python seed_data.py
python app.py
```

---

## 👥 Sample Test Accounts

| Role | Name | Email | Password | Track |
|------|------|-------|----------|-------|
| **Intern** | Alex Rivera | `alex@internpilot.ai` | `intern123` | Full-Stack Engineering |
| **Intern** | Maya Chen | `maya@internpilot.ai` | `intern123` | Frontend & Product UI |
| **Intern** | Liam Patel | `liam@internpilot.ai` | `intern123` | Data Science & ML |
| **Mentor** | Sarah Connor | `mentor@internpilot.ai` | `mentor123` | Lead Engineering Mentor |
