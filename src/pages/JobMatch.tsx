import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase, Search, Target, TrendingUp, Lightbulb, CheckCircle2, XCircle, AlertTriangle,
  ArrowRight, Workflow, Clipboard, Zap
} from 'lucide-react';
import { useResumeStore } from '../stores/resumeStore';
import type { JobMatch, JobDescription } from '../types/resume';
import { createId } from '../types/resume';
import { computeJobMatch, guessJobMeta } from '../services/aiEngine';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
};


function getScoreColor(score: number) {
  if (score >= 80) return 'var(--color-success)';
  if (score >= 60) return 'var(--color-warning)';
  return 'var(--color-danger)';
}

function ScoreRingSmall({ score, label, size = 80 }: { score: number; label: string; size?: number }) {
  const r = (size - 10) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="score-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle className="score-ring-bg" cx={size / 2} cy={size / 2} r={r} strokeWidth="5" />
        <circle
          className="score-ring-progress"
          cx={size / 2} cy={size / 2} r={r}
          strokeWidth="5"
          stroke={getScoreColor(score)}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="score-ring-label">
        <div className="score-ring-value" style={{ fontSize: size < 90 ? '18px' : '28px', color: getScoreColor(score) }}>{score}</div>
        <div className="score-ring-text" style={{ fontSize: '9px' }}>{label}</div>
      </div>
    </div>
  );
}

export default function JobMatchPage() {
  const { resumes, activeResumeId, setPage, addJobDescription, setJobMatch } = useResumeStore();
  const [jobText, setJobText] = useState('');
  const [selectedResumeId, setSelectedResumeId] = useState(activeResumeId || '');
  const [match, setMatch] = useState<JobMatch | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [keywordFilter, setKeywordFilter] = useState<'all' | 'present' | 'missing' | 'underrep'>('all');
  const [roleTitle, setRoleTitle] = useState('');
  const [company, setCompany] = useState('');

  const handleAnalyze = () => {
    const resume = resumes.find(r => r.id === selectedResumeId);
    if (!resume || !jobText.trim()) return;

    setIsAnalyzing(true);
    setTimeout(() => {
      const result = computeJobMatch(resume, jobText);
      const guessed = guessJobMeta(jobText);
      setMatch(result);
      setJobMatch(result);
      setRoleTitle(prev => prev || guessed.title);
      setCompany(prev => prev || guessed.company);

      const jd: JobDescription = {
        id: createId(),
        title: roleTitle.trim() || guessed.title || 'Untitled role',
        company: company.trim() || guessed.company || 'Unknown company',
        rawText: jobText,
        addedAt: new Date().toISOString(),
        matchScore: result.overallMatch,
      };
      addJobDescription(jd);
      setIsAnalyzing(false);
    }, 800);
  };

  /**
   * Hand this posting to the AI Optimizer. The posting is saved first, so the
   * Optimizer can load it and write bullets and a skills list for this role.
   */
  const optimizeForThisJob = () => {
    addJobDescription({
      id: createId(),
      title: roleTitle.trim() || 'Untitled role',
      company: company.trim() || 'Unknown company',
      rawText: jobText,
      addedAt: new Date().toISOString(),
      matchScore: match?.overallMatch,
    });
    setPage('optimizer');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
      <div className="section-header">
        <div>
          <h1 className="section-title">
            Job Description Match
          </h1>
          <p className="section-subtitle">Paste a job description to see how well your resume matches</p>
        </div>
      </div>

      {/* Input Section */}
      <div className="grid-2 mb-8">
        <div className="glass-card">
          <div className="flex items-center gap-3 mb-4">
            <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clipboard size={18} style={{ color: 'var(--accent-primary)' }} />
            </div>
            <div>
              <h3 className="font-semibold">Job Description</h3>
              <p className="text-xs text-muted">Paste the full job posting</p>
            </div>
          </div>
          <textarea
            className="input-field"
            rows={10}
            placeholder="Paste the job description here..."
            value={jobText}
            onChange={(e) => setJobText(e.target.value)}
            style={{ minHeight: 220, resize: 'vertical' }}
          />
          <p className="text-xs text-muted mt-2">{jobText.split(/\s+/).filter(Boolean).length} words</p>
        </div>

        <div className="glass-card">
          <div className="flex items-center gap-3 mb-4">
            <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Briefcase size={18} style={{ color: 'var(--accent-primary)' }} />
            </div>
            <div>
              <h3 className="font-semibold">Select Resume</h3>
              <p className="text-xs text-muted">Choose which resume to match</p>
            </div>
          </div>

          {resumes.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 20px' }}>
              <p className="text-sm text-muted mb-4">No resumes found</p>
              <button className="btn btn-primary" onClick={() => setPage('builder')}>
                Create Resume <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {resumes.map(r => (
                <button
                  key={r.id}
                  onClick={() => setSelectedResumeId(r.id)}
                  className="glass-card"
                  style={{
                    cursor: 'pointer',
                    border: selectedResumeId === r.id ? '2px solid var(--accent-primary)' : '1px solid var(--border-primary)',
                    padding: '12px 16px',
                    textAlign: 'left',
                    background: selectedResumeId === r.id ? 'var(--accent-subtle)' : undefined,
                  }}
                >
                  <div className="font-semibold text-sm">{r.metadata.name}</div>
                  <div className="text-xs text-muted mt-1">
                    {r.personalInfo.fullName || 'Untitled'} · {r.metadata.template}
                  </div>
                </button>
              ))}
            </div>
          )}

          <button
            className="btn btn-primary w-full mt-6"
            onClick={handleAnalyze}
            disabled={!jobText.trim() || !selectedResumeId || isAnalyzing}
            style={{ opacity: (!jobText.trim() || !selectedResumeId) ? 0.5 : 1 }}
          >
            {isAnalyzing ? (
              <><div className="spinner" style={{ width: 16, height: 16 }} /> Analyzing...</>
            ) : (
              <><Search size={16} /> Analyze Match</>
            )}
          </button>
        </div>
      </div>

      {/* Results */}
      <AnimatePresence>
        {match && (
          <motion.div {...fadeInUp} transition={{ duration: 0.5 }}>
            {/* Overall Score */}
            <div className="glass-card mb-6" style={{ textAlign: 'center', padding: '40px' }}>
              <h2 className="text-2xl font-bold mb-6">Match Results</h2>
              <div className="flex items-center justify-center gap-16" style={{ flexWrap: 'wrap' }}>
                <ScoreRingSmall score={match.overallMatch} label="Overall" size={140} />
                <div className="flex flex-col gap-4" style={{ textAlign: 'left' }}>
                  {[
                    { label: 'Skills Match', score: match.skillsMatch },
                    { label: 'Experience Match', score: match.experienceMatch },
                    { label: 'Keyword Match', score: match.keywordMatch },
                    { label: 'Education Match', score: match.educationMatch },
                    { label: 'ATS Compatibility', score: match.atsCompatibility },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-4 match-row">
                      <span className="text-sm text-secondary match-row-label">{item.label}</span>
                      <div style={{
                        flex: 1, height: 6, background: 'var(--bg-tertiary)',
                        borderRadius: 3, overflow: 'hidden', minWidth: 100,
                      }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${item.score}%` }}
                          transition={{ duration: 1, delay: 0.3 }}
                          style={{ height: '100%', background: getScoreColor(item.score), borderRadius: 3 }}
                        />
                      </div>
                      <span className="text-sm font-bold" style={{ color: getScoreColor(item.score), width: 36, textAlign: 'right' }}>{item.score}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Interview Probability */}
            <div className="grid-2 mb-6">
              <div className="glass-card">
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp size={20} style={{ color: 'var(--color-warning)' }} />
                  <h3 className="font-semibold">Interview Probability</h3>
                </div>
                <div className="flex items-center gap-6">
                  <div>
                    <div className="text-xs text-muted mb-1">Current Resume</div>
                    <div className="text-3xl font-black" style={{ color: getScoreColor(match.interviewProbabilityBefore) }}>
                      {match.interviewProbabilityBefore}%
                    </div>
                  </div>
                  <ArrowRight size={24} style={{ color: 'var(--text-muted)' }} />
                  <div>
                    <div className="text-xs text-muted mb-1">After Optimization</div>
                    <div className="text-3xl font-black" style={{ color: 'var(--accent-emerald)' }}>
                      {match.interviewProbabilityAfter}%
                    </div>
                  </div>
                </div>
              </div>
              <div className="glass-card">
                <div className="flex items-center gap-3 mb-4">
                  <Zap size={20} style={{ color: 'var(--accent-primary)' }} />
                  <h3 className="font-semibold">Quick Optimize</h3>
                </div>
                <p className="text-sm text-secondary mb-4">
                  Automatically tailor your resume to match this job description.
                </p>
                <button className="btn btn-primary" onClick={optimizeForThisJob}>
                  <Workflow size={16} /> Optimize Resume For This Job
                </button>
                <p className="text-xs text-muted mt-3">
                  Opens the Resume Optimizer with this posting saved, so it can write bullets and a skills list for this role.
                </p>
              </div>
            </div>

            {/* Keywords */}
            <div className="glass-card mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Target size={20} style={{ color: 'var(--accent-violet)' }} />
                  <h3 className="font-semibold">Keyword Analysis</h3>
                </div>
                <div className="tabs">
                  {[
                    { key: 'all' as const, label: 'All' },
                    { key: 'present' as const, label: `✔ Present (${match.presentKeywords.length})` },
                    { key: 'missing' as const, label: `✗ Missing (${match.missingKeywords.length})` },
                    { key: 'underrep' as const, label: `⚠ Weak (${match.underrepresentedKeywords.length})` },
                  ].map(tab => (
                    <button
                      key={tab.key}
                      className={`tab-item ${keywordFilter === tab.key ? 'active' : ''}`}
                      onClick={() => setKeywordFilter(tab.key)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
              <motion.div className="flex flex-wrap gap-2" variants={stagger} initial="initial" animate="animate">
                {(keywordFilter === 'all' || keywordFilter === 'present') &&
                  match.presentKeywords.map(k => (
                    <motion.span key={`p-${k}`} variants={fadeInUp} className="keyword-tag present">
                      <CheckCircle2 size={12} /> {k}
                    </motion.span>
                  ))
                }
                {(keywordFilter === 'all' || keywordFilter === 'missing') &&
                  match.missingKeywords.map(k => (
                    <motion.span key={`m-${k}`} variants={fadeInUp} className="keyword-tag missing">
                      <XCircle size={12} /> {k}
                    </motion.span>
                  ))
                }
                {(keywordFilter === 'all' || keywordFilter === 'underrep') &&
                  match.underrepresentedKeywords.map(k => (
                    <motion.span key={`u-${k}`} variants={fadeInUp} className="keyword-tag underrepresented">
                      <AlertTriangle size={12} /> {k}
                    </motion.span>
                  ))
                }
              </motion.div>
            </div>

            {/* Suggestions */}
            <div className="glass-card">
              <div className="flex items-center gap-3 mb-4">
                <Lightbulb size={20} style={{ color: 'var(--accent-amber)' }} />
                <h3 className="font-semibold">Improvement Suggestions</h3>
              </div>
              <div className="flex flex-col gap-3">
                {match.suggestions.map((s, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="issue-card suggestion"
                  >
                    <div className="issue-card-icon">
                      <Lightbulb size={16} style={{ color: 'var(--accent-blue)' }} />
                    </div>
                    <div className="issue-card-content">
                      <p className="issue-card-title">{s}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="grid-2 mt-6">
              {[
                { title: 'Hard Skills', items: match.extractedKeywords.hardSkills, color: 'var(--color-info)' },
                { title: 'Soft Skills', items: match.extractedKeywords.softSkills, color: 'var(--accent-primary)' },
                { title: 'Tools', items: match.extractedKeywords.tools, color: 'var(--accent-primary)' },
                { title: 'Certifications', items: match.extractedKeywords.certifications, color: 'var(--color-warning)' },
              ].map(cat => (
                <div key={cat.title} className="glass-card">
                  <h4 className="font-semibold mb-3" style={{ color: cat.color }}>{cat.title}</h4>
                  <div className="flex flex-wrap gap-2">
                    {cat.items.length > 0 ? cat.items.map(k => (
                      <span key={k} className="badge" style={{
                        background: 'var(--bg-tertiary)',
                        color: cat.color,
                        borderColor: 'var(--border-primary)',
                      }}>{k}</span>
                    )) : (
                      <span className="text-xs text-muted">None detected</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
