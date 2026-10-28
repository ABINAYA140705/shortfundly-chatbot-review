import React from 'react';
import { Review, User } from '../types';
import {
  Calendar,
  Clock,
  Video,
  ExternalLink,
  UserCheck,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';

interface ReviewScheduleCardProps {
  reviews: Review[];
  currentUser: User;
  onOpenScheduleModal: () => void;
  onViewSummary?: () => void;
}

export const ReviewScheduleCard: React.FC<ReviewScheduleCardProps> = ({
  reviews,
  currentUser,
  onOpenScheduleModal,
  onViewSummary,
}) => {
  // Sort reviews by date
  const upcomingReviews = reviews.filter(r => r.status === 'scheduled');
  const pastReviews = reviews.filter(r => r.status !== 'scheduled');
  const activeReview = upcomingReviews[0] || reviews[0];

  const calculateDaysRemaining = (reviewDate: string) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const target = new Date(reviewDate);
      target.setHours(0, 0, 0, 0);
      const diffTime = target.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Tomorrow';
      if (diffDays > 1) return `In ${diffDays} days`;
      return `${Math.abs(diffDays)} days ago`;
    } catch {
      return '';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
              Live Milestone
            </span>
            <span className="text-xs text-slate-400">Mentor Review Session</span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <span>Upcoming Review &amp; Meeting Schedule</span>
          </h3>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {onViewSummary && (
            <button
              onClick={onViewSummary}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>Review Summary</span>
            </button>
          )}

          <button
            onClick={onOpenScheduleModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{currentUser.role === 'mentor' ? 'Set New Review' : 'Request / Reschedule'}</span>
          </button>
        </div>
      </div>

      {activeReview ? (
        <div className="bg-gradient-to-br from-blue-50/80 via-indigo-50/40 to-slate-50 border border-blue-200/70 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                {activeReview.title}
              </span>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                <div className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>{activeReview.review_date}</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>{activeReview.review_time}</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  {calculateDaysRemaining(activeReview.review_date)}
                </span>
              </div>
            </div>

            {/* Direct Join Meeting Button */}
            <a
              href={activeReview.meeting_link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              <Video className="w-4 h-4" />
              <span>Join Video Meeting</span>
              <ExternalLink className="w-3.5 h-3.5 ml-0.5" />
            </a>
          </div>

          {/* Meeting Link display */}
          <div className="bg-white/90 border border-slate-200/80 rounded-xl px-3.5 py-2 text-xs flex items-center justify-between gap-2 overflow-hidden">
            <div className="flex items-center gap-2 text-slate-600 truncate">
              <span className="font-semibold text-slate-700 shrink-0">Meeting Room:</span>
              <span className="font-mono text-blue-600 truncate">{activeReview.meeting_link}</span>
            </div>
            <span className="text-[11px] text-slate-400 shrink-0">Google Meet / Zoom</span>
          </div>

          {/* Agenda */}
          <div className="bg-white/90 border border-slate-200/80 rounded-xl p-3.5 text-xs space-y-1">
            <span className="font-bold text-slate-900 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              Review Agenda:
            </span>
            <p className="text-slate-600 leading-relaxed whitespace-pre-line">
              {activeReview.agenda}
            </p>
          </div>

          {/* Mentor Notes & Scheduled By */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500 pt-1">
            <div className="flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>
                Host &amp; Lead Reviewer: <strong>{activeReview.scheduled_by}</strong>
              </span>
            </div>
            {activeReview.notes && (
              <span className="italic text-slate-600">Note: {activeReview.notes}</span>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-700">No review currently scheduled</p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Set a review date to receive an email invitation and meeting link.
          </p>
          <button
            onClick={onOpenScheduleModal}
            className="mt-3 px-3.5 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 cursor-pointer"
          >
            Schedule First Review
          </button>
        </div>
      )}

      {/* History timeline of previous reviews if any */}
      {pastReviews.length > 0 && (
        <div className="pt-2">
          <span className="text-xs font-bold text-slate-800 block mb-2">Previous Reviews:</span>
          <div className="space-y-2">
            {pastReviews.map(r => (
              <div
                key={r.id}
                className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl text-xs text-slate-600 border border-slate-100"
              >
                <div>
                  <span className="font-semibold text-slate-900">{r.title}</span>
                  <span className="text-slate-400 ml-2">({r.review_date})</span>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-200 text-slate-700 rounded-full">
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
