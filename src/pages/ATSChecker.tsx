import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target, AlertCircle, AlertTriangle, Lightbulb, CheckCircle2, XCircle,
  TrendingUp, Zap, Shield, BookOpen, Wrench, FileText, BarChart3, Sparkles
} from 'lucide-react';
import { useResumeStore } from '../stores/resumeStore';
import { analyzeResume } from '../services/atsScorer';
import type { ATSAnalysis } from '../types/resume';

function getScoreColor(score: number): string {
  if (score >= 80) return 'var(--accent-emerald)';
  if (score >= 60) return 'var(--accent-amber)';
  return 'var(--accent-rose)';
}

function getScoreLabel(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Great';
  if (score >= 70) return 'Good';
  if (score >= 60) return 'Fair';
  if (score >= 50) return 'Needs Work';
  return 'Poor';
}

function ScoreRing({ score, size = 160 }: { score: number; size?: number }) {
  const r = (size - 14) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="score-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle className="score-ring-bg" cx={size / 2} cy={size / 2} r={r} strokeWidth="8" />
        <motion.circle
          className="score-ring-progress"
          cx={size / 2} cy={size / 2} r={r}
          strokeWidth="8"
          stroke={getScoreColor(score)}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeInOut' }}
        />
      </svg>
      <div className="score-ring-label">
        <motion.div
          className="score-ring-value"
          style={{ color: getScoreColor(score) }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {score}
        </motion.div>
        <div className="score-ring-text">{getScoreLabel(score)}</div>
      </div>
    </div>
  );
}

const categoryInfo = [
  { key: 'format' as const, label: 'Format', icon: <FileText size={16} />, desc: 'Structure & layout compliance' },
  { key: 'keywords' as const, label: 'Keywords', icon: <Target size={16} />, desc: 'Action verbs & industry terms' },
  { key: 'readability' as const, label: 'Readability', icon: <BookOpen size={16} />, desc: 'Content clarity & length' },
  { key: 'experience' as const, label: 'Experience', icon: <BarChart3 size={16} />, desc: 'Achievements & metrics' },
  { key: 'skills' as const, label: 'Skills', icon: <Wrench size={16} />, desc: 'Skill count & relevance' },
  { key: 'recruiterAppeal' as const, label: 'Recruiter Appeal', icon: <Shield size={16} />, desc: 'Overall presentation' },
];

export default function ATSChecker() {
  const { resumes, activeResumeId, setActiveResume, setATSAnalysis, atsAnalysis, setPage } = useResumeStore();
  const [selectedId, setSelectedId] = useState(activeResumeId || '');
  const [analysis, setAnalysis] = useState<ATSAnalysis | null>(atsAnalysis);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [issueFilter, setIssueFilter] = useState<'all' | 'error' | 'warning' | 'suggestion'>('all');

  const handleAnalyze = () => {
    const resume = resumes.find(r => r.id === selectedId);
    if (!resume) return;
    setIsAnalyzing(true);
    setTimeout(() => {
      const result = analyzeResume(resume);
      setAnalysis(result);
      setATSAnalysis(result);
      setActiveResume(selectedId);
      setIsAnalyzing(false);
    }, 1200);
  };

  const filteredIssues = analysis?.issues.filter(i => issueFilter === 'all' || i.type === issueFilter) || [];

  const issueIcon = (type: string) => {
    if (type === 'error') return <AlertCircle size={16} style={{ color: 'var(--accent-rose)' }} />;
    if (type === 'warning') return <AlertTriangle size={16} style={{ color: 'var(--accent-amber)' }} />;
    return <Lightbulb size={16} style={{ color: 'var(--accent-blue)' }} />;
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
      <div className="section-header">
        <div>
          <h1 className="section-title"><span className="gradient-text">ATS Resume Scanner</span></h1>
          <p className="section-subtitle">Analyze your resume for ATS compatibility and get actionable fixes</p>
        </div>
      </div>

      {/* Resume Selector */}
      {!analysis && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card mb-8" style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center', padding: '3rem' }}>
          <div style={{ width: 64, height: 64, borderRadius: 'var(--radius-xl)', background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: 'var(--accent-blue)' }}>
            <Target size={28} />
          </div>
          <h2 className="text-xl font-bold mb-2">Select a Resume to Scan</h2>
          <p className="text-sm text-tertiary mb-6">Choose from your saved resumes to run an ATS analysis</p>

          <select className="input-field mb-4" value={selectedId} onChange={e => setSelectedId(e.target.value)} style={{ textAlign: 'left' }}>
            <option value="">Select a resume...</option>
            {resumes.map(r => (
              <option key={r.id} value={r.id}>{r.metadata.name} — {r.personalInfo.fullName || 'Untitled'}</option>
            ))}
          </select>

          <button className="btn btn-primary btn-lg w-full" onClick={handleAnalyze} disabled={!selectedId || isAnalyzing} style={{ opacity: !selectedId ? 0.5 : 1 }}>
            {isAnalyzing ? <><div className="spinner" style={{ width: 18, height: 18 }} /> Analyzing...</> : <><Zap size={18} /> Analyze Resume</>}
          </button>

          {resumes.length === 0 && (
            <div className="mt-6">
              <p className="text-sm text-tertiary mb-3">No resumes found</p>
              <button className="btn btn-secondary" onClick={() => setPage('builder')}>Create Resume</button>
            </div>
          )}
        </motion.div>
      )}

      {/* Results */}
      <AnimatePresence>
        {analysis && (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            {/* Re-analyze */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <select className="input-field" value={selectedId} onChange={e => setSelectedId(e.target.value)} style={{ width: 260 }}>
                  {resumes.map(r => <option key={r.id} value={r.id}>{r.metadata.name}</option>)}
                </select>
                <button className="btn btn-secondary btn-sm" onClick={handleAnalyze} disabled={isAnalyzing}>
                  {isAnalyzing ? 'Analyzing...' : 'Re-analyze'}
                </button>
              </div>
            </div>

            {/* Overall Score */}
            <div className="glass-card mb-6" style={{ textAlign: 'center', padding: '2.5rem' }}>
              <h2 className="text-xl font-bold mb-6">ATS Compatibility Score</h2>
              <ScoreRing score={analysis.score.overall} size={180} />
              <div className="mt-6 flex items-center justify-center gap-8">
                <div>
                  <div className="text-xs text-tertiary">Interview Probability</div>
                  <div className="text-2xl font-black" style={{ color: getScoreColor(analysis.interviewProbability) }}>
                    {analysis.interviewProbability}%
                  </div>
                </div>
                <div style={{ width: 1, height: 40, background: 'var(--glass-border)' }} />
                <div>
                  <div className="text-xs text-tertiary">Quantified Achievements</div>
                  <div className="text-2xl font-black text-accent">
                    {analysis.quantifiedAchievements}/{analysis.totalBullets}
                  </div>
                </div>
              </div>
            </div>

            {/* Breakdown Grid */}
            <div className="grid-3 mb-6">
              {categoryInfo.map((cat, i) => {
                const score = analysis.score[cat.key];
                return (
                  <motion.div key={cat.key} className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.08 }}>
                    <div className="flex items-center gap-3 mb-3">
                      <div style={{ color: getScoreColor(score) }}>{cat.icon}</div>
                      <div>
                        <div className="text-sm font-semibold">{cat.label}</div>
                        <div className="text-xs text-tertiary">{cat.desc}</div>
                      </div>
                      <span className="text-lg font-black" style={{ marginLeft: 'auto', color: getScoreColor(score) }}>{score}</span>
                    </div>
                    <div style={{ height: 6, background: 'rgba(148,163,184,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${score}%` }}
                        transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                        style={{ height: '100%', background: getScoreColor(score), borderRadius: 3 }}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Strengths & Weaknesses */}
            <div className="grid-2 mb-6">
              <div className="glass-card">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle2 size={18} style={{ color: 'var(--accent-emerald)' }} /> Strengths
                </h3>
                <div className="flex flex-col gap-2">
                  {analysis.strengths.map((s, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <CheckCircle2 size={14} style={{ color: 'var(--accent-emerald)', flexShrink: 0 }} />
                      <span>{s}</span>
                    </div>
                  ))}
                  {analysis.strengths.length === 0 && <p className="text-sm text-tertiary">No notable strengths detected</p>}
                </div>
              </div>
              <div className="glass-card">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <XCircle size={18} style={{ color: 'var(--accent-rose)' }} /> Weaknesses
                </h3>
                <div className="flex flex-col gap-2">
                  {analysis.weaknesses.map((w, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <XCircle size={14} style={{ color: 'var(--accent-rose)', flexShrink: 0 }} />
                      <span>{w}</span>
                    </div>
                  ))}
                  {analysis.weaknesses.length === 0 && <p className="text-sm text-tertiary">No critical weaknesses found</p>}
                </div>
              </div>
            </div>

            {/* Issues */}
            <div className="glass-card mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <AlertCircle size={18} style={{ color: 'var(--accent-amber)' }} />
                  Issues ({analysis.issues.length})
                </h3>
                <div className="tabs">
                  {[
                    { key: 'all' as const, label: `All (${analysis.issues.length})` },
                    { key: 'error' as const, label: `Errors (${analysis.issues.filter(i => i.type === 'error').length})` },
                    { key: 'warning' as const, label: `Warnings (${analysis.issues.filter(i => i.type === 'warning').length})` },
                    { key: 'suggestion' as const, label: `Tips (${analysis.issues.filter(i => i.type === 'suggestion').length})` },
                  ].map(tab => (
                    <button key={tab.key} className={`tab-item ${issueFilter === tab.key ? 'active' : ''}`} onClick={() => setIssueFilter(tab.key)}>
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {filteredIssues.map((issue, i) => (
                  <motion.div key={issue.id} className={`issue-card ${issue.type}`}
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  >
                    <div className="issue-card-icon">{issueIcon(issue.type)}</div>
                    <div className="issue-card-content">
                      <div className="issue-card-title">{issue.title}</div>
                      <div className="issue-card-desc">{issue.description}</div>
                      {issue.fix && (
                        <div className="issue-card-fix">
                          <span className="badge badge-blue">
                            <TrendingUp size={10} /> Fix: {issue.fix}
                          </span>
                        </div>
                      )}
                    </div>
                    <span className="badge badge-rose" style={{ flexShrink: 0 }}>Impact: {issue.impact}/10</span>
                  </motion.div>
                ))}
                {filteredIssues.length === 0 && <p className="text-sm text-tertiary text-center p-6">No issues in this category 🎉</p>}
              </div>
            </div>

            {/* One-Click Fix */}
            <div className="glass-card" style={{ textAlign: 'center', padding: '2rem' }}>
              <h3 className="font-semibold mb-2">Ready to improve your score?</h3>
              <p className="text-sm text-tertiary mb-4">Go to the Resume Builder to address the issues above</p>
              <div className="flex justify-center gap-3">
                <button className="btn btn-primary btn-lg" onClick={() => setPage('builder')}>
                  <Zap size={18} /> Fix Issues in Builder
                </button>
                <button className="btn btn-secondary btn-lg" onClick={() => setPage('optimizer')}>
                  <Sparkles size={18} /> AI Optimizer
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

