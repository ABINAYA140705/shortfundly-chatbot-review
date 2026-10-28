import React, { useState } from 'react';
import {
  BookOpen,
  X,
  Copy,
  Check,
  Terminal,
  FolderTree,
  FileCode,
  Sparkles,
  Server,
  Play,
} from 'lucide-react';

interface LocalSetupGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LocalSetupGuideModal: React.FC<LocalSetupGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'quick' | 'flask' | 'node' | 'structure'>('quick');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white rounded-2xl max-w-4xl w-full h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Local VS Code &amp; Python Flask Setup Guide
              </h3>
              <p className="text-xs text-slate-500">
                Complete instructions to run both Python Flask + SQLite or Node/Express locally
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="px-6 border-b border-slate-200 flex items-center gap-4 bg-slate-50/50 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('quick')}
            className={`py-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'quick' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Quick 2-Minute Start
          </button>
          <button
            onClick={() => setActiveTab('flask')}
            className={`py-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'flask' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Python Flask + SQLite Backend
          </button>
          <button
            onClick={() => setActiveTab('node')}
            className={`py-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'node' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Node.js / Express Runtime
          </button>
          <button
            onClick={() => setActiveTab('structure')}
            className={`py-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'structure' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Project Folder Tree
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-700">
          {activeTab === 'quick' && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
                <span className="font-bold text-sm text-blue-900 block">
                  🚀 Running in VS Code (Beginner Friendly)
                </span>
                <p className="leading-relaxed text-blue-950">
                  InternPilot AI is designed with complete dual implementations: you can run the application directly using Node.js &amp; Vite, or run the standalone Python Flask backend located in <code className="font-mono bg-blue-100 px-1 py-0.5 rounded text-blue-900 font-semibold">/python-backend</code>!
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm">Step 1: Clone or Open in VS Code</h4>
                <div className="relative bg-slate-900 text-slate-100 p-3.5 rounded-xl font-mono text-[11px]">
                  <button
                    onClick={() => copyToClipboard('cd internpilot-ai\ncode .', 'step1')}
                    className="absolute top-2.5 right-2.5 p-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300"
                  >
                    {copiedKey === 'step1' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <pre>cd internpilot-ai&#10;code .</pre>
                </div>

                <h4 className="font-bold text-slate-900 text-sm">Step 2: Install Node Dependencies &amp; Start</h4>
                <div className="relative bg-slate-900 text-slate-100 p-3.5 rounded-xl font-mono text-[11px]">
                  <button
                    onClick={() => copyToClipboard('npm install\nnpm run dev', 'step2')}
                    className="absolute top-2.5 right-2.5 p-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300"
                  >
                    {copiedKey === 'step2' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <pre>npm install&#10;npm run dev</pre>
                </div>
                <p className="text-slate-500">
                  Open <span className="font-semibold text-blue-600">http://localhost:3000</span> in your browser. The SQLite database is automatically seeded!
                </p>

                <h4 className="font-bold text-slate-900 text-sm">Step 3: Sample Accounts for Instant Testing</h4>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="font-bold text-slate-900 block">Alex Rivera (Full-Stack Intern)</span>
                    <span className="text-slate-500">alex@internpilot.ai / intern123</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="font-bold text-slate-900 block">Sarah Connor (Engineering Mentor)</span>
                    <span className="text-slate-500">mentor@internpilot.ai / mentor123</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'flask' && (
            <div className="space-y-4">
              <h4 className="font-bold text-slate-900 text-sm">Python Flask + SQLite Backend Setup</h4>
              <p className="leading-relaxed">
                The folder <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-blue-600">/python-backend</code> contains the full Python Flask API with SQLAlchemy/SQLite, Gemini API integration, and SMTP mailer.
              </p>

              <div className="space-y-2">
                <span className="font-bold text-slate-800">1. Create virtual environment &amp; install requirements:</span>
                <div className="relative bg-slate-900 text-slate-100 p-3.5 rounded-xl font-mono text-[11px]">
                  <button
                    onClick={() =>
                      copyToClipboard(
                        'cd python-backend\npython3 -m venv venv\nsource venv/bin/activate  # On Windows: venv\\Scripts\\activate\npip install -r requirements.txt',
                        'flask_install'
                      )
                    }
                    className="absolute top-2.5 right-2.5 p-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300"
                  >
                    {copiedKey === 'flask_install' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <pre>
cd python-backend&#10;python3 -m venv venv&#10;source venv/bin/activate  # Windows: venv\Scripts\activate&#10;pip install -r requirements.txt
                  </pre>
                </div>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-slate-800">2. Configure .env in python-backend:</span>
                <div className="bg-slate-900 text-slate-100 p-3.5 rounded-xl font-mono text-[11px]">
                  <pre>
GEMINI_API_KEY=your_gemini_api_key&#10;SMTP_HOST=smtp.gmail.com&#10;SMTP_PORT=587&#10;SMTP_USER=you@example.com&#10;SMTP_PASS=app_password
                  </pre>
                </div>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-slate-800">3. Seed Database &amp; Run Server:</span>
                <div className="relative bg-slate-900 text-slate-100 p-3.5 rounded-xl font-mono text-[11px]">
                  <button
                    onClick={() => copyToClipboard('python seed_data.py\npython app.py', 'flask_run')}
                    className="absolute top-2.5 right-2.5 p-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300"
                  >
                    {copiedKey === 'flask_run' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <pre>python seed_data.py&#10;python app.py</pre>
                </div>
                <p className="text-slate-500">Flask server starts at http://127.0.0.1:5000</p>
              </div>
            </div>
          )}

          {activeTab === 'node' && (
            <div className="space-y-4">
              <h4 className="font-bold text-slate-900 text-sm">Full-Stack Node.js &amp; Express Engine</h4>
              <p className="leading-relaxed">
                The application's root server is built with Node.js, Express, better-sqlite3, and Vite middlewares for an all-in-one developer experience on port 3000.
              </p>

              <div className="space-y-2">
                <span className="font-bold text-slate-800">Available NPM Scripts:</span>
                <div className="bg-slate-900 text-slate-100 p-3.5 rounded-xl font-mono text-[11px] space-y-1">
                  <p><span className="text-blue-400">npm run dev</span>    - Starts Express + Vite on port 3000 with HMR</p>
                  <p><span className="text-blue-400">npm run build</span>  - Builds static frontend bundle in /dist</p>
                  <p><span className="text-blue-400">npm run start</span>  - Runs production Express server</p>
                  <p><span className="text-blue-400">npm run lint</span>   - Validates TypeScript typing without emit</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'structure' && (
            <div className="space-y-4">
              <h4 className="font-bold text-slate-900 text-sm">Complete Project Structure</h4>
              <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-[11px] leading-relaxed">
                <pre>
{`├── package.json               # Full-stack dependencies & scripts
├── tsconfig.json             # TypeScript configuration
├── vite.config.ts            # Vite + Tailwind configuration
├── server.ts                 # Full-stack Express server with Vite middleware
├── server/
│   ├── db.ts                 # SQLite schema, tables, and seeder
│   ├── gemini.ts             # Gemini 3.8 Flash SDK service
│   └── mailer.ts             # Nodemailer SMTP & Demo mode logger
├── src/
│   ├── App.tsx               # Main application orchestration & views
│   ├── main.tsx              # React DOM entry point
│   ├── types/index.ts        # TypeScript data definitions
│   ├── services/
│   │   ├── api.ts            # REST client endpoints
│   │   └── speech.ts         # Natural speech synthesis reader
│   └── components/
│       ├── Navbar.tsx
│       ├── LoginView.tsx
│       ├── TaskOverviewCard.tsx
│       ├── VoiceExplanationPlayer.tsx
│       ├── ChatAssistant.tsx
│       ├── WorkSubmissionCard.tsx
│       ├── EvaluationReportCard.tsx
│       ├── ReviewScheduleCard.tsx
│       ├── ScheduleReviewModal.tsx
│       ├── SubmissionHistoryCard.tsx
│       ├── MentorPortal.tsx
│       ├── EmailOutboxModal.tsx
│       └── LocalSetupGuideModal.tsx
├── python-backend/           # Standalone Python Flask + SQLite Backend
│   ├── app.py                # Flask application & endpoints
│   ├── models.py             # SQLite database models
│   ├── seed_data.py          # Sample data seeder
│   ├── requirements.txt      # Python dependencies
│   └── README.md             # Flask setup instructions
├── uploads/                  # Secure file upload storage
└── database.sqlite           # Persistent SQLite database`}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>InternPilot AI &bull; Enterprise Mentorship Platform</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg cursor-pointer"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
