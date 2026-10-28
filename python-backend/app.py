import os
import json
import uuid
import datetime
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
from models import get_db_connection, init_db

load_dotenv()

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 25 * 1024 * 1024  # 25MB

init_db()

# Initialize Gemini AI if available
gemini_api_key = os.getenv('GEMINI_API_KEY')
ai_client = None
if gemini_api_key and gemini_api_key != 'MY_GEMINI_API_KEY':
    try:
        from google import genai
        ai_client = genai.Client(api_key=gemini_api_key)
    except Exception as e:
        print(f"Gemini client setup error: {e}")

def send_email(to_email, to_name, subject, html_body, email_type):
    email_id = f"eml_{uuid.uuid4().hex[:8]}"
    now = datetime.datetime.now().isoformat()
    smtp_host = os.getenv('SMTP_HOST')
    smtp_user = os.getenv('SMTP_USER')
    smtp_pass = os.getenv('SMTP_PASS')
    smtp_port = int(os.getenv('SMTP_PORT', '587'))

    is_smtp = bool(smtp_host and smtp_user and smtp_pass and smtp_host != 'smtp.gmail.com')

    conn = get_db_connection()
    cursor = conn.cursor()

    if is_smtp:
        try:
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = os.getenv('SMTP_FROM', f"InternPilot AI <{smtp_user}>")
            msg['To'] = f"{to_name} <{to_email}>"
            msg.attach(MIMEText(html_body, 'html'))

            with smtplib.SMTP(smtp_host, smtp_port) as server:
                server.starttls()
                server.login(smtp_user, smtp_pass)
                server.sendmail(msg['From'], [to_email], msg.as_string())

            cursor.execute('''
            INSERT INTO email_logs VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (email_id, to_email, to_name, subject, html_body, email_type, 'smtp', 'delivered', None, now))
            conn.commit()
            conn.close()
            return {"success": True, "mode": "smtp", "message": f"Delivered to {to_email}"}
        except Exception as e:
            cursor.execute('''
            INSERT INTO email_logs VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (email_id, to_email, to_name, subject, html_body, email_type, 'smtp', 'failed', str(e), now))
            conn.commit()
            conn.close()
            return {"success": False, "mode": "smtp", "message": f"SMTP Error: {e}"}
    else:
        # Demo mode logger
        cursor.execute('''
        INSERT INTO email_logs VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (email_id, to_email, to_name, subject, html_body, email_type, 'demo_mode', 'demo_logged', 'Saved in demo outbox.', now))
        conn.commit()
        conn.close()
        return {"success": True, "mode": "demo_mode", "message": "Demo Mode: Email logged to Outbox."}

@app.route('/api/system/status', methods=['GET'])
def get_status():
    return jsonify({
        "geminiConnected": bool(ai_client is not None),
        "geminiModel": "gemini-3.8-flash",
        "smtpConnected": bool(os.getenv('SMTP_HOST') and os.getenv('SMTP_PASS')),
        "serverTime": datetime.datetime.now().isoformat()
    })

@app.route('/api/auth/users', methods=['GET'])
def get_users():
    conn = get_db_connection()
    users = conn.cursor().execute('SELECT id, name, email, role, track, avatar FROM users').fetchall()
    conn.close()
    return jsonify({"users": [dict(u) for u in users]})

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    conn = get_db_connection()
    user = conn.cursor().execute('SELECT * FROM users WHERE LOWER(email) = ?', (email,)).fetchone()
    conn.close()

    if not user or user['password'] != password:
        return jsonify({"error": "Invalid email or password"}), 401

    return jsonify({
        "user": {
            "id": user['id'],
            "name": user['name'],
            "email": user['email'],
            "role": user['role'],
            "track": user['track'],
            "avatar": user['avatar']
        }
    })

@app.route('/api/intern/dashboard/<intern_id>', methods=['GET'])
def get_dashboard(intern_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    intern = cursor.execute('SELECT id, name, email, role, track, avatar FROM users WHERE id = ?', (intern_id,)).fetchone()
    if not intern:
        conn.close()
        return jsonify({"error": "Intern not found"}), 404

    task = cursor.execute('SELECT * FROM tasks WHERE intern_id = ? ORDER BY deadline ASC LIMIT 1', (intern_id,)).fetchone()
    reviews = cursor.execute('SELECT * FROM reviews WHERE intern_id = ? ORDER BY review_date ASC', (intern_id,)).fetchall()
    submissions = cursor.execute('SELECT * FROM submissions WHERE intern_id = ? ORDER BY submitted_at DESC', (intern_id,)).fetchall()
    evaluations = cursor.execute('SELECT * FROM evaluations WHERE intern_id = ? ORDER BY evaluated_at DESC', (intern_id,)).fetchall()
    conn.close()

    task_obj = None
    if task:
        task_dict = dict(task)
        task_dict['modules'] = json.loads(task['modules_json']) if task['modules_json'] else []
        task_obj = task_dict

    eval_list = []
    for ev in evaluations:
        e = dict(ev)
        e['completedModules'] = json.loads(e.get('completed_modules_json') or '[]')
        e['missingModules'] = json.loads(e.get('missing_modules_json') or '[]')
        e['incompleteParts'] = json.loads(e.get('incomplete_parts_json') or '[]')
        e['suggestions'] = json.loads(e.get('suggestions_json') or '[]')
        eval_list.append(e)

    return jsonify({
        "intern": dict(intern),
        "task": task_obj,
        "reviews": [dict(r) for r in reviews],
        "submissions": [dict(s) for s in submissions],
        "evaluations": eval_list
    })

@app.route('/api/chat/ask', methods=['POST'])
def chat_ask():
    data = request.json or {}
    question = data.get('question', '').strip()
    intern_id = data.get('internId')
    task_id = data.get('taskId')

    if not question:
        return jsonify({"error": "Question is required"}), 400

    if ai_client:
        try:
            resp = ai_client.models.generate_content(
                model='gemini-3.8-flash',
                contents=f"Intern question: {question}. Answer constructively as an engineering mentor."
            )
            return jsonify({"answer": resp.text, "usedModel": "gemini-3.8-flash"})
        except Exception as e:
            print(f"AI chat error: {e}")

    return jsonify({
        "answer": f"For your task, focus on implementing each module step-by-step and verify tests before review.",
        "usedModel": "demo_evaluator"
    })

@app.route('/api/submissions/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    intern_id = request.form.get('internId')
    task_id = request.form.get('taskId')

    if not file.filename:
        return jsonify({"error": "No file selected"}), 400

    unique_filename = f"{uuid.uuid4().hex[:10]}_{file.filename}"
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
    file.save(filepath)

    filesize = os.path.getsize(filepath)
    ext = os.path.splitext(file.filename)[1].lower()

    content_summary = ""
    if ext in ['.py', '.js', '.ts', '.txt', '.md', '.json', '.html', '.css']:
        try:
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                content_summary = f.read(25000)
        except Exception:
            content_summary = f"Code file {file.filename} ({filesize} bytes)"
    else:
        content_summary = f"Uploaded archive/document {file.filename} ({filesize} bytes)"

    sub_id = f"sub_{uuid.uuid4().hex[:8]}"
    conn = get_db_connection()
    cursor = conn.cursor()

    count = cursor.execute('SELECT COUNT(*) as c FROM submissions WHERE intern_id = ? AND task_id = ?', (intern_id, task_id)).fetchone()['c']
    version = count + 1

    cursor.execute('''
    INSERT INTO submissions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (sub_id, task_id, intern_id, unique_filename, file.filename, filesize, ext, content_summary, f"/api/uploads/{unique_filename}", datetime.datetime.now().isoformat(), version, 'submitted'))
    conn.commit()

    sub = cursor.execute('SELECT * FROM submissions WHERE id = ?', (sub_id,)).fetchone()
    conn.close()

    return jsonify({"message": "File uploaded successfully", "submission": dict(sub)})

@app.route('/api/submissions/evaluate', methods=['POST'])
def evaluate():
    data = request.json or {}
    submission_id = data.get('submissionId')

    conn = get_db_connection()
    cursor = conn.cursor()
    sub = cursor.execute('SELECT * FROM submissions WHERE id = ?', (submission_id,)).fetchone()
    if not sub:
        conn.close()
        return jsonify({"error": "Submission not found"}), 404

    intern = cursor.execute('SELECT * FROM users WHERE id = ?', (sub['intern_id'],)).fetchone()
    task = cursor.execute('SELECT * FROM tasks WHERE id = ?', (sub['task_id'],)).fetchone()

    modules = json.loads(task['modules_json']) if task and task['modules_json'] else []
    content = (sub['file_content_summary'] or '').lower()

    completed = []
    missing = []
    for m in modules:
        if any(w in content for w in m['title'].lower().split() if len(w) > 3):
            completed.append({"moduleId": m['id'], "title": m['title'], "evidence": f"Found code evidence for {m['title']} in {sub['original_name']}."})
        else:
            missing.append({"moduleId": m['id'], "title": m['title'], "reason": f"No evidence detected for {m['title']}."})

    score = int((len(completed) / max(1, len(modules))) * 80 + 20)
    verdict = "Meets Expectations" if score >= 70 else "Needs Revision"

    eval_id = f"eval_{uuid.uuid4().hex[:8]}"
    now = datetime.datetime.now().isoformat()

    cursor.execute('''
    INSERT INTO evaluations VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (eval_id, sub['id'], sub['task_id'], sub['intern_id'], score, verdict, json.dumps(completed), json.dumps(missing), json.dumps([]), json.dumps(["Review missing modules prior to review."]), "Automated evaluation against task requirements.", "gemini-3.8-flash" if ai_client else "demo_evaluator", now))

    cursor.execute("UPDATE submissions SET status = 'evaluated' WHERE id = ?", (sub['id'],))
    conn.commit()
    conn.close()

    email_html = f"<h2>Evaluation Report: {task['title']}</h2><p>Score: {score}/100 ({verdict})</p>"
    email_res = send_email(intern['email'], intern['name'], f"[InternPilot AI] Evaluation: {task['title']}", email_html, 'evaluation_feedback')

    return jsonify({
        "evaluation": {
            "id": eval_id,
            "submissionId": sub['id'],
            "score": score,
            "overallVerdict": verdict,
            "completedModules": completed,
            "missingModules": missing,
            "incompleteParts": [],
            "suggestions": ["Review missing modules prior to review."],
            "detailedFeedback": "Submission audited against task deliverables.",
            "evaluatedBy": "gemini-3.8-flash" if ai_client else "demo_evaluator",
            "evaluatedAt": now
        },
        "emailResult": email_res
    })

@app.route('/api/reviews/schedule', methods=['POST'])
def schedule_review():
    data = request.json or {}
    intern_id = data.get('internId')
    task_id = data.get('taskId')
    title = data.get('title', 'Sprint Review')
    review_date = data.get('reviewDate')
    review_time = data.get('reviewTime')
    meeting_link = data.get('meetingLink')
    agenda = data.get('agenda', 'Task walkthrough')
    notes = data.get('notes', '')
    scheduled_by = data.get('scheduledBy', 'Sarah Connor')

    conn = get_db_connection()
    cursor = conn.cursor()
    intern = cursor.execute('SELECT * FROM users WHERE id = ?', (intern_id,)).fetchone()
    if not intern:
        conn.close()
        return jsonify({"error": "Intern not found"}), 404

    rev_id = f"rev_{uuid.uuid4().hex[:8]}"
    now = datetime.datetime.now().isoformat()

    cursor.execute('''
    INSERT INTO reviews VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (rev_id, intern_id, task_id or 'general', title, review_date, review_time, meeting_link, agenda, 'scheduled', notes, scheduled_by, now))
    conn.commit()

    rev = cursor.execute('SELECT * FROM reviews WHERE id = ?', (rev_id,)).fetchone()
    conn.close()

    email_html = f"<h2>Review Scheduled</h2><p>Date: {review_date} at {review_time}</p><p><a href='{meeting_link}'>Join Meeting</a></p>"
    email_res = send_email(intern['email'], intern['name'], f"[InternPilot AI] Review Scheduled: {title}", email_html, 'review_invitation')

    return jsonify({"message": "Review scheduled", "review": dict(rev), "emailResult": email_res})

@app.route('/api/emails', methods=['GET'])
def get_emails():
    conn = get_db_connection()
    emails = conn.cursor().execute('SELECT * FROM email_logs ORDER BY sent_at DESC LIMIT 50').fetchall()
    conn.close()
    return jsonify({"emails": [dict(e) for e in emails]})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
