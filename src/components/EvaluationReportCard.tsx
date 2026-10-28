import React from 'react';
import { Evaluation } from '../types';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  ShieldCheck,
  Calendar,
  FileCheck2,
  Clock,
  Printer,
  Mail,
} from 'lucide-react';

interface EvaluationReportCardProps {
  evaluation: Evaluation;
  taskTitle: string;
  onScheduleNextReview?: () => void;
  onOpenOutbox?: () => void;
  onViewReviewSummary?: () => void;
}

export const EvaluationReportCard: React.FC<EvaluationReportCardProps> = ({
  evaluation,
  taskTitle,
  onScheduleNextReview,
  onOpenOutbox,
  onViewReviewSummary,
}) => {
  const score = evaluation.score;
  const verdict = evaluation.overall_verdict || evaluation.overallVerdict || 'Meets Expectations';
  const evaluatedBy = evaluation.evaluated_by || evaluation.evaluatedBy || 'gemini-3.8-flash';
  const evaluatedAt = evaluation.evaluated_at || evaluation.evaluatedAt || new Date().toISOString();

  const completed = evaluation.completedModules || [];
  const missing = evaluation.missingModules || [];
  const incomplete = evaluation.incompleteParts || [];
  const suggestions = evaluation.suggestions || [];
  const detailedFeedback = evaluation.detailed_feedback || evaluation.detailedFeedback || '';

  const getVerdictColor = (v: string) => {
    switch (v) {
      case 'Exceeds Expectations':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Meets Expectations':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Partial Progress':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      default:
        return 'bg-rose-100 text-rose-800 border-rose-300';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
      {/* Top Banner: Score, Verdict & Attribution */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold border ${getVerdictColor(
                verdict
              )}`}
            >
              {verdict}
            </span>

            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                evaluatedBy.includes('gemini')
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>Audited by {evaluatedBy}</span>
            </span>

            <span className="text-xs text-slate-400">
              {new Date(evaluatedAt).toLocaleString()}
            </span>
          </div>

          <h3 className="text-xl font-bold text-slate-900 tracking-tight">
            AI Work Evaluation &amp; Module Audit Report
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Strict evidence verification against "{taskTitle}"
          </p>
        </div>

        {/* Score Dial */}
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 px-4 py-2.5 rounded-2xl self-start sm:self-auto">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Total Score
            </span>
            <span className="text-2xl font-black text-slate-900 leading-none">
              {score}
              <span className="text-sm font-normal text-slate-400">/100</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-full border-4 border-blue-600/20 border-t-blue-600 flex items-center justify-center font-bold text-xs text-blue-700 bg-white shadow-xs">
            {score}%
          </div>
        </div>
      </div>

      {/* Demo Evaluation Notice if applicable */}
      {evaluatedBy === 'demo_evaluator' && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Notice: Demo Evaluation Active.</span> A Gemini API key was not detected in secrets, so this evaluation was verified using the built-in deterministic static audit engine.
          </div>
        </div>
      )}

      {/* Feedback summary */}
      <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
          Mentor &amp; AI Executive Summary
        </h4>
        <p className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line">
          {detailedFeedback}
        </p>
      </div>

      {/* Grid of Verified vs Missing Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Completed Modules (Green) */}
        <div className="border border-emerald-200 bg-emerald-50/30 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
            <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Completed Modules ({completed.length})
            </span>
            <span className="text-[11px] font-semibold text-emerald-700">Verified Evidence</span>
          </div>

          {completed.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-2">
              No modules had sufficient concrete code evidence in this submission.
            </p>
          ) : (
            <div className="space-y-2.5">
              {completed.map((m, idx) => (
                <div
                  key={m.moduleId || idx}
                  className="bg-white border border-emerald-200 rounded-lg p-3 text-xs shadow-xs"
                >
                  <p className="font-bold text-emerald-950 mb-1">{m.title}</p>
                  <div className="bg-emerald-50/60 text-emerald-900 rounded p-2 text-[11px] font-mono leading-relaxed border border-emerald-100">
                    <span className="font-sans font-semibold text-emerald-800 block text-[10px] uppercase">
                      Code Evidence:
                    </span>
                    {m.evidence}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Missing or Incomplete Modules (Red/Amber) */}
        <div className="border border-rose-200 bg-rose-50/30 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-rose-100 pb-2">
            <span className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
              <XCircle className="w-4 h-4 text-rose-600" />
              Missing Modules ({missing.length})
            </span>
            <span className="text-[11px] font-semibold text-rose-700">Action Required</span>
          </div>

          {missing.length === 0 ? (
            <div className="bg-white border border-emerald-200 rounded-lg p-3 text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Great job! No modules are completely missing from your submission.</span>
            </div>
          ) : (
            <div className="space-y-2.5">
              {missing.map((m, idx) => (
                <div
                  key={m.moduleId || idx}
                  className="bg-white border border-rose-200 rounded-lg p-3 text-xs shadow-xs"
                >
                  <p className="font-bold text-rose-950 mb-1">{m.title}</p>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    <span className="font-semibold text-rose-800">Reason:</span> {m.reason}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Incomplete / Partial Modules */}
          {incomplete.length > 0 && (
            <div className="pt-2">
              <span className="text-[11px] font-bold text-amber-900 block mb-1.5 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                Partially Complete ({incomplete.length}):
              </span>
              <div className="space-y-1.5">
                {incomplete.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-white border border-amber-200 rounded-lg p-2.5 text-xs"
                  >
                    <span className="font-bold text-amber-950">{item.component}: </span>
                    <span className="text-slate-600 text-[11px]">{item.issue}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actionable Suggestions */}
      {suggestions.length > 0 && (
        <div className="bg-blue-50/60 border border-blue-200/80 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
            <Lightbulb className="w-4 h-4 text-blue-600" />
            <span>Next Steps &amp; Suggestions for Improvement</span>
          </div>
          <ul className="space-y-1.5 pl-5 list-disc text-xs text-blue-950 leading-relaxed">
            {suggestions.map((s, idx) => (
              <li key={idx}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Footer Actions: Email confirmation & Schedule Next Review */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Mail className="w-4 h-4 text-slate-400" />
          <span>Evaluation report automatically logged to email outbox.</span>
          {onOpenOutbox && (
            <button
              onClick={onOpenOutbox}
              className="text-blue-600 hover:underline font-semibold cursor-pointer"
            >
              View Email Outbox
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onViewReviewSummary && (
            <button
              onClick={onViewReviewSummary}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>View Review Summary &amp; Outcomes</span>
            </button>
          )}

          {onScheduleNextReview && (
            <button
              onClick={onScheduleNextReview}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>Schedule Next Review Meeting</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
