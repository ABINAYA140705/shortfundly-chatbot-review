import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.resolve(process.cwd(), 'database.sqlite');
export const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

export function initDatabase() {
  // Ensure tables exist
  db.exec(`
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
  `);

  // Seed initial users if empty
  const userCount = db.prepare('SELECT count(*) as count FROM users').get() as { count: number };
  if (userCount.count === 0) {
    seedInitialData();
  }
}

function seedInitialData() {
  const insertUser = db.prepare(`
    INSERT INTO users (id, name, email, password, role, track, avatar)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertTask = db.prepare(`
    INSERT INTO tasks (id, intern_id, title, category, description, objective, expected_output, deadline, priority, modules_json, mentor_notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertReview = db.prepare(`
    INSERT INTO reviews (id, intern_id, task_id, title, review_date, review_time, meeting_link, agenda, status, notes, scheduled_by, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertEmail = db.prepare(`
    INSERT INTO email_logs (id, recipient_email, recipient_name, subject, body_html, email_type, sent_via, status, error_message, sent_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // 1. Mentor
  insertUser.run(
    'usr_mentor_01',
    'Sarah Connor',
    'mentor@internpilot.ai',
    'mentor123',
    'mentor',
    'Engineering Lead & Internship Director',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
  );

  // 2. Intern Alex Rivera (Full-Stack)
  insertUser.run(
    'usr_alex_01',
    'Alex Rivera',
    'alex@internpilot.ai',
    'intern123',
    'intern',
    'Full-Stack Engineering',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  );

  // 3. Intern Maya Chen (Frontend UI/UX)
  insertUser.run(
    'usr_maya_02',
    'Maya Chen',
    'maya@internpilot.ai',
    'intern123',
    'intern',
    'Frontend & Product UI',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80'
  );

  // 4. Intern Liam Patel (Data & Machine Learning)
  insertUser.run(
    'usr_liam_03',
    'Liam Patel',
    'liam@internpilot.ai',
    'intern123',
    'intern',
    'Data Science & ML Pipelines',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
  );

  // Task for Alex Rivera
  const alexModules = [
    {
      id: 'mod-1',
      title: 'User Registration & Authentication Endpoint',
      description: 'Implement JWT or session-based authentication with bcrypt password hashing and token refresh.',
      required: true,
      weight: 25
    },
    {
      id: 'mod-2',
      title: 'Role-Based Access Control Middleware (RBAC)',
      description: 'Build middleware restricting routes for admin, mentor, and intern roles with proper 403 Forbidden responses.',
      required: true,
      weight: 25
    },
    {
      id: 'mod-3',
      title: 'Secure SQLite Database Schema & Migrations',
      description: 'Define relational schema for Users, Roles, and Audit logs with unique constraints and indexed emails.',
      required: true,
      weight: 25
    },
    {
      id: 'mod-4',
      title: 'Automated Unit Tests & Integration Tests',
      description: 'Write unit tests covering positive login, invalid password attempts, and expired token rejection with >80% coverage.',
      required: true,
      weight: 25
    }
  ];

  insertTask.run(
    'tsk_alex_auth_01',
    'usr_alex_01',
    'Implement Secure User Authentication & Role-Based Access Control',
    'Backend & Security',
    'Develop an enterprise-grade authentication service supporting secure password hashing, token issuance, and role-based permissions for users, interns, and mentors.',
    'Build a robust authentication module with RBAC middleware to ensure endpoints are protected based on user role. Include test coverage for security edge cases.',
    'A documented API endpoint collection or runnable source code package with auth routes, role middleware, database models, and passing test suite.',
    '2026-11-05',
    'High',
    JSON.stringify(alexModules),
    'Focus on clean error handling. Never return raw stack traces or database errors in auth responses.'
  );

  // Review for Alex
  insertReview.run(
    'rev_alex_01',
    'usr_alex_01',
    'tsk_alex_auth_01',
    'Sprint 1 Mid-Point Evaluation & Code Review',
    '2026-11-06',
    '14:30',
    'https://meet.google.com/pil-intr-abc',
    '1. Walkthrough of JWT auth implementation\n2. Demonstration of RBAC middleware\n3. Review test suite coverage and error cases\n4. Feedback and Sprint 2 planning',
    'scheduled',
    'Please come prepared with your test suite running locally.',
    'Sarah Connor',
    new Date().toISOString()
  );

  // Task for Maya Chen
  const mayaModules = [
    {
      id: 'mod-1',
      title: 'Responsive Metric KPI Cards',
      description: 'Create responsive KPI metric tiles displaying active users, conversion rate, and revenue with trend indicators.',
      required: true,
      weight: 30
    },
    {
      id: 'mod-2',
      title: 'Interactive Filter Controls',
      description: 'Provide date range pickers (Last 7 Days, 30 Days, YTD) and category multi-select dropdowns.',
      required: true,
      weight: 35
    },
    {
      id: 'mod-3',
      title: 'Accessible Chart Visualizations',
      description: 'Render interactive area charts and bar charts with accessible tooltips and mobile pinch-zoom support.',
      required: true,
      weight: 35
    }
  ];

  insertTask.run(
    'tsk_maya_dash_02',
    'usr_maya_02',
    'Build Responsive Analytics Dashboard with Chart Filters',
    'Frontend & UI/UX',
    'Design and build a polished executive analytics dashboard with responsive cards, dynamic charting, and date-range filtering.',
    'Deliver a lightweight, highly responsive analytics dashboard satisfying accessibility WCAG AA standards and fast rendering.',
    'React components, CSS module/Tailwind layout, and mock analytics dataset with interactive filtering.',
    '2026-11-08',
    'Medium',
    JSON.stringify(mayaModules),
    'Ensure colors have high contrast and charts resize smoothly without overflowing on mobile.'
  );

  // Review for Maya
  insertReview.run(
    'rev_maya_01',
    'usr_maya_02',
    'tsk_maya_dash_02',
    'UI/UX Architecture & Component Review',
    '2026-11-09',
    '11:00',
    'https://meet.google.com/pil-maya-ux',
    '1. Mobile responsiveness inspection\n2. Chart rendering performance\n3. Filter state synchronization',
    'scheduled',
    'Be ready to share screen on both desktop and mobile viewports.',
    'Sarah Connor',
    new Date().toISOString()
  );

  // Task for Liam Patel
  const liamModules = [
    {
      id: 'mod-1',
      title: 'Data Cleaning & Feature Engineering Pipeline',
      description: 'Handle missing values, encode categorical variables, and generate engagement trend features.',
      required: true,
      weight: 30
    },
    {
      id: 'mod-2',
      title: 'Model Training & Hyperparameter Tuning',
      description: 'Train Random Forest and XGBoost classifiers with cross-validation and compute ROC-AUC and F1 scores.',
      required: true,
      weight: 40
    },
    {
      id: 'mod-3',
      title: 'Inference API & Prediction Explainability',
      description: 'Expose a REST endpoint returning churn probability along with top SHAP feature contributions.',
      required: true,
      weight: 30
    }
  ];

  insertTask.run(
    'tsk_liam_ml_03',
    'usr_liam_03',
    'Customer Churn Prediction Model Pipeline & API',
    'Data Science & ML',
    'Develop an end-to-end churn prediction pipeline from tabular customer logs to a deployable inference microservice.',
    'Deliver high-performing classification pipeline (>0.82 ROC-AUC) with feature importance attribution and clean API.',
    'Jupyter notebook or Python package with data pipeline, model weights, and FastAPI/Flask serving script.',
    '2026-11-12',
    'High',
    JSON.stringify(liamModules),
    'Document baseline accuracy comparisons and precision/recall trade-offs.'
  );

  insertReview.run(
    'rev_liam_01',
    'usr_liam_03',
    'tsk_liam_ml_03',
    'Model Evaluation & Pipeline Architecture Review',
    '2026-11-13',
    '16:00',
    'https://meet.google.com/pil-liam-ds',
    '1. Cross-validation results review\n2. SHAP explainability insights\n3. Latency benchmarks for inference',
    'scheduled',
    'Please bring confusion matrix plots and ROC curves.',
    'Sarah Connor',
    new Date().toISOString()
  );

  // Email logs start empty so the user can generate Email #1 via Voice Briefing and Email #2 via Work Submission
}
