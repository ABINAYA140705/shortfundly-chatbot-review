export interface User {
  id: string;
  name: string;
  email: string;
  role: 'intern' | 'mentor' | 'admin';
  track: string;
  avatar?: string;
}

export interface TaskModule {
  id: string;
  title: string;
  description: string;
  required: boolean;
  weight: number;
}

export interface Task {
  id: string;
  intern_id: string;
  title: string;
  category: string;
  description: string;
  objective: string;
  expected_output: string;
  deadline: string;
  priority: 'High' | 'Medium' | 'Low';
  modules: TaskModule[];
  mentor_notes?: string;
}

export interface Submission {
  id: string;
  task_id: string;
  intern_id: string;
  filename: string;
  original_name: string;
  file_size: number;
  file_type: string;
  file_content_summary?: string;
  file_path: string;
  submitted_at: string;
  version: number;
  status: 'submitted' | 'evaluated' | 'revision_requested';
}

export interface EvaluationModuleResult {
  moduleId: string;
  title: string;
  evidence?: string;
  reason?: string;
}

export interface IncompletePart {
  component: string;
  issue: string;
}

export interface Evaluation {
  id: string;
  submission_id?: string;
  submissionId?: string;
  task_id?: string;
  intern_id?: string;
  score: number;
  overall_verdict?: string;
  overallVerdict?: string;
  completed_modules_json?: string;
  missing_modules_json?: string;
  incomplete_parts_json?: string;
  suggestions_json?: string;
  completedModules: Array<{ moduleId: string; title: string; evidence: string }>;
  missingModules: Array<{ moduleId: string; title: string; reason: string }>;
  incompleteParts: IncompletePart[];
  suggestions: string[];
  detailed_feedback?: string;
  detailedFeedback?: string;
  evaluated_by?: string;
  evaluatedBy?: string;
  evaluated_at?: string;
  evaluatedAt?: string;
}

export interface Review {
  id: string;
  intern_id: string;
  task_id: string;
  title: string;
  review_date: string;
  review_time: string;
  meeting_link: string;
  agenda: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  scheduled_by: string;
  updated_at: string;
}

export interface EmailLog {
  id: string;
  recipient_email: string;
  recipient_name: string;
  subject: string;
  body_html: string;
  email_type: string;
  sent_via: 'smtp' | 'demo_mode';
  status: 'delivered' | 'demo_logged' | 'failed';
  error_message?: string | null;
  sent_at: string;
}

export interface SystemStatus {
  geminiConnected: boolean;
  geminiModel: string;
  smtpConnected: boolean;
  serverTime: string;
}
