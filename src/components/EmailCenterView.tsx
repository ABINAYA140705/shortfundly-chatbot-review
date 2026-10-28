import React, { useState } from 'react';
import { EmailLog, User } from '../types';
import {
  Mail,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Calendar,
  FileCheck2,
  Video,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  LogIn,
  RotateCcw,
  Trash2,
} from 'lucide-react';

interface EmailCenterViewProps {
  emails: EmailLog[];
  onBack: () => void;
  onLoginAsIntern?: () => void;
  onRefresh?: () => void;
  onClearEmails?: () => Promise<void> | void;
  currentUser?: User | null;
}

export const EmailCenterView: React.FC<EmailCenterViewProps> = ({
  emails,
  onBack,
  onLoginAsIntern,
  onRefresh,
  onClearEmails,
  currentUser,
}) => {
  // Sort direction: 'asc' (oldest first / step 1 to N) or 'desc' (newest first)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isClearing, setIsClearing] = useState(false);

  // Sorted emails: when 'asc', starts from the very first email
  const sortedEmails = [...emails].sort((a, b) => {
    const timeA = new Date(a.sent_at).getTime();
    const timeB = new Date(b.sent_at).getTime();
    return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
  });

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const selectedEmail = sortedEmails[currentIndex] || sortedEmails[0] || null;

  const handleNext = () => {
    if (currentIndex < sortedEmails.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleClear = async () => {
    if (onClearEmails) {
      setIsClearing(true);
      try {
        await onClearEmails();
        setCurrentIndex(0);
      } finally {
        setIsClearing(false);
      }
    }
  };

  const getEmailCategoryBadge = (eml: EmailLog) => {
    const subj = eml.subject.toLowerCase();
    if (subj.includes('task briefing') || subj.includes('welcome') || eml.email_type === 'task_assignment') {
      return {
        step: 1,
        title: 'Step 1: Task Briefing, Deadline & Meeting Link',
        icon: Sparkles,
        color: 'bg-blue-100 text-blue-800 border-blue-200',
      };
    }
    if (subj.includes('evaluation') || subj.includes('feedback') || eml.email_type === 'evaluation_feedback') {
      return {
        step: 2,
        title: 'Step 2: AI Work Evaluation & Rescheduled Review',
        icon: FileCheck2,
        color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      };
    }
    if (subj.includes('review scheduled') || eml.email_type === 'review_invitation') {
      return {
        step: 3,
        title: 'Step 3: Milestone Review Invitation',
        icon: Calendar,
        color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      };
    }
    return {
      step: 4,
      title: 'Milestone Update',
      icon: Mail,
      color: 'bg-slate-100 text-slate-800 border-slate-200',
    };
  };

  return (
    <div className="min-h-screen bg-slate-100/80 flex flex-col font-sans">
      {/* Top Bar / Recording Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Back Button & Title */}
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-blue-700 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-xl transition-colors cursor-pointer"
                title="Return to previous screen"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to {currentUser ? 'Dashboard' : 'Sign In'}</span>
              </button>

              <div className="h-5 w-px bg-slate-200 hidden sm:block"></div>

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                      InternPilot AI &bull; Email Delivery &amp; Audit Center
                    </h1>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                      {emails.length} Emails
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 hidden sm:block">
                    Screen record notifications: Mail #1 (Voice Briefing, Deadline &amp; Link) &rarr; Mail #2 (Evaluation &amp; Rescheduled Review)
                  </p>
                </div>
              </div>
            </div>

            {/* Right Controls: Sort Mode, Clear Outbox & Quick Sign In */}
            <div className="flex items-center gap-2">
              {onClearEmails && (
                <button
                  onClick={handleClear}
                  disabled={isClearing || emails.length === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 disabled:opacity-40 disabled:pointer-events-none border border-rose-200 rounded-xl transition-colors cursor-pointer"
                  title="Clear outbox to 0 emails for a fresh video recording take"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isClearing ? 'Clearing...' : 'Reset Outbox (0 Emails)'}</span>
                </button>
              )}

              <button
                onClick={() => {
                  const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
                  setSortOrder(newOrder);
                  setCurrentIndex(0);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
                title="Toggle chronological order"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>
                  {sortOrder === 'asc' ? 'Order: First to Latest' : 'Order: Newest First'}
                </span>
              </button>

              {onRefresh && (
                <button
                  onClick={onRefresh}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer hidden sm:block"
                >
                  Refresh
                </button>
              )}

              {!currentUser && onLoginAsIntern && (
                <button
                  onClick={onLoginAsIntern}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Enter Workspace</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Screen Record Stepper Toolbar */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white py-3 px-4 border-b border-indigo-950">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2 py-0.5 rounded font-bold bg-amber-400 text-amber-950 text-[10px]">
              SCREEN RECORDING STEPPER
            </span>
            <span className="text-slate-300">
              Viewing Mail <strong>{currentIndex + 1}</strong> of <strong>{sortedEmails.length}</strong>
            </span>
            {selectedEmail && (
              <span className="hidden md:inline text-blue-300 font-medium">
                &bull; {getEmailCategoryBadge(selectedEmail).title}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="flex items-center gap-1 px-3 py-1 bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:pointer-events-none text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous Mail</span>
            </button>

            <div className="flex items-center gap-1 px-1">
              {sortedEmails.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-6 h-6 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                    currentIndex === idx
                      ? 'bg-blue-500 text-white shadow-xs scale-105'
                      : 'bg-white/10 text-slate-300 hover:bg-white/20'
                  }`}
                  title={`Jump to Email #${idx + 1}`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>

            <button
              onClick={handleNext}
              disabled={currentIndex === sortedEmails.length - 1}
              className="flex items-center gap-1 px-3 py-1 bg-blue-500 hover:bg-blue-600 disabled:opacity-30 disabled:pointer-events-none text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              <span>Next Mail</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Mailbox Two-Pane Viewer */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col lg:flex-row gap-6 overflow-hidden">
        {/* Left Column: Email Timeline Selector */}
        <div className="w-full lg:w-96 bg-white rounded-2xl border border-slate-200/90 shadow-sm flex flex-col overflow-hidden shrink-0">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Email Dispatch Timeline
              </h2>
              <p className="text-[11px] text-slate-500">
                Sorted from {sortOrder === 'asc' ? 'first sent mail' : 'latest mail'}
              </p>
            </div>
            <span className="text-xs font-semibold text-blue-600">
              {sortedEmails.length} logged
            </span>
          </div>

          <div className="divide-y divide-slate-100 overflow-y-auto max-h-[calc(100vh-280px)]">
            {sortedEmails.map((eml, idx) => {
              const isSelected = selectedEmail?.id === eml.id;
              const badge = getEmailCategoryBadge(eml);
              const BadgeIcon = badge.icon;

              return (
                <button
                  key={eml.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-full text-left p-4 transition-all flex items-start gap-3 cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50/90 border-l-4 border-blue-600 shadow-xs'
                      : 'hover:bg-slate-50/80'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    #{idx + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.color}`}
                      >
                        {badge.title.split(':')[0]}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(eml.sent_at).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                      {eml.subject}
                    </h4>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                      <span className="truncate">To: {eml.recipient_name}</span>
                      <span
                        className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded ${
                          eml.sent_via === 'smtp'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {eml.sent_via === 'smtp' ? 'SMTP' : 'DEMO LOG'}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Full Rendered Email Presentation */}
        <div className="flex-1 bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 flex flex-col overflow-y-auto">
          {selectedEmail ? (
            <div className="space-y-6 flex-1">
              {/* Email Envelope Meta Header */}
              <div className="border-b border-slate-200 pb-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full border ${
                        getEmailCategoryBadge(selectedEmail).color
                      }`}
                    >
                      {getEmailCategoryBadge(selectedEmail).title}
                    </span>

                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                        selectedEmail.sent_via === 'smtp'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {selectedEmail.sent_via === 'smtp'
                        ? 'Delivered via Real SMTP'
                        : 'Saved to Interactive Demo Outbox'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(selectedEmail.sent_at).toLocaleString()}</span>
                  </div>
                </div>

                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {selectedEmail.subject}
                </h2>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-700">Recipient: </span>
                      <strong className="text-slate-900">{selectedEmail.recipient_name}</strong>{' '}
                      <span className="text-slate-500 font-mono">
                        &lt;{selectedEmail.recipient_email}&gt;
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      ID: {selectedEmail.id}
                    </span>
                  </div>

                  <div>
                    <span className="font-semibold text-slate-700">Sender: </span>
                    <span className="text-slate-900">InternPilot AI Mentorship Automation</span>{' '}
                    <span className="text-slate-500 font-mono">
                      &lt;notifications@internpilot.ai&gt;
                    </span>
                  </div>
                </div>
              </div>

              {/* Rendered HTML Content */}
              <div className="bg-slate-50/60 p-6 rounded-2xl border border-slate-200 shadow-inner">
                <div
                  dangerouslySetInnerHTML={{ __html: selectedEmail.body_html }}
                  className="prose prose-sm max-w-none text-slate-800"
                />
              </div>

              {/* Next/Prev Navigation Footer in Card */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Previous Email</span>
                </button>

                <span className="text-xs text-slate-400">
                  Step {currentIndex + 1} of {sortedEmails.length}
                </span>

                <button
                  onClick={handleNext}
                  disabled={currentIndex === sortedEmails.length - 1}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                >
                  <span>Next Email</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-12 px-4 max-w-lg mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 ring-8 ring-blue-50/50">
                <Video className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Outbox Ready for Screen Recording (0 Emails)
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                No permanent emails are stored. You can now record each notification live from the very first email:
              </p>

              <div className="mt-5 w-full bg-slate-50 border border-slate-200/90 rounded-2xl p-4 text-left space-y-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <strong className="text-slate-800">Play Voice Briefing:</strong>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      On the intern dashboard, click <em>"Play Voice Briefing"</em>. The AI speaks the task requirements and immediately sends <strong>Email #1</strong> with the task objective, modules, deadline, scheduled date, and meeting link.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <strong className="text-slate-800">Submit Work &amp; Run AI Evaluation:</strong>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      Upload your code/zip file and click <em>"Run AI Work Evaluation"</em>. The AI audits the modules and immediately dispatches <strong>Email #2</strong> containing the feedback report, score, suggestions, and the <strong>next rescheduled review date and link</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <strong className="text-slate-800">Screen Record from Email #1:</strong>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      Switch to this page (or after logout) and use the <strong>[1]</strong>, <strong>[2]</strong> stepper and "Next Email" to record each notification sequentially.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-center gap-3">
                <button
                  onClick={onBack}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{currentUser ? 'Return to Dashboard to Start' : 'Go to Sign In'}</span>
                </button>
                {!currentUser && onLoginAsIntern && (
                  <button
                    onClick={onLoginAsIntern}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Enter as Alex Rivera (Intern)</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
