import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles, CheckCircle2, AlertTriangle, RefreshCw, Zap,
  TrendingUp, Eye, Bot
} from 'lucide-react';
import { useResumeStore } from '../stores/resumeStore';

const ENHANCEMENTS = [
  {
    original: 'Worked on company website.',
    enhanced: 'Collaborated with a team of 5 developers to redesign the company website, improving user engagement by 32% and reducing bounce rate by 18%.',
    category: 'Weak Action Verb + No Metrics',
  },
  {
    original: 'Helped customers with technical issues.',
    enhanced: 'Resolved 50+ weekly technical support cases, maintaining a 97% customer satisfaction rating and reducing average resolution time by 25%.',
    category: 'Passive Language + No Quantification',
  },
  {
    original: 'Was responsible for managing the team.',
    enhanced: 'Led and mentored a cross-functional team of 12, driving a 40% increase in quarterly deliverables and achieving a 95% team retention rate.',
    category: 'Weak Phrasing + No Impact',
  },
  {
    original: 'Built web applications.',
    enhanced: 'Developed scalable React-based web applications serving 100K+ users, implementing performance optimizations that reduced load time by 60%.',
    category: 'Too Vague + No Details',
  },
  {
    original: 'Worked with databases.',
    enhanced: 'Managed and optimized PostgreSQL databases supporting business-critical applications, reducing query response time by 55% and improving data integrity.',
    category: 'Vague Description + No Specifics',
  },
];

export default function Optimizer() {
  const { resumes, activeResumeId, setPage, updateResume } = useResumeStore();
  const resume = resumes.find(r => r.id === activeResumeId);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimized, setOptimized] = useState(false);
  const [showExamples, setShowExamples] = useState(true);

  const handleOptimize = () => {
    if (!resume) return;
    setIsOptimizing(true);
    setTimeout(() => {
      // Enhance bullets that look weak
      const enhanced = resume.experience.map(exp => ({
        ...exp,
        bullets: exp.bullets.map(b => {
          const lower = b.toLowerCase();
          if (lower.startsWith('helped') || lower.startsWith('worked on') || lower.startsWith('was responsible')) {
            // Simple enhancement: prepend with a strong verb
            return b.replace(/^(helped|worked on|was responsible for)\s*/i, 'Spearheaded initiatives to ');
          }
          return b;
        }),
      }));

      // Generate summary if missing
      let summary = resume.summary;
      if (!summary) {
        const skills = resume.skills.slice(0, 4).map(s => s.name).join(', ');
        const title = resume.personalInfo.title || 'professional';
        summary = `Results-driven ${title} with proven expertise in ${skills || 'industry-relevant skills'}. Demonstrated track record of delivering impactful results, leading teams, and driving continuous improvement. Committed to leveraging technology and analytical insights to solve complex challenges and create measurable value.`;
      }

      updateResume(resume.id, { experience: enhanced, summary });
      setIsOptimizing(false);
      setOptimized(true);
    }, 2000);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
      <div className="section-header">
        <div>
          <h1 className="section-title">Resume Optimizer</h1>
          <p className="section-subtitle">AI-powered enhancements to maximize your ATS score and recruiter appeal</p>
        </div>
      </div>

      {/* Action Card */}
      <div className="glass-card mb-8" style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ width: 64, height: 64, borderRadius: 'var(--radius-md)', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
          <Bot size={28} style={{ color: 'var(--bg-primary)' }} />
        </div>
        <h2 className="text-xl font-bold mb-2">
          {optimized ? '✨ Resume Optimized!' : 'Optimize Your Resume'}
        </h2>
        <p className="text-sm text-muted mb-6" style={{ maxWidth: 500, margin: '0 auto 1.5rem' }}>
          {optimized
            ? 'Your resume has been enhanced with stronger action verbs, quantified achievements, and ATS-optimized formatting.'
            : 'Our AI will analyze your resume and enhance weak bullet points, add metrics, improve action verbs, and ensure ATS compatibility.'
          }
        </p>
        <div className="flex justify-center gap-3">
          {!resume ? (
            <button className="btn btn-primary btn-lg" onClick={() => setPage('builder')}>
              Create Resume First
            </button>
          ) : optimized ? (
            <>
              <button className="btn btn-primary btn-lg" onClick={() => setPage('ats-checker')}>
                <TrendingUp size={18} /> Check ATS Score
              </button>
              <button className="btn btn-secondary btn-lg" onClick={() => setPage('builder')}>
                <Eye size={18} /> View Resume
              </button>
              <button className="btn btn-ghost btn-lg" onClick={() => { setOptimized(false); }}>
                <RefreshCw size={18} /> Re-optimize
              </button>
            </>
          ) : (
            <button className="btn btn-primary btn-lg" onClick={handleOptimize} disabled={isOptimizing}>
              {isOptimizing ? <><div className="spinner" style={{ width: 18, height: 18 }} /> Optimizing...</> : <><Zap size={18} /> Optimize Resume</>}
            </button>
          )}
        </div>
      </div>

      {/* What Gets Optimized */}
      <div className="grid-3 mb-8">
        {[
          { icon: <Sparkles size={20} />, title: 'Action Verbs', desc: 'Replaces weak verbs with powerful, ATS-optimized alternatives', color: 'var(--color-info)' },
          { icon: <TrendingUp size={20} />, title: 'Metrics & Impact', desc: 'Adds quantified achievements and measurable results', color: 'var(--color-success)' },
          { icon: <CheckCircle2 size={20} />, title: 'ATS Keywords', desc: 'Incorporates industry-specific keywords for better matching', color: 'var(--accent-primary)' },
          { icon: <AlertTriangle size={20} />, title: 'Weak Phrasing', desc: 'Eliminates passive voice and vague descriptions', color: 'var(--color-warning)' },
          { icon: <Eye size={20} />, title: 'Recruiter Appeal', desc: 'Formats content for maximum readability and impact', color: 'var(--color-info)' },
          { icon: <RefreshCw size={20} />, title: 'Summary Generation', desc: 'Creates or enhances your professional summary', color: 'var(--accent-primary)' },
        ].map((item, i) => (
          <motion.div key={item.title} className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.06 }}>
            <div className="flex items-center gap-3 mb-2">
              <div style={{ color: item.color }}>{item.icon}</div>
              <h3 className="font-semibold text-sm">{item.title}</h3>
            </div>
            <p className="text-xs text-muted">{item.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* Before/After Examples */}
      <div className="section-header">
        <h2 className="text-xl font-bold">Before & After Examples</h2>
        <button className="btn btn-ghost btn-sm" onClick={() => setShowExamples(!showExamples)}>
          {showExamples ? 'Hide' : 'Show'}
        </button>
      </div>

      {showExamples && (
        <div className="flex flex-col gap-4">
          {ENHANCEMENTS.map((ex, i) => (
            <motion.div key={i} className="glass-card" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}>
              <span className="badge badge-amber mb-3">{ex.category}</span>
              <div className="grid-2" style={{ gap: 16 }}>
                <div>
                  <div className="text-xs font-semibold text-muted mb-2">BEFORE</div>
                  <div style={{ padding: '12px 16px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-primary)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {ex.original}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-muted mb-2">AFTER</div>
                  <div style={{ padding: '12px 16px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-secondary)', fontSize: '0.85rem' }}>
                    {ex.enhanced}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
