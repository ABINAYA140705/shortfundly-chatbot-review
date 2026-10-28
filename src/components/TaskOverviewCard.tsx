import React from 'react';
import { Task } from '../types';
import {
  Calendar,
  Clock,
  Target,
  Layers,
  FileCheck,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  Sparkles,
  Info,
} from 'lucide-react';

interface TaskOverviewCardProps {
  task: Task;
  onOpenChatWithTopic?: (topic: string) => void;
}

export const TaskOverviewCard: React.FC<TaskOverviewCardProps> = ({
  task,
  onOpenChatWithTopic,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
              {task.category}
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                task.priority === 'High'
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              {task.priority} Priority
            </span>
            <span className="text-xs text-slate-400">Task ID: {task.id}</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {task.title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">{task.description}</p>
        </div>

        {/* Deadline Badge */}
        <div className="sm:text-right shrink-0 bg-slate-50 p-3 rounded-xl border border-slate-100">
          <div className="flex items-center sm:justify-end gap-1.5 text-xs text-slate-500 font-medium">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>Submission Deadline</span>
          </div>
          <div className="text-sm sm:text-base font-bold text-slate-900 mt-0.5">
            {task.deadline}
          </div>
          <div className="text-[11px] text-amber-600 font-medium mt-0.5 flex items-center sm:justify-end gap-1">
            <Clock className="w-3 h-3" />
            <span>Submit before review</span>
          </div>
        </div>
      </div>

      {/* Task Objective */}
      <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
        <div className="p-2 bg-blue-600 text-white rounded-lg shrink-0 mt-0.5">
          <Target className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900">
            Primary Task Objective
          </h3>
          <p className="text-sm text-blue-950 mt-1 leading-relaxed">{task.objective}</p>
        </div>
      </div>

      {/* Required Modules Breakdown */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Required Modules &amp; Deliverables ({task.modules.length})
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            Strictly audited during AI evaluation
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {task.modules.map((module, idx) => (
            <div
              key={module.id || idx}
              className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/20 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 text-[11px] flex items-center justify-center font-bold group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      {idx + 1}
                    </span>
                    {module.title}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {module.weight}% weight
                  </span>
                </div>
                <p className="text-xs text-slate-600 pl-6 leading-relaxed">
                  {module.description}
                </p>
              </div>

              {onOpenChatWithTopic && (
                <div className="pt-2 pl-6 flex justify-end">
                  <button
                    onClick={() => onOpenChatWithTopic(`How do I implement ${module.title}?`)}
                    className="text-[11px] font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Ask AI about this module</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Expected Deliverables Banner */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex items-start gap-3">
        <FileCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Expected Deliverable Output
          </h4>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">{task.expected_output}</p>
        </div>
      </div>

      {/* Mentor Guidance Notes */}
      {task.mentor_notes && (
        <div className="bg-amber-50/60 border border-amber-200/70 rounded-xl p-4 flex items-start gap-3">
          <MessageSquare className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold text-amber-900">Mentor Note:</span>{' '}
            <span className="text-amber-950">{task.mentor_notes}</span>
          </div>
        </div>
      )}
    </div>
  );
};
