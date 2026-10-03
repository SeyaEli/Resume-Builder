// ============================================
// ATS Resume Platform - Core Type Definitions
// ============================================

export interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  portfolio: string;
  title: string;
}

export interface Experience {
  id: string;
  jobTitle: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  bullets: string[];
}

export interface Education {
  id: string;
  degree: string;
  institution: string;
  location: string;
  year: string;
  gpa?: string;
  honors?: string;
}

export interface Skill {
  id: string;
  name: string;
  category: 'hard' | 'soft' | 'tool' | 'language' | 'framework';
  level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

export interface Project {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  results: string;
  url?: string;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
  expiry?: string;
}

export interface Language {
  id: string;
  name: string;
  proficiency: 'native' | 'fluent' | 'advanced' | 'intermediate' | 'basic';
}

export interface Award {
  id: string;
  name: string;
  issuer: string;
  date: string;
  description?: string;
}

export interface VolunteerExperience {
  id: string;
  role: string;
  organization: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface Reference {
  id: string;
  name: string;
  title: string;
  company: string;
  email: string;
  phone: string;
  relationship: string;
}

export interface ResumeMetadata {
  createdAt: string;
  updatedAt: string;
  template: TemplateType;
  targetJob?: string;
  targetCompany?: string;
  version: number;
  name: string;
}

export type TemplateType =
  | 'corporate'
  | 'modern'
  | 'executive'
  | 'technical'
  | 'graduate'
  | 'creative'
  | 'government'
  | 'academic'
  | 'minimal'
  | 'elegant'
  | 'sidebar'
  | 'compact';

/**
 * How a template draws itself. One renderer (components/ResumePreview.tsx)
 * switches on this value, so a new look is a new case, not a new file.
 */
export type TemplateLayout =
  | 'modern'
  | 'corporate'
  | 'executive'
  | 'technical'
  | 'graduate'
  | 'creative'
  | 'government'
  | 'academic'
  | 'minimal'
  | 'elegant'
  | 'sidebar'
  | 'compact';

export interface TemplateDesign {
  name: string;
  description: string;
  icon: string;
  /** The look this template draws. */
  layout: TemplateLayout;
  /** Accent colour used for headings and rules. */
  accent: string;
  /**
   * True when the file stays one column of plain text, which is what older
   * ATS parsers read most reliably.
   */
  atsSafe: boolean;
}

export interface Resume {
  id: string;
  personalInfo: PersonalInfo;
  summary: string;
  experience: Experience[];
  education: Education[];
  skills: Skill[];
  projects: Project[];
  certifications: Certification[];
  languages: Language[];
  awards: Award[];
  volunteer: VolunteerExperience[];
  references: Reference[];
  metadata: ResumeMetadata;
}

// ============================================
// ATS Scoring Types
// ============================================

export interface ATSScore {
  overall: number;
  format: number;
  keywords: number;
  readability: number;
  experience: number;
  skills: number;
  recruiterAppeal: number;
}

export interface ATSIssue {
  id: string;
  type: 'error' | 'warning' | 'suggestion';
  category: 'format' | 'keywords' | 'readability' | 'experience' | 'skills' | 'structure';
  title: string;
  description: string;
  fix?: string;
  section?: string;
  impact: number; // 1-10 impact on score
}

export interface ATSAnalysis {
  score: ATSScore;
  issues: ATSIssue[];
  strengths: string[];
  weaknesses: string[];
  missingKeywords: string[];
  presentKeywords: string[];
  actionVerbs: string[];
  missingActionVerbs: string[];
  quantifiedAchievements: number;
  totalBullets: number;
  interviewProbability: number;
}

// ============================================
// Job Match Types
// ============================================

export interface JobDescription {
  id: string;
  title: string;
  company: string;
  rawText: string;
  addedAt: string;
  matchScore?: number;
}

export interface ExtractedKeywords {
  hardSkills: string[];
  softSkills: string[];
  tools: string[];
  certifications: string[];
  industryKeywords: string[];
  technologies: string[];
}

export interface JobMatch {
  overallMatch: number;
  skillsMatch: number;
  experienceMatch: number;
  keywordMatch: number;
  educationMatch: number;
  atsCompatibility: number;
  presentKeywords: string[];
  missingKeywords: string[];
  underrepresentedKeywords: string[];
  extractedKeywords: ExtractedKeywords;
  suggestions: string[];
  interviewProbabilityBefore: number;
  interviewProbabilityAfter: number;
}

// ============================================
// Cover Letter Types
// ============================================

export type CoverLetterStyle = 'formal' | 'modern' | 'executive' | 'entry-level';

export interface CoverLetter {
  id: string;
  style: CoverLetterStyle;
  targetJob: string;
  targetCompany: string;
  content: string;
  createdAt: string;
}

// ============================================
// LinkedIn Types
// ============================================

export interface LinkedInProfile {
  headline: string;
  about: string;
  experience: string[];
  skills: string[];
  keywords: string[];
}

// ============================================
// Career Coach Types
// ============================================

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// ============================================
// App State Types
// ============================================

export type AppPage =
  | 'dashboard'
  | 'builder'
  | 'ats-checker'
  | 'optimizer'
  | 'cover-letter'
  | 'job-match'
  | 'linkedin'
  | 'career-coach'
  | 'settings';

export type ThemeMode = 'dark' | 'light' | 'system';

export type SurfaceStyle = 'flat' | 'glass' | 'neomorph' | 'elevated';

export type PaletteId = 'amber' | 'emerald' | 'azure' | 'violet' | 'rose' | 'graphite';

export interface UserPreferences {
  language: string;
  theme: ThemeMode;
  palette: PaletteId;
  /** How the cards and panels are drawn: flat, glass, neomorph, elevated. */
  surface: SurfaceStyle;
  defaultTemplate: TemplateType;
  autoSave: boolean;
}

// ============================================
// Utility Types
// ============================================

export const createId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

export const createEmptyResume = (): Resume => ({
  id: createId(),
  personalInfo: {
    fullName: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    portfolio: '',
    title: '',
  },
  summary: '',
  experience: [],
  education: [],
  skills: [],
  projects: [],
  certifications: [],
  languages: [],
  awards: [],
  volunteer: [],
  references: [],
  metadata: {
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    template: 'modern',
    version: 1,
    name: 'Untitled Resume',
  },
});

export const TEMPLATE_INFO: Record<TemplateType, TemplateDesign> = {
  modern: {
    name: 'Modern',
    description: 'Thick role line with a highlights box up top',
    icon: 'FileText', layout: 'modern', accent: '#FFA929', atsSafe: true,
  },
  corporate: {
    name: 'Corporate',
    description: 'Centered header, conservative and plain',
    icon: 'Building2', layout: 'corporate', accent: '#1f4e79', atsSafe: true,
  },
  executive: {
    name: 'Executive',
    description: 'Wide name block for senior and board roles',
    icon: 'Crown', layout: 'executive', accent: '#2f2a24', atsSafe: true,
  },
  technical: {
    name: 'Technical',
    description: 'Monospace accents and a stack line for engineers',
    icon: 'Code2', layout: 'technical', accent: '#0f766e', atsSafe: true,
  },
  graduate: {
    name: 'Graduate',
    description: 'Education first, made for students and new grads',
    icon: 'GraduationCap', layout: 'graduate', accent: '#2563eb', atsSafe: true,
  },
  creative: {
    name: 'Creative ATS-Safe',
    description: 'Colour accent on one readable column',
    icon: 'Palette', layout: 'creative', accent: '#c026d3', atsSafe: true,
  },
  government: {
    name: 'Government',
    description: 'Plain and formal, no colour, for public posts',
    icon: 'Landmark', layout: 'government', accent: '#111111', atsSafe: true,
  },
  academic: {
    name: 'Academic',
    description: 'Serif type for research and teaching roles',
    icon: 'BookOpen', layout: 'academic', accent: '#7c2d12', atsSafe: true,
  },
  minimal: {
    name: 'Minimal',
    description: 'Maximum white space, nothing but the words',
    icon: 'Minus', layout: 'minimal', accent: '#111111', atsSafe: true,
  },
  elegant: {
    name: 'Elegant',
    description: 'Serif name with letterspaced section titles',
    icon: 'Star', layout: 'elegant', accent: '#6b4f2a', atsSafe: true,
  },
  sidebar: {
    name: 'Sidebar',
    description: 'Accent rail holding your skills and certificates',
    icon: 'PanelLeft', layout: 'sidebar', accent: '#0e7490', atsSafe: false,
  },
  compact: {
    name: 'Compact One-Page',
    description: 'Dense layout that squeezes onto a single page',
    icon: 'Rows3', layout: 'compact', accent: '#334155', atsSafe: true,
  },
};
