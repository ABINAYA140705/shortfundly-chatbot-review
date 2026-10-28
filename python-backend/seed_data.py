import json
import datetime
from models import get_db_connection, init_db

def seed():
    init_db()
    conn = get_db_connection()
    cursor = conn.cursor()

    # Check if seeded
    cursor.execute('SELECT COUNT(*) as count FROM users')
    if cursor.fetchone()['count'] > 0:
        print('Database already contains seed data.')
        conn.close()
        return

    print('Seeding database with sample interns, tasks, and reviews...')

    # Users
    users = [
        ('usr_mentor_01', 'Sarah Connor', 'mentor@internpilot.ai', 'mentor123', 'mentor', 'Engineering Lead & Internship Director', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'),
        ('usr_alex_01', 'Alex Rivera', 'alex@internpilot.ai', 'intern123', 'intern', 'Full-Stack Engineering', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'),
        ('usr_maya_02', 'Maya Chen', 'maya@internpilot.ai', 'intern123', 'intern', 'Frontend & Product UI', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150'),
        ('usr_liam_03', 'Liam Patel', 'liam@internpilot.ai', 'intern123', 'intern', 'Data Science & ML Pipelines', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'),
    ]
    cursor.executemany('INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, ?)', users)

    # Alex Task
    alex_modules = [
        {'id': 'mod-1', 'title': 'User Registration & Authentication Endpoint', 'description': 'Implement JWT auth with bcrypt password hashing and token refresh.', 'required': True, 'weight': 25},
        {'id': 'mod-2', 'title': 'Role-Based Access Control Middleware (RBAC)', 'description': 'Build middleware restricting routes for admin, mentor, and intern roles.', 'required': True, 'weight': 25},
        {'id': 'mod-3', 'title': 'Secure SQLite Database Schema & Migrations', 'description': 'Define relational schema with unique constraints and indexed emails.', 'required': True, 'weight': 25},
        {'id': 'mod-4', 'title': 'Automated Unit Tests & Integration Tests', 'description': 'Write unit tests covering positive login, invalid password attempts, and expired tokens.', 'required': True, 'weight': 25},
    ]

    cursor.execute('''
    INSERT INTO tasks VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        'tsk_alex_auth_01',
        'usr_alex_01',
        'Implement Secure User Authentication & Role-Based Access Control',
        'Backend & Security',
        'Develop an enterprise authentication service supporting password hashing, token issuance, and role permissions.',
        'Build a robust authentication module with RBAC middleware and test coverage for security edge cases.',
        'API endpoint collection or runnable source code with auth routes, role middleware, and passing test suite.',
        '2026-11-05',
        'High',
        json.dumps(alex_modules),
        'Focus on clean error handling. Never return raw stack traces in responses.'
    ))

    # Alex Review
    cursor.execute('''
    INSERT INTO reviews VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        'rev_alex_01',
        'usr_alex_01',
        'tsk_alex_auth_01',
        'Sprint 1 Mid-Point Evaluation & Code Review',
        '2026-11-06',
        '14:30',
        'https://meet.google.com/pil-intr-abc',
        '1. Walkthrough of JWT auth\n2. Demonstration of RBAC middleware\n3. Review test coverage',
        'scheduled',
        'Please have test suite running locally.',
        'Sarah Connor',
        datetime.datetime.now().isoformat()
    ))

    conn.commit()
    conn.close()
    print('Seeding completed successfully!')

if __name__ == '__main__':
    seed()
