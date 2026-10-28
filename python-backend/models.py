import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'database.sqlite')

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.executescript('''
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'intern',
        track TEXT NOT NULL,
        avatar TEXT
    );

    CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        intern_id TEXT NOT NULL,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT NOT NULL,
        objective TEXT NOT NULL,
        expected_output TEXT NOT NULL,
        deadline TEXT NOT NULL,
        priority TEXT NOT NULL DEFAULT 'High',
        modules_json TEXT NOT NULL,
        mentor_notes TEXT,
        FOREIGN KEY (intern_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS submissions (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL,
        intern_id TEXT NOT NULL,
        filename TEXT NOT NULL,
        original_name TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        file_type TEXT NOT NULL,
        file_content_summary TEXT,
        file_path TEXT NOT NULL,
        submitted_at TEXT NOT NULL,
        version INTEGER NOT NULL DEFAULT 1,
        status TEXT NOT NULL DEFAULT 'submitted',
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (intern_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS evaluations (
        id TEXT PRIMARY KEY,
        submission_id TEXT NOT NULL,
        task_id TEXT NOT NULL,
        intern_id TEXT NOT NULL,
        score INTEGER NOT NULL,
        overall_verdict TEXT NOT NULL,
        completed_modules_json TEXT NOT NULL,
        missing_modules_json TEXT NOT NULL,
        incomplete_parts_json TEXT NOT NULL,
        suggestions_json TEXT NOT NULL,
        detailed_feedback TEXT NOT NULL,
        evaluated_by TEXT NOT NULL,
        evaluated_at TEXT NOT NULL,
        FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (intern_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reviews (
        id TEXT PRIMARY KEY,
        intern_id TEXT NOT NULL,
        task_id TEXT NOT NULL,
        title TEXT NOT NULL,
        review_date TEXT NOT NULL,
        review_time TEXT NOT NULL,
        meeting_link TEXT NOT NULL,
        agenda TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'scheduled',
        notes TEXT,
        scheduled_by TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (intern_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS email_logs (
        id TEXT PRIMARY KEY,
        recipient_email TEXT NOT NULL,
        recipient_name TEXT NOT NULL,
        subject TEXT NOT NULL,
        body_html TEXT NOT NULL,
        email_type TEXT NOT NULL,
        sent_via TEXT NOT NULL,
        status TEXT NOT NULL,
        error_message TEXT,
        sent_at TEXT NOT NULL
    );
    ''')
    conn.commit()
    conn.close()
