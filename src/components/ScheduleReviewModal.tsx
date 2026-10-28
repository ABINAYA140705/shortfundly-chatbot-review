import React, { useState } from 'react';
import { User, Task } from '../types';
import { api } from '../services/api';
import {
  Calendar,
  Clock,
  Video,
  Mail,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';

interface ScheduleReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  intern: User;
  task: Task | null;
  onSuccess: (newReview: any) => void;
  scheduledBy: string;
}

export const ScheduleReviewModal: React.FC<ScheduleReviewModalProps> = ({
  isOpen,
  onClose,
  intern,
  task,
  onSuccess,
  scheduledBy,
}) => {
  // Set default review date to 5 days from today
  const defaultDate = new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString().split('T')[0];

  const [title, setTitle] = useState('Sprint Milestone & Code Walkthrough Review');
  const [reviewDate, setReviewDate] = useState(defaultDate);
  const [reviewTime, setReviewTime] = useState('14:30');
  const [meetingLink, setMeetingLink] = useState(
    `https://meet.google.com/pil-${intern.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 4)}-${Math.floor(100 + Math.random() * 900)}`
  );
  const [agenda, setAgenda] = useState(
    `1. Demonstration of completed modules\n2. AI Evaluation report review\n3. Code architecture and security discussion\n4. Sprint 2 milestone planning`
  );
  const [notes, setNotes] = useState('Please ensure your code is running and your test suite passes.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<any | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessInfo(null);

    try {
      const res = await api.scheduleReview({
        internId: intern.id,
        taskId: task?.id || 'general',
        title,
        reviewDate,
        reviewTime,
        meetingLink,
        agenda,
        notes,
        scheduledBy,
      });

      setSuccessInfo(res);
      setTimeout(() => {
        onSuccess(res.review);
        onClose();
      }, 1800);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to schedule review');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Schedule Review Session</h3>
              <p className="text-xs text-slate-500">
                Dispatches invite email &amp; updates {intern.name}'s dashboard
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successInfo && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl space-y-1">
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-950">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Review Scheduled &amp; Notification Sent!</span>
              </div>
              <p className="text-[11px] text-emerald-900">
                {successInfo.emailResult?.message}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Review Session Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  <span>Review Date</span>
                </label>
                <input
                  type="date"
                  required
                  value={reviewDate}
                  onChange={e => setReviewDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span>Time</span>
                </label>
                <input
                  type="time"
                  required
                  value={reviewTime}
                  onChange={e => setReviewTime(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Video className="w-3.5 h-3.5 text-blue-600" />
                <span>Meeting Link (Google Meet / Zoom)</span>
              </label>
              <input
                type="url"
                required
                value={meetingLink}
                onChange={e => setMeetingLink(e.target.value)}
                placeholder="https://meet.google.com/..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono text-blue-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Meeting Agenda &amp; Focus Topics
              </label>
              <textarea
                rows={3}
                value={agenda}
                onChange={e => setAgenda(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mentor Notes / Prep Instructions
              </label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Bring questions or demo environment ready..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Email Notification Preview Notice */}
            <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-3 text-xs text-blue-900 flex items-start gap-2.5">
              <Mail className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Email Dispatch:</span> An invitation containing the meeting link, date, time, and agenda will be dispatched to{' '}
                <span className="font-semibold underline">{intern.email}</span>.
              </div>
            </div>

            {/* Buttons */}
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Scheduling &amp; Dispatching Email...</span>
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4" />
                    <span>Confirm &amp; Dispatch Invite</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
