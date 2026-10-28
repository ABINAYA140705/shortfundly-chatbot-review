import { User, Task, Review, Submission, Evaluation, EmailLog, SystemStatus } from '../types';

async function parseResponse<T>(res: Response, defaultError: string): Promise<T> {
  const contentType = res.headers.get('content-type') || '';
  
  if (!res.ok) {
    if (contentType.includes('application/json')) {
      try {
        const errData = await res.json();
        throw new Error(errData.error || errData.message || `${defaultError} (${res.status})`);
      } catch (e: any) {
        if (e.message && !e.message.includes('Unexpected token') && !e.message.includes('is not valid JSON')) {
          throw e;
        }
      }
    }
    const rawText = await res.text().catch(() => '');
    const cleanSnippet = rawText.replace(/<[^>]*>?/gm, '').trim().slice(0, 120);
    throw new Error(cleanSnippet || `${defaultError} (${res.status} ${res.statusText})`);
  }

  if (contentType.includes('application/json')) {
    try {
      return (await res.json()) as T;
    } catch (e) {
      throw new Error(`Failed to parse JSON response for ${defaultError}`);
    }
  }

  throw new Error(`Expected JSON response from server, but received ${contentType}`);
}

export const api = {
  async getSystemStatus(): Promise<SystemStatus> {
    const res = await fetch('/api/system/status');
    return parseResponse<SystemStatus>(res, 'Failed to fetch system status');
  },

  async getUsers(): Promise<User[]> {
    const res = await fetch('/api/auth/users');
    const data = await parseResponse<{ users: User[] }>(res, 'Failed to fetch users');
    return data.users;
  },

  async login(email: string, password: string): Promise<{ user: User }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return parseResponse<{ user: User }>(res, 'Login failed');
  },

  async getInternDashboard(internId: string): Promise<{
    intern: User;
    task: Task | null;
    reviews: Review[];
    submissions: Submission[];
    evaluations: Evaluation[];
  }> {
    const res = await fetch(`/api/intern/dashboard/${internId}`);
    return parseResponse<{
      intern: User;
      task: Task | null;
      reviews: Review[];
      submissions: Submission[];
      evaluations: Evaluation[];
    }>(res, 'Failed to load intern dashboard');
  },

  async askTaskChatbot(payload: {
    internId: string;
    taskId: string;
    question: string;
    history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  }): Promise<{ answer: string; usedModel: string }> {
    const res = await fetch('/api/chat/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return parseResponse<{ answer: string; usedModel: string }>(res, 'Chat request failed');
  },

  async uploadSubmission(formData: FormData): Promise<{
    message: string;
    submission: Submission;
  }> {
    const res = await fetch('/api/submissions/upload', {
      method: 'POST',
      body: formData,
    });
    return parseResponse<{
      message: string;
      submission: Submission;
    }>(res, 'Submission upload failed');
  },

  async evaluateSubmission(submissionId: string): Promise<{
    evaluation: Evaluation;
    emailResult: {
      success: boolean;
      mode: string;
      message: string;
      emailId: string;
    };
  }> {
    const res = await fetch('/api/submissions/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submissionId }),
    });
    return parseResponse<{
      evaluation: Evaluation;
      emailResult: {
        success: boolean;
        mode: string;
        message: string;
        emailId: string;
      };
    }>(res, 'AI evaluation failed');
  },

  async scheduleReview(payload: {
    internId: string;
    taskId: string;
    title: string;
    reviewDate: string;
    reviewTime: string;
    meetingLink: string;
    agenda: string;
    notes?: string;
    scheduledBy: string;
  }): Promise<{
    message: string;
    review: Review;
    emailResult: any;
  }> {
    const res = await fetch('/api/reviews/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return parseResponse<{
      message: string;
      review: Review;
      emailResult: any;
    }>(res, 'Failed to schedule review');
  },

  async getEmails(): Promise<EmailLog[]> {
    const res = await fetch('/api/emails');
    const data = await parseResponse<{ emails: EmailLog[] }>(res, 'Failed to fetch emails');
    return data.emails;
  },

  async getMentorOverview(): Promise<{
    interns: User[];
    tasks: Task[];
    reviews: Review[];
    submissions: Submission[];
    evaluations: any[];
  }> {
    const res = await fetch('/api/mentor/overview');
    return parseResponse<{
      interns: User[];
      tasks: Task[];
      reviews: Review[];
      submissions: Submission[];
      evaluations: any[];
    }>(res, 'Failed to fetch mentor overview');
  },

  async createTask(payload: any): Promise<{ message: string; task: Task }> {
    const res = await fetch('/api/tasks/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return parseResponse<{ message: string; task: Task }>(res, 'Failed to create task');
  },

  async sendVoiceBriefingEmail(internId: string, taskId: string): Promise<{
    message: string;
    emailResult: any;
    review: Review;
  }> {
    const res = await fetch('/api/voice/send-briefing-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ internId, taskId }),
    });
    return parseResponse<{
      message: string;
      emailResult: any;
      review: Review;
    }>(res, 'Failed to send voice briefing email');
  },

  async clearEmails(): Promise<{ message: string }> {
    const res = await fetch('/api/emails/clear', {
      method: 'POST',
    });
    return parseResponse<{ message: string }>(res, 'Failed to clear emails');
  },
};
