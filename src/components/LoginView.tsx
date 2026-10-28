import React, { useState } from 'react';
import { User } from '../types';
import {
  Sparkles,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Bot,
  Mic,
  FileCheck2,
  Video,
  Eye,
  Calendar,
} from 'lucide-react';

interface LoginViewProps {
  onLogin: (email: string, password: string) => Promise<void>;
  sampleUsers: User[];
  onSelectSample: (user: User) => void;
  isLoading: boolean;
  errorMessage?: string | null;
  onOpenEmailCenter?: () => void;
  emailCount?: number;
  completionNotice?: string | null;
  onViewSummary?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLogin,
  sampleUsers,
  onSelectSample,
  isLoading,
  errorMessage,
  onOpenEmailCenter,
  emailCount = 0,
  completionNotice = null,
  onViewSummary,
}) => {
  const [email, setEmail] = useState('alex@internpilot.ai');
  const [password, setPassword] = useState('intern123');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(email, password);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-slate-100 flex flex-col justify-between py-6 px-4 sm:px-6 lg:px-8">
      {/* Top Banner on Login / Logout Page */}
      <div className="max-w-4xl w-full mx-auto flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
            IP
          </div>
          <span className="font-bold text-sm text-slate-800">InternPilot AI</span>
        </div>

        {onOpenEmailCenter && (
          <button
            onClick={onOpenEmailCenter}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            title="Screen record all emails from first to latest"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Email Audit &amp; Outbox Hub ({emailCount})</span>
            <span className="hidden sm:inline bg-blue-500 text-white text-[10px] px-1.5 py-0.2 rounded font-bold">
              Video Record
            </span>
          </button>
        )}
      </div>

      <div className="max-w-md w-full mx-auto space-y-5 my-auto">
        {/* Brand Header */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center justify-center w-13 h-13 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/25 ring-4 ring-blue-100">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            InternPilot <span className="text-blue-600">AI</span>
          </h1>
          <p className="text-xs text-slate-600 max-w-sm mx-auto">
            Smart Intern Task Assistant &bull; Voice Briefing &bull; Work Submission &bull; Review Scheduling
          </p>
        </div>

        {/* Return from Review Completion Banner */}
        {completionNotice && (
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white rounded-2xl p-4 shadow-lg border border-emerald-500/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-3 duration-300">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-200 block">
                  Review &amp; Evaluation Flow Completed
                </span>
                <p className="text-xs sm:text-sm font-semibold text-white leading-snug">
                  {completionNotice}
                </p>
              </div>
            </div>
            {onViewSummary && (
              <button
                type="button"
                onClick={onViewSummary}
                className="self-end sm:self-center px-3.5 py-1.5 bg-white hover:bg-emerald-50 text-emerald-900 font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>View Summary</span>
              </button>
            )}
          </div>
        )}

        {/* Video Screen Recording Banner Callout */}
        {onOpenEmailCenter && (
          <div
            onClick={onOpenEmailCenter}
            className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl p-4 shadow-md cursor-pointer hover:shadow-lg transition-all border border-blue-800 flex items-center justify-between gap-3 group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/30 border border-blue-400/40 flex items-center justify-center text-blue-300 shrink-0">
                <Video className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white group-hover:text-blue-200">
                    Screen Record All Emails ({emailCount})
                  </span>
                  <span className="px-1.5 py-0.2 bg-amber-400 text-amber-950 text-[9px] font-extrabold rounded uppercase">
                    Ready
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Walk through Mail #1 (Voice Task Briefing, Deadline &amp; Meeting Link) and Mail #2 (AI Work Evaluation &amp; Rescheduled Review Date) in sequence.
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-blue-300 group-hover:translate-x-1 transition-transform shrink-0" />
          </div>
        )}

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-200/80 p-6 sm:p-7 space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">Sign In to Your Workspace</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Access your assigned tasks, review schedule, and feedback
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2">
              <span className="font-bold">Error:</span> {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Work Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="intern@internpilot.ai"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md shadow-blue-500/20 transition-all disabled:opacity-60 cursor-pointer"
            >
              {isLoading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick 1-Click Sample Accounts */}
          <div className="pt-1">
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Or 1-Click Test Accounts
              </span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <div className="grid grid-cols-1 gap-2 mt-1">
              {sampleUsers.map(user => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => {
                    setEmail(user.email);
                    setPassword(user.role === 'mentor' ? 'mentor123' : 'intern123');
                    onSelectSample(user);
                  }}
                  className="flex items-center gap-3 p-2 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/60 transition-all text-left group cursor-pointer"
                >
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200 group-hover:ring-blue-400"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-900 group-hover:text-blue-700 truncate">
                        {user.name}
                      </span>
                      <span
                        className={`text-[9px] font-semibold px-1.5 py-0.2 rounded-full ${
                          user.role === 'mentor'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {user.role === 'mentor' ? 'MENTOR' : 'INTERN'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 truncate">{user.track}</p>
                    <p className="text-[9px] text-slate-400 font-mono">
                      {user.email} &bull; {user.role === 'mentor' ? 'mentor123' : 'intern123'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Feature Highlights Footer */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-white/80 backdrop-blur-xs p-2.5 rounded-xl border border-slate-200/60 shadow-xs">
            <Mic className="w-4 h-4 text-blue-600 mx-auto mb-0.5" />
            <p className="text-[11px] font-semibold text-slate-800">Voice Briefing</p>
            <p className="text-[9px] text-slate-500">Natural spoken tasks</p>
          </div>
          <div className="bg-white/80 backdrop-blur-xs p-2.5 rounded-xl border border-slate-200/60 shadow-xs">
            <Bot className="w-4 h-4 text-indigo-600 mx-auto mb-0.5" />
            <p className="text-[11px] font-semibold text-slate-800">Gemini 3.8 AI</p>
            <p className="text-[9px] text-slate-500">Rigorous code audit</p>
          </div>
          <div className="bg-white/80 backdrop-blur-xs p-2.5 rounded-xl border border-slate-200/60 shadow-xs">
            <FileCheck2 className="w-4 h-4 text-emerald-600 mx-auto mb-0.5" />
            <p className="text-[11px] font-semibold text-slate-800">Submissions</p>
            <p className="text-[9px] text-slate-500">ZIP, Code &amp; Docs</p>
          </div>
        </div>
      </div>

      <div className="text-center text-[11px] text-slate-400 py-2">
        InternPilot AI &bull; Smart Intern Task Assistant
      </div>
    </div>
  );
};
