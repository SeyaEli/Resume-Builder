// ============================================
// AI Service
// ============================================
// One door for every AI feature in the app.
//
// Provider 1 — "Built-in engine" (default)
//   Runs entirely offline in this browser. It reads the user's real resume
//   and job description and writes from rules + their own words. No key,
//   no cost, works on a plane.
//
// Provider 2 — "Connected model" (optional)
//   If the user has their own OpenAI-compatible endpoint and key, the same
//   requests are sent there instead, with the resume as context. If that
//   call fails for any reason we fall back to the built-in engine and say
//   so, so the user is never left with an empty box.
// ============================================

import type { Resume } from '../types/resume';
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
}

export interface AiResult {
  text: string;
  /** Which provider actually produced the text. */
  provider: 'builtin' | 'connected';
  /** Set when a connected model was tried and the built-in engine answered instead. */
  fallbackReason?: string;
}

export interface AiConfig {
  provider: 'builtin' | 'connected';
  baseUrl: string;
  model: string;
  apiKey: string;
}

const CONFIG_KEY = 'ats-resume-platform-ai';

export const DEFAULT_AI_CONFIG: AiConfig = {
  provider: 'builtin',
  baseUrl: '',
  model: '',
  apiKey: '',
};

export function getAiConfig(): AiConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return { ...DEFAULT_AI_CONFIG };
    const parsed = JSON.parse(raw) as Partial<AiConfig>;
    return { ...DEFAULT_AI_CONFIG, ...parsed };
  } catch {
    return { ...DEFAULT_AI_CONFIG };
  }
}

export function saveAiConfig(config: AiConfig): void {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  } catch {
    /* private mode — the setting simply does not persist */
  }
}

export function isConnectedReady(): boolean {
  const c = getAiConfig();
  return c.provider === 'connected' && Boolean(c.baseUrl.trim() && c.model.trim());
}

// ============================================
// Prompts sent to a connected model
// ============================================

const SYSTEM_PROMPT =
  'You are an ATS resume assistant. Write in plain text only: no markdown symbols, ' +
  'no emoji, no headings, no bullet characters other than "- ". Use the person\'s real ' +
  'facts from the resume context. Never invent employers, dates or numbers; if a number ' +
  'is needed, write [number] as a placeholder. Keep the tone factual and specific.';

function providerPrompt(req: AiRequest): string {
  const resumeText = req.resume ? buildResumeText(req.resume) : '';
  const context = resumeText
    ? `\n\nRESUME CONTEXT:\n${resumeText.slice(0, 6000)}`
    : '\n\nRESUME CONTEXT: (no resume yet)';
  const jd = req.input ? `\n\nJOB DESCRIPTION / REQUEST:\n${req.input.slice(0, 4000)}` : '';

  const task: Record<AiKind, string> = {
    summary: 'Write a 3 sentence professional summary (40-70 words) for this person, aimed at the role in the request. Start with their job title. No first person.',
    coach: 'Answer the request as a career coach. Be concrete and brief: at most 200 words. Where you can, refer to the resume context above.',
    'cover-letter': 'Write the BODY of a cover letter (3 short paragraphs, under 250 words) for the role in the request. Plain text only. Do not write the address block, greeting or sign-off.',
    'linkedin-about': 'Rewrite the LinkedIn About section from the resume context: first person, under 200 words, 3 short paragraphs, no hashtags.',
    bullets: 'Write 4 achievement bullet points for the role in the request. Each must start with a strong action verb, include [number] where a metric belongs, and be under 25 words.',
    skills: 'List 10 skills this person should add, most important first, one per line, plain names only.',
  };

  return `${task[req.kind]}${context}${jd}`;
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
  const title = jobTitle.trim() || 'this role';
  const years = resume.experience.length ? `${resume.experience.length * 2}+` : 'several';
  const topSkills = resume.skills.slice(0, 4).map((s) => s.name);
  const latest = resume.experience[0];
  const proof = resume.experience
    .flatMap((e) => e.bullets)
    .filter((b) => /(\d|%|\$|₱)/.test(b))[0];

  const para1 = `I am applying for the ${title} position. With ${years} years of experience as ${
    latest?.jobTitle || resume.personalInfo.title || 'a professional'
  }${latest?.company ? ` at ${latest.company}` : ''}, I bring hands-on strength in ${
    topSkills.slice(0, 3).join(', ') || 'the skills this role needs'
  }.`;

  const para2 = proof
    ? `One example from my current work: ${proof.replace(/\.$/, '')}. I would apply the same approach here — find the bottleneck, fix the process, and keep the result measured.`
    : `In my current role, I took on the tasks nobody had documented, wrote down the process, and cut the time it takes to complete them. That habit is what I would bring to this team.`;

  const para3 = `I would welcome the chance to talk about how this experience maps to your needs, and I am available at ${
    resume.personalInfo.email || 'the contact details above'
  }. Thank you for your time and consideration.`;

  return [para1, para2, para3].join('\n\n');
}

function buildLinkedInAbout(resume: Resume): string {
  return generateLinkedInAbout(resume, resume.personalInfo.title);
}

// ============================================
// Connected model call
// ============================================

async function runConnected(req: AiRequest, config: AiConfig): Promise<string> {
  const url = `${config.baseUrl.trim().replace(/\/+$/, '')}/chat/completions`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: providerPrompt(req) },
      ],
      temperature: 0.4,
      max_tokens: 800,
    }),
  });

  if (!response.ok) {
    throw new Error(`The endpoint answered ${response.status}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;
  if (typeof text !== 'string' || !text.trim()) {
    throw new Error('The endpoint returned an empty reply');
  }
  return text.trim();
}

/** Check a key and endpoint really work, for the Settings screen. */
export async function testConnection(config: AiConfig): Promise<{ ok: boolean; message: string }> {
  if (!config.baseUrl.trim() || !config.model.trim()) {
    return { ok: false, message: 'Add an endpoint and a model name first.' };
  }
  try {
    const text = await runConnected(
      { kind: 'summary', input: 'Test', resume: undefined },
      config
    );
    return { ok: true, message: `Connected. The model replied: "${text.slice(0, 60)}…"` };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { ok: false, message: `Could not reach the model — ${message}. The built-in engine still works.` };
  }
}

// ============================================
// The one function the pages call
// ============================================

/** Small pause so the "thinking" state is visible on instant local results. */
const settle = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function runAi(req: AiRequest): Promise<AiResult> {
  const config = getAiConfig();

  if (config.provider === 'connected' && config.baseUrl.trim() && config.model.trim()) {
    try {
      const text = await runConnected(req, config);
      return { text, provider: 'connected' };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      await settle(400);
      return {
        text: runBuiltin(req),
        provider: 'builtin',
        fallbackReason: `The connected model failed (${message}), so the built-in engine answered.`,
      };
    }
  }

  await settle(600);
  return { text: runBuiltin(req), provider: 'builtin' };
}

export { optimizeResume, generateSummary, generateLinkedInHeadline, generateLinkedInAbout, suggestSkills, suggestBullets };
export type { OptimizeOptions };
