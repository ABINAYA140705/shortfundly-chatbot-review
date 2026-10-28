import React, { useState, useEffect } from 'react';
import { Evaluation, Review, Task, User } from '../types';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lightbulb,
  Calendar,
  Clock,
  Video,
  ExternalLink,
  Mail,
  Home,
  Sparkles,
  ArrowRight,
  Pause,
  Play,
  RotateCcw,
  X,
  FileCheck2,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';

interface ReviewSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReturnToInitialPage: () => void;
  evaluation: Evaluation | null;
  review: Review | null;
  task: Task | null;
  intern: User | null;
  emailCount?: number;
  onOpenOutbox?: () => void;
  autoReturnSeconds?: number;
}

export const ReviewSummaryModal: React.FC<ReviewSummaryModalProps> = ({
  isOpen,
  onClose,
  onReturnToInitialPage,
  evaluation,
  review,
  task,
  intern,
  emailCount = 2,
  onOpenOutbox,
  autoReturnSeconds = 25,
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(autoReturnSeconds);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) {
      setTimeLeft(autoReturnSeconds);
      setIsPaused(false);
      return;
    }

    if (isPaused) return;

    if (timeLeft <= 0) {
      onReturnToInitialPage();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onReturnToInitialPage();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, timeLeft, isPaused, autoReturnSeconds, onReturnToInitialPage]);

  if (!isOpen) return null;

  const score = evaluation?.score ?? 92;
  const verdict =
    evaluation?.overall_verdict ||
    evaluation?.overallVerdict ||
    (score >= 85 ? 'Meets Expectations' : score >= 70 ? 'Partial Progress' : 'Needs Revision');
  const evaluatedBy = evaluation?.evaluated_by || evaluation?.evaluatedBy || 'gemini-3.8-flash';
  const completed = evaluation?.completedModules || [];
  const missing = evaluation?.missingModules || [];
  const incomplete = evaluation?.incompleteParts || [];
  const suggestions = evaluation?.suggestions || [];
  const detailedFeedback =
    evaluation?.detailed_feedback ||
    evaluation?.detailedFeedback ||
    'The submitted work successfully demonstrates core module functionality and meets benchmark internship standards.';

  const progressPercentage = Math.round(((autoReturnSeconds - timeLeft) / autoReturnSeconds) * 100);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/30 border border-blue-400/40 flex items-center justify-center text-blue-300">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-400 text-emerald-950">
                  Review Complete
                </span>
                <span className="text-xs text-blue-200">Official Milestone Summary</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                Internship Review &amp; Evaluation Summary
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Dismiss to workspace"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Auto Return Notification Banner with Pause / Resume */}
        <div className="bg-blue-50 border-b border-blue-100 px-6 py-2.5 flex items-center justify-between text-xs text-blue-900 shrink-0">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              {isPaused ? (
                <span className="font-semibold text-slate-700">Auto-return timer paused.</span>
              ) : (
                <span>
                  Returning to <strong>Initial Page</strong> in{' '}
                  <strong className="text-blue-700 font-mono text-sm">{timeLeft}s</strong>
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="flex items-center gap-1 px-2.5 py-1 bg-white border border-blue-200 hover:bg-blue-100 text-blue-700 font-semibold rounded-lg text-[11px] transition-colors cursor-pointer"
            >
              {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
              <span>{isPaused ? 'Resume Timer' : 'Pause'}</span>
            </button>

            <button
              onClick={onReturnToInitialPage}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-[11px] shadow-xs transition-colors cursor-pointer"
            >
              Return Now
            </button>
          </div>
        </div>

        {/* Progress bar for timer */}
        {!isPaused && (
          <div className="w-full bg-blue-100 h-1 shrink-0 overflow-hidden">
            <div
              className="bg-blue-600 h-full transition-all duration-1000 ease-linear"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        )}

        {/* Scrollable Summary Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          {/* Section 1: Overview Score & Verdict Card */}
          <div className="bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 border border-slate-200/90 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`px-3 py-0.5 rounded-full text-xs font-bold border ${
                    verdict.includes('Exceeds') || verdict.includes('Meets')
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-amber-100 text-amber-800 border-amber-300'
                  }`}
                >
                  {verdict}
                </span>

                <span className="text-xs text-slate-500">
                  Intern: <strong>{intern?.name || 'Alex Rivera'}</strong> ({intern?.track || 'Full-Stack'})
                </span>
              </div>

              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                {task?.title || 'Assigned Internship Task'}
              </h3>
              <p className="text-xs text-slate-600 line-clamp-2">
                {task?.objective || 'Complete required modules and submit code for review.'}
              </p>
            </div>

            {/* Score Pill */}
            <div className="flex items-center gap-3 bg-white border border-slate-200/80 px-4 py-3 rounded-2xl shadow-xs self-start sm:self-auto shrink-0">
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Review Score
                </span>
                <span className="text-2xl font-black text-slate-900 leading-none">
                  {score}
                  <span className="text-sm font-normal text-slate-400">/100</span>
                </span>
              </div>
              <div className="w-12 h-12 rounded-full border-4 border-emerald-500/30 border-t-emerald-600 flex items-center justify-center font-black text-xs text-emerald-700 bg-emerald-50">
                {score}%
              </div>
            </div>
          </div>

          {/* Section 2: Executive Feedback */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Mentor &amp; AI Executive Summary</span>
            </h4>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {detailedFeedback}
            </p>
          </div>

          {/* Section 3: Completed vs Missing Modules */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Completed Modules */}
            <div className="bg-emerald-50/40 border border-emerald-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Completed Modules ({completed.length})
                </span>
                <span className="text-[10px] font-semibold text-emerald-700">Code Verified</span>
              </div>

              {completed.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No modules fully verified.</p>
              ) : (
                <div className="space-y-2">
                  {completed.map((m, idx) => (
                    <div
                      key={m.moduleId || idx}
                      className="bg-white border border-emerald-200 rounded-xl p-2.5 text-xs shadow-xs"
                    >
                      <p className="font-bold text-emerald-950 mb-1">{m.title}</p>
                      <div className="bg-emerald-50/70 text-emerald-900 rounded p-1.5 text-[11px] font-mono border border-emerald-100">
                        {m.evidence}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Missing or Incomplete */}
            <div className="bg-rose-50/40 border border-rose-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-rose-100 pb-2">
                <span className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-rose-600" />
                  Missing or Action Items ({missing.length + incomplete.length})
                </span>
                <span className="text-[10px] font-semibold text-rose-700">Next Milestone</span>
              </div>

              {missing.length === 0 && incomplete.length === 0 ? (
                <div className="bg-white border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Excellent! All core requirements were met with verifiable evidence.</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {missing.map((m, idx) => (
                    <div
                      key={m.moduleId || idx}
                      className="bg-white border border-rose-200 rounded-xl p-2.5 text-xs shadow-xs"
                    >
                      <p className="font-bold text-rose-950 mb-0.5">{m.title}</p>
                      <p className="text-[11px] text-slate-600">
                        <span className="font-semibold text-rose-800">Reason:</span> {m.reason}
                      </p>
                    </div>
                  ))}
                  {incomplete.map((inc, idx) => (
                    <div
                      key={idx}
                      className="bg-white border border-amber-200 rounded-xl p-2.5 text-xs shadow-xs"
                    >
                      <span className="font-bold text-amber-950">{inc.component}: </span>
                      <span className="text-[11px] text-slate-600">{inc.issue}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Upcoming / Rescheduled Review Session */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-100 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>Next Scheduled Review Meeting</span>
              </span>

              {review?.meeting_link && (
                <a
                  href={review.meeting_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Open Video Meeting</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-white/90 p-2.5 rounded-xl border border-blue-100">
                <span className="text-[10px] text-slate-400 block font-medium">Review Date</span>
                <span className="font-bold text-slate-900">
                  {review?.review_date || 'Nov 12, 2026'}
                </span>
              </div>

              <div className="bg-white/90 p-2.5 rounded-xl border border-blue-100">
                <span className="text-[10px] text-slate-400 block font-medium">Review Time</span>
                <span className="font-bold text-slate-900">
                  {review?.review_time || '14:30 PM (EST)'}
                </span>
              </div>

              <div className="bg-white/90 p-2.5 rounded-xl border border-blue-100">
                <span className="text-[10px] text-slate-400 block font-medium">Lead Reviewer</span>
                <span className="font-bold text-slate-900 truncate block">
                  {review?.scheduled_by || 'Sarah Connor (Lead Mentor)'}
                </span>
              </div>
            </div>

            {review?.meeting_link && (
              <div className="bg-white/80 p-2.5 rounded-xl border border-blue-100 text-xs flex items-center justify-between gap-2">
                <span className="text-slate-500 truncate">
                  Meeting Link:{' '}
                  <span className="font-mono text-blue-600 font-semibold">{review.meeting_link}</span>
                </span>
                <span className="text-[10px] text-slate-400 shrink-0 font-medium">Google Meet</span>
              </div>
            )}
          </div>

          {/* Section 5: Email Dispatched Notification Status */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-slate-900">
                  Emails Dispatched &amp; Logged to Outbox ({emailCount})
                </p>
                <p className="text-[11px] text-slate-500">
                  Mail #1 (Task Briefing &amp; Deadline) &bull; Mail #2 (AI Evaluation &amp; Rescheduled Review Date)
                </p>
              </div>
            </div>

            {onOpenOutbox && (
              <button
                onClick={onOpenOutbox}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-blue-700 font-semibold rounded-xl text-xs transition-colors shrink-0 cursor-pointer"
              >
                Inspect Email Outbox
              </button>
            )}
          </div>
        </div>

        {/* Bottom Actions: Return to Initial Page */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 text-center sm:text-left">
            <span>Summary permanently recorded. Click below to return to the initial screen.</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Stay in Dashboard
            </button>

            <button
              onClick={onReturnToInitialPage}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-blue-500/25 transition-all cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>Return to Initial Page</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
