import React from 'react';
import { Submission, Evaluation } from '../types';
import {
  FileText,
  FileCode,
  FileArchive,
  Sparkles,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  AlertCircle,
} from 'lucide-react';

interface SubmissionHistoryCardProps {
  submissions: Submission[];
  evaluations: Evaluation[];
  onSelectEvaluation: (evaluation: Evaluation) => void;
  onTriggerEvaluation: (submissionId: string) => void;
  isEvaluating?: boolean;
}

export const SubmissionHistoryCard: React.FC<SubmissionHistoryCardProps> = ({
  submissions,
  evaluations,
  onSelectEvaluation,
  onTriggerEvaluation,
  isEvaluating,
}) => {
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getEvaluationForSubmission = (subId: string) => {
    return evaluations.find(e => (e.submission_id || e.submissionId) === subId);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <span>Submission History &amp; Audit Logs ({submissions.length})</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Track past project versions and previous evaluation scores
          </p>
        </div>
      </div>

      {submissions.length === 0 ? (
        <div className="text-center py-8 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
          No files submitted yet. Use the upload card above to submit your initial draft or final code.
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {submissions.map(sub => {
            const evaluation = getEvaluationForSubmission(sub.id);

            return (
              <div
                key={sub.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 p-2 rounded-xl transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-50 text-blue-700 rounded-lg shrink-0 mt-0.5">
                    {sub.original_name.endsWith('.zip') ? (
                      <FileArchive className="w-4 h-4" />
                    ) : sub.original_name.endsWith('.pdf') ? (
                      <FileText className="w-4 h-4" />
                    ) : (
                      <FileCode className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-900">
                        {sub.original_name}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                        v{sub.version}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          evaluation
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {evaluation ? 'Evaluated' : 'Awaiting Audit'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                      <span>{formatFileSize(sub.file_size)}</span>
                      <span>&bull;</span>
                      <span>{new Date(sub.submitted_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {evaluation ? (
                    <button
                      onClick={() => onSelectEvaluation(evaluation)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      <span>View Report ({evaluation.score}/100)</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => onTriggerEvaluation(sub.id)}
                      disabled={isEvaluating}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Run AI Evaluation</span>
                    </button>
                  )}

                  <a
                    href={sub.file_path}
                    download={sub.original_name}
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Download submitted file"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
