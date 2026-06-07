import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, FileText, Target, Sparkles, FileEdit,
  Briefcase, Link2, MessageSquare, Settings, Menu, X,
  CheckCircle2
} from 'lucide-react';
import { useResumeStore } from './stores/resumeStore';
import type { AppPage } from './types/resume';
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
  const { currentPage, setPage, sidebarOpen, toggleSidebar, toasts, removeToast } = useResumeStore();

  // Close sidebar on mobile when page changes
  useEffect(() => {
    if (window.innerWidth < 768) {
      useResumeStore.setState({ sidebarOpen: false });
    }
  }, [currentPage]);

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className={`app-sidebar ${sidebarOpen ? 'mobile-open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">R</div>
          <span className="sidebar-logo-text">ResumeAI Pro</span>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Main</div>
          {NAV_MAIN.map(item => (
            <button
              key={item.page}
              className={`sidebar-item ${currentPage === item.page ? 'active' : ''}`}
              onClick={() => setPage(item.page)}
            >
              <span className="sidebar-item-icon">{item.icon}</span>
              {item.label}
              {item.badge && <span className="sidebar-badge">{item.badge}</span>}
            </button>
          ))}

          <div className="sidebar-section-label">Tools</div>
          {NAV_TOOLS.map(item => (
            <button
              key={item.page}
              className={`sidebar-item ${currentPage === item.page ? 'active' : ''}`}
              onClick={() => setPage(item.page)}
            >
              <span className="sidebar-item-icon">{item.icon}</span>
              {item.label}
              {item.badge && <span className="sidebar-badge">{item.badge}</span>}
            </button>
          ))}

          <div className="sidebar-section-label">Account</div>
          <button
            className={`sidebar-item ${currentPage === 'settings' ? 'active' : ''}`}
            onClick={() => setPage('settings')}
          >
            <span className="sidebar-item-icon"><Settings size={20} /></span>
            Settings
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

      {/* Main Content */}
      <main className="app-main">
        {/* Header */}
        <header className="app-header">
          <button
            className="btn btn-icon btn-ghost"
            onClick={toggleSidebar}
            style={{ marginRight: '1rem', display: 'none' }}
            id="mobile-menu-btn"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <h2 className="header-title">{PAGE_TITLES[currentPage]}</h2>
          <div className="header-actions">
            <button className="btn btn-primary btn-sm" onClick={() => setPage('builder')}>
              <FileText size={14} /> New Resume
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

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="mobile-overlay"
          onClick={toggleSidebar}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            zIndex: 90, display: 'none',
          }}
        />
      )}

      <style>{`
        @media (max-width: 768px) {
          #mobile-menu-btn { display: flex !important; }
          .mobile-overlay { display: block !important; }
        }
      `}</style>
    </div>
  );
}
