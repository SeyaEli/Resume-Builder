import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  Resume, ATSAnalysis, JobDescription, JobMatch, CoverLetter,
  ChatMessage, AppPage, UserPreferences, LinkedInProfile
} from '../types/resume';
import { createEmptyResume, createId } from '../types/resume';

interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

interface ResumeState {
  resumes: Resume[];
  activeResumeId: string | null;
  atsAnalysis: ATSAnalysis | null;
  jobDescriptions: JobDescription[];
  activeJobMatch: JobMatch | null;
  coverLetters: CoverLetter[];
  chatMessages: ChatMessage[];
  linkedInProfile: LinkedInProfile | null;
  currentPage: AppPage;
  preferences: UserPreferences;
  isLoading: boolean;
  sidebarOpen: boolean;
  toasts: ToastItem[];

  // Actions
  setPage: (page: AppPage) => void;
  createResume: () => string;
  addResume: (resume: Resume) => string;
  updateResume: (id: string, updates: Partial<Resume>) => void;
  deleteResume: (id: string) => void;
  setActiveResume: (id: string) => void;
  setATSAnalysis: (analysis: ATSAnalysis | null) => void;
  addJobDescription: (jd: JobDescription) => void;
  setJobMatch: (match: JobMatch | null) => void;
  addCoverLetter: (cl: CoverLetter) => void;
  addChatMessage: (msg: ChatMessage) => void;
  setLinkedInProfile: (profile: LinkedInProfile | null) => void;
  toggleSidebar: () => void;
  addToast: (type: ToastItem['type'], message: string) => void;
  removeToast: (id: string) => void;
  getActiveResume: () => Resume | undefined;
}

// Legacy sample data retained only so v4 can recognize and remove old demo
// values from resumes that users edited before the blank-start behavior.
const sampleResume: Resume = {
  id: 'sample-1',
  personalInfo: {
    fullName: 'Alex Johnson',
    email: 'alex.johnson@email.com',
    phone: '(555) 987-6543',
    location: 'San Francisco, CA',
    linkedin: 'linkedin.com/in/alexjohnson',
    portfolio: 'alexjohnson.dev',
    title: 'Senior Software Engineer',
  },
  summary: 'Results-driven Senior Software Engineer with 6+ years of experience developing scalable cloud-based applications using Python, TypeScript, and AWS. Proven track record of leading cross-functional teams and delivering high-performance solutions that drive business growth. Passionate about clean code, mentoring developers, and leveraging modern technologies to solve complex problems.',
  experience: [
    {
      id: 'exp-1',
      jobTitle: 'Senior Software Engineer',
      company: 'TechCorp Inc.',
      location: 'San Francisco, CA',
      startDate: '2021-03',
      endDate: '',
      current: true,
      bullets: [
        'Led a team of 8 engineers to redesign the core platform architecture, reducing system latency by 45% and improving user satisfaction scores by 28%',
        'Architected and deployed microservices infrastructure on AWS using Docker and Kubernetes, handling 2M+ daily API requests with 99.9% uptime',
        'Implemented CI/CD pipelines using GitHub Actions, reducing deployment time from 4 hours to 15 minutes and increasing release frequency by 300%',
        'Mentored 5 junior developers through code reviews and pair programming, resulting in 40% reduction in production bugs',
      ],
    },
    {
      id: 'exp-2',
      jobTitle: 'Software Engineer',
      company: 'DataFlow Systems',
      location: 'Austin, TX',
      startDate: '2018-06',
      endDate: '2021-02',
      current: false,
      bullets: [
        'Developed RESTful APIs using Python and Django, serving 500K+ users with response times under 200ms',
        'Built real-time data processing pipeline using Apache Kafka, handling 1M+ events per hour',
        'Collaborated with product team to implement A/B testing framework, increasing conversion rates by 22%',
        'Optimized PostgreSQL database queries, reducing average query time by 60% and saving $15K/month in infrastructure costs',
      ],
    },
  ],
  education: [
    {
      id: 'edu-1',
      degree: 'Bachelor of Science in Computer Science',
      institution: 'University of California, Berkeley',
      location: 'Berkeley, CA',
      year: '2018',
      gpa: '3.8',
      honors: 'Magna Cum Laude',
    },
  ],
  skills: [
    { id: 's1', name: 'Python', category: 'hard', level: 'expert' },
    { id: 's2', name: 'TypeScript', category: 'hard', level: 'expert' },
    { id: 's3', name: 'React', category: 'framework', level: 'advanced' },
    { id: 's4', name: 'Node.js', category: 'framework', level: 'advanced' },
    { id: 's5', name: 'AWS', category: 'tool', level: 'advanced' },
    { id: 's6', name: 'Docker', category: 'tool', level: 'advanced' },
    { id: 's7', name: 'Kubernetes', category: 'tool', level: 'intermediate' },
    { id: 's8', name: 'PostgreSQL', category: 'hard', level: 'advanced' },
    { id: 's9', name: 'MongoDB', category: 'hard', level: 'intermediate' },
    { id: 's10', name: 'Leadership', category: 'soft', level: 'advanced' },
    { id: 's11', name: 'System Design', category: 'hard', level: 'advanced' },
    { id: 's12', name: 'CI/CD', category: 'tool', level: 'advanced' },
  ],
  projects: [
    {
      id: 'proj-1',
      name: 'CloudScale Analytics Platform',
      description: 'Built a real-time analytics dashboard processing 10M+ events daily',
      technologies: ['React', 'Node.js', 'AWS Lambda', 'DynamoDB', 'D3.js'],
      results: 'Reduced data processing time by 70%, serving 200+ enterprise clients',
      url: 'github.com/alexj/cloudscale',
    },
  ],
  certifications: [
    { id: 'cert-1', name: 'AWS Certified Solutions Architect – Associate', issuer: 'Amazon Web Services', date: '2022-08' },
    { id: 'cert-2', name: 'Certified Kubernetes Administrator (CKA)', issuer: 'CNCF', date: '2023-01' },
  ],
  languages: [
    { id: 'lang-1', name: 'English', proficiency: 'native' },
    { id: 'lang-2', name: 'Spanish', proficiency: 'intermediate' },
  ],
  awards: [
    { id: 'award-1', name: 'Employee of the Year', issuer: 'TechCorp Inc.', date: '2023', description: 'Recognized for exceptional technical leadership and team impact' },
  ],
  volunteer: [],
  references: [],
  metadata: {
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: new Date().toISOString(),
    template: 'modern',
    targetJob: 'Senior Software Engineer',
    version: 1,
    name: 'Alex Johnson — SWE Resume',
  },
};

/**
 * Versions before v4 opened the app with `sampleResume` selected. If someone
 * edited that record, any fields they did not visit stayed behind as if they
 * had entered them (for example Austin, TX or the CloudScale GitHub URL).
 *
 * Only scrub values that still exactly match the legacy sample, and only from
 * its stable id. User-created and imported resumes are never touched.
 */
const removeLegacySampleValues = (resume: Resume): Resume => {
  if (resume.id !== sampleResume.id) return resume;

  const clear = (value: string, sampleValue: string) => value === sampleValue ? '' : value;
  const sameList = (values: string[], sampleValues: string[]) =>
    values.length === sampleValues.length && values.every((value, index) => value === sampleValues[index]);

  const experience = resume.experience
    .map((entry) => {
      const sample = sampleResume.experience.find((candidate) => candidate.id === entry.id);
      if (!sample) return entry;
      return {
        ...entry,
        jobTitle: clear(entry.jobTitle, sample.jobTitle),
        company: clear(entry.company, sample.company),
        location: clear(entry.location, sample.location),
        startDate: clear(entry.startDate, sample.startDate),
        endDate: clear(entry.endDate, sample.endDate),
        current: entry.current,
        bullets: entry.bullets.filter((bullet) => !sample.bullets.includes(bullet)),
      };
    })
    .filter((entry) => entry.jobTitle || entry.company || entry.location || entry.startDate || entry.endDate || entry.bullets.length);

  const education = resume.education
    .map((entry) => {
      const sample = sampleResume.education.find((candidate) => candidate.id === entry.id);
      if (!sample) return entry;
      return {
        ...entry,
        degree: clear(entry.degree, sample.degree),
        institution: clear(entry.institution, sample.institution),
        location: clear(entry.location, sample.location),
        year: clear(entry.year, sample.year),
        gpa: clear(entry.gpa || '', sample.gpa || ''),
        honors: clear(entry.honors || '', sample.honors || ''),
      };
    })
    .filter((entry) => entry.degree || entry.institution || entry.location || entry.year || entry.gpa || entry.honors);

  const projects = resume.projects
    .map((entry) => {
      const sample = sampleResume.projects.find((candidate) => candidate.id === entry.id);
      if (!sample) return entry;
      return {
        ...entry,
        name: clear(entry.name, sample.name),
        description: clear(entry.description, sample.description),
        results: clear(entry.results, sample.results),
        url: clear(entry.url || '', sample.url || ''),
        technologies: sameList(entry.technologies, sample.technologies) ? [] : entry.technologies,
      };
    })
    .filter((entry) => entry.name || entry.description || entry.results || entry.url || entry.technologies.length);

  return {
    ...resume,
    personalInfo: {
      fullName: clear(resume.personalInfo.fullName, sampleResume.personalInfo.fullName),
      email: clear(resume.personalInfo.email, sampleResume.personalInfo.email),
      phone: clear(resume.personalInfo.phone, sampleResume.personalInfo.phone),
      location: clear(resume.personalInfo.location, sampleResume.personalInfo.location),
      linkedin: clear(resume.personalInfo.linkedin, sampleResume.personalInfo.linkedin),
      portfolio: clear(resume.personalInfo.portfolio, sampleResume.personalInfo.portfolio),
      title: clear(resume.personalInfo.title, sampleResume.personalInfo.title),
    },
    summary: clear(resume.summary, sampleResume.summary),
    experience,
    education,
    skills: resume.skills.filter((entry) => {
      const sample = sampleResume.skills.find((candidate) => candidate.id === entry.id);
      return !sample || entry.name !== sample.name || entry.category !== sample.category || entry.level !== sample.level;
    }),
    projects,
    certifications: resume.certifications.filter((entry) => {
      const sample = sampleResume.certifications.find((candidate) => candidate.id === entry.id);
      return !sample || entry.name !== sample.name || entry.issuer !== sample.issuer || entry.date !== sample.date;
    }),
    languages: resume.languages.filter((entry) => {
      const sample = sampleResume.languages.find((candidate) => candidate.id === entry.id);
      return !sample || entry.name !== sample.name || entry.proficiency !== sample.proficiency;
    }),
    awards: resume.awards.filter((entry) => {
      const sample = sampleResume.awards.find((candidate) => candidate.id === entry.id);
      return !sample || entry.name !== sample.name || entry.issuer !== sample.issuer || entry.date !== sample.date || entry.description !== sample.description;
    }),
    metadata: {
      ...resume.metadata,
      targetJob: clear(resume.metadata.targetJob || '', sampleResume.metadata.targetJob || ''),
      name: clear(resume.metadata.name, sampleResume.metadata.name) || 'Untitled Resume',
    },
  };
};

export const useResumeStore = create<ResumeState>()(
  persist(
    (set, get) => ({
      resumes: [],
      activeResumeId: null,
      atsAnalysis: null,
      jobDescriptions: [],
      activeJobMatch: null,
      coverLetters: [],
      chatMessages: [],
      linkedInProfile: null,
      currentPage: 'dashboard',
      preferences: {
        language: 'en',
        theme: 'dark',
        palette: 'amber',
        surface: 'elevated',
        defaultTemplate: 'modern',
        autoSave: true,
      },
      isLoading: false,
      sidebarOpen: true,
      toasts: [],

      setPage: (page) => set({ currentPage: page }),

      createResume: () => {
        const newResume = createEmptyResume();
        set((state) => ({
          resumes: [...state.resumes, newResume],
          activeResumeId: newResume.id,
        }));
        return newResume.id;
      },

      // Used by the PDF importer: the resume arrives already filled in, so it
      // is added as-is and becomes the active one.
      addResume: (resume) => {
        set((state) => ({
          resumes: [...state.resumes, resume],
          activeResumeId: resume.id,
        }));
        return resume.id;
      },

      updateResume: (id, updates) =>
        set((state) => ({
          resumes: state.resumes.map((r) =>
            r.id === id
              ? { ...r, ...updates, metadata: { ...r.metadata, ...updates.metadata, updatedAt: new Date().toISOString() } }
              : r
          ),
        })),

      deleteResume: (id) =>
        set((state) => ({
          resumes: state.resumes.filter((r) => r.id !== id),
          activeResumeId: state.activeResumeId === id ? (state.resumes[0]?.id || null) : state.activeResumeId,
        })),

      setActiveResume: (id) => set({ activeResumeId: id }),

      setATSAnalysis: (analysis) => set({ atsAnalysis: analysis }),

      addJobDescription: (jd) =>
        set((state) => ({ jobDescriptions: [...state.jobDescriptions, jd] })),

      setJobMatch: (match) => set({ activeJobMatch: match }),

      addCoverLetter: (cl) =>
        set((state) => ({ coverLetters: [cl, ...state.coverLetters] })),

      addChatMessage: (msg) =>
        set((state) => ({ chatMessages: [...state.chatMessages, msg] })),

      setLinkedInProfile: (profile) => set({ linkedInProfile: profile }),

      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      addToast: (type, message) => {
        const toast: ToastItem = { id: createId(), type, message };
        set((state) => ({ toasts: [...state.toasts, toast] }));
        setTimeout(() => get().removeToast(toast.id), 4000);
      },

      removeToast: (id) =>
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

      getActiveResume: () => {
        const state = get();
        return state.resumes.find((r) => r.id === state.activeResumeId);
      },
    }),
    {
      name: 'ats-resume-platform',
      version: 4,
      storage: createJSONStorage(() => localStorage),
      // Older saves have no palette (and no 'system' mode). Fill them in
      // instead of dropping the user's settings on the floor.
      migrate: (persisted, version) => {
        const state = (persisted ?? {}) as Partial<ResumeState>;
        if (version < 3) {
          state.preferences = {
            ...(state.preferences ?? {}),
            palette: 'amber',
            surface: 'elevated',
          } as UserPreferences;
        }
        if (version < 4 && state.resumes) {
          state.resumes = state.resumes.map(removeLegacySampleValues);
        }
        return state as ResumeState;
      },
      partialize: (state) => ({
        resumes: state.resumes,
        activeResumeId: state.activeResumeId,
        jobDescriptions: state.jobDescriptions,
        coverLetters: state.coverLetters,
        chatMessages: state.chatMessages,
        linkedInProfile: state.linkedInProfile,
        preferences: state.preferences,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
);
