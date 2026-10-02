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

// Sample resume so dashboard isn't empty
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

export const useResumeStore = create<ResumeState>()(
  persist(
    (set, get) => ({
      resumes: [sampleResume],
      activeResumeId: sampleResume.id,
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
      version: 2,
      storage: createJSONStorage(() => localStorage),
      // Older saves have no palette (and no 'system' mode). Fill them in
      // instead of dropping the user's settings on the floor.
      migrate: (persisted, version) => {
        const state = (persisted ?? {}) as Partial<ResumeState>;
        if (version < 2) {
          state.preferences = {
            palette: 'amber',
            ...(state.preferences ?? {}),
          } as UserPreferences;
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
