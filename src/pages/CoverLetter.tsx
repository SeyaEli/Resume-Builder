import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileEdit, Copy, Download, Sparkles, Building2, User, Check
} from 'lucide-react';
import { useResumeStore } from '../stores/resumeStore';
import type { CoverLetterStyle, CoverLetter, Resume } from '../types/resume';
import { createId } from '../types/resume';

const STYLES: { key: CoverLetterStyle; label: string; desc: string; icon: React.ReactNode }[] = [
  { key: 'formal', label: 'Formal', desc: 'Traditional and professional', icon: <Building2 size={20} /> },
  { key: 'modern', label: 'Modern', desc: 'Contemporary and engaging', icon: <Sparkles size={20} /> },
  { key: 'executive', label: 'Executive', desc: 'Sophisticated and commanding', icon: <User size={20} /> },
  { key: 'entry-level', label: 'Entry-Level', desc: 'Enthusiastic and eager', icon: <FileEdit size={20} /> },
];

function generateCoverLetterContent(resume: Resume, jobTitle: string, company: string, style: CoverLetterStyle): string {
  const name = resume.personalInfo.fullName || 'Your Name';
  const email = resume.personalInfo.email || 'your.email@example.com';
  const phone = resume.personalInfo.phone || '(555) 123-4567';
  const topSkills = resume.skills.slice(0, 5).map(s => s.name).join(', ') || 'relevant skills';
  const years = resume.experience.length > 0 ? `${resume.experience.length * 2}+` : 'several';
  const recentTitle = resume.experience[0]?.jobTitle || 'professional';
  const recentCompany = resume.experience[0]?.company || 'my current organization';

  const greetings: Record<CoverLetterStyle, string> = {
    formal: 'Dear Hiring Manager,',
    modern: `Dear ${company} Hiring Team,`,
    executive: 'Dear Members of the Selection Committee,',
    'entry-level': `Dear ${company} Recruiting Team,`,
  };

  const openings: Record<CoverLetterStyle, string> = {
    formal: `I am writing to express my strong interest in the ${jobTitle} position at ${company}. With ${years} years of professional experience and expertise in ${topSkills}, I am confident in my ability to make a meaningful contribution to your team.`,
    modern: `I'm excited to apply for the ${jobTitle} role at ${company}. As a ${recentTitle} with a passion for delivering results and expertise in ${topSkills}, I believe I'd be a great addition to your innovative team.`,
    executive: `I am reaching out regarding the ${jobTitle} opportunity at ${company}. As a seasoned professional with ${years} years of leadership experience, I bring a proven track record of driving organizational growth, strategic innovation, and operational excellence.`,
    'entry-level': `I am thrilled to apply for the ${jobTitle} position at ${company}. As a motivated and eager professional with strong foundations in ${topSkills}, I am excited about the opportunity to bring my enthusiasm and fresh perspective to your team.`,
  };

  const bodies: Record<CoverLetterStyle, string> = {
    formal: `In my current role as ${recentTitle} at ${recentCompany}, I have developed a comprehensive skill set that aligns well with the requirements of this position. My experience includes ${topSkills}, which I have applied to deliver measurable results and drive continuous improvement.\n\nI am particularly drawn to ${company}'s commitment to excellence and innovation in the industry. I am confident that my professional background, combined with my dedication to quality and results, would enable me to contribute significantly to your organization's continued success.`,
    modern: `At ${recentCompany}, I've had the opportunity to grow as a ${recentTitle}, working on exciting projects that sharpened my skills in ${topSkills}. I thrive in collaborative environments where creativity meets execution, and I'm passionate about building solutions that make a real impact.\n\n${company}'s approach to innovation really resonates with me. I'm eager to bring my energy, skills, and growth mindset to a team that values both individual contribution and collective success. I'm confident I can hit the ground running and add value from day one.`,
    executive: `Throughout my career, I have consistently demonstrated the ability to lead cross-functional teams, drive strategic initiatives, and deliver exceptional results. At ${recentCompany}, I spearheaded initiatives that strengthened organizational performance, optimized processes, and fostered a culture of innovation and accountability.\n\nMy leadership philosophy centers on empowering teams, making data-driven decisions, and maintaining an unwavering focus on stakeholder value. I am confident that my strategic vision and operational expertise would complement ${company}'s leadership team as you continue to scale and innovate.`,
    'entry-level': `During my academic and early career journey, I have built a strong foundation in ${topSkills}. I am a fast learner with a genuine passion for growth, and I have consistently demonstrated my ability to take on new challenges with enthusiasm and deliver quality results.\n\nWhat excites me most about ${company} is the opportunity to learn from experienced professionals while contributing my fresh perspectives and strong work ethic. I am committed to growing within your organization and making a positive impact from the start.`,
  };

  const closings: Record<CoverLetterStyle, string> = {
    formal: `Thank you for considering my application. I would welcome the opportunity to discuss how my qualifications and experience can benefit ${company}. I am available at your convenience for an interview and can be reached at ${email} or ${phone}.\n\nSincerely,\n${name}`,
    modern: `I'd love the chance to chat about how I can contribute to ${company}'s success. Feel free to reach out at ${email} or ${phone} — I'm looking forward to connecting!\n\nBest regards,\n${name}`,
    executive: `I would welcome the opportunity to discuss how my leadership experience and strategic vision can drive value for ${company}. Please do not hesitate to contact me at ${email} or ${phone} to arrange a meeting.\n\nRespectfully,\n${name}`,
    'entry-level': `I am eager to discuss how my skills, enthusiasm, and commitment to growth make me a great fit for this role. Please feel free to contact me at ${email} or ${phone}. Thank you for your time and consideration!\n\nWarmly,\n${name}`,
  };

  return `${name}\n${email} | ${phone}\n${resume.personalInfo.location}\n\n${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}\n\n${greetings[style]}\n\n${openings[style]}\n\n${bodies[style]}\n\n${closings[style]}`;
}

export default function CoverLetterPage() {
  const { resumes, activeResumeId, coverLetters, addCoverLetter } = useResumeStore();
  const [selectedStyle, setSelectedStyle] = useState<CoverLetterStyle>('modern');
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [selectedResumeId, setSelectedResumeId] = useState(activeResumeId || '');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = () => {
    const resume = resumes.find(r => r.id === selectedResumeId);
    if (!resume || !jobTitle.trim() || !company.trim()) return;

    setIsGenerating(true);
    setTimeout(() => {
      const content = generateCoverLetterContent(resume, jobTitle, company, selectedStyle);
      setGeneratedContent(content);
      setIsGenerating(false);

      const cl: CoverLetter = {
        id: createId(),
        style: selectedStyle,
        targetJob: jobTitle,
        targetCompany: company,
        content,
        createdAt: new Date().toISOString(),
      };
      addCoverLetter(cl);
    }, 1200);
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
                      <><Sparkles size={16} /> Generate Cover Letter</>
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
