import React, { useState, useEffect } from 'react';
import { User, Task, Review, Submission } from '../types';
import { api } from '../services/api';
import {
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  PlusCircle,
  FileText,
  Mail,
  Video,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

interface MentorPortalProps {
  mentor: User;
  onSelectIntern: (internId: string) => void;
  onOpenScheduleModalForIntern: (intern: User, task: Task | null) => void;
  onOpenOutbox: () => void;
}

export const MentorPortal: React.FC<MentorPortalProps> = ({
  mentor,
  onSelectIntern,
  onOpenScheduleModalForIntern,
  onOpenOutbox,
}) => {
  const [data, setData] = useState<{
    interns: User[];
    tasks: Task[];
    reviews: Review[];
    submissions: Submission[];
    evaluations: any[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  // New task creation state
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [targetInternId, setTargetInternId] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState('Full-Stack');
  const [newTaskObjective, setNewTaskObjective] = useState('');
  const [newTaskExpected, setNewTaskExpected] = useState('');
  const [newTaskDeadline, setNewTaskDeadline] = useState('2026-11-20');
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.getMentorOverview();
      setData(res);
      if (res.interns.length > 0 && !targetInternId) {
        setTargetInternId(res.interns[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetInternId || !newTaskTitle || !newTaskObjective) return;
    setIsCreatingTask(true);
    try {
      await api.createTask({
        internId: targetInternId,
        title: newTaskTitle,
        category: newTaskCategory,
        description: newTaskTitle,
        objective: newTaskObjective,
        expectedOutput: newTaskExpected || 'Documented code repository, test suite, and deployment README',
        deadline: newTaskDeadline,
        priority: 'High',
        modules: [
          {
            id: 'mod-1',
            title: 'Core Implementation & Logic',
            description: 'Implement the primary architecture and API endpoints.',
            required: true,
            weight: 50,
          },
          {
            id: 'mod-2',
            title: 'Automated Test Suite & Edge Cases',
            description: 'Provide unit tests covering success and failure branches.',
            required: true,
            weight: 50,
          },
        ],
        mentorNotes: 'Ensure clean documentation and robust error handling.',
      });

      setShowCreateTask(false);
      setNewTaskTitle('');
      setNewTaskObjective('');
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreatingTask(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="py-16 text-center text-slate-500 text-sm">
        Loading Mentor Oversight Hub...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-400 text-amber-950">
              Mentor Command Center
            </span>
            <span className="text-xs text-slate-300">Engineering Internship Oversight</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Welcome, {mentor.name}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Monitor intern task progress, audit submitted code repositories with Gemini AI, set review milestones, and dispatch notifications.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setShowCreateTask(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Assign New Task</span>
          </button>

          <button
            onClick={onOpenOutbox}
            className="flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold rounded-xl transition-colors cursor-pointer"
          >
            <Mail className="w-4 h-4" />
            <span>View All Dispatched Emails</span>
          </button>
        </div>
      </div>

      {/* Interns Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span>Active Intern Cohort ({data.interns.length})</span>
          </h3>
          <span className="text-xs text-slate-500">Click any intern to open their dashboard</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.interns.map(intern => {
            const internTask = data.tasks.find(t => t.intern_id === intern.id);
            const internSubmissions = data.submissions.filter(s => s.intern_id === intern.id);
            const internReviews = data.reviews.filter(r => r.intern_id === intern.id && r.status === 'scheduled');
            const latestReview = internReviews[0];

            return (
              <div
                key={intern.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 space-y-4 hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Intern Profile Header */}
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                    <img
                      src={intern.avatar}
                      alt={intern.name}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-blue-100"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-slate-900 truncate">{intern.name}</h4>
                      <p className="text-xs text-blue-600 font-medium truncate">{intern.track}</p>
                      <p className="text-[11px] text-slate-400 font-mono truncate">{intern.email}</p>
                    </div>
                  </div>

                  {/* Assigned Task */}
                  <div className="mt-3 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Assigned Task
                    </span>
                    {internTask ? (
                      <div>
                        <p className="text-xs font-semibold text-slate-900 line-clamp-2">
                          {internTask.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-semibold">
                            {internTask.category}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Due: {internTask.deadline}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No task assigned yet</p>
                    )}
                  </div>

                  {/* Submission and Review Status */}
                  <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-50 p-2 rounded-xl">
                      <span className="text-[10px] text-slate-400 block font-medium">Submissions</span>
                      <span className="text-xs font-bold text-slate-800">
                        {internSubmissions.length} files
                      </span>
                    </div>

                    <div className="bg-slate-50 p-2 rounded-xl">
                      <span className="text-[10px] text-slate-400 block font-medium">Next Review</span>
                      <span className="text-xs font-bold text-blue-700 truncate block">
                        {latestReview ? `${latestReview.review_date}` : 'None Set'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => onSelectIntern(intern.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    <span>View Intern Hub</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onOpenScheduleModalForIntern(intern, internTask || null)}
                    className="p-2 bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-700 rounded-xl transition-colors cursor-pointer"
                    title="Schedule Review Meeting & Email Notification"
                  >
                    <Calendar className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create Task Modal */}
      {showCreateTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Assign New Internship Task</h3>
              <p className="text-xs text-slate-500">Define objectives, expected deliverables, and deadline</p>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assign To Intern
                </label>
                <select
                  value={targetInternId}
                  onChange={e => setTargetInternId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm"
                >
                  {data.interns.map(i => (
                    <option key={i.id} value={i.id}>
                      {i.name} ({i.track})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Task Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Build Real-Time Collaboration Canvas"
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Track / Category
                  </label>
                  <input
                    type="text"
                    value={newTaskCategory}
                    onChange={e => setNewTaskCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Deadline
                  </label>
                  <input
                    type="date"
                    required
                    value={newTaskDeadline}
                    onChange={e => setNewTaskDeadline(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Task Objective
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Explain the overarching purpose and user benefit..."
                  value={newTaskObjective}
                  onChange={e => setNewTaskObjective(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Expected Output
                </label>
                <input
                  type="text"
                  placeholder="e.g. Clean React frontend, tested Express routes, and passing test suite"
                  value={newTaskExpected}
                  onChange={e => setNewTaskExpected(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateTask(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingTask}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl"
                >
                  {isCreatingTask ? 'Creating...' : 'Assign Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
