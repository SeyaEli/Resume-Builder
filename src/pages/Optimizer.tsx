import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, CheckCircle2, RefreshCw, Zap, TrendingUp, Eye, Bot,
  ArrowRight, ArrowUpRight, AlertTriangle, Loader2, Copy, Check, Target,
} from 'lucide-react';
import { useResumeStore } from '../stores/resumeStore';
import { optimizeResume } from '../services/aiEngine';
import { runAi } from '../services/aiService';
import { analyzeResume } from '../services/atsScorer';
import type { OptimizeResult, AITextChange } from '../services/aiEngine';

function ScoreCompare({ before, after }: { before: number; after: number }) {
  const delta = after - before;
  const color = (s: number) => (s >= 80 ? 'var(--color-success)' : s >= 60 ? 'var(--color-warning)' : 'var(--color-danger)');
  return (
    <div className="flex items-center justify-center gap-8 flex-wrap">
      <div style={{ textAlign: 'center' }}>
        <div className="text-xs text-muted mb-1">Before</div>
        <div className="text-3xl font-black" style={{ color: color(before) }}>{before}</div>
      </div>
      <ArrowRight size={22} style={{ color: 'var(--text-muted)' }} />
      <div style={{ textAlign: 'center' }}>
        <div className="text-xs text-muted mb-1">After</div>
        <div className="text-3xl font-black" style={{ color: color(after) }}>{after}</div>
      </div>
      <div className="badge badge-emerald" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
        {delta > 0 ? '+' : ''}{delta} points
      </div>
    </div>
  );
}

function ChangeCard({ change, index }: { change: AITextChange; index: number }) {
  const [copied, setCopied] = useState(false);

  const copyAfter = () => {
    navigator.clipboard.writeText(change.after);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <motion.div
      className="glass-card"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.4) }}
    >
      <div className="flex items-center justify-between mb-3" style={{ gap: 12 }}>
        <span className="badge badge-blue">{change.label}</span>
        <button className="btn btn-ghost btn-sm" onClick={copyAfter}>
          {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
        </button>
      </div>

      <div className="grid-2" style={{ gap: 16 }}>
        <div>
          <div className="text-xs font-semibold text-muted mb-2">BEFORE</div>
          <div style={{
            padding: '12px 16px', background: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-md)', border: '1px solid var(--border-primary)',
            fontSize: '0.85rem', color: 'var(--text-secondary)',
          }}>{change.before}</div>
        </div>
        <div>
          <div className="text-xs font-semibold text-muted mb-2">AFTER</div>
          <div style={{
            padding: '12px 16px', background: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-md)', border: '1px solid var(--border-secondary)',
            fontSize: '0.85rem',
          }}>{change.after}</div>
        </div>
      </div>

      {change.reasons.length > 0 && (
        <ul style={{ marginTop: 12, paddingLeft: 18 }}>
          {change.reasons.map((r, i) => (
            <li key={i} className="text-xs text-tertiary" style={{ marginBottom: 3 }}>{r}</li>
          ))}
        </ul>
      )}

      {change.verifyNumber && (
        <div className="flex items-center gap-2 mt-3 text-xs" style={{ color: 'var(--color-warning)' }}>
          <AlertTriangle size={13} />
          The number in this line is a placeholder — replace it with your real figure before you send it.
        </div>
      )}
    </motion.div>
  );
}

export default function Optimizer() {
  const { resumes, activeResumeId, setPage, updateResume, addToast, jobDescriptions } = useResumeStore();
  const resume = resumes.find(r => r.id === activeResumeId);

  const [isOptimizing, setIsOptimizing] = useState(false);
  const [result, setResult] = useState<OptimizeResult | null>(null);
  const [options, setOptions] = useState({ rewriteBullets: true, addMetrics: true, generateSummary: true });
  const [tab, setTab] = useState<'resume' | 'job'>('resume');

  // Job-targeted suggestions
  const [jobText, setJobText] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [skillsToAdd, setSkillsToAdd] = useState<string[]>([]);
  const [isTargeting, setIsTargeting] = useState(false);
  const [addingSkills, setAddingSkills] = useState(false);

  const handleOptimize = () => {
    if (!resume) return;
    setIsOptimizing(true);
    setResult(null);
    // A short pause so the change is visible instead of instant.
    setTimeout(() => {
      const output = optimizeResume(resume, options);
      updateResume(resume.id, {
        summary: output.updated.summary,
        experience: output.updated.experience,
      });
      setResult(output);
      setIsOptimizing(false);
      addToast('success', output.changes.length
        ? `${output.changes.length} change${output.changes.length === 1 ? '' : 's'} applied to your resume.`
        : 'Nothing needed rewriting — your bullets are already strong.');
    }, 900);
  };

  const handleTargetJob = async () => {
    if (!resume || !jobText.trim()) return;
    setIsTargeting(true);
    try {
      const bullets = await runAi({ kind: 'bullets', resume, input: jobText });
      const skills = await runAi({ kind: 'skills', resume, input: jobText });
      setSuggestions(
        bullets.text.split('\n').map(l => l.replace(/^[-•*]\s*/, '').trim()).filter(Boolean)
      );
      setSkillsToAdd(
        skills.text.split('\n').map(l => l.replace(/^[-•*]\s*/, '').trim()).filter(Boolean)
      );
      if (bullets.fallbackReason) addToast('warning', bullets.fallbackReason);
    } finally {
      setIsTargeting(false);
    }
  };

  const addSuggestedSkills = () => {
    if (!resume || skillsToAdd.length === 0) return;
    setAddingSkills(true);
    const existing = new Set(resume.skills.map(s => s.name.toLowerCase()));
    const fresh = skillsToAdd
      .filter(s => !existing.has(s.toLowerCase()))
      .map(name => ({ id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`, name, category: 'hard' as const }));
    updateResume(resume.id, { skills: [...resume.skills, ...fresh] });
    addToast('success', `${fresh.length} skill${fresh.length === 1 ? '' : 's'} added. Remove any you would not want to be asked about.`);
    setSkillsToAdd([]);
    setAddingSkills(false);
  };

  const copyAll = () => {
    if (!suggestions.length) return;
    navigator.clipboard.writeText(suggestions.map(s => `• ${s}`).join('\n'));
    addToast('success', 'Suggested bullets copied.');
  };

  const currentScore = resume ? analyzeResume(resume).score.overall : 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
      <div className="section-header">
        <div>
          <h1 className="section-title">Resume Optimizer</h1>
          <p className="section-subtitle">
            Reads your own bullets, fixes the weak ones, and drafts the numbers only you can confirm
          </p>
        </div>
        {resume && <span className="badge badge-amber">Current ATS score: {currentScore}/100</span>}
      </div>

      {/* Tabs */}
      <div className="tabs mb-6 tabs-fit">
        {[
          { key: 'resume' as const, label: 'Optimize my resume', icon: <Sparkles size={14} /> },
          { key: 'job' as const, label: 'Target a job posting', icon: <Target size={14} /> },
        ].map(t => (
          <button key={t.key} className={`tab-item ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
            <span className="flex items-center gap-2">{t.icon}{t.label}</span>
          </button>
        ))}
      </div>

      {!resume ? (
        <div className="glass-card center-card">
          <h2 className="text-xl font-bold mb-2">No resume selected</h2>
          <p className="text-sm text-muted mb-6">Build or pick a resume first, then come back to optimize it.</p>
          <button className="btn btn-primary btn-lg" onClick={() => setPage('builder')}>Open Resume Builder</button>
        </div>
      ) : tab === 'resume' ? (
        <>
          {/* Action card */}
          <div className="glass-card mb-8 center-card">
            <div className="flex items-center gap-4 mb-6" style={{ justifyContent: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: 'var(--radius-md)', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot size={26} style={{ color: 'var(--text-on-accent)' }} />
              </div>
              <div>
                <h2 className="text-xl font-bold">What should it fix?</h2>
                <p className="text-xs text-muted">Every change is shown to you before you keep it.</p>
              </div>
            </div>

            <div className="grid-3 mb-6">
              {[
                { key: 'rewriteBullets' as const, title: 'Rewrite weak bullets', desc: 'Replaces "worked on", "helped", "responsible for" and first person with strong action verbs.' },
                { key: 'addMetrics' as const, title: 'draft measurable results', desc: 'Adds a placeholder number to lines with none, matched to what the line is about.' },
                { key: 'generateSummary' as const, title: 'Rebuild the summary', desc: 'Writes a summary from your real titles, skills, certifications and best result.' },
              ].map(opt => (
                <button
                  key={opt.key}
                  className="glass-card"
                  onClick={() => setOptions({ ...options, [opt.key]: !options[opt.key] })}
                  style={{
                    textAlign: 'left',
                    borderColor: options[opt.key] ? 'var(--accent-primary)' : 'var(--border-primary)',
                    background: options[opt.key] ? 'var(--accent-subtle)' : 'var(--bg-card)',
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {options[opt.key]
                      ? <CheckCircle2 size={16} style={{ color: 'var(--accent-primary)' }} />
                      : <div style={{ width: 16, height: 16, borderRadius: 4, border: '1px solid var(--border-secondary)' }} />}
                    <span className="font-semibold text-sm">{opt.title}</span>
                  </div>
                  <p className="text-xs text-muted">{opt.desc}</p>
                </button>
              ))}
            </div>

            <div className="flex justify-center">
              <button className="btn btn-primary btn-lg" onClick={handleOptimize} disabled={isOptimizing}>
                {isOptimizing
                  ? <><Loader2 size={18} className="spin" /> Optimizing...</>
                  : <><Zap size={18} /> Optimize Resume</>}
              </button>
            </div>
          </div>

          {/* Results */}
          <AnimatePresence>
            {result && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="glass-card mb-6" style={{ padding: '2rem' }}>
                  <h3 className="font-semibold mb-4" style={{ textAlign: 'center' }}>
                    {result.changes.length ? 'Your score after optimizing' : 'Already in good shape'}
                  </h3>
                  <ScoreCompare before={result.scoreBefore} after={result.scoreAfter} />
                  <p className="text-xs text-muted mt-4" style={{ textAlign: 'center' }}>
                    The score is recomputed from the live ATS checks, so this is the same number the ATS Checker shows.
                  </p>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">
                    Changes applied ({result.changes.length})
                  </h3>
                  <div className="flex gap-2">
                    <button className="btn btn-ghost btn-sm" onClick={() => setResult(null)}>
                      <RefreshCw size={14} /> Hide
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => setPage('builder')}>
                      <Eye size={14} /> See it in the resume
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  {result.changes.map((change, i) => (
                    <ChangeCard key={change.id} change={change} index={i} />
                  ))}
                  {result.changes.length === 0 && (
                    <div className="glass-card text-sm text-muted">
                      No bullet needed rewriting. Your strong verbs and numbers are already doing the work.
                    </div>
                  )}
                </div>

                {result.needsAttention.length > 0 && (
                  <div className="glass-card mt-6">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle size={16} style={{ color: 'var(--color-warning)' }} />
                      <h3 className="font-semibold text-sm">Only you can fix these {result.needsAttention.length}</h3>
                    </div>
                    <div className="flex flex-col gap-3">
                      {result.needsAttention.map((item, i) => (
                        <div key={i} style={{ padding: '10px 14px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                          <div className="text-xs text-muted mb-1">{item.label}</div>
                          <div className="text-sm">{item.bullet}</div>
                          <div className="text-xs mt-2" style={{ color: 'var(--color-warning)' }}>{item.why}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      ) : (
        /* ===== Job-targeted mode ===== */
        <div className="grid-2" style={{ alignItems: 'flex-start' }}>
          <div className="glass-card">
            <h3 className="font-semibold mb-2">Paste the job posting</h3>
            <p className="text-xs text-muted mb-4">
              The optimizer pulls the tools, skills and keywords out of the posting, then writes bullets and a skills list aimed at it.
            </p>
            {jobDescriptions.length > 0 && (
              <div className="input-group mb-3">
                <label className="input-label">Load a posting you already saved</label>
                <select
                  className="input-field"
                  value=""
                  onChange={e => {
                    const jd = jobDescriptions.find(j => j.id === e.target.value);
                    if (jd) {
                      setJobText(jd.rawText);
                      addToast('info', `Loaded "${jd.title}" from your job list.`);
                    }
                  }}
                >
                  <option value="">Choose from {jobDescriptions.length} saved posting{jobDescriptions.length === 1 ? '' : 's'}...</option>
                  {jobDescriptions.map(j => (
                    <option key={j.id} value={j.id}>{j.title} — {j.company}</option>
                  ))}
                </select>
              </div>
            )}
            <textarea
              className="input-field"
              rows={12}
              placeholder="Paste the full job description here..."
              value={jobText}
              onChange={e => setJobText(e.target.value)}
              style={{ minHeight: 240, resize: 'vertical' }}
            />
            <button
              className="btn btn-primary w-full mt-4"
              onClick={handleTargetJob}
              disabled={!jobText.trim() || isTargeting}
            >
              {isTargeting
                ? <><Loader2 size={16} className="spin" /> Reading the posting...</>
                : <><Sparkles size={16} /> Write targeted content</>}
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {suggestions.length > 0 && (
              <motion.div className="glass-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <TrendingUp size={16} style={{ color: 'var(--accent-primary)' }} /> Bullets for this role
                  </h3>
                  <button className="btn btn-ghost btn-sm" onClick={copyAll}><Copy size={14} /> Copy all</button>
                </div>
                <div className="flex flex-col gap-2">
                  {suggestions.map((s, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm" style={{
                      padding: '10px 14px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)',
                    }}>
                      <ArrowUpRight size={14} style={{ color: 'var(--accent-primary)', flexShrink: 0, marginTop: 3 }} />
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted mt-3">
                  Copy the ones that are true for you into the Experience step. Replace every [number] with your real figure.
                </p>
              </motion.div>
            )}

            {skillsToAdd.length > 0 && (
              <motion.div className="glass-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <h3 className="font-semibold mb-3">Skills the posting wants that you have not listed</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {skillsToAdd.map(s => <span key={s} className="badge badge-amber">{s}</span>)}
                </div>
                <button className="btn btn-secondary btn-sm" onClick={addSuggestedSkills} disabled={addingSkills}>
                  <Zap size={14} /> Add these to my skills
                </button>
                <p className="text-xs text-muted mt-3">
                  Only add what you can honestly discuss in an interview — the ATS matches words, the interviewer asks about them.
                </p>
              </motion.div>
            )}

            {!suggestions.length && !skillsToAdd.length && (
              <div className="glass-card" style={{ textAlign: 'center', padding: '2.5rem' }}>
                <div style={{ width: 56, height: 56, margin: '0 auto 1rem', borderRadius: 'var(--radius-md)', background: 'var(--accent-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)' }}>
                  <Target size={26} />
                </div>
                <h3 className="font-semibold mb-2">Aim your resume at one job</h3>
                <p className="text-sm text-muted">
                  Paste a posting on the left. You will get bullets and a skills list written for that exact role,
                  using the posting's own words.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
