"""
InternPilot AI Partial Draft Submission
Intern: Alex Rivera
Task: Implement Secure User Authentication & Role-Based Access Control

STATUS NOTE:
- Implemented simple user login and SQLite table draft.
- Incomplete: RBAC middleware not written yet.
- Incomplete: No automated test suite included.
"""

import sqlite3

def init_db():
    conn = sqlite3.connect("partial.sqlite")
    conn.execute("CREATE TABLE IF NOT EXISTS users (email TEXT, password TEXT);")
    conn.commit()
    conn.close()

def simple_login(email, password):
    # Draft implementation without hashing or token expiration
    conn = sqlite3.connect("partial.sqlite")
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ? AND password = ?", (email, password))
    user = cursor.fetchone()
    conn.close()
    if user:
        return {"status": "ok", "email": email}
    return {"status": "failed"}

# TODO: Add bcrypt password hashing
# TODO: Add JWT token refresh
# TODO: Implement Role-Based Access Control Middleware (RBAC)
# TODO: Write unit tests
