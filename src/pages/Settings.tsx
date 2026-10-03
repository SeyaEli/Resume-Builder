import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Globe, Palette, Save, Trash2, Download, Database, Bot, Plug, Check, Loader2, AlertTriangle,
  Sun, Moon, Monitor
} from 'lucide-react';
import { useResumeStore } from '../stores/resumeStore';
import { TEMPLATE_INFO } from '../types/resume';
import type { TemplateType, ThemeMode, SurfaceStyle } from '../types/resume';
import TemplateThumbnail from '../components/TemplateThumbnail';
import { getAiConfig, saveAiConfig, testConnection } from '../services/aiService';
import type { AiConfig } from '../services/aiService';
import { PALETTES, SURFACES, paletteSwatch, resolveMode } from '../services/themeService';

const TEMPLATE_KEYS = Object.keys(TEMPLATE_INFO) as TemplateType[];

const THEME_MODES: { mode: ThemeMode; title: string; desc: string; icon: React.ReactNode }[] = [
  { mode: 'light', title: 'Light', desc: 'Bright background, dark text', icon: <Sun size={16} /> },
  { mode: 'dark', title: 'Dark', desc: 'Easy on the eyes at night', icon: <Moon size={16} /> },
  { mode: 'system', title: 'Match my device', desc: 'Follows your phone or PC setting', icon: <Monitor size={16} /> },
];

const SURFACE_STYLES: { id: SurfaceStyle; name: string; desc: string }[] = SURFACES.map(s => ({
  id: s.id,
  name: s.name,
  desc: s.hint,
}));

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
  const [ai, setAi] = useState<AiConfig>(() => getAiConfig());
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => { saveAiConfig(ai); }, [ai]);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    const result = await testConnection(ai);
    setTestResult(result);
    setTesting(false);
  };

  const updatePref = (key: string, value: string | boolean) => {
    useResumeStore.setState({
      preferences: { ...preferences, [key]: value },
    });
  };

  const resolvedMode = resolveMode(preferences.theme);

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

      <div className="settings-col">
        {/* Appearance: colour mode + accent palette */}
        <motion.div className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div className="flex items-center gap-3 mb-4">
            <Sun size={20} style={{ color: 'var(--accent-primary)' }} />
            <div>
              <h3 className="font-semibold">Appearance</h3>
              <p className="text-xs text-muted">Pick a light or dark look, then your accent colour</p>
            </div>
          </div>

          <div className="input-label" style={{ marginBottom: 'var(--space-2)' }}>Colour mode</div>
          <div className="mode-options">
            {THEME_MODES.map(option => (
              <button
                key={option.mode}
                className={`mode-option ${preferences.theme === option.mode ? 'active' : ''}`}
                onClick={() => updatePref('theme', option.mode)}
              >
                <div className="mode-option-top">
                  {option.icon}
                  <span className="text-sm font-semibold">{option.title}</span>
                  {preferences.theme === option.mode && <Check size={14} style={{ marginLeft: 'auto', color: 'var(--accent-primary)' }} />}
                </div>
                <p className="text-xs text-muted">{option.desc}</p>
              </button>
            ))}
          </div>

          <div className="input-label" style={{ margin: 'var(--space-5) 0 var(--space-2)' }}>Accent colour</div>
          <div className="palette-grid">
            {PALETTES.map(p => (
              <button
                key={p.id}
                className={`palette-option ${preferences.palette === p.id ? 'active' : ''}`}
                onClick={() => updatePref('palette', p.id)}
                title={p.hint}
              >
                <span
                  className="palette-swatch"
                  style={{ background: paletteSwatch(p.id, resolvedMode) }}
                >
                  {preferences.palette === p.id && <Check size={16} />}
                </span>
                <span className="palette-meta">
                  <span className="palette-name">{p.name}</span>
                  <span className="palette-hint">{p.hint}</span>
                </span>
              </button>
            ))}
          </div>


          <div className="input-label" style={{ margin: 'var(--space-5) 0 var(--space-2)' }}>Panel style</div>
          <div className="surface-grid">
            {SURFACE_STYLES.map(style => (
              <button
                key={style.id}
                className={`surface-option ${preferences.surface === style.id ? 'active' : ''}`}
                onClick={() => updatePref('surface', style.id)}
                title={style.desc}
              >
                <span className="surface-option-top">
                  <span className={`surface-chip surface-chip-${style.id}`} />
                  <span className="surface-name">{style.name}</span>
                  {preferences.surface === style.id && <Check size={14} style={{ marginLeft: 'auto', color: 'var(--accent-primary)' }} />}
                </span>
                <span className="surface-hint">{style.desc}</span>
              </button>
            ))}
          </div>
          {/* Tiny mock of the app, drawn with the live theme variables */}
          <div className="theme-preview" aria-hidden="true">
            <div className="theme-preview-bar">
              <span className="theme-preview-dot" />
              <span className="theme-preview-dot" />
              <span className="theme-preview-dot" />
              <span className="text-xs text-muted" style={{ marginLeft: 'auto' }}>Live preview</span>
            </div>
            <div className="theme-preview-body">
              <div className="theme-preview-side">
                <div className="theme-preview-line on" style={{ width: '70%' }} />
                <div className="theme-preview-line" style={{ width: '88%' }} />
                <div className="theme-preview-line" style={{ width: '60%' }} />
                <div className="theme-preview-line" style={{ width: '78%' }} />
              </div>
              <div className="theme-preview-main">
                <div className="theme-preview-card">
                  <div className="theme-preview-line on" style={{ width: '38%' }} />
                  <div className="theme-preview-line" style={{ width: '82%' }} />
                  <div className="theme-preview-actions">
                    <div className="theme-preview-btn" />
                    <div className="theme-preview-btn ghost" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

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

        {/* AI Provider */}
        <motion.div className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className="flex items-center gap-3 mb-4">
            <Bot size={20} style={{ color: 'var(--accent-primary)' }} />
            <div>
              <h3 className="font-semibold">AI Engine</h3>
              <p className="text-xs text-muted">Choose what writes your summaries, bullets and advice</p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {[
              {
                key: 'builtin' as const,
                title: 'Built-in engine',
                desc: 'Runs inside this browser. Reads your resume and the job posting, needs no key, costs nothing, and works offline.',
              },
              {
                key: 'connected' as const,
                title: 'My own model',
                desc: 'Send the same requests to an OpenAI-compatible endpoint you control. If it fails, the built-in engine answers instead.',
              },
            ].map(option => (
              <button
                key={option.key}
                onClick={() => setAi({ ...ai, provider: option.key })}
                className="glass-card"
                style={{
                  textAlign: 'left',
                  borderColor: ai.provider === option.key ? 'var(--accent-primary)' : 'var(--border-primary)',
                  background: ai.provider === option.key ? 'var(--accent-subtle)' : 'var(--bg-card)',
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  {ai.provider === option.key
                    ? <Check size={16} style={{ color: 'var(--accent-primary)' }} />
                    : <div style={{ width: 16, height: 16, borderRadius: '50%', border: '1px solid var(--border-secondary)' }} />}
                  <span className="font-semibold text-sm">{option.title}</span>
                </div>
                <p className="text-xs text-muted">{option.desc}</p>
              </button>
            ))}
          </div>

          {ai.provider === 'connected' && (
            <div className="flex flex-col gap-3 mt-5">
              <div className="input-group">
                <label className="input-label"><Plug size={12} /> Endpoint URL</label>
                <input
                  className="input-field"
                  placeholder="https://your-endpoint/v1"
                  value={ai.baseUrl}
                  onChange={e => setAi({ ...ai, baseUrl: e.target.value })}
                />
              </div>
              <div className="input-group">
                <label className="input-label">Model name</label>
                <input
                  className="input-field"
                  placeholder="the model your endpoint serves"
                  value={ai.model}
                  onChange={e => setAi({ ...ai, model: e.target.value })}
                />
              </div>
              <div className="input-group">
                <label className="input-label">API key</label>
                <input
                  className="input-field"
                  type="password"
                  placeholder="sk-..."
                  value={ai.apiKey}
                  onChange={e => setAi({ ...ai, apiKey: e.target.value })}
                />
                <p className="text-xs text-muted mt-2">
                  Stored only in this browser and sent straight to your endpoint. Anyone using this computer can read it, so use a key you can revoke.
                </p>
              </div>

              <button className="btn btn-secondary" onClick={handleTest} disabled={testing} style={{ width: 'fit-content' }}>
                {testing ? <><Loader2 size={16} className="spin" /> Testing...</> : <><Plug size={16} /> Test connection</>}
              </button>

              {testResult && (
                <div className="flex items-start gap-2 text-xs" style={{ color: testResult.ok ? 'var(--color-success)' : 'var(--color-warning)' }}>
                  {testResult.ok ? <Check size={14} /> : <AlertTriangle size={14} />}
                  <span>{testResult.message}</span>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Default Template */}
        <motion.div className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center gap-3 mb-4">
            <Palette size={20} style={{ color: 'var(--accent-primary)' }} />
            <div>
              <h3 className="font-semibold">Default Template</h3>
              <p className="text-xs text-muted">Used for every new resume — {TEMPLATE_KEYS.length} designs available</p>
            </div>
          </div>
          <div className="template-picker">
            {TEMPLATE_KEYS.map(key => {
              const info = TEMPLATE_INFO[key];
              const selected = preferences.defaultTemplate === key;
              return (
                <button
                  key={key}
                  className={`template-card ${selected ? 'selected' : ''}`}
                  onClick={() => updatePref('defaultTemplate', key)}
                  style={{ padding: '12px 10px' }}
                >
                  <TemplateThumbnail layout={info.layout} accent={info.accent} width={80} height={104} />
                  <div className="template-card-name text-sm">{info.name}</div>
                  {selected && <span className="badge badge-emerald" style={{ marginTop: 4 }}><Check size={10} /> Default</span>}
                </button>
              );
            })}
          </div>
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
                  background: preferences.autoSave ? 'var(--text-on-accent)' : 'var(--text-muted)', borderRadius: '50%', transition: 'all 0.2s',
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
