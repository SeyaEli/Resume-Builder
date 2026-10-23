// ============================================
// PDF Import
// ============================================
//
// Reads a PDF resume and turns it into the app's Resume shape so it can be
// edited in the Resume Builder.
//
// How it works, in plain words:
//   1. pdf.js opens the file in the browser and pulls out the text of each page.
//   2. The text items are grouped back into lines by their height on the page.
//   3. Those lines are split into sections by their headings (EXPERIENCE,
//      EDUCATION, SKILLS ...), and each section is read into the matching field.
//
// This is a best-effort reader, not a mind reader. It says so in the UI: the
// person always lands in the builder with a draft they can correct. Nothing is
// uploaded anywhere - the file never leaves the browser.

import type { PDFDocumentProxy, PDFDocumentLoadingTask } from 'pdfjs-dist';
import { createId } from '../types/resume';
import type {
  Resume, Experience, Education, Skill, Project, Certification,
  Language, Award, VolunteerExperience, Reference, TemplateType,
} from '../types/resume';

// pdf.js is a big library and it is only needed when someone actually imports
// a PDF, so it is fetched on demand instead of weighing down the first page
// load. The background worker is fetched alongside it.
type PdfjsModule = typeof import('pdfjs-dist');
let pdfjsPromise: Promise<PdfjsModule> | null = null;

function loadPdfjs(): Promise<PdfjsModule> {
  if (!pdfjsPromise) {
    pdfjsPromise = (async () => {
      const [lib, worker] = await Promise.all([
        import('pdfjs-dist'),
        import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
      ]);
      // The reader runs in this worker so a big PDF never freezes the page.
      lib.GlobalWorkerOptions.workerSrc = worker.default;
      return lib;
    })().catch((error) => {
      // Do not cache a failure: if the fetch was cut off, the next attempt
      // should try again instead of failing forever.
      pdfjsPromise = null;
      throw error;
    });
  }
  return pdfjsPromise;
}

/** A friendly failure the UI can show as-is, with optional diagnostics. */
export class PdfImportError extends Error {
  details?: { pages: number; rawItems: number; rawChars: number };
  constructor(message: string, details?: { pages: number; rawItems: number; rawChars: number }) {
    super(message);
    this.name = 'PdfImportError';
    this.details = details;
  }
}

const MAX_BYTES = 20 * 1024 * 1024; // 20 MB cap on uploads

export interface PdfImportResult {
  resume: Resume;
  /** Things worth telling the person before they start editing. */
  warnings: string[];
  stats: {
    pages: number;
    characters: number;
    sections: string[];
  };
}

// ============================================
// Step 1 - file checks
// ============================================

function isPdfFile(file: File): boolean {
  const byType = file.type === 'application/pdf';
  const byName = /\.pdf$/i.test(file.name);
  // Some browsers hand over an empty type for a dropped file, so accept either.
  return byType || byName;
}

// ============================================
// Step 2 - pull text out of the PDF
// ============================================

interface RawItem {
  text: string;
  x: number;
  y: number;
  width: number;
  /** The PDF itself marks this fragment as the end of a printed line. */
  eol: boolean;
}

async function readPdfLines(file: File): Promise<{ lines: string[]; pages: number; rawChars: number; rawItems: number }> {
  let data: ArrayBuffer;
  try {
    data = await file.arrayBuffer();
  } catch {
    throw new PdfImportError('That file could not be read. Try saving it again and re-uploading.');
  }

  const pdfjsLib = await loadPdfjs();

  // Font maps live in public/cmaps and public/standard_fonts (copied from
  // pdfjs-dist). Without them, PDFs that use embedded or non-standard fonts
  // hand back zero characters and look like scans. BASE_URL keeps this
  // working when the app is served from a subfolder (XAMPP) or a file path.
  const base = import.meta.env.BASE_URL || './';
  const docParams = {
    data,
    cMapUrl: base + 'cmaps/',
    cMapPacked: true as const,
    standardFontDataUrl: base + 'standard_fonts/',
    useSystemFonts: true as const,
    isEvalSupported: false as const,
  };

  let doc: PDFDocumentProxy;
  let loadingTask: PDFDocumentLoadingTask | null = null;
  try {
    loadingTask = pdfjsLib.getDocument(docParams);
    doc = await loadingTask.promise;
  } catch (error) {
    // The task may already hold a worker; drop it before giving up.
    await loadingTask?.destroy().catch(() => undefined);
    const name = (error as { name?: string })?.name;
    if (name === 'PasswordException') {
      throw new PdfImportError('This PDF is password-protected. Remove the password (or print it to a new PDF) and try again.');
    }
    if (name === 'InvalidPDFException') {
      throw new PdfImportError('This file is not a readable PDF. It may be damaged or renamed from another format.');
    }
    throw new PdfImportError('This PDF could not be opened. It may be damaged, or saved in an unusual way.');
  }

  const lines: string[] = [];
  const pages = doc.numPages;
  // Raw character count before any grouping: tells a real scan (no text at
  // all) apart from a grouping bug (text exists but lines came out empty).
  let rawChars = 0;
  let rawItems = 0;

  try {
    for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber++) {
      const page = await doc.getPage(pageNumber);
      // First pass: default text extraction. If a page comes back empty,
      // retry with marked content included — some writers (Canva, Word
      // with text boxes, Illustrator outlines-as-text) only expose text
      // through that path.
      let content = await page.getTextContent();
      if (content.items.length === 0) {
        try {
          content = await page.getTextContent({ includeMarkedContent: true } as never);
        } catch {
          // Keep the empty first pass; the diagnostics below will explain it.
        }
      }

      const items: RawItem[] = [];
      for (const item of content.items) {
        if (!('str' in item)) continue;
        rawItems++;
        const text = (item.str as string) ?? '';
        rawChars += text.length;
        // Keep end-of-line markers even when the fragment itself is only
        // whitespace: some PDFs split words into single characters with
        // blank fragments between them, and dropping the blanks loses the
        // line breaks.
        if (!text.trim()) {
          if ((item as { hasEOL?: boolean }).hasEOL && items.length) {
            const last = items[items.length - 1];
            last.eol = true;
          }
          continue;
        }
        // Some PDFs hand over items without a position; treat those as
        // starting at the left so they are kept instead of crashing the read.
        const transform = (item as { transform?: number[] }).transform;
        items.push({
          text,
          x: transform?.[4] ?? 0,
          y: transform?.[5] ?? 0,
          width: item.width ?? 0,
          eol: (item as { hasEOL?: boolean }).hasEOL ?? false,
        });
      }

      const grouped = groupItemsIntoLines(items);
      if (grouped.length === 0 && items.length > 0) {
        // Grouping dropped everything (odd coordinates): fall back to the
        // raw fragments joined in read order so no text is lost.
        lines.push(items.map((entry) => entry.text).join(' '));
      } else {
        lines.push(...grouped);
      }
      page.cleanup();
    }
  } finally {
    // The loading task owns the background worker, so it is the thing to
    // tear down - leaving it alive would keep the worker in memory.
    await loadingTask.destroy();
  }

  const tidied = tidyLines(lines);
  return { lines: tidied, pages, rawChars, rawItems };
}

/**
 * PDF text arrives as loose fragments scattered across the page. Fragments that
 * sit at the same height belong to the same line, so we sort by height (top
 * first) and then by horizontal position (left first).
 */
function groupItemsIntoLines(items: RawItem[]): string[] {
  if (items.length === 0) return [];

  const sorted = [...items].sort((a, b) => (Math.abs(b.y - a.y) > 2 ? b.y - a.y : a.x - b.x));

  const rows: RawItem[][] = [];
  let current: RawItem[] = [];
  let currentY = sorted[0].y;
  // True when the previous fragment ended a printed line, so the next one
  // always starts a fresh row even if it sits at almost the same height
  // (two-column layouts and justified text do this).
  let breakAfter = false;

  for (const item of sorted) {
    // 2pt of slack absorbs the small height differences inside one line.
    const yGap = Math.abs(item.y - currentY) > 2;
    if (current.length && (breakAfter || yGap)) {
      rows.push(current);
      current = [];
    }
    if (current.length === 0) {
      currentY = item.y;
      breakAfter = false;
    }
    current.push(item);
    if (item.eol) breakAfter = true;
  }
  if (current.length) rows.push(current);

  return rows.map(row => {
    const ordered = [...row].sort((a, b) => a.x - b.x);
    let text = '';
    let lastEnd: number | null = null;

    for (const item of ordered) {
      if (lastEnd !== null) {
        const gap = item.x - lastEnd;
        // A wide gap is a real space (or a column break); a small one is just
        // how the PDF stored the word.
        if (gap > 12) text += '  ';
        else if (gap > 0.6 && !text.endsWith(' ') && !item.text.startsWith(' ')) text += ' ';
      }
      text += item.text;
      lastEnd = item.x + item.width;
    }
    return text;
  });
}

/** Join hyphenated line breaks and drop stray blank lines. */
function tidyLines(lines: string[]): string[] {
  const out: string[] = [];

  for (const raw of lines) {
    // Strip zero-width and invisible formatting characters that some PDF
    // writers sprinkle everywhere — left alone they make lines look empty.
    const line = raw.replace(/[\u200B\u200C\u200D\uFEFF\u00AD]/g, '').replace(/\s+/g, ' ').trim();
    if (!line) {
      // Keep a single blank line as a paragraph break, never two in a row.
      if (out.length && out[out.length - 1] !== '') out.push('');
      continue;
    }

    const previous = out.length ? out[out.length - 1] : '';
    // "develop-\nment" -> "development"
    if (previous.endsWith('-') && /^[a-z]/.test(line)) {
      out[out.length - 1] = previous.slice(0, -1) + line;
      continue;
    }

    out.push(line);
  }

  while (out.length && out[out.length - 1] === '') out.pop();
  return out;
}

// ============================================
// Step 3 - patterns used while reading
// ============================================

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
const PHONE_RE = /(?:\+?\d{1,3}[\s.-]?)?(?:\(\d{2,4}\)[\s.-]?)?\d{3}[\s.-]?\d{3,4}(?:[\s.-]?\d{2,4})?/;
const LINKEDIN_RE = /(?:https?:\/\/)?(?:[a-z]{2,3}\.)?linkedin\.com\/[^\s,;|]+/i;
const URL_RE = /(?:https?:\/\/|www\.)[^\s,;|)]+|[a-z0-9][a-z0-9-]*\.(?:com|net|org|io|dev|me|ph|co|app|info|biz)(?:\/[^\s,;|)]*)?/i;

const BULLET_RE = /^\s*(?:[\u2022\u2023\u25AA\u25CF\u25E6\u2043\u2219\u00B7\u27A4\u25B8\u25AB\u25A0\u2027>*-]|\u2013|\u2014)\s+/;

const MONTHS: Record<string, string> = {
  jan: '01', january: '01', feb: '02', february: '02', mar: '03', march: '03',
  apr: '04', april: '04', may: '05', jun: '06', june: '06', jul: '07', july: '07',
  aug: '08', august: '08', sep: '09', sept: '09', september: '09', oct: '10', october: '10',
  nov: '11', november: '11', dec: '12', december: '12',
};

const DATE_TOKEN = '(?:[A-Za-z]{3,9}\\.?\\s*,?\\s*\\d{4}|\\d{1,2}\\/\\d{4}|\\d{4}-\\d{2}|\\d{4})';
const PRESENT_TOKEN = '(?:present|current|now|ongoing|to\\s+date|today|date)';
const RANGE_RE = new RegExp(
  `(${DATE_TOKEN})\\s*(?:-|\\u2013|\\u2014|to|until|through|till)\\s*(${DATE_TOKEN}|${PRESENT_TOKEN})`,
  'i',
);
const SINGLE_DATE_RE = new RegExp(`(${DATE_TOKEN})`, 'i');

interface DateRange {
  start: string;
  end: string;
  current: boolean;
}

/** "Jan 2020" | "01/2020" | "2020-01" | "2020" -> "2020-01" | "2020" */
function toYearMonth(token: string): string {
  const value = token.trim().replace(/,$/, '');

  const monthYear = value.match(/^([A-Za-z]{3,9})\.?\s*(\d{4})$/);
  if (monthYear) {
    const month = MONTHS[monthYear[1].toLowerCase()];
    if (month) return `${monthYear[2]}-${month}`;
    return monthYear[2];
  }

  const slash = value.match(/^(\d{1,2})\/(\d{4})$/);
  if (slash) return `${slash[2]}-${slash[1].padStart(2, '0')}`;

  const dashed = value.match(/^(\d{4})-(\d{2})$/);
  if (dashed) return value;

  const yearOnly = value.match(/^(\d{4})$/);
  if (yearOnly) return yearOnly[1];

  return '';
}

function isPresent(token: string): boolean {
  return /^(?:present|current|now|ongoing|to\s+date|today|date)$/i.test(token.trim());
}

function findDateRange(line: string): DateRange | null {
  const range = line.match(RANGE_RE);
  if (range) {
    const start = toYearMonth(range[1]);
    if (isPresent(range[2])) return { start, end: '', current: true };
    const end = toYearMonth(range[2]);
    if (start || end) return { start, end, current: false };
  }
  return null;
}

/** Remove the dates from a header line so what's left is title/company/place. */
function stripDates(line: string): string {
  return line
    .replace(RANGE_RE, ' ')
    .replace(new RegExp(`\\(?\\s*${PRESENT_TOKEN}\\s*\\)?`, 'gi'), ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function findSingleDate(line: string): string {
  const match = line.match(SINGLE_DATE_RE);
  return match ? toYearMonth(match[1]) : '';
}

// ============================================
// Step 4 - section headings
// ============================================

type SectionKey =
  | 'header' | 'summary' | 'experience' | 'education' | 'skills' | 'projects'
  | 'certifications' | 'languages' | 'awards' | 'volunteer' | 'references' | 'ignored';

const SECTION_PATTERNS: { key: SectionKey; patterns: RegExp[] }[] = [
  {
    key: 'summary',
    patterns: [
      /^(?:professional\s+|career\s+|executive\s+)?(?:summary|profile|objective|statement)$/,
      /^about(?:\s+me)?$/,
      /^personal\s+(?:summary|profile|statement)$/,
      /^career\s+(?:objective|summary|profile)$/,
      /^overview$/,
    ],
  },
  {
    key: 'experience',
    patterns: [
      /^(?:(?:work|professional|employment|relevant|career|industry)\s+)*(?:experience|history)$/,
      /^work\s+history$/,
      /^employment(?:\s+history)?$/,
      /^professional\s+background$/,
      /^positions?\s+held$/,
    ],
  },
  {
    key: 'education',
    patterns: [
      /^education(?:\s+(?:and|&)\s+training)?$/,
      /^educational\s+background$/,
      /^academic(?:\s+(?:background|qualifications|credentials))?$/,
      /^academics$/,
      /^qualifications$/,
    ],
  },
  {
    key: 'skills',
    patterns: [
      /^(?:(?:technical|core|key|professional|relevant|other|additional|specialized|specialised)\s+)*(?:skills|competencies|proficiencies|expertise)$/,
      /^areas?\s+of\s+(?:expertise|focus)$/,
      /^technologies(?:\s+(?:used|and\s+tools))?$/,
      /^tech(?:nology)?\s+stack$/,
      /^tools?(?:\s+(?:and|&)\s+technologies)?$/,
      /^skills?\s+(?:and|&)\s+(?:interests|abilities)$/,
    ],
  },
  {
    key: 'projects',
    patterns: [
      /^(?:(?:personal|selected|key|notable|academic|side|major)\s+)*projects?$/,
      /^portfolio$/,
      /^selected\s+work$/,
    ],
  },
  {
    key: 'certifications',
    patterns: [
      /^certifications?$/,
      /^certificates?$/,
      /^licenses?(?:\s+(?:and|&)\s+certifications?)?$/,
      /^licensure(?:\s+(?:and|&)\s+certifications?)?$/,
      /^professional\s+(?:certifications?|development|credentials)$/,
      /^training(?:\s+(?:and|&)\s+certifications?)?$/,
    ],
  },
  {
    key: 'languages',
    patterns: [/^languages?(?:\s+skills?)?$/, /^language\s+proficiency$/],
  },
  {
    key: 'awards',
    patterns: [
      /^awards?(?:\s+(?:and|&)\s+honors?)?$/,
      /^honors?(?:\s+(?:and|&)\s+awards?)?$/,
      /^achievements?$/,
      /^accomplishments?$/,
      /^recognitions?$/,
    ],
  },
  {
    key: 'volunteer',
    patterns: [
      /^volunteer(?:\s+(?:experience|work|activities|service))?$/,
      /^community\s+(?:service|involvement|engagement)$/,
      /^extracurricular(?:\s+activities)?$/,
    ],
  },
  {
    key: 'references',
    patterns: [/^references?$/, /^referees?$/],
  },
  {
    // Recognised on purpose, then set aside: these hold nothing this app models.
    key: 'ignored',
    patterns: [
      /^interests?(?:\s+(?:and|&)\s+hobbies)?$/,
      /^hobbies(?:\s+(?:and|&)\s+interests)?$/,
      /^publications?$/,
      /^additional\s+information$/,
      /^other\s+information$/,
      /^personal\s+(?:details|information|data)$/,
      /^declaration$/,
      /^affiliations?$/,
      /^memberships?$/,
      /^activities$/,
      /^summary\s+of\s+qualifications$/,
    ],
  },
];

/** Headings are short and stand alone. A long sentence never is one. */
function asHeading(line: string): SectionKey | null {
  const cleaned = line.replace(/[\s:_.\-–—]+$/g, '').trim();
  if (!cleaned || cleaned.length > 46) return null;
  if (/[.!?]$/.test(line.trim())) return null;
  // Contact lines and bullet points are never headings.
  if (EMAIL_RE.test(cleaned) || PHONE_RE.test(cleaned) || BULLET_RE.test(line)) return null;

  const lowered = cleaned.toLowerCase();
  for (const section of SECTION_PATTERNS) {
    for (const pattern of section.patterns) {
      if (pattern.test(lowered)) return section.key;
    }
  }
  return null;
}

// ============================================
// Step 5 - small helpers
// ============================================

function splitOnSeparators(text: string): string[] {
  return text
    .split(/\s*(?:\||\u2022|\u00B7|\u25CF|\t| {3,})\s*/)
    .map(part => part.replace(/^[\s,;:–—\-]+|[\s,;:–—\-]+$/g, '').trim())
    .filter(Boolean);
}

/** Split a header like "Senior Engineer — Acme Inc, Manila" into its parts. */
function splitHeaderLine(line: string): string[] {
  const withPipes = splitOnSeparators(line);
  if (withPipes.length > 1) return withPipes;

  const dashed = line.split(/\s+(?:\u2013|\u2014|-)\s+/).map(p => p.trim()).filter(Boolean);
  if (dashed.length > 1) return dashed;

  return [line.trim()].filter(Boolean);
}

const INSTITUTION_RE = /(university|college|institute|institution|school|academy|polytechnic|conservatory|seminary)/i;
const DEGREE_RE = /(bachelor|master|doctor|ph\.?d|associate|diploma|degree|b\.?s\.?|b\.?a\.?|m\.?s\.?|m\.?a\.?|mba|bsc|msc|bs|ba|ms|ma|juris|llb|llm|md|bsn|bsee|bsit)/i;
const LOCATION_RE = /,\s*(?:[A-Z]{2}|[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*$/;

const SOFT_SKILLS = [
  'communication', 'leadership', 'teamwork', 'collaboration', 'problem solving', 'problem-solving',
  'time management', 'adaptability', 'critical thinking', 'creativity', 'organization', 'organisation',
  'attention to detail', 'decision making', 'conflict resolution', 'negotiation', 'mentoring',
  'presentation', 'interpersonal', 'work ethic', 'multitasking', 'emotional intelligence',
  'project management', 'strategic planning', 'customer service', 'public speaking', 'coaching',
];

const TOOLS = [
  'git', 'github', 'gitlab', 'docker', 'kubernetes', 'jenkins', 'jira', 'confluence', 'slack',
  'figma', 'photoshop', 'illustrator', 'excel', 'word', 'powerpoint', 'outlook', 'tableau',
  'power bi', 'looker', 'sap', 'salesforce', 'hubspot', 'quickbooks', 'xero', 'postman',
  'vs code', 'visual studio', 'intellij', 'eclipse', 'linux', 'windows', 'macos', 'aws',
  'azure', 'gcp', 'google cloud', 'terraform', 'ansible', 'nginx', 'apache', 'redis',
  'mongodb', 'postgresql', 'mysql', 'sqlite', 'oracle', 'snowflake', 'databricks', 'airflow',
  'grafana', 'prometheus', 'splunk', 'zendesk', 'notion', 'asana', 'trello', 'monday.com',
];

const LANGUAGES = [
  'python', 'javascript', 'typescript', 'java', 'c', 'c++', 'c#', 'go', 'golang', 'rust', 'ruby',
  'php', 'swift', 'kotlin', 'scala', 'perl', 'r', 'matlab', 'sql', 'nosql', 'bash', 'shell',
  'powershell', 'html', 'css', 'sass', 'less', 'dart', 'objective-c', 'vba', 'abap', 'cobol',
  'fortran', 'lua', 'elixir', 'haskell', 'clojure', 'groovy', 'solidity',
];

const FRAMEWORKS = [
  'react', 'react native', 'angular', 'vue', 'svelte', 'next.js', 'nextjs', 'nuxt', 'node.js',
  'nodejs', 'express', 'nestjs', 'django', 'flask', 'fastapi', 'spring', 'spring boot', '.net',
  'dotnet', 'asp.net', 'laravel', 'rails', 'ruby on rails', 'jquery', 'bootstrap', 'tailwind',
  'tailwindcss', 'material ui', 'redux', 'graphql', 'rest', 'restful', 'soap', 'grpc',
  'tensorflow', 'pytorch', 'scikit-learn', 'pandas', 'numpy', 'keras', 'opencv', 'flutter',
  'xamarin', 'electron', 'webpack', 'vite', 'jest', 'cypress', 'selenium', 'playwright',
];

const SPOKEN_LANGUAGES = [
  'english', 'spanish', 'french', 'german', 'italian', 'portuguese', 'dutch', 'russian',
  'mandarin', 'cantonese', 'japanese', 'korean', 'arabic', 'hindi', 'urdu', 'bengali', 'tamil',
  'tagalog', 'filipino', 'cebuano', 'ilocano', 'vietnamese', 'thai', 'indonesian', 'malay',
  'turkish', 'polish', 'swedish', 'norwegian', 'danish', 'greek', 'hebrew', 'persian', 'swahili',
];

function categoriseSkill(name: string): Skill['category'] {
  const lowered = name.toLowerCase().trim();
  if (SPOKEN_LANGUAGES.includes(lowered)) return 'language';
  if (LANGUAGES.includes(lowered)) return 'language';
  if (FRAMEWORKS.some(f => lowered === f || lowered.startsWith(`${f} `))) return 'framework';
  if (TOOLS.some(t => lowered === t || lowered.startsWith(`${t} `))) return 'tool';
  if (SOFT_SKILLS.some(s => lowered === s || lowered.includes(s))) return 'soft';
  return 'hard';
}

const PROFICIENCY_MAP: { pattern: RegExp; value: Language['proficiency'] }[] = [
  { pattern: /native|mother\s*tongue|bilingual/i, value: 'native' },
  { pattern: /fluent|full\s+professional|professional\s+working|native\s*\/\s*fluent/i, value: 'fluent' },
  { pattern: /advanced|proficient|c1|c2/i, value: 'advanced' },
  { pattern: /intermediate|conversational|working\s+knowledge|b1|b2/i, value: 'intermediate' },
  { pattern: /basic|beginner|elementary|a1|a2|limited/i, value: 'basic' },
];

// ============================================
// Step 6 - read each section into the Resume shape
// ============================================

function parsePersonalInfo(headerLines: string[], allLines: string[]): Resume['personalInfo'] {
  const joined = allLines.join(' \u2022 ');

  const email = joined.match(EMAIL_RE)?.[0] ?? '';
  const linkedin = joined.match(LINKEDIN_RE)?.[0]?.replace(/^https?:\/\//i, '') ?? '';

  // Prefer the first phone-shaped match, but never one that is part of a date.
  let phone = '';
  for (const line of headerLines) {
    if (EMAIL_RE.test(line)) continue;
    const match = line.match(PHONE_RE);
    if (match && match[0].replace(/\D/g, '').length >= 7) {
      phone = match[0].trim();
      break;
    }
  }

  let portfolio = '';
  for (const line of headerLines) {
    const match = line.match(URL_RE);
    if (match && !/linkedin\.com/i.test(match[0])) {
      portfolio = match[0].replace(/^https?:\/\//i, '');
      break;
    }
  }

  // The name is the first short line that holds no contact details.
  let fullName = '';
  for (const line of headerLines) {
    if (EMAIL_RE.test(line) || PHONE_RE.test(line) || URL_RE.test(line)) continue;
    if (line.length > 60) continue;
    if (asHeading(line)) continue;
    const words = line.split(/\s+/).filter(Boolean);
    if (words.length < 1 || words.length > 6) continue;
    if (/\d/.test(line)) continue;
    fullName = line.replace(/[|,]+$/, '').trim();
    break;
  }

  // A job title usually sits right under the name, on its own short line.
  let title = '';
  if (fullName) {
    const nameIndex = headerLines.findIndex(line => line.includes(fullName));
    for (let i = nameIndex + 1; i < headerLines.length; i++) {
      const line = headerLines[i];
      if (!line) continue;
      if (EMAIL_RE.test(line) || PHONE_RE.test(line) || URL_RE.test(line)) continue;
      if (asHeading(line)) break;
      if (line.length > 70) break;
      const words = line.split(/\s+/).filter(Boolean);
      if (words.length < 2 || words.length > 9) continue;
      if (findDateRange(line)) continue;
      title = line.replace(/[|,]+$/, '').trim();
      break;
    }
  }

  // A place, e.g. "San Francisco, CA" or "Manila, Philippines".
  let location = '';
  for (const line of headerLines) {
    if (line === fullName || line === title) continue;
    if (EMAIL_RE.test(line) || PHONE_RE.test(line) || URL_RE.test(line)) continue;
    for (const part of splitOnSeparators(line)) {
      const trimmed = part.replace(/^[\s|]+/, '').trim();
      if (LOCATION_RE.test(trimmed) && trimmed.length <= 48) {
        location = trimmed;
        break;
      }
    }
    if (location) break;
  }

  return { fullName, email, phone, location, linkedin, portfolio, title };
}

function parseExperience(lines: string[]): Experience[] {
  const entries: Experience[] = [];
  let current: Experience | null = null;

  const startEntry = (line: string): Experience => {
    const range = findDateRange(line);
    const withoutDates = stripDates(line);
    const parts = splitHeaderLine(withoutDates);

    const entry: Experience = {
      id: createId(),
      jobTitle: parts[0] ?? '',
      company: parts[1] ?? '',
      location: parts.slice(2).join(', '),
      startDate: range?.start ?? '',
      endDate: range?.end ?? '',
      current: range?.current ?? false,
      bullets: [],
    };

    // "Acme Inc, Manila" as the only part: peel the place off the company.
    if (!entry.location && entry.company && LOCATION_RE.test(entry.company)) {
      const comma = entry.company.lastIndexOf(',');
      entry.location = entry.company.slice(comma + 1).trim();
      entry.company = entry.company.slice(0, comma).trim();
    }
    // "Acme Inc, Manila" as a single part.
    if (!entry.company && LOCATION_RE.test(entry.jobTitle)) {
      const comma = entry.jobTitle.lastIndexOf(',');
      entry.location = entry.jobTitle.slice(comma + 1).trim();
      entry.jobTitle = entry.jobTitle.slice(0, comma).trim();
    }

    return entry;
  };

  const isEntryHeader = (line: string): boolean => {
    if (BULLET_RE.test(line)) return false;
    if (findDateRange(line)) return true;
    if (!current) return false;
    if (current.bullets.length === 0) return false;
    // A short line with a divider after a finished entry starts the next one.
    return line.length <= 95 && /[|\u2022\u00B7]|\s+\u2013\s+|\s+\u2014\s+/.test(line);
  };

  for (const line of lines) {
    if (!line) continue;

    if (isEntryHeader(line)) {
      if (current) entries.push(current);
      current = startEntry(line);
      continue;
    }

    if (BULLET_RE.test(line)) {
      if (!current) current = startEntry(line.replace(BULLET_RE, ''));
      const text = line.replace(BULLET_RE, '').trim();
      if (text) current.bullets.push(text);
      continue;
    }

    if (!current) {
      current = startEntry(line);
      continue;
    }

    // A plain line after bullets is either a wrapped bullet or a company line.
    if (current.bullets.length > 0) {
      const lastIndex = current.bullets.length - 1;
      const last = current.bullets[lastIndex];
      if (/[.!;]$/.test(last) || last.length > 140) {
        current.bullets.push(line);
      } else {
        current.bullets[lastIndex] = `${last} ${line}`.replace(/\s+/g, ' ').trim();
      }
    } else if (!current.company) {
      const parts = splitHeaderLine(line);
      current.company = parts[0] ?? '';
      if (parts.length > 1) current.location = parts.slice(1).join(', ');
    } else if (!current.location) {
      current.location = line;
    } else {
      current.bullets.push(line);
    }
  }

  if (current) entries.push(current);

  // A "job" with no title, no company and no dates is noise, not an entry.
  return entries.filter(e => e.jobTitle || e.company || e.bullets.length);
}

function parseEducation(lines: string[]): Education[] {
  const blocks: string[][] = [];
  let block: string[] = [];

  for (const line of lines) {
    if (!line) {
      if (block.length) blocks.push(block);
      block = [];
      continue;
    }
    // A line carrying a year normally begins the next school entry.
    if (block.length && /\b(?:19|20)\d{2}\b/.test(line) && block.some(l => /\b(?:19|20)\d{2}\b/.test(l))) {
      blocks.push(block);
      block = [line];
      continue;
    }
    block.push(line);
  }
  if (block.length) blocks.push(block);

  return blocks
    .map(entryLines => {
      const education: Education = { id: createId(), degree: '', institution: '', location: '', year: '' };

      for (const line of entryLines) {
        const gpaMatch = line.match(/\b(?:gpa|grade|average)\b[:\s]*([0-9.]+(?:\s*\/\s*[0-9.]+)?)/i);
        if (gpaMatch) {
          education.gpa = gpaMatch[1].trim();
          continue;
        }
        if (/\b(?:cum\s+laude|magna|summa|dean'?s\s+list|honou?rs?|distinction|with\s+high)\b/i.test(line) && line.length < 80) {
          education.honors = education.honors ? `${education.honors}; ${line}` : line;
          continue;
        }
        if (!education.year) {
          const year = findSingleDate(line);
          if (year) education.year = year;
        }

        const withoutYear = stripDates(line).replace(/\b(?:19|20)\d{2}\b/g, '').replace(/\s{2,}/g, ' ').trim();
        if (!withoutYear) continue;

        const parts = splitHeaderLine(withoutYear);
        for (const part of parts) {
          if (!part) continue;
          if (INSTITUTION_RE.test(part) && !education.institution) {
            education.institution = part;
          } else if (DEGREE_RE.test(part) && !education.degree) {
            education.degree = part;
          } else if (!education.degree) {
            education.degree = part;
          } else if (!education.institution) {
            education.institution = part;
          } else if (LOCATION_RE.test(part) && !education.location) {
            education.location = part;
          }
        }
      }

      return education;
    })
    .filter(e => e.degree || e.institution);
}

function parseSkills(lines: string[]): Skill[] {
  const skills: Skill[] = [];
  const seen = new Set<string>();

  const add = (raw: string) => {
    const name = raw.replace(/^[\s,;:–—\-•·|]+|[\s,;:–—\-•·|]+$/g, '').trim();
    if (!name || name.length > 60) return;
    // Drop a stray label that is only punctuation or a single letter.
    if (!/[A-Za-z0-9]/.test(name)) return;
    const key = name.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    skills.push({ id: createId(), name, category: categoriseSkill(name) });
  };

  for (const line of lines) {
    if (!line) continue;
    let body = line;

    // "Programming Languages: Python, Java" - the label hints at a category.
    const labelled = body.match(/^([^:]{2,40}):\s*(.+)$/);
    if (labelled) body = labelled[2];

    body
      .split(/\s*(?:,|;|\||\u2022|\u00B7|\u25CF|\t)\s*/)
      .forEach(add);
  }

  return skills;
}

function parseProjects(lines: string[]): Project[] {
  const projects: Project[] = [];
  let current: Project | null = null;

  const flush = () => {
    if (current && (current.name || current.description)) projects.push(current);
    current = null;
  };

  for (const line of lines) {
    if (!line) continue;

    const techMatch = line.match(/^(?:technolog(?:y|ies)|tech\s+stack|stack|tools?(?:\s+used)?|built\s+with)\s*:\s*(.+)$/i);
    if (techMatch && current) {
      current.technologies = techMatch[1].split(/\s*(?:,|;|\||\u2022)\s*/).map(t => t.trim()).filter(Boolean);
      continue;
    }

    const resultMatch = line.match(/^(?:results?|impact|outcomes?|achievements?)\s*:\s*(.+)$/i);
    if (resultMatch && current) {
      current.results = resultMatch[1].trim();
      continue;
    }

    const urlMatch = line.match(URL_RE);
    if (urlMatch && current && !current.url) {
      current.url = urlMatch[0].replace(/^https?:\/\//i, '');
    }

    if (BULLET_RE.test(line) && current) {
      const text = line.replace(BULLET_RE, '').trim();
      if (text) current.description = current.description ? `${current.description} ${text}` : text;
      continue;
    }

    // A new project starts when the line looks like a title, not a sentence.
    const looksLikeTitle =
      !current ||
      (current.description.length > 0 && line.length <= 80 && !/[.!?]$/.test(line)) ||
      /[|\u2022\u00B7]/.test(line);

    if (looksLikeTitle) {
      flush();
      const parts = splitHeaderLine(line.replace(URL_RE, '').trim());
      current = {
        id: createId(),
        name: parts[0] ?? '',
        description: parts.slice(1).join(', '),
        technologies: [],
        results: '',
      };
      if (urlMatch) current.url = urlMatch[0].replace(/^https?:\/\//i, '');
      continue;
    }

    if (current) {
      current.description = current.description ? `${current.description} ${line}` : line;
    }
  }

  flush();
  return projects.filter(p => p.name || p.description);
}

const ISSUER_HINT = /(aws|amazon|google|microsoft|meta|cisco|oracle|ibm|comptia|pmi|scrum|safe|itil|salesforce|hubspot|coursera|udemy|edx|linkedin|nvidia|red\s*hat|linux\s+foundation|isaca|isc2|asq|six\s+sigma|lean|iso|dost|tesda|prc)/i;

function parseCertifications(lines: string[]): Certification[] {
  const certifications: Certification[] = [];

  for (const line of lines) {
    if (!line) continue;
    const text = line.replace(BULLET_RE, '').trim();
    if (!text) continue;

    const parts = splitHeaderLine(text);
    let name = parts[0] ?? text;
    let issuer = '';
    let date = findSingleDate(text);

    if (parts.length > 1) {
      // Whichever part names a known issuer is the issuer, not the title.
      const issuerIndex = parts.findIndex((p, i) => i > 0 && ISSUER_HINT.test(p));
      if (issuerIndex > 0) {
        issuer = parts[issuerIndex];
        name = parts.filter((_, i) => i !== issuerIndex).join(', ');
      } else {
        issuer = parts[1];
        name = parts[0];
      }
    }

    // "AWS Certified Solutions Architect (Amazon Web Services, 2022)"
    const paren = text.match(/\(([^)]+)\)/);
    if (paren) {
      const inside = paren[1];
      const insideDate = findSingleDate(inside);
      if (insideDate) date = insideDate;
      if (!issuer) {
        const candidate = inside.replace(SINGLE_DATE_RE, '').replace(/[,\s]+$/g, '').trim();
        if (candidate && ISSUER_HINT.test(candidate)) issuer = candidate;
      }
    }

    const cleanedName = name
      .replace(/\([^)]*\)/g, '')
      .replace(SINGLE_DATE_RE, '')
      .replace(/\s*[,\u2013\u2014-]\s*$/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim();

    if (!cleanedName) continue;
    certifications.push({ id: createId(), name: cleanedName, issuer: issuer.trim(), date });
  }

  return certifications;
}

function parseLanguages(lines: string[]): Language[] {
  const languages: Language[] = [];
  const seen = new Set<string>();

  for (const line of lines) {
    if (!line) continue;
    const parts = line.split(/\s*(?:,|;|\||\u2022|\u00B7)\s*/).filter(Boolean);

    for (const part of parts) {
      const cleaned = part.replace(BULLET_RE, '').trim();
      if (!cleaned) continue;

      const match = cleaned.match(/^([A-Za-z\u00C0-\u024F' .-]{2,30}?)\s*(?:\(([^)]*)\)|\s*[-–—:]\s*(.+))?$/);
      if (!match) continue;

      const name = match[1].replace(/[,\s]+$/, '').trim();
      if (!name) continue;
      const key = name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);

      const levelText = (match[2] || match[3] || '').trim();
      let proficiency: Language['proficiency'] = 'intermediate';
      for (const entry of PROFICIENCY_MAP) {
        if (entry.pattern.test(levelText)) { proficiency = entry.value; break; }
      }
      // A bare language name with no level is safest as "fluent" only if it is
      // the person's own; we cannot know, so keep the neutral middle value.
      languages.push({ id: createId(), name, proficiency });
    }
  }

  return languages;
}

function parseAwards(lines: string[]): Award[] {
  const awards: Award[] = [];

  for (const line of lines) {
    if (!line) continue;
    const text = line.replace(BULLET_RE, '').trim();
    if (!text) continue;

    const parts = splitHeaderLine(text);
    const name = parts[0] ?? text;
    if (!name) continue;

    awards.push({
      id: createId(),
      name: name.replace(SINGLE_DATE_RE, '').replace(/[,\s]+$/, '').trim(),
      issuer: parts[1] ?? '',
      date: findSingleDate(text),
      description: parts.length > 2 ? parts.slice(2).join(', ') : undefined,
    });
  }

  return awards;
}

function parseVolunteer(lines: string[]): VolunteerExperience[] {
  const entries: VolunteerExperience[] = [];
  let current: VolunteerExperience | null = null;

  const start = (line: string): VolunteerExperience => {
    const range = findDateRange(line);
    const parts = splitHeaderLine(stripDates(line));
    return {
      id: createId(),
      role: parts[0] ?? '',
      organization: parts[1] ?? '',
      startDate: range?.start ?? '',
      endDate: range?.end ?? '',
      description: parts.slice(2).join(', '),
    };
  };

  for (const line of lines) {
    if (!line) continue;

    if (findDateRange(line) || (!current && !BULLET_RE.test(line))) {
      if (current) entries.push(current);
      current = start(line);
      continue;
    }

    if (!current) { current = start(line); continue; }

    const text = line.replace(BULLET_RE, '').trim();
    if (!text) continue;
    current.description = current.description ? `${current.description} ${text}` : text;
  }

  if (current) entries.push(current);
  return entries.filter(v => v.role || v.organization || v.description);
}

function parseReferences(lines: string[]): Reference[] {
  const references: Reference[] = [];

  for (const line of lines) {
    if (!line) continue;
    const text = line.replace(BULLET_RE, '').trim();
    if (!text) continue;
    if (/^references?\s+(?:available|upon)/i.test(text)) continue;

    const email = text.match(EMAIL_RE)?.[0] ?? '';
    const phone = text.match(PHONE_RE)?.[0] ?? '';
    const remainder = text
      .replace(EMAIL_RE, '')
      .replace(PHONE_RE, '')
      .replace(/[|,;]+/g, '|')
      .replace(/\s{2,}/g, ' ')
      .trim();

    const parts = splitOnSeparators(remainder);
    if (!parts.length && !email && !phone) continue;

    references.push({
      id: createId(),
      name: parts[0] ?? '',
      title: parts[1] ?? '',
      company: parts[2] ?? '',
      email,
      phone: phone.trim(),
      relationship: parts[3] ?? '',
    });
  }

  return references;
}

// ============================================
// Step 7 - put it together
// ============================================

export function parseResumeText(lines: string[], fileName: string, pages: number): PdfImportResult {
  // 1. Cut the lines into sections.
  const buckets: Record<SectionKey, string[]> = {
    header: [], summary: [], experience: [], education: [], skills: [], projects: [],
    certifications: [], languages: [], awards: [], volunteer: [], references: [], ignored: [],
  };

  let section: SectionKey = 'header';
  for (const line of lines) {
    if (!line) continue;
    const heading = asHeading(line);
    if (heading) {
      section = heading;
      continue;
    }
    buckets[section].push(line);
  }

  // 2. Read each section.
  const personalInfo = parsePersonalInfo(buckets.header, lines);
  const summary = buckets.summary.join(' ').replace(/\s{2,}/g, ' ').trim();
  const experience = parseExperience(buckets.experience);
  const education = parseEducation(buckets.education);
  const skills = parseSkills(buckets.skills);
  const projects = parseProjects(buckets.projects);
  const certifications = parseCertifications(buckets.certifications);
  const languages = parseLanguages(buckets.languages);
  const awards = parseAwards(buckets.awards);
  const volunteer = parseVolunteer(buckets.volunteer);
  const references = parseReferences(buckets.references);

  // A resume with no headings at all: keep every line as experience so the
  // text is not lost, and say so.
  const foundAnySection = buckets.experience.length + buckets.education.length + buckets.skills.length > 0;
  const warnings: string[] = [];

  if (!foundAnySection && buckets.header.length > 4) {
    warnings.push(
      'This PDF has no section headings the reader could recognise, so everything was placed under Experience. Move the parts that belong elsewhere.',
    );
  }

  const sections: string[] = [];
  if (personalInfo.fullName) sections.push('personal details');
  if (summary) sections.push('summary');
  if (experience.length) sections.push('experience');
  if (education.length) sections.push('education');
  if (skills.length) sections.push('skills');
  if (projects.length) sections.push('projects');
  if (certifications.length) sections.push('certifications');
  if (languages.length) sections.push('languages');
  if (awards.length) sections.push('awards');
  if (volunteer.length) sections.push('volunteer work');
  if (references.length) sections.push('references');

  if (pages > 1) {
    warnings.push(
      `This PDF has ${pages} pages. Text is read from all of them, but a two-column layout can come out jumbled — check the order of the sections.`,
    );
  }
  if (!personalInfo.fullName) {
    warnings.push('No name was found at the top of the PDF. Type your name in the Personal step.');
  }
  if (experience.length === 0 && buckets.experience.length > 0) {
    warnings.push('The experience section was found but could not be split into jobs. The text is in the Experience step for you to tidy.');
  }

  const baseName = fileName.replace(/\.pdf$/i, '').replace(/[_-]+/g, ' ').trim();

  const resume: Resume = {
    id: createId(),
    personalInfo,
    summary,
    experience,
    education,
    skills,
    projects,
    certifications,
    languages,
    awards,
    volunteer,
    references,
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      template: 'modern' as TemplateType,
      targetJob: personalInfo.title || undefined,
      version: 1,
      name: personalInfo.fullName
        ? `${personalInfo.fullName} — imported from PDF`
        : `${baseName || 'Imported resume'}`,
    },
  };

  return {
    resume,
    warnings,
    stats: {
      pages,
      characters: lines.join('').length,
      sections,
    },
  };
}

// ============================================
// The one function the UI calls
// ============================================

export async function importResumeFromPdf(file: File): Promise<PdfImportResult> {
  if (!isPdfFile(file)) {
    throw new PdfImportError('Only PDF files can be imported. Choose a file that ends in .pdf.');
  }
  if (file.size === 0) {
    throw new PdfImportError('That file is empty.');
  }
  if (file.size > MAX_BYTES) {
    throw new PdfImportError(`That PDF is ${(file.size / 1024 / 1024).toFixed(1)} MB. Please use one under 20 MB.`);
  }

  const { lines, pages, rawChars, rawItems } = await readPdfLines(file);

  const characters = lines.join('').replace(/\s/g, '').length;
  // A scanned page is a picture of text: pdf.js finds no characters in it.
  // rawItems > 0 with zero usable characters means the fragments were all
  // blank or the text uses an encoding pdf.js cannot map — say so plainly.
  // The numbers go along so the dialog can show what was actually found.
  if (characters < 30) {
    const details = { pages, rawItems, rawChars };
    if (rawItems === 0 || rawChars === 0) {
      throw new PdfImportError(
        'No text could be read from this PDF. It is a picture of text, not real text — most likely a scan, a photo, or an older file exported from this app before its PDF export wrote real text. ' +
        'To check: open the PDF and try selecting the text with Ctrl+A — if nothing highlights, there is no text to read. ' +
        'Fix it by exporting again from this app (new files contain real selectable text), or from Word or Google Docs (File → Download or Save as PDF), and uploading that.',
        details,
      );
    }
    throw new PdfImportError(
      `This PDF has text in it (${rawItems} fragments) but it came out unreadable — the file may use an unusual font encoding. ` +
      'Try printing it to a new PDF (open it, choose Print → Save as PDF) and uploading that copy.',
      details,
    );
  }

  return parseResumeText(lines, file.name, pages);
}
