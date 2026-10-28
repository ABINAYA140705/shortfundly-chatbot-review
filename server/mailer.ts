import nodemailer from 'nodemailer';
import { db } from './db.js';
import crypto from 'crypto';

export interface EmailPayload {
  toEmail: string;
  toName: string;
  subject: string;
  html: string;
  emailType: 'review_invitation' | 'evaluation_feedback' | 'task_assignment' | 'general';
}

export interface EmailResult {
  success: boolean;
  mode: 'smtp' | 'demo_mode';
  message: string;
  emailId: string;
}

export function isSmtpConfigured(): boolean {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  if (!host || !user || !pass) return false;
  if (user === 'your-email@gmail.com' || pass === 'your-app-password-or-secret' || user.includes('example.com') || host === 'smtp.example.com') {
    return false;
  }
  return true;
}

export async function sendInternEmail(payload: EmailPayload): Promise<EmailResult> {
  const emailId = `eml_${crypto.randomUUID().slice(0, 8)}`;
  const now = new Date().toISOString();
  const smtpActive = isSmtpConfigured();

  if (smtpActive) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true',
        connectionTimeout: 2500,
        greetingTimeout: 2500,
        socketTimeout: 3000,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: process.env.SMTP_FROM || `"InternPilot AI" <${process.env.SMTP_USER}>`,
        to: `"${payload.toName}" <${payload.toEmail}>`,
        subject: payload.subject,
        html: payload.html,
      });

      // Save to database as delivered via SMTP
      db.prepare(`
        INSERT INTO email_logs (id, recipient_email, recipient_name, subject, body_html, email_type, sent_via, status, error_message, sent_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        emailId,
        payload.toEmail,
        payload.toName,
        payload.subject,
        payload.html,
        payload.emailType,
        'smtp',
        'delivered',
        null,
        now
      );

      return {
        success: true,
        mode: 'smtp',
        message: `Email successfully delivered to ${payload.toEmail} via configured SMTP server.`,
        emailId,
      };
    } catch (err: any) {
      console.error('[SMTP Delivery Failed]:', err);

      // Save failed record
      db.prepare(`
        INSERT INTO email_logs (id, recipient_email, recipient_name, subject, body_html, email_type, sent_via, status, error_message, sent_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        emailId,
        payload.toEmail,
        payload.toName,
        payload.subject,
        payload.html,
        payload.emailType,
        'smtp',
        'failed',
        err.message || 'SMTP transmission error',
        now
      );

      return {
        success: false,
        mode: 'smtp',
        message: `SMTP connection failed: ${err.message || 'Unknown error'}. Logged to Outbox for inspection.`,
        emailId,
      };
    }
  } else {
    // Demo Mode: Record with clear "demo_mode" indicator and status "demo_logged"
    db.prepare(`
      INSERT INTO email_logs (id, recipient_email, recipient_name, subject, body_html, email_type, sent_via, status, error_message, sent_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      emailId,
      payload.toEmail,
      payload.toName,
      payload.subject,
      payload.html,
      payload.emailType,
      'demo_mode',
      'demo_logged',
      'Email was not dispatched to external inbox because SMTP credentials are unconfigured. Saved to interactive Email Outbox.',
      now
    );

    return {
      success: true,
      mode: 'demo_mode',
      message: `Demo Mode Active: External email was NOT sent (no SMTP credentials). Full email generated and recorded in the Email Outbox.`,
      emailId,
    };
  }
}
