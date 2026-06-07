import { motion } from 'framer-motion';
import { Globe, Palette, Save, Trash2, Download, Database } from 'lucide-react';
import { useResumeStore } from '../stores/resumeStore';
import type { TemplateType } from '../types/resume';

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'ar', name: 'العربية' },
  { code: 'fil', name: 'Filipino' },
  { code: 'hi', name: 'हिन्दी' },
  { code: 'zh', name: '中文' },
];

export default function Settings() {
  const { preferences, resumes, coverLetters, chatMessages, addToast } = useResumeStore();

  const updatePref = (key: string, value: string | boolean) => {
    useResumeStore.setState({
      preferences: { ...preferences, [key]: value },
    });
  };

  const handleExportData = () => {
    const data = {
      resumes,
      coverLetters,
      chatMessages,
      preferences,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ats-platform-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('success', 'Data exported successfully!');
  };

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      localStorage.removeItem('ats-resume-platform');
      window.location.reload();
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
      <div className="section-header">
        <div>
          <h1 className="section-title">Settings</h1>
          <p className="section-subtitle">Customize your experience</p>
        </div>
      </div>

      <div style={{ maxWidth: 700, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Language */}
        <motion.div className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="flex items-center gap-3 mb-4">
            <Globe size={20} style={{ color: 'var(--accent-primary)' }} />
            <div>
              <h3 className="font-semibold">Language</h3>
              <p className="text-xs text-muted">Choose your preferred language</p>
            </div>
          </div>
          <select className="input-field" value={preferences.language} onChange={e => updatePref('language', e.target.value)}>
            {LANGUAGES.map(l => (
              <option key={l.code} value={l.code}>{l.name}</option>
            ))}
          </select>
        </motion.div>

        {/* Default Template */}
        <motion.div className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center gap-3 mb-4">
            <Palette size={20} style={{ color: 'var(--accent-primary)' }} />
            <div>
              <h3 className="font-semibold">Default Template</h3>
              <p className="text-xs text-muted">Default template for new resumes</p>
            </div>
          </div>
          <select className="input-field" value={preferences.defaultTemplate} onChange={e => updatePref('defaultTemplate', e.target.value as TemplateType)}>
            <option value="modern">Modern</option>
            <option value="corporate">Corporate</option>
            <option value="executive">Executive</option>
            <option value="technical">Technical</option>
            <option value="graduate">Graduate</option>
            <option value="creative">Creative ATS-Safe</option>
            <option value="government">Government</option>
            <option value="academic">Academic</option>
          </select>
        </motion.div>

        {/* Auto Save */}
        <motion.div className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Save size={20} style={{ color: 'var(--color-success)' }} />
              <div>
                <h3 className="font-semibold">Auto-Save</h3>
                <p className="text-xs text-muted">Automatically save changes as you type</p>
              </div>
            </div>
            <label style={{ position: 'relative', display: 'inline-block', width: 48, height: 26 }}>
              <input type="checkbox" checked={preferences.autoSave} onChange={e => updatePref('autoSave', e.target.checked)}
                style={{ opacity: 0, width: 0, height: 0 }} />
              <span style={{
                position: 'absolute', cursor: 'pointer', inset: 0,
                background: preferences.autoSave ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                borderRadius: 13, transition: 'all 0.2s',
                border: '1px solid var(--border-primary)',
              }}>
                <span style={{
                  position: 'absolute', width: 18, height: 18, left: preferences.autoSave ? 26 : 3, top: 3,
                  background: preferences.autoSave ? 'var(--bg-primary)' : 'var(--text-muted)', borderRadius: '50%', transition: 'all 0.2s',
                }} />
              </span>
            </label>
          </div>
        </motion.div>

        {/* Data Summary */}
        <motion.div className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <div className="flex items-center gap-3 mb-4">
            <Database size={20} style={{ color: 'var(--accent-primary)' }} />
            <div>
              <h3 className="font-semibold">Your Data</h3>
              <p className="text-xs text-muted">All data is stored locally in your browser</p>
            </div>
          </div>
          <div className="grid-3" style={{ gap: 12 }}>
            <div style={{ padding: '12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <div className="text-2xl font-black text-accent">{resumes.length}</div>
              <div className="text-xs text-muted">Resumes</div>
            </div>
            <div style={{ padding: '12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <div className="text-2xl font-black" style={{ color: 'var(--accent-primary)' }}>{coverLetters.length}</div>
              <div className="text-xs text-muted">Cover Letters</div>
            </div>
            <div style={{ padding: '12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <div className="text-2xl font-black text-emerald">{chatMessages.length}</div>
              <div className="text-xs text-muted">Chat Messages</div>
            </div>
          </div>
        </motion.div>

        {/* Export / Clear */}
        <motion.div className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <h3 className="font-semibold mb-4">Data Management</h3>
          <div className="flex gap-3">
            <button className="btn btn-secondary" onClick={handleExportData}>
              <Download size={16} /> Export All Data
            </button>
            <button className="btn btn-danger" onClick={handleClearData}>
              <Trash2 size={16} /> Clear All Data
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
