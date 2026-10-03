import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, FileText, Briefcase, GraduationCap, Wrench, FolderOpen,
  Award, Check, ChevronLeft, ChevronRight, Plus, Trash2, Workflow,
  Download, Target, Loader2, Languages
} from 'lucide-react';
import { useResumeStore } from '../stores/resumeStore';
import { createId, TEMPLATE_INFO } from '../types/resume';
import type { Resume, Experience, Education, Skill, Project, Certification, Language, TemplateType } from '../types/resume';
import { exportToPDF, exportToTXT } from '../services/exportService';
import { runAi } from '../services/aiService';
import ResumePreview from '../components/ResumePreview';
import TemplateThumbnail from '../components/TemplateThumbnail';

const TEMPLATE_KEYS = Object.keys(TEMPLATE_INFO) as TemplateType[];

const STEPS = [
  { label: 'Personal', icon: <User size={16} /> },
  { label: 'Summary', icon: <FileText size={16} /> },
  { label: 'Experience', icon: <Briefcase size={16} /> },
  { label: 'Education', icon: <GraduationCap size={16} /> },
  { label: 'Skills', icon: <Wrench size={16} /> },
  { label: 'Projects', icon: <FolderOpen size={16} /> },
  { label: 'Certs', icon: <Award size={16} /> },
  { label: 'Languages', icon: <Languages size={16} /> },
  { label: 'Finalize', icon: <Check size={16} /> },
];


function LanguagesStep({ resume, update }: { resume: Resume; update: (u: Partial<Resume>) => void }) {
  const [newLang, setNewLang] = useState('');
  const [newProf, setNewProf] = useState<Language['proficiency']>('intermediate');

  const addLang = () => {
    if (!newLang.trim()) return;
    const lang: Language = { id: createId(), name: newLang.trim(), proficiency: newProf };
    update({ languages: [...resume.languages, lang] });
    setNewLang('');
  };

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-lg font-bold">Languages</h3>
      <div className="flex gap-3 items-end">
        <div className="input-group" style={{ flex: 1 }}>
          <label className="input-label">Language</label>
          <input className="input-field" placeholder="e.g., English, Spanish" value={newLang}
            onChange={e => setNewLang(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addLang(); }} />
        </div>
        <div className="input-group">
          <label className="input-label">Proficiency</label>
          <select className="input-field" value={newProf} onChange={e => setNewProf(e.target.value as Language['proficiency'])}>
            <option value="native">Native</option>
            <option value="fluent">Fluent</option>
            <option value="advanced">Advanced</option>
            <option value="intermediate">Intermediate</option>
            <option value="basic">Basic</option>
          </select>
        </div>
        <button className="btn btn-primary" onClick={addLang} style={{ marginBottom: 0 }}>
          <Plus size={14} /> Add
        </button>
      </div>
      <div className="flex flex-col gap-2 mt-2">
        {resume.languages.map(l => (
          <div key={l.id} className="glass-card" style={{ padding: '12px 16px' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold">{l.name}</span>
                <select
                  className="input-field"
                  style={{ maxWidth: '100%', minWidth: 120, padding: '4px 8px', fontSize: '0.8rem' }}
                  value={l.proficiency}
                  onChange={e => update({ languages: resume.languages.map(lg => lg.id === l.id ? { ...lg, proficiency: e.target.value as Language['proficiency'] } : lg) })}
                >
                  <option value="native">Native</option>
                  <option value="fluent">Fluent</option>
                  <option value="advanced">Advanced</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="basic">Basic</option>
                </select>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => update({ languages: resume.languages.filter(lg => lg.id !== l.id) })} style={{ color: 'var(--accent-rose)' }}>
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
        {resume.languages.length === 0 && (
          <p className="text-sm text-tertiary">No languages added yet.</p>
        )}
      </div>
    </div>
  );
}

function SkillsStep({ resume, update }: { resume: Resume; update: (u: Partial<Resume>) => void }) {
  const [newSkill, setNewSkill] = useState('');
  const [newCat, setNewCat] = useState<Skill['category']>('hard');

  const addSkill = () => {
    if (!newSkill.trim()) return;
    const skill: Skill = { id: createId(), name: newSkill.trim(), category: newCat };
    update({ skills: [...resume.skills, skill] });
    setNewSkill('');
  };

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-lg font-bold">Skills</h3>
      <div className="flex gap-3 items-end">
        <div className="input-group" style={{ flex: 1 }}>
          <label className="input-label">Skill Name</label>
          <input className="input-field" placeholder="e.g., Python, Leadership, AWS" value={newSkill}
            onChange={e => setNewSkill(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addSkill(); }} />
        </div>
        <div className="input-group">
          <label className="input-label">Category</label>
          <select className="input-field" value={newCat} onChange={e => setNewCat(e.target.value as Skill['category'])}>
            <option value="hard">Hard Skill</option>
            <option value="soft">Soft Skill</option>
            <option value="tool">Tool</option>
            <option value="framework">Framework</option>
            <option value="language">Language</option>
          </select>
        </div>
        <button className="btn btn-primary" onClick={addSkill} style={{ marginBottom: 0 }}>
          <Plus size={14} /> Add
        </button>
      </div>
      <div className="flex flex-wrap gap-2 mt-2">
        {resume.skills.map(s => (
          <motion.span key={s.id} initial={{ scale: 0 }} animate={{ scale: 1 }}
            className={`badge ${s.category === 'hard' ? 'badge-blue' : s.category === 'soft' ? 'badge-violet' : s.category === 'tool' ? 'badge-cyan' : 'badge-emerald'}`}
            style={{ cursor: 'pointer', fontSize: '0.8rem', padding: '6px 12px' }}
            onClick={() => update({ skills: resume.skills.filter(sk => sk.id !== s.id) })}
            title="Click to remove"
          >
            {s.name} ×
          </motion.span>
        ))}
      </div>
      <p className="text-xs text-tertiary">{resume.skills.length} skills added (recommended: 8-15). Click a skill to remove it.</p>
    </div>
  );
}

export default function ResumeBuilder() {
  const { resumes, activeResumeId, createResume, updateResume, setActiveResume, setPage, addToast } = useResumeStore();
  const [step, setStep] = useState(0);

  // Ensure we have an active resume
  useEffect(() => {
    if (!activeResumeId || !resumes.find(r => r.id === activeResumeId)) {
      const newId = createResume();
      setActiveResume(newId);
    }
  }, []);

  const resume = resumes.find(r => r.id === activeResumeId);
  if (!resume) return null;

  const update = (updates: Partial<Resume>) => updateResume(resume.id, updates);

  // ===== Step Renderers =====

  const renderPersonalInfo = () => (
    <div className="flex flex-col gap-4">
      <h3 className="text-lg font-bold">Personal Information</h3>
      <div className="grid-2" style={{ gap: 16 }}>
        {[
          { key: 'fullName' as const, label: 'Full Name', placeholder: 'John Doe', required: true },
          { key: 'title' as const, label: 'Professional Title', placeholder: 'Software Engineer' },
          { key: 'email' as const, label: 'Email', placeholder: 'john@example.com', required: true },
          { key: 'phone' as const, label: 'Phone', placeholder: '(555) 123-4567' },
          { key: 'location' as const, label: 'Location', placeholder: 'San Francisco, CA' },
          { key: 'linkedin' as const, label: 'LinkedIn', placeholder: 'linkedin.com/in/johndoe' },
          { key: 'portfolio' as const, label: 'Portfolio/Website', placeholder: 'johndoe.com' },
        ].map(field => (
          <div key={field.key} className="input-group">
            <label className="input-label">{field.label}{field.required ? <span> *</span> : ''}</label>
            <input
              className="input-field"
              placeholder={field.placeholder}
              value={resume.personalInfo[field.key]}
              onChange={e => update({ personalInfo: { ...resume.personalInfo, [field.key]: e.target.value } })}
            />
          </div>
        ))}
      </div>
    </div>
  );

  const [aiBusy, setAiBusy] = useState(false);

  const handleAiSummary = async () => {
    setAiBusy(true);
    try {
      const result = await runAi({ kind: 'summary', resume, input: resume.personalInfo.title || 'the role' });
      update({ summary: result.text });
      addToast('success', result.fallbackReason ? 'Summary written — note: your connected model failed, so the built-in engine answered.' : 'Summary written from your resume.');
    } finally {
      setAiBusy(false);
    }
  };

  const renderSummary = () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">Professional Summary</h3>
        <button className="btn btn-secondary btn-sm" onClick={handleAiSummary} disabled={aiBusy}>
          {aiBusy ? <><Loader2 size={14} className="spin" /> Writing...</> : <><Workflow size={14} /> Generate</>}
        </button>
      </div>
      <textarea
        className="input-field"
        rows={5}
        placeholder="Write a compelling 2-4 sentence summary highlighting your key strengths, experience, and career goals..."
        value={resume.summary}
        onChange={e => update({ summary: e.target.value })}
      />
      <p className="text-xs text-tertiary">{resume.summary.split(/\s+/).filter(Boolean).length} words (recommended: 30-60). AI Generate uses your own titles, skills and results.</p>
    </div>
  );

  const renderExperience = () => {
    const addExperience = () => {
      const newExp: Experience = {
        id: createId(), jobTitle: '', company: '', location: '',
        startDate: '', endDate: '', current: false, bullets: [''],
      };
      update({ experience: [...resume.experience, newExp] });
    };

    const updateExp = (id: string, changes: Partial<Experience>) => {
      update({ experience: resume.experience.map(e => e.id === id ? { ...e, ...changes } : e) });
    };

    const removeExp = (id: string) => {
      update({ experience: resume.experience.filter(e => e.id !== id) });
    };

    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Work Experience</h3>
          <button className="btn btn-secondary btn-sm" onClick={addExperience}>
            <Plus size={14} /> Add Experience
          </button>
        </div>

        {resume.experience.length === 0 && (
          <div className="empty-state" style={{ padding: '40px' }}>
            <p className="text-sm text-tertiary">No experience added yet</p>
            <button className="btn btn-primary btn-sm mt-4" onClick={addExperience}><Plus size={14} /> Add Experience</button>
          </div>
        )}

        {resume.experience.map((exp, ei) => (
          <div key={exp.id} className="glass-card">
            <div className="flex items-center justify-between mb-4">
              <span className="badge badge-blue">Experience {ei + 1}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => removeExp(exp.id)} style={{ color: 'var(--accent-rose)' }}>
                <Trash2 size={14} />
              </button>
            </div>
            <div className="grid-2 mb-4" style={{ gap: 12 }}>
              <div className="input-group">
                <label className="input-label">Job Title <span>*</span></label>
                <input className="input-field" placeholder="Software Engineer" value={exp.jobTitle}
                  onChange={e => updateExp(exp.id, { jobTitle: e.target.value })} />
              </div>
              <div className="input-group">
                <label className="input-label">Company <span>*</span></label>
                <input className="input-field" placeholder="Company Inc." value={exp.company}
                  onChange={e => updateExp(exp.id, { company: e.target.value })} />
              </div>
              <div className="input-group">
                <label className="input-label">Start Date</label>
                <input className="input-field" type="month" value={exp.startDate}
                  onChange={e => updateExp(exp.id, { startDate: e.target.value })} />
              </div>
              <div className="input-group">
                <label className="input-label">End Date</label>
                <div className="flex items-center gap-3">
                  <input className="input-field" type="month" value={exp.endDate} disabled={exp.current}
                    onChange={e => updateExp(exp.id, { endDate: e.target.value })}
                    style={{ opacity: exp.current ? 0.5 : 1 }} />
                  <label className="flex items-center gap-2 text-xs text-secondary" style={{ whiteSpace: 'nowrap' }}>
                    <input type="checkbox" checked={exp.current}
                      onChange={e => updateExp(exp.id, { current: e.target.checked, endDate: '' })} />
                    Current
                  </label>
                </div>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Key Achievements & Responsibilities</label>
              {exp.bullets.map((bullet, bi) => (
                <div key={bi} className="flex items-center gap-2 mb-2">
                  <span className="text-tertiary text-xs" style={{ width: 16 }}>•</span>
                  <input
                    className="input-field"
                    placeholder="Led a team of 5 to deliver a project that increased revenue by 20%..."
                    value={bullet}
                    onChange={e => {
                      const newBullets = [...exp.bullets];
                      newBullets[bi] = e.target.value;
                      updateExp(exp.id, { bullets: newBullets });
                    }}
                    style={{ flex: 1 }}
                  />
                  {exp.bullets.length > 1 && (
                    <button className="btn btn-ghost btn-sm" onClick={() => {
                      updateExp(exp.id, { bullets: exp.bullets.filter((_, i) => i !== bi) });
                    }} style={{ color: 'var(--accent-rose)', padding: '4px' }}>
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              ))}
              <button className="btn btn-ghost btn-sm mt-1" onClick={() => {
                updateExp(exp.id, { bullets: [...exp.bullets, ''] });
              }}>
                <Plus size={12} /> Add Bullet
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderEducation = () => {
    const addEdu = () => {
      const newEdu: Education = { id: createId(), degree: '', institution: '', location: '', year: '' };
      update({ education: [...resume.education, newEdu] });
    };

    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Education</h3>
          <button className="btn btn-secondary btn-sm" onClick={addEdu}><Plus size={14} /> Add</button>
        </div>
        {resume.education.length === 0 && (
          <div className="empty-state" style={{ padding: '40px' }}>
            <p className="text-sm text-tertiary">No education added</p>
            <button className="btn btn-primary btn-sm mt-4" onClick={addEdu}><Plus size={14} /> Add Education</button>
          </div>
        )}
        {resume.education.map((edu, i) => (
          <div key={edu.id} className="glass-card">
            <div className="flex items-center justify-between mb-4">
              <span className="badge badge-violet">Education {i + 1}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => update({ education: resume.education.filter(e => e.id !== edu.id) })} style={{ color: 'var(--accent-rose)' }}>
                <Trash2 size={14} />
              </button>
            </div>
            <div className="grid-2" style={{ gap: 12 }}>
              <div className="input-group"><label className="input-label">Degree <span>*</span></label><input className="input-field" placeholder="Bachelor of Science in Computer Science" value={edu.degree} onChange={e => update({ education: resume.education.map(ed => ed.id === edu.id ? { ...ed, degree: e.target.value } : ed) })} /></div>
              <div className="input-group"><label className="input-label">Institution <span>*</span></label><input className="input-field" placeholder="University of California" value={edu.institution} onChange={e => update({ education: resume.education.map(ed => ed.id === edu.id ? { ...ed, institution: e.target.value } : ed) })} /></div>
              <div className="input-group"><label className="input-label">Year</label><input className="input-field" placeholder="2024" value={edu.year} onChange={e => update({ education: resume.education.map(ed => ed.id === edu.id ? { ...ed, year: e.target.value } : ed) })} /></div>
              <div className="input-group"><label className="input-label">GPA (optional)</label><input className="input-field" placeholder="3.8" value={edu.gpa || ''} onChange={e => update({ education: resume.education.map(ed => ed.id === edu.id ? { ...ed, gpa: e.target.value } : ed) })} /></div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderSkills = () => <SkillsStep resume={resume} update={update} />;
  const renderLanguages = () => <LanguagesStep resume={resume} update={update} />;

  const renderProjects = () => {
    const addProject = () => {
      const proj: Project = { id: createId(), name: '', description: '', technologies: [], results: '' };
      update({ projects: [...resume.projects, proj] });
    };

    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Projects</h3>
          <button className="btn btn-secondary btn-sm" onClick={addProject}><Plus size={14} /> Add</button>
        </div>
        {resume.projects.length === 0 && (
          <div className="empty-state" style={{ padding: '40px' }}>
            <p className="text-sm text-tertiary">Showcase your best work</p>
            <button className="btn btn-primary btn-sm mt-4" onClick={addProject}><Plus size={14} /> Add Project</button>
          </div>
        )}
        {resume.projects.map((proj, i) => (
          <div key={proj.id} className="glass-card">
            <div className="flex items-center justify-between mb-4">
              <span className="badge badge-emerald">Project {i + 1}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => update({ projects: resume.projects.filter(p => p.id !== proj.id) })} style={{ color: 'var(--accent-rose)' }}><Trash2 size={14} /></button>
            </div>
            <div className="grid-2 mb-3" style={{ gap: 12 }}>
              <div className="input-group"><label className="input-label">Project Name</label><input className="input-field" placeholder="My Awesome Project" value={proj.name} onChange={e => update({ projects: resume.projects.map(p => p.id === proj.id ? { ...p, name: e.target.value } : p) })} /></div>
              <div className="input-group"><label className="input-label">Technologies (comma-sep)</label><input className="input-field" placeholder="React, Node.js, AWS" value={proj.technologies.join(', ')} onChange={e => update({ projects: resume.projects.map(p => p.id === proj.id ? { ...p, technologies: e.target.value.split(',').map(t => t.trim()).filter(Boolean) } : p) })} /></div>
            </div>
            <div className="input-group mb-3"><label className="input-label">Description</label><textarea className="input-field" rows={2} placeholder="Brief description of the project..." value={proj.description} onChange={e => update({ projects: resume.projects.map(p => p.id === proj.id ? { ...p, description: e.target.value } : p) })} /></div>
            <div className="input-group"><label className="input-label">Results / Impact</label><input className="input-field" placeholder="Increased performance by 50%" value={proj.results} onChange={e => update({ projects: resume.projects.map(p => p.id === proj.id ? { ...p, results: e.target.value } : p) })} /></div>
          </div>
        ))}
      </div>
    );
  };

  const renderCertifications = () => {
    const addCert = () => {
      const cert: Certification = { id: createId(), name: '', issuer: '', date: '' };
      update({ certifications: [...resume.certifications, cert] });
    };

    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Certifications</h3>
          <button className="btn btn-secondary btn-sm" onClick={addCert}><Plus size={14} /> Add</button>
        </div>
        {resume.certifications.length === 0 && (
          <div className="empty-state" style={{ padding: '40px' }}>
            <p className="text-sm text-tertiary">Add your professional certifications</p>
            <button className="btn btn-primary btn-sm mt-4" onClick={addCert}><Plus size={14} /> Add Cert</button>
          </div>
        )}
        {resume.certifications.map((cert, i) => (
          <div key={cert.id} className="glass-card" style={{ padding: '16px 20px' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="badge badge-amber">Cert {i + 1}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => update({ certifications: resume.certifications.filter(c => c.id !== cert.id) })} style={{ color: 'var(--accent-rose)' }}><Trash2 size={14} /></button>
            </div>
            <div className="grid-2" style={{ gap: 10 }}>
              <div className="input-group"><label className="input-label">Name</label><input className="input-field" placeholder="Certification Name" value={cert.name}
                onChange={e => update({ certifications: resume.certifications.map(c => c.id === cert.id ? { ...c, name: e.target.value } : c) })} /></div>
              <div className="input-group"><label className="input-label">Issuer</label><input className="input-field" placeholder="Issuer" value={cert.issuer}
                onChange={e => update({ certifications: resume.certifications.map(c => c.id === cert.id ? { ...c, issuer: e.target.value } : c) })} /></div>
              <div className="input-group"><label className="input-label">Date</label><input className="input-field" type="month" value={cert.date}
                onChange={e => update({ certifications: resume.certifications.map(c => c.id === cert.id ? { ...c, date: e.target.value } : c) })} /></div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderFinalize = () => (
    <div className="flex flex-col gap-6">
      <h3 className="text-lg font-bold">Choose Template & Export</h3>

      {/* Resume Name */}
      <div className="input-group">
        <label className="input-label">Resume Name</label>
        <input className="input-field" value={resume.metadata.name}
          onChange={e => update({ metadata: { ...resume.metadata, name: e.target.value } })} />
      </div>

      {/* Template Grid */}
      <div>
        <label className="input-label mb-3">Resume Template ({TEMPLATE_KEYS.length} designs)</label>
        <div className="template-picker">
          {TEMPLATE_KEYS.map(key => {
            const info = TEMPLATE_INFO[key];
            const selected = resume.metadata.template === key;
            return (
              <button
                key={key}
                className={`template-card ${selected ? 'selected' : ''}`}
                onClick={() => update({ metadata: { ...resume.metadata, template: key } })}
                style={{ padding: '12px 10px' }}
              >
                <TemplateThumbnail layout={info.layout} accent={info.accent} width={86} height={112} />
                <div className="template-card-name text-sm">{info.name}</div>
                <div className="template-card-desc">{info.description}</div>
                {selected && (
                  <span className="badge badge-emerald" style={{ marginTop: 6 }}>
                    <Check size={10} /> Selected
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-tertiary mt-3">
          The template is applied to the live preview on the right, and to the PDF you export.
        </p>
      </div>

      {/* Export */}
      <div>
        <label className="input-label mb-3">Export Resume</label>
        <div className="flex gap-3">
          <button className="btn btn-primary" onClick={() => exportToPDF(resume).then(() => addToast('success', 'PDF exported!')).catch(() => addToast('error', 'Export failed'))}>
            <Download size={16} /> Export PDF
          </button>
          <button className="btn btn-secondary" onClick={() => { exportToTXT(resume); addToast('success', 'TXT exported!'); }}>
            <Download size={16} /> Export TXT
          </button>
          <button className="btn btn-ghost" onClick={() => { setPage('ats-checker'); }}>
            <Target size={16} /> Check ATS Score
          </button>
        </div>
      </div>
    </div>
  );

  const stepContent = [renderPersonalInfo, renderSummary, renderExperience, renderEducation, renderSkills, renderProjects, renderCertifications, renderLanguages, renderFinalize];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
      {/* Progress Steps */}
      <div className="step-rail" role="tablist" aria-label="Resume sections">
        {STEPS.map((s, i) => {
          const state = step === i ? 'active' : i < step ? 'done' : 'todo';
          return (
            <div key={i} className="step-item">
              <button
                type="button"
                role="tab"
                aria-selected={step === i}
                aria-label={`${s.label} (step ${i + 1} of ${STEPS.length})`}
                className={`step-chip ${state}`}
                onClick={() => setStep(i)}
              >
                <span className="step-chip-icon">{i < step ? <Check size={14} /> : s.icon}</span>
                <span className="step-chip-label">{s.label}</span>
              </button>
              {i < STEPS.length - 1 && <span className="step-link" aria-hidden="true" />}
            </div>
          );
        })}
      </div>

      {/* Main Content */}
      <div className="builder-split" style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
        {/* Left: Form */}
        <div style={{ flex: '1 1 50%', minWidth: 0 }}>
          <div className="glass-card">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {stepContent[step]()}
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8" style={{ borderTop: '1px solid var(--border-primary)', paddingTop: '1.5rem' }}>
              <button className="btn btn-ghost" disabled={step === 0} onClick={() => setStep(s => s - 1)}>
                <ChevronLeft size={16} /> Back
              </button>
              <span className="text-xs text-muted">Step {step + 1} of {STEPS.length}</span>
              <button className="btn btn-primary" disabled={step === STEPS.length - 1} onClick={() => setStep(s => s + 1)}>
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Live Preview */}
        <div className="builder-preview-panel" style={{ flex: '1 1 50%', minWidth: 0 }}>
          <div style={{ marginBottom: 12 }}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-secondary">Live Preview</span>
              <span className="badge badge-blue">{TEMPLATE_INFO[resume.metadata.template]?.name || 'Modern'}</span>
            </div>
          </div>
          <div style={{ maxHeight: 'calc(100vh - 160px)', overflow: 'auto', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-xl)' }}>
            <ResumePreview resume={resume} />
          </div>
          {!TEMPLATE_INFO[resume.metadata.template]?.atsSafe && (
            <p className="text-xs mt-3" style={{ color: 'var(--color-warning)' }}>
              This template puts skills in a side rail. Looks great, but older ATS parsers can skip a rail — export the compact or corporate version for a strict employer.
            </p>
          )}
          <p className="text-xs text-tertiary mt-3">
            {resume.experience.flatMap(e => e.bullets).filter(b => b.trim() && /(\d|%|\$)/.test(b)).length}
            {' of '}
            {resume.experience.flatMap(e => e.bullets).filter(b => b.trim()).length}
            {' experience bullets contain a measurable number.'}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
