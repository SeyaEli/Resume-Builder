import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileEdit, Copy, Download, FileSignature, Building2, User, Check
} from 'lucide-react';
import { useResumeStore } from '../stores/resumeStore';
import type { CoverLetterStyle, CoverLetter } from '../types/resume';
import { runAi } from '../services/aiService';
import { createId } from '../types/resume';

const STYLES: { key: CoverLetterStyle; label: string; desc: string; icon: React.ReactNode }[] = [
  { key: 'formal', label: 'Formal', desc: 'Traditional and professional', icon: <Building2 size={20} /> },
  { key: 'modern', label: 'Modern', desc: 'Contemporary and engaging', icon: <FileSignature size={20} /> },
  { key: 'executive', label: 'Executive', desc: 'Sophisticated and commanding', icon: <User size={20} /> },
  { key: 'entry-level', label: 'Entry-Level', desc: 'Enthusiastic and eager', icon: <FileEdit size={20} /> },
];

export default function CoverLetterPage() {
  const { resumes, activeResumeId, coverLetters, addCoverLetter, addToast } = useResumeStore();
  const [selectedStyle, setSelectedStyle] = useState<CoverLetterStyle>('modern');
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [selectedResumeId, setSelectedResumeId] = useState(activeResumeId || '');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    const resume = resumes.find(r => r.id === selectedResumeId);
    if (!resume || !jobTitle.trim() || !company.trim() || isGenerating) return;
    setIsGenerating(true);
    try {
      const result = await runAi({ kind: 'cover-letter', resume, input: `${jobTitle} at ${company}\nTone: ${selectedStyle}` });
      const content = [resume.personalInfo.fullName, [resume.personalInfo.email, resume.personalInfo.phone, resume.personalInfo.location].filter(Boolean).join(' | '),
        new Date().toLocaleDateString(), `Dear ${company} Hiring Team,`, result.text, `Sincerely,\n${resume.personalInfo.fullName}`].filter(Boolean).join('\n\n');
      setGeneratedContent(content);
      if (result.fallbackReason) addToast('warning', result.fallbackReason);
      const cl: CoverLetter = { id: createId(), style: selectedStyle, targetJob: jobTitle, targetCompany: company, content, createdAt: new Date().toISOString() };
      addCoverLetter(cl);
    } finally { setIsGenerating(false); }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([generatedContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Cover_Letter_${company.replace(/\s+/g, '_')}_${jobTitle.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
      <div className="section-header">
        <div>
          <h1 className="section-title">
            Cover Letter Generator
          </h1>
          <p className="section-subtitle">Create personalized, ATS-friendly cover letters in seconds</p>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-ghost" onClick={() => setShowHistory(!showHistory)}>
            {showHistory ? 'New Letter' : `History (${coverLetters.length})`}
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {showHistory ? (
          <motion.div key="history" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            {coverLetters.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon"><FileEdit size={32} /></div>
                <h3 className="empty-state-title">No cover letters yet</h3>
                <p className="empty-state-desc">Generate your first cover letter to see it here</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {coverLetters.map(cl => (
                  <div key={cl.id} className="glass-card">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold">{cl.targetJob} at {cl.targetCompany}</h3>
                        <p className="text-xs text-tertiary mt-1">
                          {cl.style} · {new Date(cl.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button className="btn btn-ghost btn-sm" onClick={() => {
                          setGeneratedContent(cl.content);
                          setShowHistory(false);
                        }}>View</button>
                      </div>
                    </div>
                    <p className="text-sm text-secondary" style={{ maxHeight: 60, overflow: 'hidden' }}>
                      {cl.content.substring(0, 150)}...
                    </p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div key="generator" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <div className="grid-2 mb-6">
              {/* Configuration */}
              <div className="flex flex-col gap-6">
                {/* Style Selection */}
                <div className="glass-card">
                  <h3 className="font-semibold mb-4">Choose Style</h3>
                  <div className="grid-2" style={{ gap: '12px' }}>
                    {STYLES.map(s => (
                      <button
                        key={s.key}
                        className={`template-card ${selectedStyle === s.key ? 'selected' : ''}`}
                        onClick={() => setSelectedStyle(s.key)}
                        style={{ padding: '16px', textAlign: 'left' }}
                      >
                        <div className="flex items-center gap-3">
                          <div style={{
                            width: 36, height: 36, borderRadius: 'var(--radius-md)',
                            background: selectedStyle === s.key ? 'var(--accent-subtle)' : 'var(--bg-tertiary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: selectedStyle === s.key ? 'var(--accent-primary)' : 'var(--text-muted)',
                          }}>
                            {s.icon}
                          </div>
                          <div>
                            <div className="font-semibold text-sm">{s.label}</div>
                            <div className="text-xs text-muted">{s.desc}</div>
                          </div>
                          {selectedStyle === s.key && (
                            <Check size={16} style={{ marginLeft: 'auto', color: 'var(--accent-primary)' }} />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Details */}
                <div className="glass-card">
                  <h3 className="font-semibold mb-4">Job Details</h3>
                  <div className="flex flex-col gap-4">
                    <div className="input-group">
                      <label className="input-label">Job Title <span>*</span></label>
                      <input className="input-field" placeholder="e.g., Software Engineer" value={jobTitle} onChange={e => setJobTitle(e.target.value)} />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Company Name <span>*</span></label>
                      <input className="input-field" placeholder="e.g., Google" value={company} onChange={e => setCompany(e.target.value)} />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Based on Resume</label>
                      <select
                        className="input-field"
                        value={selectedResumeId}
                        onChange={e => setSelectedResumeId(e.target.value)}
                      >
                        <option value="">Select a resume...</option>
                        {resumes.map(r => (
                          <option key={r.id} value={r.id}>
                            {r.metadata.name} — {r.personalInfo.fullName || 'Untitled'}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button
                    className="btn btn-primary w-full mt-6"
                    onClick={handleGenerate}
                    disabled={!jobTitle.trim() || !company.trim() || !selectedResumeId || isGenerating}
                    style={{ opacity: (!jobTitle.trim() || !company.trim() || !selectedResumeId) ? 0.5 : 1 }}
                  >
                    {isGenerating ? (
                      <><div className="spinner" style={{ width: 16, height: 16 }} /> Generating...</>
                    ) : (
                      <><FileSignature size={16} /> Generate Cover Letter</>
                    )}
                  </button>
                </div>
              </div>

              {/* Preview */}
              <div className="glass-card" style={{ minHeight: 500 }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Preview</h3>
                  {generatedContent && (
                    <div className="flex gap-2">
                      <button className="btn btn-ghost btn-sm" onClick={handleCopy}>
                        {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy</>}
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={handleDownload}>
                        <Download size={14} /> Download
                      </button>
                    </div>
                  )}
                </div>

                {generatedContent ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                      background: 'white',
                      color: '#1a1a1a',
                      padding: '40px',
                      borderRadius: 'var(--radius-md)',
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '12px',
                      lineHeight: 1.7,
                      whiteSpace: 'pre-wrap',
                      minHeight: 400,
                    }}
                  >
                    {generatedContent}
                  </motion.div>
                ) : (
                  <div className="empty-state" style={{ padding: '60px 20px' }}>
                    <div className="empty-state-icon"><FileEdit size={32} /></div>
                    <h3 className="empty-state-title">Your cover letter will appear here</h3>
                    <p className="empty-state-desc">Fill in the details and click generate</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
