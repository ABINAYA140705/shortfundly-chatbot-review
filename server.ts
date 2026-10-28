import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { db, initDatabase } from './server/db.js';
import { askTaskAssistant, evaluateSubmission, isGeminiConfigured } from './server/gemini.js';
import { sendInternEmail, isSmtpConfigured } from './server/mailer.js';
import crypto from 'crypto';
import JSZip from 'jszip';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize SQLite database
initDatabase();

// Ensure uploads folder exists
const uploadsDir = path.resolve(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage config
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
  fileFilter: (_req, file, cb) => {
    const allowedExtensions = [
      '.pdf', '.docx', '.txt', '.md', '.zip',
      '.py', '.js', '.ts', '.jsx', '.tsx', '.json',
      '.html', '.css', '.java', '.cpp', '.c', '.go', '.rs', '.sql'
    ];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext) || file.mimetype.includes('text') || file.mimetype.includes('json')) {
      cb(null, true);
    } else {
      cb(new Error(`File extension ${ext} is not supported. Please upload PDF, DOCX, TXT, ZIP, or source code files.`));
    }
  },
});

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);
  const isDev = process.env.NODE_ENV !== 'production';

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Serve static uploaded files safely
  app.use('/api/uploads', express.static(uploadsDir));
  app.use('/samples', express.static(path.resolve(__dirname, 'public/samples')));

  // --- API Endpoints ---

  // System Status Check (Gemini & SMTP state)
  app.get('/api/system/status', (_req: Request, res: Response) => {
    res.json({
      geminiConnected: isGeminiConfigured(),
      geminiModel: 'gemini-3.8-flash',
      smtpConnected: isSmtpConfigured(),
      serverTime: new Date().toISOString(),
    });
  });

  // Auth: List users / sample accounts
  app.get('/api/auth/users', (_req: Request, res: Response) => {
    const users = db.prepare('SELECT id, name, email, role, track, avatar FROM users').all();
    res.json({ users });
  });

  // Auth: Login
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email) as any;
    if (!user || user.password !== password) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Return safe user object
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        track: user.track,
        avatar: user.avatar,
      },
    });
  });

  // Intern Dashboard Data
  app.get('/api/intern/dashboard/:internId', (req: Request, res: Response) => {
    const { internId } = req.params;

    const intern = db.prepare('SELECT id, name, email, role, track, avatar FROM users WHERE id = ?').get(internId) as any;
    if (!intern) {
      res.status(404).json({ error: 'Intern not found' });
      return;
    }

    // Get assigned task
    const task = db.prepare('SELECT * FROM tasks WHERE intern_id = ? ORDER BY deadline ASC LIMIT 1').get(internId) as any;
    let modules = [];
    if (task && task.modules_json) {
      try {
        modules = JSON.parse(task.modules_json);
      } catch (e) {
        modules = [];
      }
    }

    // Get reviews
    const reviews = db.prepare('SELECT * FROM reviews WHERE intern_id = ? ORDER BY review_date ASC, review_time ASC').all(internId);

    // Get submissions
    const submissions = db.prepare('SELECT * FROM submissions WHERE intern_id = ? ORDER BY submitted_at DESC').all(internId);

    // Get evaluations
    const evaluations = db.prepare('SELECT * FROM evaluations WHERE intern_id = ? ORDER BY evaluated_at DESC').all(internId);

    res.json({
      intern,
      task: task ? { ...task, modules } : null,
      reviews,
      submissions,
      evaluations: evaluations.map((ev: any) => ({
        ...ev,
        completedModules: JSON.parse(ev.completed_modules_json || '[]'),
        missingModules: JSON.parse(ev.missing_modules_json || '[]'),
        incompleteParts: JSON.parse(ev.incomplete_parts_json || '[]'),
        suggestions: JSON.parse(ev.suggestions_json || '[]'),
      })),
    });
  });

  // AI Task Chatbot Q&A
  app.post('/api/chat/ask', async (req: Request, res: Response) => {
    try {
      const { internId, taskId, question, history } = req.body;
      if (!question) {
        res.status(400).json({ error: 'Question is required' });
        return;
      }

      const intern = db.prepare('SELECT name FROM users WHERE id = ?').get(internId) as any;
      const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId) as any;

      const internName = intern ? intern.name : 'Intern';
      const taskTitle = task ? task.title : 'Assigned Internship Project';
      const taskObjective = task ? task.objective : 'Complete project deliverables';
      const expectedOutput = task ? task.expected_output : 'Working code and tests';
      const deadline = task ? task.deadline : 'Upcoming Review';
      let modules = [];
      if (task && task.modules_json) {
        try {
          modules = JSON.parse(task.modules_json);
        } catch (e) {
          modules = [];
        }
      }

      const result = await askTaskAssistant({
        internName,
        taskTitle,
        taskObjective,
        modules,
        expectedOutput,
        deadline,
        userQuestion: question,
        conversationHistory: history || [],
      });

      res.json(result);
    } catch (err: any) {
      console.error('[API Chat Error]:', err);
      res.status(500).json({ error: err.message || 'Chat assistance failed' });
    }
  });

  // Upload Submission
  app.post('/api/submissions/upload', upload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded or invalid file format' });
        return;
      }

      const { internId, taskId } = req.body;
      if (!internId || !taskId) {
        res.status(400).json({ error: 'internId and taskId are required' });
        return;
      }

      const file = req.file;
      const ext = path.extname(file.originalname).toLowerCase();
      let fileContentSummary = '';

      // Read text content for code, txt, md, json, etc.
      const textExtensions = ['.txt', '.md', '.py', '.js', '.ts', '.jsx', '.tsx', '.json', '.html', '.css', '.java', '.cpp', '.c', '.sql'];
      if (textExtensions.includes(ext)) {
        try {
          fileContentSummary = fs.readFileSync(file.path, 'utf8').slice(0, 30000); // Read up to 30KB
        } catch (readErr) {
          fileContentSummary = `File ${file.originalname} uploaded (${file.size} bytes).`;
        }
      } else if (ext === '.zip') {
        try {
          const zipData = fs.readFileSync(file.path);
          const loadedZip = await JSZip.loadAsync(zipData);
          const fileNames = Object.keys(loadedZip.files);
          let extractedText = `ZIP Archive: ${file.originalname}\nFiles in archive: ${fileNames.join(', ')}\n\n`;
          for (const name of fileNames) {
            const entry = loadedZip.files[name];
            if (!entry.dir && (name.endsWith('.py') || name.endsWith('.js') || name.endsWith('.ts') || name.endsWith('.md') || name.endsWith('.txt') || name.endsWith('.json'))) {
              const text = await entry.async('string');
              extractedText += `--- File: ${name} ---\n${text.slice(0, 8000)}\n\n`;
            }
          }
          fileContentSummary = extractedText.slice(0, 30000);
        } catch (zipErr) {
          fileContentSummary = `ZIP archive: ${file.originalname} (${(file.size / 1024).toFixed(1)} KB). Contains project code and documentation.`;
        }
      } else {
        fileContentSummary = `Document submission: ${file.originalname} (${(file.size / 1024).toFixed(1)} KB, type: ${file.mimetype}). Technical deliverable report.`;
      }

      // Count existing submissions for versioning
      const countRes = db.prepare('SELECT count(*) as count FROM submissions WHERE intern_id = ? AND task_id = ?').get(internId, taskId) as { count: number };
      const version = (countRes?.count || 0) + 1;
      const subId = `sub_${crypto.randomUUID().slice(0, 8)}`;

      db.prepare(`
        INSERT INTO submissions (id, task_id, intern_id, filename, original_name, file_size, file_type, file_content_summary, file_path, submitted_at, version, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        subId,
        taskId,
        internId,
        file.filename,
        file.originalname,
        file.size,
        ext || file.mimetype,
        fileContentSummary,
        `/api/uploads/${file.filename}`,
        new Date().toISOString(),
        version,
        'submitted'
      );

      const submission = db.prepare('SELECT * FROM submissions WHERE id = ?').get(subId);
      res.json({
        message: 'Work submitted successfully!',
        submission,
      });
    } catch (err: any) {
      console.error('[Upload Error]:', err);
      res.status(500).json({ error: err.message || 'File upload failed' });
    }
  });

  // Evaluate Submission with Gemini AI
  app.post('/api/submissions/evaluate', async (req: Request, res: Response) => {
    try {
      const { submissionId } = req.body;
      if (!submissionId) {
        res.status(400).json({ error: 'submissionId is required' });
        return;
      }

      const submission = db.prepare('SELECT * FROM submissions WHERE id = ?').get(submissionId) as any;
      if (!submission) {
        res.status(404).json({ error: 'Submission not found' });
        return;
      }

      const intern = db.prepare('SELECT * FROM users WHERE id = ?').get(submission.intern_id) as any;
      const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(submission.task_id) as any;

      let modules = [];
      if (task && task.modules_json) {
        try {
          modules = JSON.parse(task.modules_json);
        } catch (e) {
          modules = [];
        }
      }

      // Perform rigorous evaluation
      const evalResult = await evaluateSubmission({
        internName: intern?.name || 'Intern',
        taskTitle: task?.title || 'Assigned Task',
        taskObjective: task?.objective || '',
        modules,
        expectedOutput: task?.expected_output || '',
        filename: submission.original_name,
        fileType: submission.file_type,
        fileContent: submission.file_content_summary || '',
      });

      // Save evaluation record to database
      const evalId = `eval_${crypto.randomUUID().slice(0, 8)}`;
      db.prepare(`
        INSERT INTO evaluations (id, submission_id, task_id, intern_id, score, overall_verdict, completed_modules_json, missing_modules_json, incomplete_parts_json, suggestions_json, detailed_feedback, evaluated_by, evaluated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        evalId,
        submission.id,
        submission.task_id,
        submission.intern_id,
        evalResult.score,
        evalResult.overallVerdict,
        JSON.stringify(evalResult.completedModules),
        JSON.stringify(evalResult.missingModules),
        JSON.stringify(evalResult.incompleteParts),
        JSON.stringify(evalResult.suggestions),
        evalResult.detailedFeedback,
        evalResult.evaluatedBy,
        evalResult.evaluatedAt
      );

      // Update submission status
      db.prepare("UPDATE submissions SET status = 'evaluated' WHERE id = ?").run(submission.id);

      // Automatically calculate and schedule the NEXT Rescheduled Review Session
      const nextDate = new Date(Date.now() + 7 * 24 * 3600 * 1000);
      const nextReviewDate = nextDate.toISOString().split('T')[0];
      const nextReviewTime = '14:30';
      const nextMeetingLink = `https://meet.google.com/pil-next-${Math.floor(100 + Math.random() * 900)}`;
      const nextRevId = `rev_${crypto.randomUUID().slice(0, 8)}`;

      // Insert new upcoming scheduled review into reviews table
      db.prepare(`
        INSERT INTO reviews (id, intern_id, task_id, title, review_date, review_time, meeting_link, agenda, status, notes, scheduled_by, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        nextRevId,
        submission.intern_id,
        submission.task_id,
        `Next Rescheduled Milestone Review (Post-Evaluation)`,
        nextReviewDate,
        nextReviewTime,
        nextMeetingLink,
        '1. Discussion of AI Evaluation findings and score breakdown\n2. Review of corrected modules\n3. Sprint 2 progression and next goals',
        'scheduled',
        'Please review the suggestions and bring revised code.',
        'Sarah Connor',
        new Date().toISOString()
      );

      // Automatically send evaluation email to intern (with Next Rescheduled Review Date!)
      const emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <div style="background-color: #1e40af; padding: 16px 20px; border-radius: 6px; margin-bottom: 20px;">
            <h1 style="color: #ffffff; margin: 0; font-size: 20px;">InternPilot AI – Work Evaluation &amp; Rescheduled Review</h1>
          </div>
          <p>Hello <strong>${intern?.name || 'Intern'}</strong>,</p>
          <p>Your submitted work (<strong>${submission.original_name}</strong>) for task "<strong>${task?.title}</strong>" has been audited and evaluated.</p>
          
          <div style="background: #f8fafc; border-left: 4px solid #2563eb; padding: 14px 18px; margin: 18px 0; border-radius: 4px;">
            <p style="margin: 0; font-size: 16px;"><strong>Overall Score:</strong> ${evalResult.score}/100 &bull; <strong>Verdict:</strong> ${evalResult.overallVerdict}</p>
            <p style="margin: 6px 0 0; color: #64748b; font-size: 13px;">Evaluated by: ${evalResult.evaluatedBy} on ${new Date().toLocaleDateString()}</p>
          </div>

          <h3 style="color: #0f172a; margin-top: 20px;">Completed Modules (${evalResult.completedModules.length}):</h3>
          <ul>
            ${evalResult.completedModules.map(m => `<li><strong>${m.title}</strong>: ${m.evidence}</li>`).join('')}
          </ul>

          ${evalResult.missingModules.length > 0 ? `
            <h3 style="color: #dc2626; margin-top: 16px;">Missing Modules (${evalResult.missingModules.length}):</h3>
            <ul>
              ${evalResult.missingModules.map(m => `<li><strong>${m.title}</strong>: ${m.reason}</li>`).join('')}
            </ul>
          ` : '<p style="color: #16a34a;">&check; All required modules have verified code implementation!</p>'}

          <h3 style="color: #0f172a; margin-top: 16px;">Actionable Improvement Suggestions:</h3>
          <ul>
            ${evalResult.suggestions.map(s => `<li>${s}</li>`).join('')}
          </ul>

          <!-- Rescheduled Review Block -->
          <div style="background: #eff6ff; border: 1px solid #bfdbfe; padding: 18px; margin: 20px 0; border-radius: 6px;">
            <h3 style="color: #1e3a8a; margin: 0 0 10px; font-size: 16px;">📅 Next Rescheduled Review Session</h3>
            <p style="margin: 0 0 6px; font-size: 15px;"><strong>Rescheduled Date:</strong> ${nextReviewDate}</p>
            <p style="margin: 0 0 6px; font-size: 15px;"><strong>Time:</strong> ${nextReviewTime}</p>
            <p style="margin: 0 0 10px; font-size: 14px; color: #475569;"><strong>Reviewer:</strong> Sarah Connor (Lead Engineering Mentor)</p>
            <p style="margin: 12px 0 0;">
              <a href="${nextMeetingLink}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: 600; font-size: 14px;">
                Join Rescheduled Review Meeting &rarr;
              </a>
            </p>
            <p style="margin: 8px 0 0; font-size: 12px; color: #64748b;">Meeting Room: ${nextMeetingLink}</p>
          </div>

          <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #64748b;">
            <p>Please review these recommendations and prepare your questions for your next review session.</p>
            <p>InternPilot AI Evaluation System &bull; Mentorship Operations</p>
          </div>
        </div>
      `;

      const emailResult = await sendInternEmail({
        toEmail: intern?.email || 'intern@internpilot.ai',
        toName: intern?.name || 'Intern',
        subject: `[InternPilot AI] Work Feedback Report: ${task?.title} (${evalResult.overallVerdict}) & Next Rescheduled Review: ${nextReviewDate}`,
        html: emailHtml,
        emailType: 'evaluation_feedback',
      });

      res.json({
        evaluation: {
          id: evalId,
          submissionId: submission.id,
          score: evalResult.score,
          overallVerdict: evalResult.overallVerdict,
          completedModules: evalResult.completedModules,
          missingModules: evalResult.missingModules,
          incompleteParts: evalResult.incompleteParts,
          suggestions: evalResult.suggestions,
          detailedFeedback: evalResult.detailedFeedback,
          evaluatedBy: evalResult.evaluatedBy,
          evaluatedAt: evalResult.evaluatedAt,
        },
        nextReview: {
          id: nextRevId,
          review_date: nextReviewDate,
          review_time: nextReviewTime,
          meeting_link: nextMeetingLink,
        },
        emailResult,
      });
    } catch (err: any) {
      console.error('[Evaluation Error]:', err);
      res.status(500).json({ error: err.message || 'Evaluation failed' });
    }
  });

  // Voice Briefing Email Endpoint (First Mail: triggered after voice plays/briefing)
  app.post('/api/voice/send-briefing-email', async (req: Request, res: Response) => {
    try {
      const { internId, taskId } = req.body;
      if (!internId || !taskId) {
        res.status(400).json({ error: 'internId and taskId are required' });
        return;
      }

      const intern = db.prepare('SELECT * FROM users WHERE id = ?').get(internId) as any;
      const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId) as any;
      if (!intern || !task) {
        res.status(404).json({ error: 'Intern or Task not found' });
        return;
      }

      // Find scheduled review for this intern
      let review = db.prepare('SELECT * FROM reviews WHERE intern_id = ? ORDER BY review_date ASC LIMIT 1').get(internId) as any;
      if (!review) {
        const revId = `rev_${crypto.randomUUID().slice(0, 8)}`;
        const reviewDate = '2026-11-06';
        const reviewTime = '14:30';
        const meetingLink = `https://meet.google.com/pil-${intern.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 4)}-${Math.floor(100 + Math.random() * 900)}`;
        db.prepare(`
          INSERT INTO reviews (id, intern_id, task_id, title, review_date, review_time, meeting_link, agenda, status, notes, scheduled_by, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          revId,
          internId,
          taskId,
          'Sprint 1 Mid-Point Evaluation & Code Review',
          reviewDate,
          reviewTime,
          meetingLink,
          '1. Walkthrough of completed task modules\n2. Demonstration of test suite\n3. Review feedback and sprint planning',
          'scheduled',
          'Please ensure code runs locally before meeting.',
          'Sarah Connor',
          new Date().toISOString()
        );
        review = db.prepare('SELECT * FROM reviews WHERE id = ?').get(revId) as any;
      }

      let modules: any[] = [];
      try {
        modules = JSON.parse(task.modules_json || '[]');
      } catch (e) {
        modules = [];
      }

      const emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <div style="background-color: #1e40af; padding: 18px 20px; border-radius: 6px; margin-bottom: 20px;">
            <h1 style="color: #ffffff; margin: 0; font-size: 20px;">InternPilot AI – Task Briefing &amp; Review Schedule</h1>
          </div>
          <p>Hello <strong>${intern.name}</strong>,</p>
          <p>You have listened to the AI voice explanation briefing for: <strong>"${task.title}"</strong>.</p>
          
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px 20px; border-radius: 6px; margin: 18px 0;">
            <h3 style="color: #1e40af; margin-top: 0; font-size: 15px;">Task Objective</h3>
            <p style="margin: 0; color: #334155; line-height: 1.5;">${task.objective}</p>
            
            <h4 style="color: #0f172a; margin-top: 14px; margin-bottom: 6px; font-size: 14px;">Required Deliverable Modules:</h4>
            <ul style="margin: 0; padding-left: 20px; color: #475569; font-size: 13px;">
              ${modules.map((m: any) => `<li><strong>${m.title}</strong>: ${m.description} (${m.weight}% weight)</li>`).join('')}
            </ul>
          </div>

          <div style="background: #eff6ff; border: 1px solid #bfdbfe; padding: 18px; margin: 18px 0; border-radius: 6px;">
            <h3 style="color: #1e3a8a; margin: 0 0 10px; font-size: 16px;">📅 Important Milestone Deadlines &amp; Review Meeting</h3>
            <p style="margin: 0 0 6px; font-size: 15px;"><strong>Submission Deadline:</strong> ${task.deadline}</p>
            <p style="margin: 0 0 6px; font-size: 15px;"><strong>Scheduled Review Date:</strong> ${review.review_date}</p>
            <p style="margin: 0 0 6px; font-size: 15px;"><strong>Scheduled Review Time:</strong> ${review.review_time}</p>
            <p style="margin: 12px 0 0;">
              <a href="${review.meeting_link}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: 600; font-size: 14px;">
                Join Video Meeting &rarr;
              </a>
            </p>
            <p style="margin: 8px 0 0; font-size: 12px; color: #64748b;">Meeting Room: ${review.meeting_link}</p>
          </div>

          <p style="color: #475569; font-size: 13px;">
            Please ensure you upload your code files or project archive on your dashboard before the review date so the AI audit report can be reviewed by your mentor.
          </p>

          <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #64748b;">
            <p>Best regards,<br/><strong>Sarah Connor</strong><br/>Engineering Lead &bull; InternPilot AI Mentorship Hub</p>
          </div>
        </div>
      `;

      const emailResult = await sendInternEmail({
        toEmail: intern.email,
        toName: intern.name,
        subject: `[InternPilot AI] Task Briefing: ${task.title} (Deadline: ${task.deadline} & Review Scheduled: ${review.review_date})`,
        html: emailHtml,
        emailType: 'task_assignment',
      });

      res.json({
        message: 'Voice briefing email dispatched with deadline, scheduled date, and meeting link!',
        emailResult,
        review,
      });
    } catch (err: any) {
      console.error('[Voice Briefing Email Error]:', err);
      res.status(500).json({ error: err.message || 'Failed to dispatch voice briefing email' });
    }
  });

  // Clear all email logs (for recording a fresh video from scratch)
  app.post('/api/emails/clear', (_req: Request, res: Response) => {
    db.prepare('DELETE FROM email_logs').run();
    res.json({ message: 'Email outbox cleared for clean recording take' });
  });

  // Schedule Review & Send Email Notification
  app.post('/api/reviews/schedule', async (req: Request, res: Response) => {
    try {
      const { internId, taskId, title, reviewDate, reviewTime, meetingLink, agenda, notes, scheduledBy } = req.body;
      if (!internId || !reviewDate || !reviewTime || !meetingLink) {
        res.status(400).json({ error: 'internId, reviewDate, reviewTime, and meetingLink are required' });
        return;
      }

      const intern = db.prepare('SELECT * FROM users WHERE id = ?').get(internId) as any;
      const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId) as any;
      if (!intern) {
        res.status(404).json({ error: 'Intern not found' });
        return;
      }

      const revId = `rev_${crypto.randomUUID().slice(0, 8)}`;
      const now = new Date().toISOString();

      db.prepare(`
        INSERT INTO reviews (id, intern_id, task_id, title, review_date, review_time, meeting_link, agenda, status, notes, scheduled_by, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        revId,
        internId,
        taskId || (task ? task.id : 'general'),
        title || 'Sprint Evaluation Review',
        reviewDate,
        reviewTime,
        meetingLink,
        agenda || 'Task progress walkthrough, code review, and feedback.',
        'scheduled',
        notes || '',
        scheduledBy || 'Sarah Connor',
        now
      );

      // Construct and dispatch email
      const emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <div style="background-color: #1e40af; padding: 16px 20px; border-radius: 6px; margin-bottom: 20px;">
            <h1 style="color: #ffffff; margin: 0; font-size: 20px;">InternPilot AI – Review Meeting Scheduled</h1>
          </div>
          <p>Hello <strong>${intern.name}</strong>,</p>
          <p>A new milestone review has been scheduled with your mentor <strong>${scheduledBy || 'Sarah Connor'}</strong>.</p>
          
          <div style="background: #eff6ff; border: 1px solid #bfdbfe; padding: 18px; margin: 18px 0; border-radius: 6px;">
            <p style="margin: 0 0 8px; font-size: 15px;"><strong>Date:</strong> ${reviewDate}</p>
            <p style="margin: 0 0 8px; font-size: 15px;"><strong>Time:</strong> ${reviewTime}</p>
            <p style="margin: 0 0 8px; font-size: 15px;"><strong>Task:</strong> ${task ? task.title : 'General Internship Milestone'}</p>
            <p style="margin: 12px 0 0;">
              <a href="${meetingLink}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 10px 18px; border-radius: 6px; font-weight: 500;">
                Join Video Meeting &rarr;
              </a>
            </p>
          </div>

          <h3 style="color: #0f172a; margin-top: 18px;">Meeting Agenda:</h3>
          <p style="color: #334155; white-space: pre-line;">${agenda || 'Code walkthrough and Q&A.'}</p>

          ${notes ? `<h3 style="color: #0f172a; margin-top: 18px;">Mentor Notes:</h3><p style="color: #334155;">${notes}</p>` : ''}

          <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #64748b;">
            <p>Remember to submit your latest source code files through the InternPilot AI portal before this review.</p>
          </div>
        </div>
      `;

      const emailResult = await sendInternEmail({
        toEmail: intern.email,
        toName: intern.name,
        subject: `[InternPilot AI] Review Scheduled: ${title || 'Sprint Evaluation'} on ${reviewDate} at ${reviewTime}`,
        html: emailHtml,
        emailType: 'review_invitation',
      });

      const newReview = db.prepare('SELECT * FROM reviews WHERE id = ?').get(revId);

      res.json({
        message: 'Review successfully scheduled!',
        review: newReview,
        emailResult,
      });
    } catch (err: any) {
      console.error('[Schedule Review Error]:', err);
      res.status(500).json({ error: err.message || 'Failed to schedule review' });
    }
  });

  // Get Email Outbox logs (for interactive outbox drawer/modal)
  app.get('/api/emails', (_req: Request, res: Response) => {
    const logs = db.prepare('SELECT * FROM email_logs ORDER BY sent_at DESC LIMIT 50').all();
    res.json({ emails: logs });
  });

  // Mentor View: Get all interns and tasks
  app.get('/api/mentor/overview', (_req: Request, res: Response) => {
    const interns = db.prepare("SELECT id, name, email, role, track, avatar FROM users WHERE role = 'intern'").all();
    const tasks = db.prepare('SELECT * FROM tasks').all();
    const reviews = db.prepare('SELECT * FROM reviews ORDER BY review_date ASC').all();
    const submissions = db.prepare('SELECT * FROM submissions ORDER BY submitted_at DESC LIMIT 20').all();
    const evaluations = db.prepare('SELECT * FROM evaluations ORDER BY evaluated_at DESC LIMIT 20').all();

    res.json({
      interns,
      tasks: tasks.map((t: any) => ({
        ...t,
        modules: JSON.parse(t.modules_json || '[]'),
      })),
      reviews,
      submissions,
      evaluations,
    });
  });

  // Create or Update Task (Mentor)
  app.post('/api/tasks/create', (req: Request, res: Response) => {
    try {
      const { internId, title, category, description, objective, expectedOutput, deadline, priority, modules, mentorNotes } = req.body;
      if (!internId || !title || !objective || !deadline) {
        res.status(400).json({ error: 'internId, title, objective, and deadline are required' });
        return;
      }

      const taskId = `tsk_${crypto.randomUUID().slice(0, 8)}`;
      db.prepare(`
        INSERT INTO tasks (id, intern_id, title, category, description, objective, expected_output, deadline, priority, modules_json, mentor_notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        taskId,
        internId,
        title,
        category || 'Engineering',
        description || title,
        objective,
        expectedOutput || 'Runnable project and tests',
        deadline,
        priority || 'High',
        JSON.stringify(modules || []),
        mentorNotes || ''
      );

      const created = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId) as any;
      res.json({
        message: 'Task created successfully',
        task: { ...created, modules: JSON.parse(created.modules_json || '[]') },
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to create task' });
    }
  });

  // Alias /sample-submissions to public/samples for compatibility
  app.use('/sample-submissions', express.static(path.resolve(__dirname, 'public/samples')));

  // Ensure any unmatched /api/* requests return JSON 404 and never fall through to Vite HTML
  app.all('/api/*', (req: Request, res: Response) => {
    res.status(404).json({ error: `API endpoint not found: ${req.method} ${req.originalUrl}` });
  });

  // Global JSON Error Handler (Prevents Express default HTML error page from breaking client fetch)
  app.use((err: any, _req: Request, res: Response, _next: any) => {
    console.error('[Global Express Error]:', err);
    if (res.headersSent) return;
    const statusCode = typeof err.status === 'number' ? err.status : 500;
    res.status(statusCode).json({
      error: err.message || 'Internal Server Error',
    });
  });

  // Mount Vite development middlewares in dev mode, or serve static dist in prod
  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[InternPilot AI] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('[Server Start Failed]:', err);
  process.exit(1);
});
