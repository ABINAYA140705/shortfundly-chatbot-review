import React, { useState, useEffect } from 'react';
import { User, Task, Review, Submission, Evaluation, EmailLog, SystemStatus } from './types';
import { api } from './services/api';
import { Navbar } from './components/Navbar';
import { LoginView } from './components/LoginView';
import { VoiceExplanationPlayer } from './components/VoiceExplanationPlayer';
import { TaskOverviewCard } from './components/TaskOverviewCard';
import { ChatAssistant } from './components/ChatAssistant';
import { WorkSubmissionCard } from './components/WorkSubmissionCard';
import { EvaluationReportCard } from './components/EvaluationReportCard';
import { ReviewScheduleCard } from './components/ReviewScheduleCard';
import { ScheduleReviewModal } from './components/ScheduleReviewModal';
import { SubmissionHistoryCard } from './components/SubmissionHistoryCard';
import { MentorPortal } from './components/MentorPortal';
import { EmailOutboxModal } from './components/EmailOutboxModal';
import { EmailCenterView } from './components/EmailCenterView';
import { LocalSetupGuideModal } from './components/LocalSetupGuideModal';
import { ReviewSummaryModal } from './components/ReviewSummaryModal';
import {
  Sparkles,
  BookOpen,
  Mail,
  Calendar,
  CheckCircle2,
  Clock,
  Layers,
  Bot,
  Upload,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  AlertCircle,
  Eye,
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [sampleUsers, setSampleUsers] = useState<User[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);

  // Intern Dashboard Data
  const [task, setTask] = useState<Task | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [latestEvaluation, setLatestEvaluation] = useState<Evaluation | null>(null);

  // All Emails for outbox modal
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);

  // UI state
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'info' | 'error'; message: string } | null>(null);

  // Modals
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isOutboxOpen, setIsOutboxOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isReviewSummaryOpen, setIsReviewSummaryOpen] = useState(false);
  const [initialPageMessage, setInitialPageMessage] = useState<string | null>(null);
  const [activeChatTopic, setActiveChatTopic] = useState<string | undefined>(undefined);

  // Active view for intern: 'overview' | 'chat' | 'submit' | 'reviews'
  const [activeTab, setActiveTab] = useState<'all' | 'task' | 'submit' | 'chat'>('all');

  // Screen view mode: 'workspace' | 'email_center'
  const [viewMode, setViewMode] = useState<'workspace' | 'email_center'>('workspace');

  // Load initial users and system state
  useEffect(() => {
    async function init() {
      try {
        const [users, status, emails] = await Promise.all([
          api.getUsers(),
          api.getSystemStatus(),
          api.getEmails(),
        ]);

        setSampleUsers(users);
        setSystemStatus(status);
        setEmailLogs(emails);

        // Auto-login Alex Rivera (intern) by default for smooth exploration, or allow login
        const defaultIntern = users.find(u => u.role === 'intern');
        if (defaultIntern) {
          setCurrentUser(defaultIntern);
          await loadInternData(defaultIntern.id);
        }
      } catch (err) {
        console.error('Initialization error:', err);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, []);

  const loadInternData = async (internId: string) => {
    try {
      const data = await api.getInternDashboard(internId);
      setTask(data.task);
      setReviews(data.reviews || []);
      setSubmissions(data.submissions || []);
      setEvaluations(data.evaluations || []);
      setLatestEvaluation(data.evaluations?.[0] || null);

      // Refresh email logs
      const updatedEmails = await api.getEmails();
      setEmailLogs(updatedEmails);
    } catch (err) {
      console.error('Failed to load intern data:', err);
    }
  };

  const handleLogin = async (email: string, pass: string) => {
    try {
      setAuthError(null);
      const res = await api.login(email, pass);
      setCurrentUser(res.user);
      if (res.user.role === 'intern') {
        await loadInternData(res.user.id);
      }
      showNotification('success', `Welcome back, ${res.user.name}!`);
    } catch (err: any) {
      setAuthError(err.message || 'Login failed');
    }
  };

  const handleSwitchUser = async (user: User) => {
    setCurrentUser(user);
    if (user.role === 'intern') {
      await loadInternData(user.id);
    }
    showNotification('info', `Switched workspace to ${user.name} (${user.role.toUpperCase()})`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const showNotification = (type: 'success' | 'info' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const handleSubmissionSuccess = async (newSubmission: Submission) => {
    setSubmissions(prev => [newSubmission, ...prev]);
    showNotification('success', `Work submitted: ${newSubmission.original_name}. Ready for AI audit!`);
  };

  const handleTriggerEvaluation = async (submissionId: string) => {
    setIsEvaluating(true);
    try {
      const res = await api.evaluateSubmission(submissionId);
      setLatestEvaluation(res.evaluation);
      setEvaluations(prev => [res.evaluation, ...prev.filter(e => e.id !== res.evaluation.id)]);

      // Add rescheduled review session to reviews state
      if ((res as any).nextReview) {
        setReviews(prev => [(res as any).nextReview, ...prev]);
      }

      // Update submissions status in state
      setSubmissions(prev =>
        prev.map(s => (s.id === submissionId ? { ...s, status: 'evaluated' } : s))
      );

      // Refresh emails
      const emails = await api.getEmails();
      setEmailLogs(emails);

      showNotification(
        'success',
        `AI Evaluation Complete! Score: ${res.evaluation.score}/100. Feedback report & next review emailed to intern.`
      );

      // ALWAYS show the Review Summary after the review!
      setIsReviewSummaryOpen(true);
    } catch (err: any) {
      console.error(err);
      showNotification('error', err.message || 'AI evaluation failed');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleReturnToInitialPage = () => {
    setIsReviewSummaryOpen(false);
    const scoreVal = latestEvaluation?.score ?? 92;
    const verdictVal =
      latestEvaluation?.overall_verdict ||
      latestEvaluation?.overallVerdict ||
      'Meets Expectations';
    setInitialPageMessage(
      `Review session completed and summary recorded! Score: ${scoreVal}/100 (${verdictVal}). Dispatched emails are preserved in the Email Outbox for your video recording.`
    );
    setCurrentUser(null);
  };

  const handleReviewScheduled = async (newReview: Review) => {
    setReviews(prev => [newReview, ...prev]);
    const emails = await api.getEmails();
    setEmailLogs(emails);
    showNotification('success', `Review scheduled for ${newReview.review_date} at ${newReview.review_time}!`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center animate-bounce shadow-lg">
            <Sparkles className="w-6 h-6" />
          </div>
          <span className="text-sm font-semibold text-slate-700">Loading InternPilot AI...</span>
        </div>
      </div>
    );
  }

  // Dedicated Full-Page Email Center View (Accessible both logged in and logged out)
  if (viewMode === 'email_center') {
    return (
      <EmailCenterView
        emails={emailLogs}
        onBack={() => setViewMode('workspace')}
        onLoginAsIntern={() => {
          const intern = sampleUsers.find(u => u.role === 'intern') || sampleUsers[1];
          if (intern) handleSwitchUser(intern);
          setViewMode('workspace');
        }}
        onRefresh={async () => {
          const fresh = await api.getEmails();
          setEmailLogs(fresh);
        }}
        onClearEmails={async () => {
          await api.clearEmails();
          const fresh = await api.getEmails();
          setEmailLogs(fresh);
          showNotification('info', 'Email outbox cleared to 0 emails. Ready for video recording take!');
        }}
        currentUser={currentUser}
      />
    );
  }

  // If no user is logged in, show Login view with Outbox Hub trigger and Review Summary modal support
  if (!currentUser) {
    return (
      <>
        <LoginView
          onLogin={handleLogin}
          sampleUsers={sampleUsers}
          onSelectSample={user => {
            setInitialPageMessage(null);
            handleSwitchUser(user);
          }}
          isLoading={false}
          errorMessage={authError}
          onOpenEmailCenter={() => setViewMode('email_center')}
          emailCount={emailLogs.length}
          completionNotice={initialPageMessage}
          onViewSummary={() => setIsReviewSummaryOpen(true)}
        />

        <ReviewSummaryModal
          isOpen={isReviewSummaryOpen}
          onClose={() => setIsReviewSummaryOpen(false)}
          onReturnToInitialPage={() => setIsReviewSummaryOpen(false)}
          evaluation={latestEvaluation || evaluations[0] || null}
          review={reviews[0] || null}
          task={task}
          intern={sampleUsers.find(u => u.role === 'intern') || null}
          emailCount={emailLogs.length}
          onOpenOutbox={() => {
            setIsReviewSummaryOpen(false);
            setViewMode('email_center');
          }}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-xs sm:text-sm font-semibold border ${
              notification.type === 'success'
                ? 'bg-emerald-600 text-white border-emerald-500'
                : notification.type === 'error'
                ? 'bg-rose-600 text-white border-rose-500'
                : 'bg-slate-900 text-white border-slate-800'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Main Navbar */}
      <Navbar
        currentUser={currentUser}
        users={sampleUsers}
        systemStatus={systemStatus}
        emailCount={emailLogs.length}
        onSwitchUser={handleSwitchUser}
        onOpenOutbox={() => setViewMode('email_center')}
        onOpenGuide={() => setIsGuideOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Workspace Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Mentor View */}
        {currentUser.role === 'mentor' ? (
          <MentorPortal
            mentor={currentUser}
            onSelectIntern={internId => {
              const intern = sampleUsers.find(u => u.id === internId);
              if (intern) handleSwitchUser(intern);
            }}
            onOpenScheduleModalForIntern={(targetIntern, targetTask) => {
              setTask(targetTask);
              setIsScheduleModalOpen(true);
            }}
            onOpenOutbox={() => setViewMode('email_center')}
          />
        ) : (
          /* Intern View */
          <div className="space-y-6">
            {/* Intern Welcome & Briefing Banner */}
            {task ? (
              <VoiceExplanationPlayer
                internName={currentUser.name}
                task={task}
                onVoiceTriggeredEmail={async () => {
                  try {
                    const res = await api.sendVoiceBriefingEmail(currentUser.id, task.id);
                    const emails = await api.getEmails();
                    setEmailLogs(emails);
                    if (res.review) {
                      setReviews(prev => [res.review, ...prev.filter(r => r.id !== res.review.id)]);
                    }
                    showNotification(
                      'success',
                      '📧 Email #1 Sent: Task briefing, deadline, review date & meeting link dispatched!'
                    );
                  } catch (err: any) {
                    console.error('Failed to dispatch voice briefing email:', err);
                  }
                }}
              />
            ) : (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 text-center text-slate-500 text-sm">
                No active tasks assigned. Please contact your mentor Sarah Connor.
              </div>
            )}

            {/* Quick Filter Navigation Tabs for Mobile / Compact Screens */}
            <div className="flex sm:hidden items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                  activeTab === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600'
                }`}
              >
                All Modules
              </button>
              <button
                onClick={() => setActiveTab('task')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                  activeTab === 'task' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600'
                }`}
              >
                Task Details
              </button>
              <button
                onClick={() => setActiveTab('submit')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                  activeTab === 'submit' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600'
                }`}
              >
                Submission &amp; Audit
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                  activeTab === 'chat' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600'
                }`}
              >
                AI Assistant
              </button>
            </div>

            {/* Grid Layout: Left Column (7) + Right Column (5) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column (Task details, Submissions, Evaluation report, History) */}
              <div className="lg:col-span-7 space-y-6">
                {/* 1. Task Overview & Modules */}
                {task && (
                  <TaskOverviewCard
                    task={task}
                    onOpenChatWithTopic={topic => {
                      setActiveChatTopic(topic);
                      setActiveTab('chat');
                    }}
                  />
                )}

                {/* 2. Latest AI Evaluation Report (Prominent when available) */}
                {latestEvaluation && (
                  <EvaluationReportCard
                    evaluation={latestEvaluation}
                    taskTitle={task?.title || 'Assigned Task'}
                    onScheduleNextReview={() => setIsScheduleModalOpen(true)}
                    onOpenOutbox={() => setViewMode('email_center')}
                    onViewReviewSummary={() => setIsReviewSummaryOpen(true)}
                  />
                )}

                {/* 3. Work Submission Dropzone */}
                {task && (
                  <WorkSubmissionCard
                    intern={currentUser}
                    task={task}
                    onSubmissionSuccess={handleSubmissionSuccess}
                    onTriggerEvaluation={handleTriggerEvaluation}
                    isEvaluating={isEvaluating}
                  />
                )}

                {/* 4. Submission History */}
                <SubmissionHistoryCard
                  submissions={submissions}
                  evaluations={evaluations}
                  onSelectEvaluation={ev => setLatestEvaluation(ev)}
                  onTriggerEvaluation={handleTriggerEvaluation}
                  isEvaluating={isEvaluating}
                />
              </div>

              {/* Right Column (Review Schedule & AI Task Chatbot) */}
              <div className="lg:col-span-5 space-y-6 sticky top-20">
                {/* 1. Review Schedule Card */}
                <ReviewScheduleCard
                  reviews={reviews}
                  currentUser={currentUser}
                  onOpenScheduleModal={() => setIsScheduleModalOpen(true)}
                  onViewSummary={() => setIsReviewSummaryOpen(true)}
                />

                {/* 2. Grounded AI Chat Assistant */}
                {task && (
                  <ChatAssistant
                    intern={currentUser}
                    task={task}
                    initialTopic={activeChatTopic}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">InternPilot AI</span>
            <span>&bull;</span>
            <span>Smart Intern Task Assistant &amp; Review Hub</span>
          </div>

          <div className="flex items-center gap-4 text-slate-500">
            <button
              onClick={() => setIsGuideOpen(true)}
              className="hover:text-blue-600 transition-colors cursor-pointer"
            >
              VS Code Local Guide
            </button>
            <button
              onClick={() => setViewMode('email_center')}
              className="hover:text-blue-600 transition-colors cursor-pointer"
            >
              Email Outbox ({emailLogs.length})
            </button>
            <span>v1.0.0 &bull; Enterprise Edition</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ScheduleReviewModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        intern={currentUser}
        task={task}
        onSuccess={handleReviewScheduled}
        scheduledBy={currentUser.role === 'mentor' ? currentUser.name : 'Sarah Connor (Assigned Mentor)'}
      />

      <EmailOutboxModal
        isOpen={isOutboxOpen}
        onClose={() => setIsOutboxOpen(false)}
        emails={emailLogs}
        onRefresh={async () => {
          const fresh = await api.getEmails();
          setEmailLogs(fresh);
        }}
      />

      <LocalSetupGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      <ReviewSummaryModal
        isOpen={isReviewSummaryOpen}
        onClose={() => setIsReviewSummaryOpen(false)}
        onReturnToInitialPage={handleReturnToInitialPage}
        evaluation={latestEvaluation || evaluations[0] || null}
        review={reviews[0] || null}
        task={task}
        intern={currentUser}
        emailCount={emailLogs.length}
        onOpenOutbox={() => {
          setIsReviewSummaryOpen(false);
          setViewMode('email_center');
        }}
      />
    </div>
  );
}
