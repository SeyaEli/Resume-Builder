import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, FileText, Target, Sparkles, FileEdit,
  Briefcase, Link2, MessageSquare, Settings, Menu, X,
  CheckCircle2, Sun, Moon, Monitor, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useResumeStore } from './stores/resumeStore';
import type { AppPage, ThemeMode } from './types/resume';
import { applyTheme, resolveMode, watchSystemTheme } from './services/themeService';
import Logo from './components/Logo';
import PrivacyNotice from './components/PrivacyNotice';
import './styles/globals.css';

// Pages
import Dashboard from './pages/Dashboard';
import ResumeBuilder from './pages/ResumeBuilder';
import ATSChecker from './pages/ATSChecker';
import Optimizer from './pages/Optimizer';
import CoverLetter from './pages/CoverLetter';
import JobMatch from './pages/JobMatch';
import LinkedInOptimizer from './pages/LinkedIn';
import CareerCoach from './pages/CareerCoach';
import SettingsPage from './pages/Settings';

const SIDEBAR_KEY = 'resume-ai-sidebar-collapsed';

interface NavItem {
  page: AppPage;
  label: string;
  icon: React.ReactNode;
  badge?: string;
}

const NAV_MAIN: NavItem[] = [
  { page: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { page: 'builder', label: 'Resume Builder', icon: <FileText size={20} /> },
  { page: 'ats-checker', label: 'ATS Checker', icon: <Target size={20} /> },
  { page: 'optimizer', label: 'AI Optimizer', icon: <Sparkles size={20} />, badge: 'AI' },
];

const NAV_TOOLS: NavItem[] = [
  { page: 'cover-letter', label: 'Cover Letter', icon: <FileEdit size={20} /> },
  { page: 'job-match', label: 'Job Match', icon: <Briefcase size={20} /> },
  { page: 'linkedin', label: 'LinkedIn', icon: <Link2 size={20} /> },
  { page: 'career-coach', label: 'Career Coach', icon: <MessageSquare size={20} />, badge: 'AI' },
];

const PAGE_TITLES: Record<AppPage, string> = {
  dashboard: 'Dashboard',
  builder: 'Resume Builder',
  'ats-checker': 'ATS Checker',
  optimizer: 'AI Optimizer',
  'cover-letter': 'Cover Letter',
  'job-match': 'Job Match',
  linkedin: 'LinkedIn Optimizer',
  'career-coach': 'AI Career Coach',
  settings: 'Settings',
};

const THEME_OPTIONS: { mode: ThemeMode; label: string; icon: React.ReactNode }[] = [
  { mode: 'light', label: 'Light', icon: <Sun size={15} /> },
  { mode: 'dark', label: 'Dark', icon: <Moon size={15} /> },
  { mode: 'system', label: 'Match my device', icon: <Monitor size={15} /> },
];

function PageContent({ page }: { page: AppPage }) {
  switch (page) {
    case 'dashboard': return <Dashboard />;
    case 'builder': return <ResumeBuilder />;
    case 'ats-checker': return <ATSChecker />;
    case 'optimizer': return <Optimizer />;
    case 'cover-letter': return <CoverLetter />;
    case 'job-match': return <JobMatch />;
    case 'linkedin': return <LinkedInOptimizer />;
    case 'career-coach': return <CareerCoach />;
    case 'settings': return <SettingsPage />;
    default: return <Dashboard />;
  }
}

export default function App() {
  const { currentPage, setPage, sidebarOpen, toggleSidebar, toasts, removeToast, preferences } = useResumeStore();

  const { theme, palette } = preferences;

  // Collapsed rail is a desktop preference, remembered between visits.
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return window.localStorage.getItem(SIDEBAR_KEY) === '1';
    } catch {
      return false;
    }
  });

  const toggleCollapsed = () => {
    setCollapsed(prev => {
      const next = !prev;
      try {
        window.localStorage.setItem(SIDEBAR_KEY, next ? '1' : '0');
      } catch {
        // Private mode or full storage: the rail still collapses for this visit.
      }
      return next;
    });
  };

  const setTheme = (mode: ThemeMode) => {
    useResumeStore.setState({ preferences: { ...preferences, theme: mode } });
  };

  // Paint the chosen mode + palette. On 'system' we keep listening, so the
  // app switches the moment the device does.
  useEffect(() => {
    const paint = () => applyTheme(resolveMode(theme), palette);
    paint();
    return theme === 'system' ? watchSystemTheme(paint) : undefined;
  }, [theme, palette]);

  // Close sidebar on mobile when page changes
  useEffect(() => {
    if (window.innerWidth < 768) {
      useResumeStore.setState({ sidebarOpen: false });
    }
  }, [currentPage]);

  return (
    <div className="app-layout">
      {/* Privacy notice — shown on every visit, before anything else */}
      <PrivacyNotice />

      {/* Sidebar */}
      <aside className={`app-sidebar ${sidebarOpen ? 'mobile-open' : ''} ${collapsed ? 'collapsed' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <Logo size={36} />
          <button
            className="sidebar-collapse-btn"
            onClick={toggleCollapsed}
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
          >
            <ChevronLeft size={16} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Main</div>
          {NAV_MAIN.map(item => (
            <button
              key={item.page}
              className={`sidebar-item ${currentPage === item.page ? 'active' : ''}`}
              onClick={() => setPage(item.page)}
              title={item.label}
            >
              <span className="sidebar-item-icon">{item.icon}</span>
              <span className="sidebar-item-text">{item.label}</span>
              {item.badge && <span className="sidebar-badge">{item.badge}</span>}
            </button>
          ))}

          <div className="sidebar-section-label">Tools</div>
          {NAV_TOOLS.map(item => (
            <button
              key={item.page}
              className={`sidebar-item ${currentPage === item.page ? 'active' : ''}`}
              onClick={() => setPage(item.page)}
              title={item.label}
            >
              <span className="sidebar-item-icon">{item.icon}</span>
              <span className="sidebar-item-text">{item.label}</span>
              {item.badge && <span className="sidebar-badge">{item.badge}</span>}
            </button>
          ))}

          <div className="sidebar-section-label">Account</div>
          <button
            className={`sidebar-item ${currentPage === 'settings' ? 'active' : ''}`}
            onClick={() => setPage('settings')}
            title="Settings"
          >
            <span className="sidebar-item-icon"><Settings size={20} /></span>
            <span className="sidebar-item-text">Settings</span>
          </button>
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">JD</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">Job Seeker</div>
              <div className="sidebar-user-plan">Free Plan</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={toggleSidebar}
      />

      {/* Main Content */}
      <main className={`app-main ${collapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Header */}
        <header className="app-header">
          <button
            className="btn btn-icon btn-ghost mobile-menu-btn"
            onClick={toggleSidebar}
            aria-label="Toggle menu"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {collapsed && (
            <button
              className="btn btn-icon btn-ghost"
              onClick={toggleCollapsed}
              aria-label="Expand sidebar"
              title="Expand sidebar"
              style={{ marginRight: 'var(--space-3)' }}
            >
              <ChevronRight size={18} />
            </button>
          )}

          <h2 className="header-title">{PAGE_TITLES[currentPage]}</h2>

          <div className="header-actions">
            <div className="theme-quick" role="group" aria-label="Colour mode">
              {THEME_OPTIONS.map(option => (
                <button
                  key={option.mode}
                  className={`theme-quick-btn ${theme === option.mode ? 'active' : ''}`}
                  onClick={() => setTheme(option.mode)}
                  aria-label={option.label}
                  aria-pressed={theme === option.mode}
                  title={option.label}
                >
                  {option.icon}
                </button>
              ))}
            </div>

            <button className="btn btn-primary btn-sm" onClick={() => setPage('builder')}>
              <FileText size={14} /> <span className="hide-mobile">New Resume</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="app-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              <PageContent page={currentPage} />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Toast Notifications */}
      <div className="toast-container">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              className={`toast ${toast.type}`}
              initial={{ opacity: 0, x: 50, y: -10 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ type: 'spring', damping: 20 }}
              onClick={() => removeToast(toast.id)}
              style={{ cursor: 'pointer' }}
            >
              <CheckCircle2 size={18} style={{
                color: toast.type === 'success' ? 'var(--color-success)' :
                  toast.type === 'error' ? 'var(--color-danger)' :
                    toast.type === 'warning' ? 'var(--color-warning)' : 'var(--color-info)',
                flexShrink: 0,
              }} />
              <span className="text-sm">{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
