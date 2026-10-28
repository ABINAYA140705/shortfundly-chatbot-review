import React, { useState, useRef } from 'react';
import { Task, User, Submission } from '../types';
import { api } from '../services/api';
import JSZip from 'jszip';
import {
  Upload,
  FileCode,
  FileArchive,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  Sparkles,
  ExternalLink,
  Eye,
  X,
} from 'lucide-react';

interface WorkSubmissionCardProps {
  intern: User;
  task: Task;
  onSubmissionSuccess: (submission: Submission) => void;
  onTriggerEvaluation: (submissionId: string) => void;
  isEvaluating?: boolean;
}

export const WorkSubmissionCard: React.FC<WorkSubmissionCardProps> = ({
  intern,
  task,
  onSubmissionSuccess,
  onTriggerEvaluation,
  isEvaluating,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastUploaded, setLastUploaded] = useState<Submission | null>(null);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [loadingSample, setLoadingSample] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedExtensions = [
    '.pdf', '.docx', '.txt', '.md', '.zip',
    '.py', '.js', '.ts', '.jsx', '.tsx', '.json',
    '.html', '.css', '.java', '.cpp', '.sql'
  ];

  const handleFile = (file: File) => {
    setErrorMsg(null);
    if (file.size > 25 * 1024 * 1024) {
      setErrorMsg('File exceeds 25MB maximum limit.');
      return;
    }
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      setErrorMsg(`Unsupported file format "${ext}". Supported: PDF, DOCX, TXT, ZIP, and source code (.py, .ts, .js, .java, etc.)`);
      return;
    }
    setSelectedFile(file);

    // If text/code file, read preview locally
    if (file.size < 500 * 1024 && !file.name.endsWith('.zip') && !file.name.endsWith('.pdf') && !file.name.endsWith('.docx')) {
      const reader = new FileReader();
      reader.onload = e => {
        setPreviewContent((e.target?.result as string) || null);
      };
      reader.readAsText(file);
    } else {
      setPreviewContent(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('internId', intern.id);
      formData.append('taskId', task.id);

      const res = await api.uploadSubmission(formData);
      setLastUploaded(res.submission);
      onSubmissionSuccess(res.submission);
      setSelectedFile(null);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'File upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleLoadSample = async (url: string, filename: string) => {
    setLoadingSample(filename);
    setErrorMsg(null);
    try {
      let file: File | null = null;
      try {
        const res = await fetch(url);
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && !contentType.includes('text/html')) {
          const blob = await res.blob();
          file = new File([blob], filename, { type: blob.type || 'application/octet-stream' });
        }
      } catch (netErr) {
        console.warn('Network sample fetch fallback:', netErr);
      }

      // If network fetch failed or returned HTML, generate sample file in-memory
      if (!file) {
        if (filename.endsWith('.zip')) {
          const zip = new JSZip();
          const completeCode = `"""
InternPilot AI Sample Submission
Task: Implement Secure User Authentication & Role-Based Access Control
"""
import sqlite3, hashlib, os, time, functools

DB_NAME = "auth_service.sqlite"

def init_auth_db():
    conn = sqlite3.connect(DB_NAME)
    conn.execute("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, email TEXT UNIQUE, password_hash TEXT, salt TEXT, role TEXT);")
    conn.commit()
    conn.close()

def hash_password(password: str, salt: bytes = None):
    salt = salt or os.urandom(16)
    key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
    return key.hex(), salt.hex()

def register_user(email: str, password: str, role: str = "intern"):
    pwd_hash, salt = hash_password(password)
    conn = sqlite3.connect(DB_NAME)
    conn.execute("INSERT INTO users (email, password_hash, salt, role) VALUES (?, ?, ?, ?)", (email.lower(), pwd_hash, salt, role))
    conn.commit()
    conn.close()
    return {"email": email, "role": role}

def login_user(email: str, password: str):
    conn = sqlite3.connect(DB_NAME)
    row = conn.execute("SELECT id, email, password_hash, salt, role FROM users WHERE email = ?", (email.lower(),)).fetchone()
    conn.close()
    if not row: raise PermissionError("Invalid credentials")
    return {"access_token": f"jwt_{row[0]}_{row[4]}", "user": {"id": row[0], "email": row[1], "role": row[4]}}

def require_role(roles):
    def dec(fn):
        def wrap(user, *a, **kw):
            if not user or user.get("role") not in roles:
                return {"error": "Forbidden: Insufficient privileges", "status": 403}
            return fn(user, *a, **kw)
        return wrap
    return dec

@require_role(["admin", "mentor"])
def mentor_endpoint(user): return {"message": "Access granted to mentor review portal"}

def run_unit_tests():
    init_auth_db()
    register_user("alex_test@internpilot.ai", "Pass1234!", "intern")
    auth = login_user("alex_test@internpilot.ai", "Pass1234!")
    assert auth["user"]["role"] == "intern"
    res = mentor_endpoint(auth["user"])
    assert res["status"] == 403
    print("ALL MODULE TESTS PASSED")

if __name__ == "__main__":
    run_unit_tests()
`;
          zip.file('auth_service.py', completeCode);
          zip.file('README.md', '# Authentication & RBAC Service\nAll modules implemented with verified test suite.');
          zip.file('tests/test_auth.py', completeCode);
          const zipBlob = await zip.generateAsync({ type: 'blob' });
          file = new File([zipBlob], filename, { type: 'application/zip' });
        } else if (filename.includes('partial')) {
          const partialCode = `"""
InternPilot AI Partial Draft
Task: User Authentication & RBAC (Draft missing RBAC & Tests)
"""
import sqlite3

def login(email, password):
    conn = sqlite3.connect("db.sqlite")
    user = conn.execute("SELECT * FROM users WHERE email=? AND password=?", (email, password)).fetchone()
    conn.close()
    return user is not None
`;
          file = new File([partialCode], filename, { type: 'text/x-python' });
        } else if (filename.endsWith('.md')) {
          const docContent = `# Technical Deliverable Report: Authentication & RBAC System
**Intern:** Alex Rivera  
**Task:** Implement Secure User Authentication & Role-Based Access Control  

## Verified Deliverables
1. **Module 1 - User Authentication:** Implemented PBKDF2 hashing & JWT tokens.
2. **Module 2 - RBAC Middleware:** Restricts mentor & admin routes with HTTP 403.
3. **Module 3 - SQLite Schema:** Users table with unique email index.
4. **Module 4 - Automated Tests:** Unit test assertions covering positive and negative cases.
`;
          file = new File([docContent], filename, { type: 'text/markdown' });
        } else {
          const fullCode = `"""
InternPilot AI Complete Solution
Intern: Alex Rivera
Task: Implement Secure User Authentication & Role-Based Access Control

Modules:
1. User Registration & Auth with password hashing and JWT
2. Role-Based Access Control (RBAC) middleware
3. SQLite database schema with indexes
4. Automated unit tests
"""
import sqlite3, hashlib, os, time, functools

DB_NAME = "auth_service.sqlite"

def init_auth_db():
    conn = sqlite3.connect(DB_NAME)
    conn.execute("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, email TEXT UNIQUE, password_hash TEXT, salt TEXT, role TEXT);")
    conn.commit()
    conn.close()

def hash_password(password: str, salt: bytes = None):
    salt = salt or os.urandom(16)
    key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
    return key.hex(), salt.hex()

def register_user(email: str, password: str, role: str = "intern"):
    pwd_hash, salt = hash_password(password)
    conn = sqlite3.connect(DB_NAME)
    conn.execute("INSERT INTO users (email, password_hash, salt, role) VALUES (?, ?, ?, ?)", (email.lower(), pwd_hash, salt, role))
    conn.commit()
    conn.close()
    return {"email": email, "role": role}

def login_user(email: str, password: str):
    conn = sqlite3.connect(DB_NAME)
    row = conn.execute("SELECT id, email, password_hash, salt, role FROM users WHERE email = ?", (email.lower(),)).fetchone()
    conn.close()
    if not row: raise PermissionError("Invalid credentials")
    return {"access_token": f"jwt_{row[0]}_{row[4]}", "user": {"id": row[0], "email": row[1], "role": row[4]}}

def require_role(roles):
    def dec(fn):
        def wrap(user, *a, **kw):
            if not user or user.get("role") not in roles:
                return {"error": "Forbidden: Insufficient privileges", "status": 403}
            return fn(user, *a, **kw)
        return wrap
    return dec

@require_role(["admin", "mentor"])
def mentor_review_endpoint(user): return {"message": "Access granted to mentor review portal"}

def run_unit_tests():
    init_auth_db()
    register_user("alex_test@internpilot.ai", "Pass1234!", "intern")
    auth = login_user("alex_test@internpilot.ai", "Pass1234!")
    assert auth["user"]["role"] == "intern"
    res = mentor_review_endpoint(auth["user"])
    assert res["status"] == 403
    print("ALL MODULE TESTS PASSED")

if __name__ == "__main__":
    run_unit_tests()
`;
          file = new File([fullCode], filename, { type: 'text/x-python' });
        }
      }

      handleFile(file);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(`Failed to load sample: ${err.message}`);
    } finally {
      setLoadingSample(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-600" />
            <span>Upload Completed Work for Review</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Submit your source code, project archive, or documentation before the review meeting.
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 self-start sm:self-auto">
          Max file size: 25 MB
        </span>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Drag & Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-blue-500 bg-blue-50/50 scale-[0.99]'
            : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={e => {
            if (e.target.files && e.target.files[0]) {
              handleFile(e.target.files[0]);
            }
          }}
        />

        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3 ring-4 ring-blue-50/50">
          <Upload className="w-6 h-6" />
        </div>

        <p className="text-sm font-semibold text-slate-800">
          Drag &amp; drop your completed work here, or <span className="text-blue-600 underline">browse files</span>
        </p>

        <p className="text-xs text-slate-500 mt-1.5">
          Supported: <span className="font-mono text-slate-600 font-medium">.py, .js, .ts, .zip, .pdf, .docx, .txt, .json</span>
        </p>
      </div>

      {/* Quick Test Sample Submissions Toolbar */}
      <div className="bg-blue-50/60 border border-blue-200/80 rounded-xl p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Test the AI Review &amp; Feedback System with Sample Files:</span>
          </div>
          <span className="text-[10px] text-blue-700 font-medium hidden sm:inline">1-Click Load or Download</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {/* Sample 1: Full Completed Project ZIP */}
          <div className="bg-white border border-blue-200 rounded-lg p-2.5 flex items-center justify-between gap-2 shadow-xs">
            <div className="min-w-0 flex items-center gap-2">
              <FileArchive className="w-4 h-4 text-indigo-600 shrink-0" />
              <div className="truncate">
                <span className="font-bold text-slate-800 block text-[11px] truncate">
                  Complete Project Archive (.ZIP)
                </span>
                <span className="text-[10px] text-emerald-600 font-medium">
                  All 4 Modules &bull; High Score Test
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => handleLoadSample('/samples/intern_auth_project_archive.zip', 'intern_auth_project_archive.zip')}
                disabled={loadingSample !== null}
                className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-semibold cursor-pointer"
              >
                {loadingSample === 'intern_auth_project_archive.zip' ? 'Loading...' : 'Load'}
              </button>
              <a
                href="/samples/intern_auth_project_archive.zip"
                download="intern_auth_project_archive.zip"
                className="p-1 text-slate-500 hover:text-slate-800 rounded hover:bg-slate-100"
                title="Download ZIP"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Sample 2: Complete Python Solution */}
          <div className="bg-white border border-blue-200 rounded-lg p-2.5 flex items-center justify-between gap-2 shadow-xs">
            <div className="min-w-0 flex items-center gap-2">
              <FileCode className="w-4 h-4 text-blue-600 shrink-0" />
              <div className="truncate">
                <span className="font-bold text-slate-800 block text-[11px] truncate">
                  Full Code Solution (.py)
                </span>
                <span className="text-[10px] text-blue-600 font-medium">
                  JWT, RBAC &amp; Tests Verified
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => handleLoadSample('/samples/alex_auth_complete_solution.py', 'alex_auth_complete_solution.py')}
                disabled={loadingSample !== null}
                className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-semibold cursor-pointer"
              >
                {loadingSample === 'alex_auth_complete_solution.py' ? 'Loading...' : 'Load'}
              </button>
              <a
                href="/samples/alex_auth_complete_solution.py"
                download="alex_auth_complete_solution.py"
                className="p-1 text-slate-500 hover:text-slate-800 rounded hover:bg-slate-100"
                title="Download Python Code"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Sample 3: Technical Documentation Report */}
          <div className="bg-white border border-blue-200 rounded-lg p-2.5 flex items-center justify-between gap-2 shadow-xs">
            <div className="min-w-0 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="truncate">
                <span className="font-bold text-slate-800 block text-[11px] truncate">
                  Technical Report Document (.md)
                </span>
                <span className="text-[10px] text-slate-500">
                  Sprint 1 Architecture &amp; Coverage
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => handleLoadSample('/samples/intern_task_submission_report.md', 'intern_task_submission_report.md')}
                disabled={loadingSample !== null}
                className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-semibold cursor-pointer"
              >
                {loadingSample === 'intern_task_submission_report.md' ? 'Loading...' : 'Load'}
              </button>
              <a
                href="/samples/intern_task_submission_report.md"
                download="intern_task_submission_report.md"
                className="p-1 text-slate-500 hover:text-slate-800 rounded hover:bg-slate-100"
                title="Download Document"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Sample 4: Incomplete / Partial Draft */}
          <div className="bg-white border border-amber-200 rounded-lg p-2.5 flex items-center justify-between gap-2 shadow-xs">
            <div className="min-w-0 flex items-center gap-2">
              <FileCode className="w-4 h-4 text-amber-600 shrink-0" />
              <div className="truncate">
                <span className="font-bold text-slate-800 block text-[11px] truncate">
                  Partial Draft Code (.py)
                </span>
                <span className="text-[10px] text-amber-700 font-medium">
                  Missing Tests &amp; RBAC &bull; Gap Test
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => handleLoadSample('/samples/alex_auth_partial_draft.py', 'alex_auth_partial_draft.py')}
                disabled={loadingSample !== null}
                className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[10px] font-semibold cursor-pointer"
              >
                {loadingSample === 'alex_auth_partial_draft.py' ? 'Loading...' : 'Load'}
              </button>
              <a
                href="/samples/alex_auth_partial_draft.py"
                download="alex_auth_partial_draft.py"
                className="p-1 text-slate-500 hover:text-slate-800 rounded hover:bg-slate-100"
                title="Download Partial Draft"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Selected File Card */}
      {selectedFile && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
              {selectedFile.name.endsWith('.zip') ? (
                <FileArchive className="w-5 h-5" />
              ) : selectedFile.name.endsWith('.pdf') || selectedFile.name.endsWith('.docx') ? (
                <FileText className="w-5 h-5" />
              ) : (
                <FileCode className="w-5 h-5" />
              )}
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-slate-900 truncate max-w-xs sm:max-w-md">
                {selectedFile.name}
              </p>
              <p className="text-[11px] text-slate-500">
                {formatFileSize(selectedFile.size)} &bull; Ready for upload &amp; audit
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {previewContent && (
              <button
                type="button"
                onClick={() => setShowPreviewModal(true)}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleUpload}
              disabled={isUploading}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium text-xs sm:text-sm rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Confirm &amp; Submit Work</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Success banner after upload with direct trigger evaluation button */}
      {lastUploaded && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-xs sm:text-sm font-bold text-emerald-950">
                Work successfully submitted: {lastUploaded.original_name} (v{lastUploaded.version})
              </p>
              <p className="text-[11px] text-emerald-800">
                Saved to your task portfolio. Trigger AI evaluation now to see your module completion report!
              </p>
            </div>
          </div>

          <button
            onClick={() => onTriggerEvaluation(lastUploaded.id)}
            disabled={isEvaluating}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
          >
            {isEvaluating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Running Gemini AI Audit...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Run AI Work Evaluation</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Code / Text Preview Modal */}
      {showPreviewModal && previewContent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-bold text-slate-900">
                  Submission Code Preview: {selectedFile?.name}
                </span>
              </div>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex-1 overflow-y-auto bg-slate-950 text-slate-100 font-mono text-xs leading-relaxed">
              <pre className="whitespace-pre-wrap">{previewContent}</pre>
            </div>
            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 bg-slate-800 text-white text-xs font-semibold rounded-xl hover:bg-slate-900 cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
