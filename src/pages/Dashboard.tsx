import { motion } from 'framer-motion';
import {
  FileText, Target, Briefcase, Mail, Plus, Upload,
  MessageSquare, FileEdit, Sparkles, ArrowRight, Clock, Zap
} from 'lucide-react';
import { useResumeStore } from '../stores/resumeStore';

const fadeInUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } },
};

export default function Dashboard() {
  const { resumes, coverLetters, jobDescriptions, setPage, createResume, setActiveResume } = useResumeStore();

  const avgScore = 78; // placeholder — will use real ATS scores when available

  const stats = [
    { label: 'Total Resumes', value: resumes.length, icon: <FileText size={22} />, color: 'var(--accent-primary)', bg: 'var(--accent-subtle)' },
    { label: 'Avg ATS Score', value: avgScore, icon: <Target size={22} />, color: 'var(--color-success)', bg: 'rgba(16,185,129,0.1)', suffix: '%' },
    { label: 'Job Matches', value: jobDescriptions.length, icon: <Briefcase size={22} />, color: 'var(--accent-primary)', bg: 'var(--accent-subtle)' },
    { label: 'Cover Letters', value: coverLetters.length, icon: <Mail size={22} />, color: 'var(--accent-primary)', bg: 'var(--accent-subtle)' },
  ];

  const quickActions = [
    { label: 'Create New Resume', desc: 'Start building an ATS-optimized resume', icon: <Plus size={22} />, page: 'builder' as const, color: 'var(--accent-primary)' },
    { label: 'Upload Resume', desc: 'Import and optimize an existing resume', icon: <Upload size={22} />, page: 'builder' as const, color: 'var(--accent-primary)' },
    { label: 'ATS Score Check', desc: 'Scan your resume for ATS compatibility', icon: <Target size={22} />, page: 'ats-checker' as const, color: 'var(--accent-primary)' },
    { label: 'Match to Job', desc: 'Tailor your resume to a job description', icon: <Briefcase size={22} />, page: 'job-match' as const, color: 'var(--accent-primary)' },
    { label: 'Cover Letter', desc: 'Generate a professional cover letter', icon: <FileEdit size={22} />, page: 'cover-letter' as const, color: 'var(--accent-primary)' },
    { label: 'Career Coach', desc: 'Get AI-powered career advice', icon: <MessageSquare size={22} />, page: 'career-coach' as const, color: 'var(--accent-primary)' },
  ];

  const handleNewResume = () => {
    createResume();
    setPage('builder');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      {/* Welcome */}
      <motion.div {...fadeInUp} transition={{ delay: 0.1 }} style={{ marginBottom: '2rem' }}>
        <div className="flex items-center gap-3 mb-2">
          <Sparkles size={28} style={{ color: 'var(--accent-primary)' }} />
          <h1 className="text-4xl font-black">
            Welcome back
          </h1>
        </div>
        <p className="text-secondary text-lg" style={{ maxWidth: 600 }}>
          Your AI-powered resume platform. Create, optimize, and export ATS-compliant resumes that land interviews.
        </p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div className="grid-4 mb-8" variants={stagger} initial="initial" animate="animate">
        {stats.map((stat) => (
          <motion.div key={stat.label} className="stat-card" variants={fadeInUp}>
            <div className="stat-card-icon" style={{ background: stat.bg, color: stat.color }}>
              {stat.icon}
            </div>
            <div className="stat-card-value" style={{ color: stat.color }}>
              {stat.value}{stat.suffix || ''}
            </div>
            <div className="stat-card-label">{stat.label}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick Actions */}
      <motion.div {...fadeInUp} transition={{ delay: 0.3 }}>
        <div className="section-header">
          <div>
            <h2 className="text-xl font-bold">Quick Actions</h2>
            <p className="text-sm text-tertiary mt-1">Get started with one click</p>
          </div>
        </div>
        <div className="grid-3 mb-8">
          {quickActions.map((action, i) => (
            <motion.button
              key={action.label}
              className="glass-card"
              style={{ textAlign: 'left', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.06 }}
              onClick={() => {
                if (action.label === 'Create New Resume') {
                  handleNewResume();
                } else {
                  setPage(action.page);
                }
              }}
            >
              <div
                style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                  background: 'var(--accent-primary)', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
                }}
              />
              <div className="flex items-center gap-4">
                <div style={{
                  width: 44, height: 44, borderRadius: 'var(--radius-md)',
                  background: 'var(--accent-subtle)', position: 'absolute',
                  top: 24, left: 24,
                }} />
                <div style={{
                  width: 44, height: 44, borderRadius: 'var(--radius-md)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--accent-primary)', position: 'relative', zIndex: 1,
                }}>
                  {action.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 className="font-semibold" style={{ fontSize: '0.95rem' }}>{action.label}</h3>
                  <p className="text-xs text-tertiary mt-1">{action.desc}</p>
                </div>
                <ArrowRight size={16} style={{ color: 'var(--text-muted)' }} />
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Recent Resumes */}
      <motion.div {...fadeInUp} transition={{ delay: 0.5 }}>
        <div className="section-header">
          <div>
            <h2 className="text-xl font-bold">Recent Resumes</h2>
            <p className="text-sm text-tertiary mt-1">Continue editing your resumes</p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={handleNewResume}>
            <Plus size={14} /> New Resume
          </button>
        </div>

        {resumes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><FileText size={32} /></div>
            <h3 className="empty-state-title">No resumes yet</h3>
            <p className="empty-state-desc">Create your first ATS-optimized resume in minutes</p>
            <button className="btn btn-primary" onClick={handleNewResume}>
              <Zap size={16} /> Create Resume
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {resumes.map((resume, i) => (
              <motion.div
                key={resume.id}
                className="glass-card"
                style={{ cursor: 'pointer', padding: '16px 24px' }}
                whileHover={{ scale: 1.005, x: 4 }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.08 }}
                onClick={() => {
                  setActiveResume(resume.id);
                  setPage('builder');
                }}
              >
                <div className="flex items-center gap-4">
                  <div style={{
                    width: 44, height: 44, borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-tertiary)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    color: 'var(--accent-primary)',
                  }}>
                    <FileText size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 className="font-semibold text-sm">{resume.metadata.name}</h3>
                    <p className="text-xs text-muted mt-1">
                      {resume.personalInfo.fullName || 'Untitled'} · {resume.metadata.template} template
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="badge badge-amber">{resume.metadata.template}</span>
                    <div className="flex items-center gap-1 text-xs text-muted">
                      <Clock size={12} />
                      {new Date(resume.metadata.updatedAt).toLocaleDateString()}
                    </div>
                    <ArrowRight size={16} style={{ color: 'var(--text-muted)' }} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
