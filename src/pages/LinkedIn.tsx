import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link2, Copy, Check, Sparkles, User, Briefcase, Wrench, Search } from 'lucide-react';
import { useResumeStore } from '../stores/resumeStore';

export default function LinkedInOptimizer() {
  const { resumes, activeResumeId, setPage } = useResumeStore();
  const resume = resumes.find(r => r.id === activeResumeId);
  const [generated, setGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const [headline, setHeadline] = useState('');
  const [about, setAbout] = useState('');
  const [expText, setExpText] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);

  const handleGenerate = () => {
    if (!resume) return;
    setIsGenerating(true);
    setTimeout(() => {
      const title = resume.personalInfo.title || 'Professional';
      const topSkills = resume.skills.slice(0, 5).map(s => s.name);
      const company = resume.experience[0]?.company || '';

      setHeadline(`${title}${company ? ` at ${company}` : ''} | ${topSkills.slice(0, 3).join(' • ')} | Driving Results Through Innovation`);

      setAbout(`${resume.summary || `Experienced ${title} passionate about delivering impactful solutions.`}

🔹 What I do: I specialize in ${topSkills.slice(0, 3).join(', ')}, helping organizations achieve their goals through technology and strategic thinking.

🔹 What drives me: I'm passionate about continuous learning, mentoring teams, and building solutions that make a real difference. I thrive in collaborative environments where innovation meets execution.

🔹 Key achievements:
${resume.experience[0]?.bullets.slice(0, 3).map(b => `• ${b}`).join('\n') || '• Delivered impactful projects and driven measurable results'}

📫 Let's connect! I'm always open to discussing new opportunities, collaborations, and industry insights.`);

      setExpText(resume.experience.map(exp =>
        `${exp.jobTitle} at ${exp.company}\n${exp.bullets.map(b => `• ${b}`).join('\n')}`
      ).join('\n\n'));

      setSkills(resume.skills.map(s => s.name));
      setKeywords([title, ...topSkills, 'Innovation', 'Strategy', 'Results-Driven', 'Team Leadership']);
      setGenerated(true);
      setIsGenerating(false);
    }, 1500);
  };

  const copyText = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopied(section);
    setTimeout(() => setCopied(null), 2000);
  };

  const CopyBtn = ({ text, section }: { text: string; section: string }) => (
    <button className="btn btn-ghost btn-sm" onClick={() => copyText(text, section)}>
      {copied === section ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy</>}
    </button>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
      <div className="section-header">
        <div>
          <h1 className="section-title">LinkedIn Optimizer</h1>
          <p className="section-subtitle">Optimize your LinkedIn profile for recruiter searches</p>
        </div>
      </div>

      {!generated ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', maxWidth: 600, margin: '0 auto' }}>
          <div style={{ width: 64, height: 64, borderRadius: 'var(--radius-md)', background: 'var(--accent-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: 'var(--accent-primary)' }}>
            <Link2 size={28} />
          </div>
          <h2 className="text-xl font-bold mb-2">Generate LinkedIn Content</h2>
          <p className="text-sm text-muted mb-6">We'll create optimized Headline, About, Experience, and Skills sections based on your resume.</p>
          {!resume ? (
            <button className="btn btn-primary btn-lg" onClick={() => setPage('builder')}>Create Resume First</button>
          ) : (
            <button className="btn btn-primary btn-lg" onClick={handleGenerate} disabled={isGenerating}>
              {isGenerating ? <><div className="spinner" style={{ width: 18, height: 18 }} /> Generating...</> : <><Sparkles size={18} /> Generate LinkedIn Content</>}
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Headline */}
          <motion.div className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2"><User size={18} style={{ color: 'var(--accent-primary)' }} /> Headline</h3>
              <CopyBtn text={headline} section="headline" />
            </div>
            <textarea className="input-field" value={headline} onChange={e => setHeadline(e.target.value)} rows={2} />
            <p className="text-xs text-muted mt-2">{headline.length}/220 characters</p>
          </motion.div>

          {/* About */}
          <motion.div className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2"><Briefcase size={18} style={{ color: 'var(--accent-primary)' }} /> About Section</h3>
              <CopyBtn text={about} section="about" />
            </div>
            <textarea className="input-field" value={about} onChange={e => setAbout(e.target.value)} rows={10} />
          </motion.div>

          {/* Experience */}
          <motion.div className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2"><Briefcase size={18} style={{ color: 'var(--accent-primary)' }} /> Experience</h3>
              <CopyBtn text={expText} section="experience" />
            </div>
            <textarea className="input-field" value={expText} onChange={e => setExpText(e.target.value)} rows={8} />
          </motion.div>

          {/* Skills */}
          <motion.div className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2"><Wrench size={18} style={{ color: 'var(--accent-primary)' }} /> Recommended Skills</h3>
              <CopyBtn text={skills.join(', ')} section="skills" />
            </div>
            <div className="flex flex-wrap gap-2">
              {skills.map(s => <span key={s} className="badge badge-amber">{s}</span>)}
            </div>
          </motion.div>

          {/* Keywords */}
          <motion.div className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2"><Search size={18} style={{ color: 'var(--accent-primary)' }} /> SEO Keywords</h3>
            </div>
            <p className="text-sm text-muted mb-3">Include these in your profile to appear in recruiter searches:</p>
            <div className="flex flex-wrap gap-2">
              {keywords.map(k => <span key={k} className="badge badge-amber">{k}</span>)}
            </div>
          </motion.div>

          <button className="btn btn-ghost" onClick={() => { setGenerated(false); }}>
            ← Regenerate
          </button>
        </div>
      )}
    </motion.div>
  );
}
