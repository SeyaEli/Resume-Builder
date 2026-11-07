import type { Resume } from '../types/resume';
import { createId } from '../types/resume';
import { analyzeResume } from './atsScorer';
import type { AITextChange, OptimizeResult } from './aiEngine';
import {
  generateSummary, generateLinkedInHeadline, generateLinkedInAbout, careerCoachReply,
  buildResumeText, suggestBullets, suggestSkills, optimizeResume,
  type OptimizeOptions,
} from './aiEngine';

export type AiKind = 'summary' | 'coach' | 'cover-letter' | 'linkedin-about' | 'bullets' | 'skills';

export interface AiRequest {
  kind: AiKind;
  resume?: Resume;
  /** Free text from the user: a question, a job description, a role name. */
  input?: string;
  /** Used by the coach so repeated asks give different, deeper answers. */
  turn?: number;
  history?: { role: 'user' | 'assistant'; content: string }[];
}

export interface AiResult {
  text: string;
  /** Which provider actually produced the text. */
  provider: 'builtin' | 'groq';
  /** Set when a connected model was tried and the built-in engine answered instead. */
  fallbackReason?: string;
}

export interface AiConfig {
  provider: 'builtin' | 'groq';
  model: string;
}

const CONFIG_KEY = 'ats-resume-platform-ai';

export const DEFAULT_AI_CONFIG: AiConfig = {
  provider: 'builtin',
  model: '',
};

export function getAiConfig(): AiConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return { ...DEFAULT_AI_CONFIG };
    const parsed = JSON.parse(raw) as Partial<AiConfig>;
    const safe: AiConfig = { provider: parsed.provider === 'groq' ? 'groq' : 'builtin', model: typeof parsed.model === 'string' ? parsed.model : '' };
    // Rewrite legacy settings to remove previously stored API keys and endpoints.
    localStorage.setItem(CONFIG_KEY, JSON.stringify(safe));
    return safe;
  } catch {
    try { localStorage.removeItem(CONFIG_KEY); } catch { /* storage unavailable */ }
    return { ...DEFAULT_AI_CONFIG };
  }
}

export function saveAiConfig(config: AiConfig): void {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify({ provider: config.provider, model: config.model }));
  } catch {
    /* private mode — the setting simply does not persist */
  }
}

export function isConnectedReady(): boolean {
  const c = getAiConfig();
  return c.provider === 'groq' && hasAiAccessPassword();
}

// ============================================
// Built-in engine
// ============================================

function runBuiltin(req: AiRequest): string {
  const { resume, input = '', turn = 0 } = req;

  switch (req.kind) {
    case 'summary':
      return resume ? generateSummary(resume, input) : '';
    case 'coach':
      return careerCoachReply(input, resume, turn);
    case 'linkedin-about':
      return resume ? buildLinkedInAbout(resume) : '';
    case 'bullets': {
      const jobTitle = resume?.personalInfo.title || input.split('\n')[0] || '';
      return suggestBullets(jobTitle, input, 4).map((b) => `- ${b}`).join('\n');
    }
    case 'skills':
      return resume ? suggestSkills(resume, input, 10).map((s) => `- ${s}`).join('\n') : '';
    case 'cover-letter':
      return resume ? buildCoverLetterBody(resume, input) : '';
    default:
      return '';
  }
}

/** The three paragraphs of a cover letter, written from the user's own facts. */
export function buildCoverLetterBody(resume: Resume, jobTitle: string): string {
  const title = jobTitle.split('\n')[0].trim() || 'this role';
  const topSkills = resume.skills.slice(0, 4).map((s) => s.name);
  const latest = resume.experience[0];
  const proof = resume.experience
    .flatMap((e) => e.bullets)
    .filter((b) => /(\d|%|\$|₱)/.test(b))[0];

  const para1 = `I am applying for the ${title} position. My background as ${
    latest?.jobTitle || resume.personalInfo.title || 'a professional'
  }${latest?.company ? ` at ${latest.company}` : ''} gives me a foundation in ${
    topSkills.slice(0, 3).join(', ') || 'the skills this role needs'
  }.`;

  const para2 = proof
    ? `One example from my current work: ${proof.replace(/\.$/, '')}. I would apply the same approach here — find the bottleneck, fix the process, and keep the result measured.`
    : `I would welcome the opportunity to explain how my background could support your team. [Add one specific example of your relevant contribution here.]`;

  const para3 = `I would welcome the chance to talk about how this experience maps to your needs, and I am available at ${
    resume.personalInfo.email || 'the contact details above'
  }. Thank you for your time and consideration.`;

  return [para1, para2, para3].join('\n\n');
}

function buildLinkedInAbout(resume: Resume): string {
  return generateLinkedInAbout(resume, resume.personalInfo.title);
}

// Requests are always sent to this app's server; no Groq key enters browser code.
let accessPassword = '';
export function setAiAccessPassword(password: string): void { accessPassword = password.startsWith('gsk_') ? '' : password; }
export function hasAiAccessPassword(): boolean { return Boolean(accessPassword); }

async function serverRequest(body: object): Promise<{ text?: string; models?: string[] }> {
  if (!accessPassword) throw new Error('Enter the app access password in Settings first.');
  const response = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessPassword}` },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(typeof data?.error === 'string' ? data.error : 'The AI server is unavailable.');
  return data;
}

async function runGroq(req: AiRequest, config: AiConfig): Promise<string> {
  const data = await serverRequest({
    kind: req.kind, model: config.model || undefined,
    context: req.resume ? buildResumeText(req.resume).slice(0, 16000) : '',
    input: req.input?.slice(0, 12000),
    history: req.kind === 'coach' ? req.history?.slice(-12).map(m => ({ role: m.role, content: m.content.slice(0, 2000) })) : undefined,
  });
  if (typeof data.text !== 'string' || !data.text.trim()) throw new Error('The AI server returned an empty reply.');
  return data.text.trim();
}

export async function testConnection(config: AiConfig): Promise<{ ok: boolean; message: string; models?: string[] }> {
  try {
    const data = await serverRequest({ kind: 'test', model: config.model || undefined });
    return { ok: true, message: 'Groq connected. Your API key stays on the server.', models: data.models };
  } catch (error) {
    return { ok: false, message: errorMessage(error) };
  }
}

function errorMessage(error: unknown): string {
  if (error instanceof Error && ['TimeoutError', 'AbortError'].includes(error.name)) return 'Groq took too long. Try again.';
  return error instanceof Error ? error.message : 'The AI service is unavailable.';
}

export async function runAi(req: AiRequest): Promise<AiResult> {
  const config = getAiConfig();
  if (config.provider === 'groq') {
    try { return { text: await runGroq(req, config), provider: 'groq' }; }
    catch (error) {
      return { text: runBuiltin(req), provider: 'builtin', fallbackReason: `${errorMessage(error)} The built-in engine answered instead.` };
    }
  }
  return { text: runBuiltin(req), provider: 'builtin' };
}

export async function optimizeWithAi(resume: Resume, options: OptimizeOptions): Promise<OptimizeResult & { provider: 'groq' | 'builtin'; fallbackReason?: string }> {
  const config = getAiConfig();
  if (config.provider !== 'groq') return { ...optimizeResume(resume, options), provider: 'builtin' };
  try {
    const source = { summary: resume.summary, experience: resume.experience.map(e => ({ id: e.id, jobTitle: e.jobTitle, company: e.company, bullets: e.bullets })) };
    const input = JSON.stringify({ options, resume: source });
    if (input.length > 12000) throw new Error('Resume is too long for one AI rewrite.');
    const data = await serverRequest({ kind: 'optimize', model: config.model || undefined, context: buildResumeText(resume).slice(0, 16000), input });
    const parsed = JSON.parse(data.text || '') as { summary: string; experience: { id: string; bullets: string[] }[] };
    const invalid = () => { throw new Error('Groq returned an invalid rewrite.'); };
    if (!parsed || typeof parsed.summary !== 'string' || parsed.summary.length > 2500 || !Array.isArray(parsed.experience) || parsed.experience.length !== resume.experience.length) invalid();
    const changes: AITextChange[] = [];
    const record = (before: string, after: string, label: string, section: 'summary' | 'experience') => {
      // Missing measurements must be placeholders; reject numbers absent from the source line.
      const numbers: string[] = after.match(/\d+(?:[.,]\d+)*/g) || [];
      const originalNumbers: string[] = before.match(/\d+(?:[.,]\d+)*/g) || [];
      if (numbers.some(n => !originalNumbers.includes(n)) || originalNumbers.some(n => !numbers.includes(n))) invalid();
      if (before !== after) changes.push({ id: createId(), before, after, label, section, reasons: ['Rewritten by Groq using your resume facts. Review before sending.'], verifyNumber: /\[[^\]]+\]/.test(after) });
    };
    const summary = options.generateSummary ? parsed.summary.trim() : resume.summary;
    if (options.generateSummary && !summary) invalid();
    // Summaries may reuse figures from the full resume, but may not introduce new ones.
    if (options.generateSummary) {
      const supplied: string[] = buildResumeText(resume).match(/\d+(?:[.,]\d+)*/g) || [];
      if ((summary.match(/\d+(?:[.,]\d+)*/g) || []).some(n => !supplied.includes(n))) invalid();
      if (summary !== resume.summary) changes.push({ id: createId(), before: resume.summary, after: summary, label: 'Professional summary', section: 'summary', reasons: ['Rewritten by Groq from your resume facts.'], verifyNumber: /\[[^\]]+\]/.test(summary) });
    }
    const experience = resume.experience.map((exp, i) => {
      const entry = parsed.experience[i];
      if (!entry || entry.id !== exp.id || !Array.isArray(entry.bullets) || entry.bullets.length !== exp.bullets.length || entry.bullets.some(b => typeof b !== 'string' || b.length > 1000)) invalid();
      const bullets = options.rewriteBullets ? entry.bullets.map((b, j) => {
        if (!b.trim() && exp.bullets[j].trim()) invalid();
        record(exp.bullets[j], b.trim(), exp.jobTitle || 'Experience', 'experience');
        return b.trim();
      }) : exp.bullets;
      return { ...exp, bullets };
    });
    const updated = { ...resume, summary, experience };
    return { updated, changes, needsAttention: [], scoreBefore: analyzeResume(resume).score.overall, scoreAfter: analyzeResume(updated).score.overall, provider: 'groq' };
  } catch (error) {
    return { ...optimizeResume(resume, options), provider: 'builtin', fallbackReason: `${errorMessage(error)} The built-in optimizer answered instead.` };
  }
}

export { optimizeResume, generateSummary, generateLinkedInHeadline, generateLinkedInAbout, suggestSkills, suggestBullets };
export type { OptimizeOptions };
