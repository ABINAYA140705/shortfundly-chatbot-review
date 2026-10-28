import React from 'react';
import { User, SystemStatus } from '../types';
import {
  Sparkles,
  Mail,
  BookOpen,
  LogOut,
  Users,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Radio,
} from 'lucide-react';

interface NavbarProps {
  currentUser: User;
  users: User[];
  systemStatus: SystemStatus | null;
  emailCount: number;
  onSwitchUser: (user: User) => void;
  onOpenOutbox: () => void;
  onOpenGuide: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  users,
  systemStatus,
  emailCount,
  onSwitchUser,
  onOpenOutbox,
  onOpenGuide,
  onLogout,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-sm ring-2 ring-blue-100">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">InternPilot</span>
                <span className="px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wider rounded bg-blue-100 text-blue-700">
                  AI
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Smart Intern Task Assistant & Review Hub</p>
            </div>
          </div>

          {/* Center Badges: System Status */}
          <div className="hidden lg:flex items-center gap-2 text-xs">
            {/* Gemini AI Status */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium border ${
                systemStatus?.geminiConnected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
              title={
                systemStatus?.geminiConnected
                  ? 'Gemini 3.8 Flash is configured and active'
                  : 'Running in smart demo evaluation mode (No API key found)'
              }
            >
              <Radio className={`w-3.5 h-3.5 ${systemStatus?.geminiConnected ? 'text-emerald-500 animate-pulse' : 'text-amber-500'}`} />
              <span>{systemStatus?.geminiConnected ? 'Gemini 3.8 Flash' : 'Demo AI Evaluator'}</span>
            </div>

            {/* Email / SMTP Status */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium border ${
                systemStatus?.smtpConnected
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
              title={
                systemStatus?.smtpConnected
                  ? 'Real SMTP email transport active'
                  : 'Interactive Demo Email Outbox active'
              }
            >
              <Mail className="w-3.5 h-3.5" />
              <span>{systemStatus?.smtpConnected ? 'SMTP Live' : 'Demo Outbox Mode'}</span>
            </div>
          </div>

          {/* Right Action Tools & Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Email Outbox Trigger */}
            <button
              onClick={onOpenOutbox}
              className="relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-blue-700 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-lg transition-colors"
              title="View sent emails & demo logs"
            >
              <Mail className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">Email Outbox</span>
              {emailCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 bg-blue-600 text-white rounded-full text-[10px] font-bold">
                  {emailCount}
                </span>
              )}
            </button>

            {/* VS Code & Python Guide */}
            <button
              onClick={onOpenGuide}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-blue-700 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-lg transition-colors"
              title="Python Flask & SQLite local setup guide"
            >
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span className="hidden md:inline">VS Code / Flask Guide</span>
            </button>

            {/* Switch User Dropdown */}
            <div className="relative group">
              <button
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
                title="Switch active user (Intern or Mentor)"
              >
                <img
                  src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-500/20"
                />
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-semibold text-slate-900 flex items-center gap-1">
                    {currentUser.name}
                    {currentUser.role === 'mentor' && (
                      <span className="px-1 text-[10px] font-bold rounded bg-amber-100 text-amber-800">
                        MENTOR
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate max-w-[120px]">
                    {currentUser.track.split('&')[0]}
                  </div>
                </div>
              </button>

              {/* Dropdown Menu */}
              <div className="absolute right-0 mt-1 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 hidden group-hover:block hover:block z-50">
                <div className="px-3 py-1.5 border-b border-slate-100 mb-1">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Quick Role Switcher
                  </p>
                </div>

                {users.map(u => (
                  <button
                    key={u.id}
                    onClick={() => onSwitchUser(u)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-blue-50 text-xs transition-colors ${
                      u.id === currentUser.id ? 'bg-blue-50/80 font-medium text-blue-700' : 'text-slate-700'
                    }`}
                  >
                    <img
                      src={u.avatar}
                      alt={u.name}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="truncate">{u.name}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                            u.role === 'mentor'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {u.role}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate">{u.email}</p>
                    </div>
                  </button>
                ))}

                <div className="border-t border-slate-100 mt-1 pt-1 px-2">
                  <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
