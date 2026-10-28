import { GoogleGenAI } from '@google/genai';

export interface EvaluationResult {
  score: number; // 0 - 100
  overallVerdict: 'Meets Expectations' | 'Needs Revision' | 'Partial Progress' | 'Exceeds Expectations';
  completedModules: Array<{
    moduleId: string;
    title: string;
    evidence: string;
  }>;
  missingModules: Array<{
    moduleId: string;
    title: string;
    reason: string;
  }>;
  incompleteParts: Array<{
    component: string;
    issue: string;
  }>;
  suggestions: string[];
  detailedFeedback: string;
  evaluatedBy: 'gemini-3.8-flash' | 'demo_evaluator';
  evaluatedAt: string;
}

let aiInstance: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiInstance;
}

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');
}

/**
 * Task Chat / Q&A Assistant using Gemini 3.8 Flash
 */
export async function askTaskAssistant(params: {
  internName: string;
  taskTitle: string;
  taskObjective: string;
  modules: any[];
  expectedOutput: string;
  deadline: string;
  userQuestion: string;
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
}): Promise<{ answer: string; usedModel: 'gemini-3.8-flash' | 'demo_evaluator' }> {
  const ai = getAiClient();

  if (!ai) {
    // Domain-aware fallback responses
    return {
      answer: getDemoChatAnswer(params.userQuestion, params.taskTitle, params.modules),
      usedModel: 'demo_evaluator',
    };
  }

  try {
    const modulesText = params.modules
      .map((m, i) => `${i + 1}. [${m.title}]: ${m.description} (Required: ${m.required ? 'Yes' : 'No'})`)
      .join('\n');

    const historyPrompt = params.conversationHistory
      .slice(-6)
      .map(h => `${h.role === 'user' ? 'Intern' : 'Assistant'}: ${h.content}`)
      .join('\n');

    const prompt = `You are InternPilot AI, an encouraging, professional, and pragmatic senior engineering mentor guiding an intern.
The intern is asking a question about their assigned task.

TASK DETAILS:
- Title: ${params.taskTitle}
- Objective: ${params.taskObjective}
- Required Modules:
${modulesText}
- Expected Output: ${params.expectedOutput}
- Deadline: ${params.deadline}
- Intern Name: ${params.internName}

RECENT CONVERSATION:
${historyPrompt}

INTERN'S NEW QUESTION:
"${params.userQuestion}"

INSTRUCTIONS:
1. Provide a direct, step-by-step, actionable answer tailored specifically to their task and modules.
2. If they ask about implementation details, give concrete code snippets or clear architecture patterns.
3. Keep the tone warm, empowering, and clear for early-career interns.
4. Keep the response concise and well-structured with clear bullet points.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are InternPilot AI, a wise, constructive mentor helping software interns succeed.',
        temperature: 0.6,
      },
    });

    return {
      answer: response.text || 'I analyzed your request. Keep focusing on the required task modules and reach out if you have specific code questions!',
      usedModel: 'gemini-3.8-flash',
    };
  } catch (err: any) {
    console.error('[Gemini Task Assistant Error]:', err);
    return {
      answer: getDemoChatAnswer(params.userQuestion, params.taskTitle, params.modules),
      usedModel: 'demo_evaluator',
    };
  }
}

/**
 * AI-Powered Work Evaluation using Gemini 3.8 Flash
 * Strict requirement: "Do not claim that a module is completed unless the submitted work provides evidence."
 */
export async function evaluateSubmission(params: {
  internName: string;
  taskTitle: string;
  taskObjective: string;
  modules: Array<{ id: string; title: string; description: string; required?: boolean }>;
  expectedOutput: string;
  filename: string;
  fileType: string;
  fileContent: string;
}): Promise<EvaluationResult> {
  const ai = getAiClient();

  if (!ai) {
    return runDemoEvaluation(params);
  }

  try {
    const modulesSpec = JSON.stringify(params.modules, null, 2);
    // Truncate file content if excessively long to fit tokens cleanly
    const sampleContent = params.fileContent.slice(0, 18000);

    const prompt = `You are an expert technical auditor and internship evaluator.
Your job is to thoroughly evaluate the intern's submitted work against the task specification.

CRITICAL INSTRUCTION:
DO NOT claim that a module is completed unless the submitted work provides clear, concrete evidence.
If a module has no corresponding code, implementation, or files in the submitted work, mark it as MISSING.
If a module is partially implemented or missing error handling/tests, mark it as INCOMPLETE.

TASK DETAILS:
- Title: ${params.taskTitle}
- Objective: ${params.taskObjective}
- Expected Deliverable: ${params.expectedOutput}
- Required Modules:
${modulesSpec}

SUBMISSION FILE:
- Filename: ${params.filename} (${params.fileType})
- Content / Source Code:
\`\`\`
${sampleContent}
\`\`\`

You must respond with valid JSON adhering EXACTLY to this JSON structure:
{
  "score": number, // 0 to 100 based strictly on verified completion and quality
  "overallVerdict": "Meets Expectations" | "Needs Revision" | "Partial Progress" | "Exceeds Expectations",
  "completedModules": [
    {
      "moduleId": string,
      "title": string,
      "evidence": string // Exact code function, route, or file snippet proving completion
    }
  ],
  "missingModules": [
    {
      "moduleId": string,
      "title": string,
      "reason": string // Specific missing requirement
    }
  ],
  "incompleteParts": [
    {
      "component": string,
      "issue": string
    }
  ],
  "suggestions": [
    string // Actionable advice to improve or complete the work
  ],
  "detailedFeedback": string // Comprehensive mentor review summary
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2, // low temperature for objective audit
      },
    });

    const text = response.text?.trim() || '{}';
    const parsed = JSON.parse(text);

    return {
      score: typeof parsed.score === 'number' ? Math.max(0, Math.min(100, parsed.score)) : 70,
      overallVerdict: parsed.overallVerdict || 'Needs Revision',
      completedModules: Array.isArray(parsed.completedModules) ? parsed.completedModules : [],
      missingModules: Array.isArray(parsed.missingModules) ? parsed.missingModules : [],
      incompleteParts: Array.isArray(parsed.incompleteParts) ? parsed.incompleteParts : [],
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : ['Review the remaining task modules before the next scheduled review.'],
      detailedFeedback: parsed.detailedFeedback || 'Submission evaluated against task requirements.',
      evaluatedBy: 'gemini-3.8-flash',
      evaluatedAt: new Date().toISOString(),
    };
  } catch (err: any) {
    console.error('[Gemini Work Evaluation Error]:', err);
    return runDemoEvaluation(params);
  }
}

function getDemoChatAnswer(question: string, taskTitle: string, modules: any[]): string {
  const q = question.toLowerCase();
  if (q.includes('deadline') || q.includes('when')) {
    return `Your assigned task "${taskTitle}" has an upcoming deadline shown in your review card. Make sure to submit your draft 24 hours prior so your mentor can review the automated evaluation.`;
  }
  if (q.includes('module') || q.includes('step') || q.includes('start')) {
    const firstMod = modules[0]?.title || 'Module 1';
    return `For "${taskTitle}", start with **${firstMod}**. Verify inputs and build automated test cases as you go. You can upload intermediate drafts anytime to see which modules are validated.`;
  }
  if (q.includes('submit') || q.includes('upload') || q.includes('format')) {
    return `You can submit single code files (.py, .ts, .js, .java, .cpp), documentation (.txt, .md, .pdf), or an entire project archived as a .zip file. The AI evaluation system parses your code and verifies each module against expected deliverables.`;
  }
  return `Regarding "${taskTitle}": Ensure your solution covers all ${modules.length} required modules. Submit your work before the scheduled mentor review. Feel free to ask specific implementation questions anytime!`;
}

function runDemoEvaluation(params: {
  internName: string;
  taskTitle: string;
  taskObjective: string;
  modules: Array<{ id: string; title: string; description: string }>;
  expectedOutput: string;
  filename: string;
  fileContent: string;
}): EvaluationResult {
  const content = params.fileContent.toLowerCase();
  const completed: Array<{ moduleId: string; title: string; evidence: string }> = [];
  const missing: Array<{ moduleId: string; title: string; reason: string }> = [];
  const incomplete: Array<{ component: string; issue: string }> = [];

  params.modules.forEach(mod => {
    // Check keywords from module title or description in submitted text/code
    const keywords = mod.title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const matched = keywords.filter(k => content.includes(k));

    if (matched.length >= 2 || (keywords.length === 1 && matched.length === 1)) {
      completed.push({
        moduleId: mod.id,
        title: mod.title,
        evidence: `Found implementation patterns matching "${matched.join(', ')}" in submitted file ${params.filename}.`,
      });
    } else if (matched.length === 1) {
      incomplete.push({
        component: mod.title,
        issue: `Partial implementation detected for "${matched[0]}", but missing full functionality and automated tests.`,
      });
    } else {
      missing.push({
        moduleId: mod.id,
        title: mod.title,
        reason: `No evidence of code or documentation found in ${params.filename} for this module.`,
      });
    }
  });

  const total = params.modules.length;
  const completedRatio = completed.length / Math.max(1, total);
  const score = Math.round(completedRatio * 75 + (incomplete.length > 0 ? 15 : 0) + (params.fileContent.length > 200 ? 10 : 5));

  let verdict: 'Meets Expectations' | 'Needs Revision' | 'Partial Progress' | 'Exceeds Expectations' = 'Partial Progress';
  if (score >= 85) verdict = 'Exceeds Expectations';
  else if (score >= 70) verdict = 'Meets Expectations';
  else if (score >= 50) verdict = 'Partial Progress';
  else verdict = 'Needs Revision';

  return {
    score: Math.min(100, Math.max(20, score)),
    overallVerdict: verdict,
    completedModules: completed,
    missingModules: missing,
    incompleteParts: incomplete,
    suggestions: [
      missing.length > 0
        ? `Implement missing module "${missing[0].title}" before the upcoming review.`
        : 'Solid progress! Consider adding more test assertions and edge-case handling.',
      'Document your setup and API request/response formats in a README.',
      'Prepare a 3-minute walkthrough demo for your scheduled mentor meeting.',
    ],
    detailedFeedback: `Evaluated ${params.filename} against "${params.taskTitle}". Completed ${completed.length} of ${total} modules. Review the evidence breakdown below to prepare for your review session.`,
    evaluatedBy: 'demo_evaluator',
    evaluatedAt: new Date().toISOString(),
  };
}
