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
  | 'academic';

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

export interface UserPreferences {
  language: string;
  theme: 'dark' | 'light';
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

export const TEMPLATE_INFO: Record<TemplateType, { name: string; description: string; icon: string }> = {
  corporate: { name: 'Corporate', description: 'Clean and professional for corporate roles', icon: 'Building2' },
  modern: { name: 'Modern', description: 'Contemporary design with subtle accents', icon: 'Sparkles' },
  executive: { name: 'Executive', description: 'Sophisticated layout for senior roles', icon: 'Crown' },
  technical: { name: 'Technical', description: 'Optimized for engineering and tech roles', icon: 'Code2' },
  graduate: { name: 'Graduate', description: 'Perfect for students and new graduates', icon: 'GraduationCap' },
  creative: { name: 'Creative ATS-Safe', description: 'Creative yet fully ATS-compatible', icon: 'Palette' },
  government: { name: 'Government', description: 'Formatted for government applications', icon: 'Landmark' },
  academic: { name: 'Academic', description: 'Designed for academic and research roles', icon: 'BookOpen' },
};
