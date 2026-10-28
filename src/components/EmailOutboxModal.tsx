import React, { useState } from 'react';
import { EmailLog } from '../types';
import {
  Mail,
  X,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldAlert,
  Send,
  Eye,
  Inbox,
  Sparkles,
} from 'lucide-react';

interface EmailOutboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  emails: EmailLog[];
  onRefresh: () => void;
}

export const EmailOutboxModal: React.FC<EmailOutboxModalProps> = ({
  isOpen,
  onClose,
  emails,
  onRefresh,
}) => {
  const [selectedEmail, setSelectedEmail] = useState<EmailLog | null>(emails[0] || null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white rounded-2xl max-w-4xl w-full h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">Email Outbox &amp; Audit Logs</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                  {emails.length} Dispatched
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Inspect automated review invitations, task briefings, and evaluation reports
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Refresh
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Two-pane layout: Email list on left, rendered preview on right */}
        <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
          {/* Left: Email list */}
          <div className="w-full sm:w-80 border-r border-slate-200 overflow-y-auto bg-slate-50/50 divide-y divide-slate-100">
            {emails.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                <Inbox className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                No emails dispatched yet. Schedule a review or trigger an evaluation to send one.
              </div>
            ) : (
              emails.map(eml => {
                const isSelected = selectedEmail?.id === eml.id;

                return (
                  <button
                    key={eml.id}
                    onClick={() => setSelectedEmail(eml)}
                    className={`w-full text-left p-3.5 transition-colors cursor-pointer ${
                      isSelected ? 'bg-blue-50/80 border-l-4 border-blue-600' : 'hover:bg-slate-100/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {eml.recipient_name}
                      </span>
                      <span
                        className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded ${
                          eml.status === 'delivered'
                            ? 'bg-emerald-100 text-emerald-800'
                            : eml.status === 'failed'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {eml.sent_via === 'smtp' ? 'SMTP' : 'DEMO MODE'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 font-medium line-clamp-1">
                      {eml.subject}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                      <span className="truncate">{eml.recipient_email}</span>
                      <span>{new Date(eml.sent_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Right: Email content preview */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/50 flex flex-col">
            {selectedEmail ? (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4 flex-1">
                {/* Meta details */}
                <div className="border-b border-slate-100 pb-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        selectedEmail.sent_via === 'smtp'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {selectedEmail.sent_via === 'smtp'
                        ? 'Delivered via Real SMTP'
                        : 'Interactive Demo Mode (Saved to Outbox)'}
                    </span>

                    <span className="text-xs text-slate-400">
                      {new Date(selectedEmail.sent_at).toLocaleString()}
                    </span>
                  </div>

                  <h4 className="text-base sm:text-lg font-bold text-slate-900">
                    {selectedEmail.subject}
                  </h4>

                  <div className="text-xs text-slate-600 space-y-0.5">
                    <div>
                      <span className="font-semibold text-slate-700">To: </span>
                      {selectedEmail.recipient_name} &lt;{selectedEmail.recipient_email}&gt;
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700">From: </span>
                      InternPilot AI Mentorship System
                    </div>
                  </div>

                  {selectedEmail.sent_via === 'demo_mode' && (
                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Demo Mode Active:</strong> SMTP credentials are not configured in your environment. This notification was intercepted and recorded here for full inspection without external mail dispatch.
                      </div>
                    </div>
                  )}

                  {selectedEmail.status === 'failed' && (
                    <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-start gap-2">
                      <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Delivery Error:</strong> {selectedEmail.error_message}
                      </div>
                    </div>
                  )}
                </div>

                {/* Rendered HTML body */}
                <div className="email-html-wrapper p-4 bg-slate-50/50 rounded-xl border border-slate-100 text-sm">
                  <div
                    dangerouslySetInnerHTML={{ __html: selectedEmail.body_html }}
                    className="prose prose-sm max-w-none"
                  />
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
                Select an email from the list to preview its rendered HTML output.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>SMTP configuration can be provided via .env (SMTP_HOST, SMTP_USER, SMTP_PASS)</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg cursor-pointer"
          >
            Close Outbox
          </button>
        </div>
      </div>
    </div>
  );
};
