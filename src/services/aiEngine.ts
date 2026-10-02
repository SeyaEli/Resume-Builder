// ============================================
// Local ATS / AI Engine
// ============================================
// Everything here runs inside the browser. There are no network calls:
// every "AI" result is computed from the text the user actually typed
// (their resume + the job description), so the advice is specific to
// their content instead of canned.
// ============================================

import type { Resume, ExtractedKeywords, JobMatch } from '../types/resume';
import { createId } from '../types/resume';
import { analyzeResume, ACTION_VERBS } from './atsScorer';

// ============================================
// Small text helpers
// ============================================

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Whole-phrase match that ignores punctuation differences around the phrase. */
function hasPhrase(haystackLower: string, needle: string): boolean {
  return haystackLower.includes(needle.toLowerCase());
}

function countPhrase(haystackLower: string, needle: string): number {
  const re = new RegExp(escapeRegex(needle.toLowerCase()), 'g');
  return (haystackLower.match(re) || []).length;
}

const words = (text: string) => text.split(/\s+/).filter(Boolean);

const hasNumber = (text: string) => /(\d|%|\$|₱)/.test(text);

function startsWithActionVerb(text: string): boolean {
  const first = (text.trim().toLowerCase().match(/^[a-z]+/) || [''])[0];
  return ACTION_VERBS.includes(first);
}

function titleCase(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// ============================================
// Job description keyword extraction
// ============================================

const HARD_SKILLS = [
  'python', 'java', 'javascript', 'typescript', 'c++', 'c#', 'ruby', 'go', 'golang', 'rust',
  'swift', 'kotlin', 'php', 'scala', 'matlab', 'sql', 'nosql', 'html', 'css', 'sass',
  'react', 'react native', 'angular', 'vue', 'svelte', 'next.js', 'node.js', 'express',
  'django', 'flask', 'laravel', 'spring boot', '.net', 'graphql', 'rest api', 'microservices',
  'machine learning', 'deep learning', 'data science', 'data analysis', 'data engineering',
  'artificial intelligence', 'natural language processing', 'computer vision', 'llm',
  'api', 'agile', 'scrum', 'kanban', 'devops', 'cloud computing', 'ci/cd',
  'database', 'mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch', 'dynamodb',
  'unit testing', 'integration testing', 'automation', 'selenium', 'cypress', 'jest',
  'linux', 'networking', 'cybersecurity', 'penetration testing', 'blockchain',
  'figma', 'sketch', 'adobe', 'photoshop', 'illustrator', 'ui/ux', 'user research', 'prototyping',
  'excel', 'powerpoint', 'tableau', 'power bi', 'looker', 'data visualization', 'google analytics',
  'project management', 'stakeholder management', 'budget management', 'risk management',
  'seo', 'sem', 'content strategy', 'social media marketing', 'email marketing', 'copywriting',
  'accounting', 'bookkeeping', 'financial reporting', 'financial modeling', 'auditing',
  'taxation', 'payroll', 'reconciliation', 'accounts payable', 'accounts receivable',
  'recruitment', 'onboarding', 'employee relations', 'performance management', 'hris',
  'salesforce', 'hubspot', 'sap', 'erp', 'crm', 'netsuite', 'quickbooks',
  'supply chain', 'inventory management', 'procurement', 'logistics', 'warehousing',
  'quality assurance', 'quality control', 'manufacturing', 'lean', 'six sigma', 'iso 9001',
  'customer service', 'customer success', 'technical support', 'troubleshooting', 'help desk',
  'nursing', 'patient care', 'clinical', 'phlebotomy', 'medication administration',
  'lesson planning', 'curriculum development', 'classroom management', 'student assessment',
  'statistical analysis', 'etl', 'data warehouse', 'big data', 'hadoop', 'spark', 'airflow',
];

const SOFT_SKILLS = [
  'leadership', 'communication', 'problem solving', 'teamwork', 'collaboration',
  'critical thinking', 'creativity', 'adaptability', 'time management', 'organization',
  'attention to detail', 'interpersonal', 'presentation', 'negotiation', 'conflict resolution',
  'mentoring', 'coaching', 'strategic thinking', 'decision making', 'initiative',
  'self-motivated', 'analytical', 'innovative', 'proactive', 'customer-focused',
  'cross-functional', 'multitasking', 'work ethic', 'emotional intelligence', 'resilience',
  'willingness to learn', 'detail-oriented', 'results-driven', 'ownership', 'prioritization',
];

const TOOLS = [
  'jira', 'confluence', 'slack', 'trello', 'asana', 'monday.com', 'notion', 'clickup', 'airtable',
  'github', 'gitlab', 'bitbucket', 'vs code', 'intellij', 'postman', 'swagger',
  'grafana', 'datadog', 'splunk', 'prometheus', 'terraform', 'ansible', 'jenkins', 'circleci',
  'docker', 'kubernetes', 'openshift', 'heroku', 'vercel', 'netlify',
  'zendesk', 'intercom', 'freshdesk', 'servicenow', 'workday', 'miro', 'lucidchart',
  'canva', 'premiere pro', 'after effects', 'davinci resolve', 'wordpress', 'shopify',
  'zoom', 'teams', 'google workspace', 'office 365', 'xero', 'sage',
];

const CERTS = [
  'pmp', 'capm', 'aws certified', 'azure certified', 'google cloud certified', 'cissp', 'cism',
  'scrum master', 'safe', 'six sigma', 'itil', 'comptia', 'ccna', 'ccnp', 'cpt',
  'cpa', 'cfa', 'cma', 'series 7', 'series 63', 'google analytics', 'meta certified',
  'shrm', 'phr', 'qhse', 'iso 27001', 'lean manufacturing',
];

const INDUSTRY_TERMS = [
  'saas', 'fintech', 'e-commerce', 'healthcare', 'edtech', 'logistics', 'retail',
  'banking', 'insurance', 'telecommunications', 'manufacturing', 'hospitality',
  'bpo', 'shared services', 'startup', 'enterprise', 'b2b', 'b2c', 'remote', 'hybrid',
  'compliance', 'governance', 'gdpr', 'dpa', 'sox', 'hipaa', 'iso', 'kpi', 'okr',
  'sla', 'escalation', 'root cause analysis', 'continuous improvement', 'process improvement',
  'digital transformation', 'migration', 'scalability', 'performance optimization',
];

export const SKILL_BANK: { label: string; terms: string[] }[] = [
  { label: 'Tech & Engineering', terms: ['python', 'javascript', 'typescript', 'react', 'node.js', 'sql', 'aws', 'docker', 'kubernetes', 'git', 'rest api', 'testing'] },
  { label: 'Data & Analytics', terms: ['excel', 'sql', 'tableau', 'power bi', 'google analytics', 'statistical analysis', 'data visualization', 'etl'] },
  { label: 'Sales & Marketing', terms: ['seo', 'social media marketing', 'email marketing', 'content strategy', 'crm', 'salesforce', 'copywriting', 'lead generation'] },
  { label: 'Finance & Admin', terms: ['accounting', 'bookkeeping', 'financial reporting', 'payroll', 'quickbooks', 'reconciliation', 'auditing', 'taxation'] },
  { label: 'HR & Recruiting', terms: ['recruitment', 'onboarding', 'employee relations', 'performance management', 'hris', 'payroll'] },
  { label: 'Operations & Supply Chain', terms: ['inventory management', 'procurement', 'logistics', 'supply chain', 'quality control', 'lean', 'six sigma'] },
  { label: 'Customer Support', terms: ['customer service', 'technical support', 'troubleshooting', 'zendesk', 'sla', 'escalation'] },
  { label: 'Healthcare', terms: ['patient care', 'clinical', 'medication administration', 'ehr', 'hipaa'] },
  { label: 'Education', terms: ['lesson planning', 'curriculum development', 'classroom management', 'student assessment'] },
  { label: 'Design & Creative', terms: ['figma', 'ui/ux', 'user research', 'prototyping', 'canva', 'adobe'] },
];

/**
 * Pull the keywords a posting really cares about. Words that appear more
 * often in the posting are treated as more important.
 */
export function extractJdKeywords(jdText: string): ExtractedKeywords {
  const lower = jdText.toLowerCase();
  const found = (list: string[]) => list.filter((term) => hasPhrase(lower, term));

  const byFrequency = (terms: string[]) =>
    terms
      .map((term) => ({ term, n: countPhrase(lower, term) }))
      .sort((a, b) => b.n - a.n || a.term.localeCompare(b.term))
      .map((x) => x.term);

  return {
    hardSkills: byFrequency(found(HARD_SKILLS)),
    softSkills: byFrequency(found(SOFT_SKILLS)),
    tools: byFrequency(found(TOOLS)),
    certifications: byFrequency(found(CERTS)),
    industryKeywords: byFrequency(found(INDUSTRY_TERMS)),
    technologies: byFrequency(found(HARD_SKILLS).slice(0, 30)),
  };
}

/** Everything a job posting asks for, most-mentioned first. */
export function allJdKeywords(jd: ExtractedKeywords): string[] {
  return [
    ...jd.hardSkills,
    ...jd.tools,
    ...jd.certifications,
    ...jd.industryKeywords,
    ...jd.softSkills,
  ];
}

/** Guess the job title / company so forms can be pre-filled. */
export function guessJobMeta(jdText: string): { title: string; company: string } {
  const lines = jdText.split('\n').map((l) => l.trim()).filter(Boolean);
  const labelled = (labels: string[]): string => {
    for (const line of lines) {
      const m = line.match(new RegExp(`^(?:${labels.join('|')})\\s*[:\\-–]\\s*(.+)$`, 'i'));
      if (m) return m[1].trim().slice(0, 80);
    }
    return '';
  };

  let title = labelled(['job title', 'position', 'role', 'title']);
  if (!title) {
    const first = lines.find((l) => l.length <= 70 && !/[.!?]$/.test(l) && /engineer|developer|manager|analyst|specialist|assistant|officer|designer|nurse|teacher|accountant|coordinator|consultant|technician|supervisor|lead|intern|representative|executive|writer|administrator/i.test(l));
    title = first ? first.slice(0, 80) : '';
  }

  let company = labelled(['company', 'organization', 'employer']);
  if (!company) {
    const m = jdText.match(/\bat\s+([A-Z][A-Za-z0-9&.'-]*(?:\s+[A-Z][A-Za-z0-9&.'-]*){0,3})/);
    company = m ? m[1].trim() : '';
  }
  return { title, company };
}

// ============================================
// Resume text + signals
// ============================================

export function buildResumeText(resume: Resume): string {
  return [
    resume.personalInfo.title,
    resume.personalInfo.location,
    resume.summary,
    ...resume.experience.flatMap((e) => [e.jobTitle, e.company, ...e.bullets]),
    ...resume.education.map((e) => `${e.degree} ${e.institution} ${e.honors || ''}`),
    ...resume.skills.map((s) => s.name),
    ...resume.projects.map((p) => `${p.name} ${p.description} ${p.results} ${p.technologies.join(' ')}`),
    ...resume.certifications.map((c) => `${c.name} ${c.issuer}`),
    ...resume.awards.map((a) => `${a.name} ${a.issuer} ${a.description || ''}`),
    ...resume.volunteer.map((v) => `${v.role} ${v.organization} ${v.description}`),
    ...resume.languages.map((l) => l.name),
  ].filter(Boolean).join(' ');
}

/** Rough total years of experience, read from the dates the user typed. */
export function estimateYearsOfExperience(resume: Resume): number {
  const now = new Date();
  let months = 0;
  for (const exp of resume.experience) {
    const start = exp.startDate ? new Date(exp.startDate + '-01') : null;
    if (!start || isNaN(start.getTime())) continue;
    const end = exp.current || !exp.endDate ? now : new Date(exp.endDate + '-01');
    if (isNaN(end.getTime())) continue;
    months += Math.max(0, (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()));
  }
  return Math.round(months / 12);
}

const DEGREE_LEVELS: { level: number; pattern: RegExp }[] = [
  { level: 1, pattern: /high school|secondary|senior high|shs|diploma|vocational|tesda/i },
  { level: 2, pattern: /associate|bachelor|b\.?s\.?\b|b\.?a\.?\b|undergraduate|degree in/i },
  { level: 3, pattern: /master|m\.?s\.?\b|mba|m\.?a\.?\b|postgraduate/i },
  { level: 4, pattern: /phd|ph\.?d|doctorate|doctoral/i },
];

function degreeLevel(text: string): number {
  let level = 0;
  for (const d of DEGREE_LEVELS) if (d.pattern.test(text)) level = Math.max(level, d.level);
  return level;
}

// ============================================
// Bullet analysis + rewriting
// ============================================

export interface BulletAnalysis {
  text: string;
  wordCount: number;
  hasActionVerb: boolean;
  hasMetric: boolean;
  hasWeakOpening: boolean;
  hasFiller: boolean;
  hasPronoun: boolean;
}

const FILLERS = ['successfully ', 'various ', 'several ', 'in order to', 'duties included', 'a lot of', 'kind of', 'helped to '];

export function analyzeBullet(text: string): BulletAnalysis {
  const lower = text.toLowerCase().trim();
  return {
    text,
    wordCount: words(text).length,
    hasActionVerb: startsWithActionVerb(text),
    hasMetric: hasNumber(text),
    hasWeakOpening: /^(was responsible for|responsible for|worked on|worked with|helped|assisted|participated in|was involved in|involved in|in charge of|handled|did|made|used|tasked with)/.test(lower),
    hasFiller: FILLERS.some((f) => lower.includes(f)),
    hasPronoun: /\bi\b|\bmy\b|\bme\b/.test(lower),
  };
}

const WEAK_OPENING_RULES: { pattern: RegExp; resolve: (rest: string) => string; label: string }[] = [
  { pattern: /^was responsible for\s+/i, resolve: () => 'Owned', label: 'was responsible for' },
  { pattern: /^responsible for\s+/i, resolve: () => 'Owned', label: 'responsible for' },
  { pattern: /^duties included\s+/i, resolve: () => 'Owned', label: 'duties included' },
  { pattern: /^worked on\s+/i, resolve: () => 'Delivered', label: 'worked on' },
  { pattern: /^worked with\s+/i, resolve: () => 'Partnered with', label: 'worked with' },
  { pattern: /^tasked with\s+/i, resolve: () => 'Owned', label: 'tasked with' },
  { pattern: /^in charge of\s+/i, resolve: () => 'Managed', label: 'in charge of' },
  { pattern: /^handled\s+/i, resolve: () => 'Managed', label: 'handled' },
  { pattern: /^did\s+/i, resolve: () => 'Executed', label: 'did' },
  { pattern: /^made\s+/i, resolve: () => 'Built', label: 'made' },
  { pattern: /^used\s+/i, resolve: () => 'Leveraged', label: 'used' },
  {
    pattern: /^helped\s+/i,
    resolve: (rest) =>
      /customer|client|user|guest|patient|student|caller/i.test(rest) ? 'Resolved'
        : /team|junior|colleague|member|staff|new hire/i.test(rest) ? 'Coached'
          : 'Supported',
    label: 'helped',
  },
  {
    pattern: /^assisted\s+(with\s+)?/i,
    resolve: (rest) => (/customer|client|user|patient/i.test(rest) ? 'Resolved' : 'Supported'),
    label: 'assisted',
  },
  { pattern: /^participated in\s+/i, resolve: () => 'Contributed to', label: 'participated in' },
  { pattern: /^was involved in\s+/i, resolve: () => 'Drove', label: 'was involved in' },
  { pattern: /^involved in\s+/i, resolve: () => 'Drove', label: 'involved in' },
];

const METRIC_CLAUSES: { match: RegExp; clause: string }[] = [
  { match: /customer|client|user|guest|patient|caller/i, clause: 'improving satisfaction scores by 22%' },
  { match: /cost|budget|spend|expense|invoice/i, clause: 'cutting costs by 18%' },
  { match: /time|process|manual|workflow|report|ticket|backlog|turnaround/i, clause: 'cutting turnaround time by 30%' },
  { match: /revenue|sales|lead|conversion|growth|profit/i, clause: 'increasing revenue by 15%' },
  { match: /team|mentor|junior|hire|onboard|train|staff/i, clause: 'raising team output by 20%' },
  { match: /bug|error|incident|downtime|defect|quality|rework/i, clause: 'reducing defects by 40%' },
  { match: /data|database|query|dashboard|record/i, clause: 'improving reporting accuracy by 25%' },
  { match: /inventory|stock|supply|logistics|delivery|shipment/i, clause: 'reducing delivery delays by 35%' },
  { match: /student|course|curriculum|lesson|class|learner/i, clause: 'improving pass rates by 20%' },
  { match: /audit|compliance|risk|policy/i, clause: 'closing 100% of audit findings on time' },
];

const DEFAULT_METRIC = 'improving efficiency by 25%';

export interface RewriteResult {
  text: string;
  reasons: string[];
  verifyNumber: boolean;
}

/**
 * Turn one bullet point into a stronger one: real action verb, no filler,
 * no first person, and (optionally) a measurable result.
 */
export function rewriteBullet(text: string, opts: { addMetrics?: boolean } = {}): RewriteResult {
  const reasons: string[] = [];
  let verifyNumber = false;
  let out = text.trim().replace(/\s+/g, ' ');

  if (!out) return { text: '', reasons: [], verifyNumber: false };

  // 1. First person out.
  if (/^i\s+/i.test(out)) {
    out = out.replace(/^i\s+/i, '');
    reasons.push('Removed the first person opener ("I ...") — resumes are written without "I".');
  }
  if (/\bmy\b/i.test(out)) {
    out = out.replace(/\bmy\b/gi, 'the');
    reasons.push('Replaced "my" with "the" so the sentence reads like a resume line.');
  }

  // 2. Weak opening -> strong action verb.
  for (const rule of WEAK_OPENING_RULES) {
    if (rule.pattern.test(out)) {
      const rest = out.replace(rule.pattern, '');
      const verb = rule.resolve(rest);
      out = `${verb} ${rest}`;
      reasons.push(`Replaced the weak opening "${rule.label}" with the action verb "${verb}".`);
      break;
    }
  }

  // 3. Wordy filler.
  const beforeFiller = out;
  out = out
    .replace(/\bsuccessfully\s+/gi, '')
    .replace(/\bvarious\s+/gi, '')
    .replace(/\bseveral\s+/gi, '')
    .replace(/\ba lot of\s+/gi, '')
    .replace(/\bkind of\s+/gi, '')
    .replace(/\bin order to\b/gi, 'to');
  if (beforeFiller !== out) reasons.push('Trimmed filler words that add length but no meaning.');

  // 4. Add a measurable result if the bullet has no numbers at all.
  if (opts.addMetrics && !hasNumber(out)) {
    const rule = METRIC_CLAUSES.find((r) => r.match.test(out));
    const clause = rule ? rule.clause : DEFAULT_METRIC;
    out = `${out.replace(/[.;]+$/, '')}, ${clause}`;
    reasons.push('Added a measurable result — replace the number with your real figure.');
    verifyNumber = true;
  }

  // 5. Keep a single trailing period off, normalise the first letter.
  out = `${titleCase(out.trim())}`;

  return { text: out, reasons, verifyNumber };
}

// ============================================
// Resume-wide optimisation (the "AI Optimizer")
// ============================================

export interface AITextChange {
  id: string;
  section: 'summary' | 'experience' | 'projects';
  label: string;
  before: string;
  after: string;
  reasons: string[];
  verifyNumber: boolean;
}

export interface OptimizeOptions {
  rewriteBullets: boolean;
  addMetrics: boolean;
  generateSummary: boolean;
}

export interface OptimizeResult {
  updated: Resume;
  changes: AITextChange[];
  /** Bullets the engine refuses to rewrite alone — they need the user's own detail. */
  needsAttention: { label: string; bullet: string; why: string }[];
  scoreBefore: number;
  scoreAfter: number;
}

export function optimizeResume(resume: Resume, options: OptimizeOptions): OptimizeResult {
  const changes: AITextChange[] = [];
  const needsAttention: { label: string; bullet: string; why: string }[] = [];
  const scoreBefore = analyzeResume(resume).score.overall;

  // --- Summary ---
  let summary = resume.summary;
  if (options.generateSummary) {
    const generated = generateSummary(resume);
    if (generated && generated !== resume.summary) {
      changes.push({
        id: createId(),
        section: 'summary',
        label: 'Professional summary',
        before: resume.summary || '(no summary yet)',
        after: generated,
        reasons: [
          resume.summary
            ? 'Rebuilt your summary from your own titles, skills and results.'
            : 'You had no summary, so one was written from your resume content.',
        ],
        verifyNumber: false,
      });
      summary = generated;
    }
  }

  // --- Experience bullets ---
  const experience = resume.experience.map((exp) => {
    const bullets = exp.bullets.map((bullet) => {
      if (!bullet.trim() || !options.rewriteBullets) return bullet;
      const result = rewriteBullet(bullet, { addMetrics: options.addMetrics });
      if (result.text !== bullet.trim().replace(/\s+/g, ' ')) {
        changes.push({
          id: createId(),
          section: 'experience',
          label: `${exp.jobTitle || 'Role'}${exp.company ? ` at ${exp.company}` : ''}`,
          before: bullet,
          after: result.text,
          reasons: result.reasons,
          verifyNumber: result.verifyNumber,
        });
      } else {
        const analysis = analyzeBullet(bullet);
        if (analysis.wordCount > 30) {
          needsAttention.push({
            label: `${exp.jobTitle || 'Role'}${exp.company ? ` at ${exp.company}` : ''}`,
            bullet,
            why: `${analysis.wordCount} words — trim to 15-25 words so a recruiter can scan it.`,
          });
        } else if (!analysis.hasMetric) {
          needsAttention.push({
            label: `${exp.jobTitle || 'Role'}${exp.company ? ` at ${exp.company}` : ''}`,
            bullet,
            why: 'No number in this line — add the size, speed or money impact only you know.',
          });
        }
      }
      return options.rewriteBullets ? rewriteBullet(bullet, { addMetrics: options.addMetrics }).text : bullet;
    });
    return { ...exp, bullets };
  });

  const updated: Resume = {
    ...resume,
    summary,
    experience,
    metadata: { ...resume.metadata, updatedAt: new Date().toISOString() },
  };

  const scoreAfter = analyzeResume(updated).score.overall;

  return { updated, changes, needsAttention, scoreBefore, scoreAfter };
}

/** Suggest strong bullets for a target role, built from the posting's own keywords. */
export function suggestBullets(jobTitle: string, jdText: string, count = 4): string[] {
  const role = jobTitle.trim() || 'the role';
  const jd = extractJdKeywords(jdText);
  const key = [...jd.hardSkills, ...jd.tools].slice(0, 3);
  const [a = 'the main process', b = 'the team', c = 'key reports'] = key;

  const templates = [
    `Led a project for ${role} work using ${a}, delivering it on schedule and cutting rework by 20%`,
    `Built and maintained ${b} workflows with ${a} and ${c}, handling [number] tasks per week at 98% accuracy`,
    `Partnered with ${b} to improve ${a} processes, reducing turnaround time by 30%`,
    `Trained and mentored [number] colleagues on ${a}, raising team output by 20%`,
    `Reported on ${c} every week, giving managers the data to cut costs by 15%`,
  ];
  return templates.slice(0, Math.max(1, Math.min(count, templates.length)));
}

/** Skills worth adding, taken from a job posting and missing from the resume. */
export function suggestSkills(resume: Resume, jdText: string, limit = 10): string[] {
  const have = resume.skills.map((s) => s.name.toLowerCase());
  const resumeText = buildResumeText(resume).toLowerCase();
  return allJdKeywords(extractJdKeywords(jdText))
    .filter((k) => !have.includes(k) && !hasPhrase(resumeText, k))
    .slice(0, limit);
}

// ============================================
// Summary + LinkedIn generation
// ============================================

export function generateSummary(resume: Resume, targetJob?: string): string {
  const title = resume.personalInfo.title || targetJob || 'professional';
  const years = estimateYearsOfExperience(resume);
  const topSkills = resume.skills.slice(0, 5).map((s) => s.name);
  const certs = resume.certifications.slice(0, 2).map((c) => c.name);

  const bestBullet = resume.experience
    .flatMap((e) => e.bullets)
    .filter((b) => hasNumber(b) && words(b).length <= 30)
    .sort((a, b) => words(b).length - words(a).length)[0];

  const opening = years >= 1
    ? `${title} with ${years}+ year${years === 1 ? '' : 's'} of hands-on experience`
    : `Detail-focused ${title} ready to grow into the role`;

  const skillLine = topSkills.length
    ? ` Skilled in ${topSkills.slice(0, 3).join(', ')}${topSkills.length > 3 ? ` and ${topSkills.slice(3).join(', ')}` : ''}.`
    : '';

  const proofLine = bestBullet
    ? ` Recent work: ${bestBullet.replace(/\.$/, '')}.`
    : ' Known for turning day-to-day duties into measurable results.';

  const credLine = certs.length ? ` Holds ${certs.join(' and ')}.` : '';

  return `${opening}.${skillLine}${proofLine}${credLine}`.replace(/\s+/g, ' ').trim();
}

export function generateLinkedInHeadline(resume: Resume, targetJob?: string): string {
  const title = resume.personalInfo.title || targetJob || 'Professional';
  const top = resume.skills.slice(0, 3).map((s) => s.name);
  const latest = resume.experience[0];
  const place = latest?.company ? ` at ${latest.company}` : '';
  const years = estimateYearsOfExperience(resume);
  return `${title}${place}${years >= 2 ? ` | ${years}+ yrs` : ''} | ${top.join(' • ')}`.slice(0, 220);
}

/**
 * The LinkedIn About section, written in the first person because that is
 * how the platform reads. Built from the user's own titles, skills and
 * measured results.
 */
export function generateLinkedInAbout(resume: Resume, targetJob?: string): string {
  const title = resume.personalInfo.title || targetJob || 'professional';
  const years = estimateYearsOfExperience(resume);
  const top = resume.skills.slice(0, 5).map((s) => s.name);
  const latest = resume.experience[0];
  const proof = resume.experience
    .flatMap((e) => e.bullets)
    .filter((b) => hasNumber(b))
    .sort((a, b) => words(b).length - words(a).length)[0];
  const certs = resume.certifications.slice(0, 2).map((c) => c.name);

  const hook = `I'm a ${title}${years >= 1 ? ` with ${years}+ year${years === 1 ? '' : 's'} of experience` : ''}${
    latest?.company ? `, currently at ${latest.company}` : ''
  }.`;

  const whatIDo = top.length
    ? `WHAT I DO\nI work with ${top.slice(0, 4).join(', ')}. Day to day that means turning requests into finished work, keeping the process documented, and measuring whether it actually helped.`
    : 'WHAT I DO\nI turn requests into finished work, keep the process documented, and measure whether it actually helped.';

  const proofLine = proof
    ? `PROOF\n${proof.replace(/\.$/, '')}.`
    : 'PROOF\nI look for the step that slows everything down, fix it, and track the difference.';

  const credLine = certs.length ? `CREDENTIALS\nHolds ${certs.join(' and ')}.` : '';

  const cta = 'Let\'s connect — I\'m open to talking about the work, tools and problems in this field.';

  return [hook, whatIDo, proofLine, credLine, cta].filter(Boolean).join('\n\n');
}

// ============================================
// Job description matching (deterministic)
// ============================================

export function computeJobMatch(resume: Resume, jdText: string): JobMatch {
  const jd = extractJdKeywords(jdText);
  const resumeText = buildResumeText(resume);
  const rLower = resumeText.toLowerCase();

  const present = allJdKeywords(jd).filter((k) => hasPhrase(rLower, k));
  const missing = allJdKeywords(jd).filter((k) => !hasPhrase(rLower, k));
  const underrep = present.filter((k) => countPhrase(rLower, k) === 1);

  // Skills: hard skills and tools count double — they are what screeners filter on.
  const skillsAsked = [...jd.hardSkills, ...jd.tools];
  const skillsHit = skillsAsked.filter((k) => hasPhrase(rLower, k));
  const skillsMatch = skillsAsked.length
    ? Math.round((skillsHit.length / skillsAsked.length) * 100)
    : 50;

  // Keywords: how much of the posting's vocabulary the resume covers.
  const keywordMatch = allJdKeywords(jd).length
    ? Math.round((present.length / allJdKeywords(jd).length) * 100)
    : 50;

  // Experience: years, seniority words and how many bullets show results.
  const years = estimateYearsOfExperience(resume);
  const wantedYears = (jdText.match(/(\d+)\s*\+?\s*(?:years|yrs)/i) || [])[1];
  const targetYears = wantedYears ? parseInt(wantedYears, 10) : 2;
  const yearScore = targetYears > 0 ? Math.min(100, Math.round((years / targetYears) * 100)) : 80;

  const allBullets = resume.experience.flatMap((e) => e.bullets).filter((b) => b.trim());
  const metricRatio = allBullets.length
    ? allBullets.filter(hasNumber).length / allBullets.length
    : 0;

  const seniorityAsked = /senior|lead|principal|head of|manager|director/i.test(jdText);
  const seniorityHave = /senior|lead|principal|head of|manager|director/i.test(
    resume.experience.map((e) => e.jobTitle).join(' ')
  );
  const seniorityBonus = seniorityAsked && seniorityHave ? 10 : 0;

  const experienceMatch = Math.max(0, Math.min(100, Math.round(yearScore * 0.55 + metricRatio * 100 * 0.35) + seniorityBonus));

  // Education: compare the level the posting asks for with the level on the resume.
  const jdDegree = degreeLevel(jdText);
  const resumeDegree = Math.max(0, ...resume.education.map((e) => degreeLevel(`${e.degree} ${e.honors || ''}`)));
  let educationMatch: number;
  if (jdDegree === 0) educationMatch = resume.education.length ? 90 : 70;
  else if (resumeDegree >= jdDegree) educationMatch = 100;
  else if (resumeDegree === jdDegree - 1) educationMatch = 65;
  else if (resumeDegree === 0) educationMatch = 40;
  else educationMatch = 50;

  const atsCompat = analyzeResume(resume).score.format;

  const overallMatch = Math.round(
    skillsMatch * 0.32 + keywordMatch * 0.26 + experienceMatch * 0.2 + educationMatch * 0.09 + atsCompat * 0.13
  );

  const suggestions: string[] = [];
  if (missing.length) {
    suggestions.push(`Add these to your Skills section: ${missing.slice(0, 4).join(', ')}.`);
  }
  if (underrep.length) {
    suggestions.push(`These are mentioned only once in your resume — repeat them inside your experience bullets: ${underrep.slice(0, 3).join(', ')}.`);
  }
  if (targetYears && years < targetYears) {
    suggestions.push(`The posting asks for ${targetYears}+ years. Your dates add up to about ${years} — lead with your most relevant role and put real project years in the summary.`);
  }
  if (metricRatio < 0.5 && allBullets.length) {
    suggestions.push(`${Math.round((1 - metricRatio) * allBullets.length)} of your ${allBullets.length} bullets have no number. Run the AI Optimizer to add measurable results.`);
  }
  if (resume.summary.length < 120) {
    suggestions.push('Your summary is thin for this role — generate one that names the posting\'s own keywords.');
  }

  const atsScore = analyzeResume(resume).score.overall;

  return {
    overallMatch,
    skillsMatch,
    experienceMatch,
    keywordMatch,
    educationMatch,
    atsCompatibility: atsCompat,
    presentKeywords: present,
    missingKeywords: missing,
    underrepresentedKeywords: underrep,
    extractedKeywords: jd,
    suggestions,
    interviewProbabilityBefore: Math.max(10, Math.min(60, Math.round(atsScore * 0.55))),
    interviewProbabilityAfter: Math.max(20, Math.min(92, Math.round(atsScore * 0.55 + skillsMatch * 0.3))),
  };
}

// ============================================
// Career coach
// ============================================

export type CoachIntent =
  | 'resume' | 'ats' | 'interview' | 'salary' | 'career'
  | 'skills' | 'cover-letter' | 'job-search' | 'general';

export function detectIntent(message: string): CoachIntent {
  const m = message.toLowerCase();
  if (/ats|score|screen|keyword|applicant tracking/.test(m)) return 'ats';
  if (/cover letter/.test(m)) return 'cover-letter';
  if (/interview|question|panel|hiring manager ask/.test(m)) return 'interview';
  if (/salary|negotiat|compensation|raise|offer|pay\b/.test(m)) return 'salary';
  if (/career|transition|switch|change field|promotion/.test(m)) return 'career';
  if (/skill|learn|course|upskill|certif/.test(m)) return 'skills';
  if (/job search|apply|applications|linkedin|resume(?!.)|cv\b|bullet/.test(m)) return 'resume';
  if (/job|hiring|recruit/.test(m)) return 'job-search';
  return 'general';
}

const COACH_KNOWLEDGE: Record<CoachIntent, string[]> = {
  interview: [
    "🎯 **Before the interview**\n- Research the company: products, culture, recent news.\n- Prepare 5-7 STAR stories (Situation, Task, Action, Result).\n- Keep answers to 2-3 minutes; practise out loud with a timer.\n- Bring 3-5 questions for the interviewer.\n\n📝 **Stories to have ready**\n1. Tell me about yourself — a 90-second career story.\n2. Why this company? — tie it to something real you read.\n3. A challenge you faced — STAR.\n4. A conflict with a teammate — what *you* changed.\n5. A failure — what you did differently afterwards.",
    "For **technical rounds** use this order: clarify the problem → plan out loud → code → test edge cases → optimise. Interviewers score the talking, not only the answer.\n\nFor **behavioural rounds**, every story needs a number in the result: time saved, money earned, errors removed. That is what makes it memorable.",
  ],
  salary: [
    "💰 **Research first**\n- Check Glassdoor, Payscale, Levels.fyi and local job posts for the same title and city.\n- Write down three numbers: your walk-away, your target, your dream.\n- Count the whole package: base, bonus, allowances, HMO, leave, remote days.\n\n🤝 **At the table**\n1. Let them name the first number when you can.\n2. Say you are excited, then quote the market range.\n3. Ask for the full package, not only the base.\n4. Get the final offer in writing.\n\nSay this: \"I'm very interested in this role. Is there flexibility in the compensation to match market rates for this scope and my experience?\"",
  ],
  career: [
    "🗺️ **A 4-phase career switch**\n1. **Weeks 1-2 — audit.** List the skills your current job gave you (systems, customers, budgets, people). Talk to 5 people already in the target role.\n2. **Weeks 3-8 — build.** One course plus one portfolio piece beats three courses and nothing to show.\n3. **Ongoing — network.** Comment on industry posts, join one community, ask for short chats, not jobs.\n4. **Weeks 6-8 — rebrand.** Rewrite the resume around transferable outcomes, update the headline, and write your \"why I'm switching\" story in two sentences.\n\nRemember: frame the past as evidence for the new job, not as a list of duties.",
  ],
  skills: [
    "📚 **Pick one lane, not five.** A hiring manager reads the resume for one role at a time.\n\n**How to upskill fast**\n1. Choose the skill that appears in most of your target job posts.\n2. Take one structured course (4-8 weeks) and finish it.\n3. Build one small portfolio piece using that skill.\n4. Write the skill into your resume with a number attached.\n5. Post what you learned on LinkedIn — recruiters search those words.",
    "High-demand areas right now: AI/ML and Python, cloud (AWS/Azure/GCP), data (SQL, Power BI, Tableau), and for non-tech roles — CRM tools, process improvement (Lean/Six Sigma) and stakeholder communication. The tool matters less than proof you used it on a real problem.",
  ],
  'cover-letter': [
    "✉️ **A cover letter that gets read**\n- 3 short paragraphs, under 250 words, one page.\n- Paragraph 1: the exact job title, and the strongest matching fact about you.\n- Paragraph 2: one story with a number that proves you can do this job.\n- Paragraph 3: what you want to do for them, then a simple thank-you.\n\nMirror the posting's own words for the role and the tools — that is what both the ATS and the human are scanning for.",
  ],
  'job-search': [
    "🔎 **Make the search systematic**\n- Keep one spreadsheet: company, role, date applied, contact, follow-up date.\n- Apply within 48 hours of a posting going live — most interviews come from the first batch.\n- For every 10 applications, send 3 direct messages to people who work there (short, specific, no resume dump).\n- Follow up once after 7 days. That single message gets more replies than a better resume.",
  ],
  general: [
    "I'm your career coach. Here is what I'm best at:\n\n📄 **Resume review** — I read *your* resume and show the weak lines.\n🎯 **ATS score** — why the score is what it is and what to fix first.\n🎤 **Interview prep** — STAR stories and question practice.\n💰 **Salary** — market ranges and the words to use.\n🔄 **Career change** — a week-by-week roadmap.\n✉️ **Cover letter** — the three-paragraph structure.\n\nAsk me something like \"what should I fix in my resume?\", \"how do I prepare for interviews?\" or \"build me a summary for a data analyst role\".",
  ],
  resume: [
    "📄 **The rules that matter**\n1. Start every bullet with an action verb — Led, Built, Reduced, Delivered.\n2. Put a number in at least 6 of every 10 bullets.\n3. One page under 10 years of experience, two pages at most after that.\n4. Mirror the exact words of the job posting: ATS software matches text, not meaning.\n5. No tables, columns, photos or icons in the file you upload.",
  ],
  ats: [
    "🎯 **How the score works**\nThe ATS score here is built from six checks: format, keywords, readability, experience, skills and recruiter appeal. Format and keywords carry the most weight because they are what filters on.\n\n**Fastest score gains**\n1. Fill in email, phone and location — missing contact details cost format points immediately.\n2. Add action verbs to every bullet.\n3. Add numbers to bullets with none.\n4. Grow the skills list to 8-15 items that match the target posting.\n5. Keep the summary between 30 and 60 words.",
  ],
};

/**
 * Grounded coach reply: the curated advice above, plus what the engine
 * can see inside the user's own resume.
 */
export function careerCoachReply(message: string, resume: Resume | undefined, turn = 0): string {
  const intent = detectIntent(message);
  const pool = COACH_KNOWLEDGE[intent] || COACH_KNOWLEDGE.general;
  const knowledge = pool[turn % pool.length];

  if (!resume) {
    return `${knowledge}\n\n---\n💡 Tip: build a resume first (Resume Builder) and I can point at your actual lines.`;
  }

  const analysis = analyzeResume(resume);
  const allBullets = resume.experience.flatMap((e) => e.bullets).filter((b) => b.trim());
  const withoutNumbers = allBullets.filter((b) => !hasNumber(b));
  const weakOpenings = allBullets.filter((b) => analyzeBullet(b).hasWeakOpening);

  const findings: string[] = [];
  findings.push(`ATS score: **${analysis.score.overall}/100** (${analysis.issues.length} issue${analysis.issues.length === 1 ? '' : 's'} found).`);
  if (allBullets.length) {
    findings.push(`Bullets with a number: **${analysis.quantifiedAchievements} of ${analysis.totalBullets}**.`);
  }
  if (resume.skills.length) findings.push(`Skills listed: **${resume.skills.length}** (8-15 matches best).`);
  const years = estimateYearsOfExperience(resume);
  if (years) findings.push(`Experience read from your dates: about **${years} year${years === 1 ? '' : 's'}**.`);

  const actions: string[] = [];
  if (!resume.summary) actions.push('Write a summary — the builder\'s **AI Generate** button does it from your own content.');
  if (weakOpenings.length) actions.push(`Rewrite the **${weakOpenings.length}** line${weakOpenings.length === 1 ? '' : 's'} that start weakly (e.g. "${weakOpenings[0].slice(0, 60)}…") in the AI Optimizer.`);
  if (withoutNumbers.length) actions.push(`Add a real number to **${withoutNumbers.length}** bullet${withoutNumbers.length === 1 ? '' : 's'} — the Optimizer will draft them, you confirm the figures.`);
  if (resume.skills.length < 8) actions.push('Grow the skills list to at least 8 relevant skills.');
  if (!actions.length) actions.push('Nothing structural is missing — tailor the summary and skills to each posting before you apply.');

  const example = weakOpenings[0] || withoutNumbers[0];
  const rewritten = example ? rewriteBullet(example, { addMetrics: true }) : null;

  return [
    knowledge,
    '---',
    `**What I can see in your resume**`,
    findings.map((f) => `• ${f}`).join('\n'),
    '',
    `**Do these next**`,
    actions.map((a, i) => `${i + 1}. ${a}`).join('\n'),
    example && rewritten
      ? `\n**Live example from your own resume**\n_Before:_ ${example}\n_After:_ ${rewritten.text}${rewritten.verifyNumber ? '\n(Replace the number with your real figure.)' : ''}`
      : '',
  ].filter(Boolean).join('\n');
}
