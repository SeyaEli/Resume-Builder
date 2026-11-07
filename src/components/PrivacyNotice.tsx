import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, HardDrive, Wifi, Trash2, X } from 'lucide-react';
import Logo from './Logo';

const STORAGE_KEY_NOTE = 'Browser storage used by this app';

export default function PrivacyNotice() {
  // Always true on a fresh page load: nothing is written to storage to
  // suppress this, so reloading or revisiting shows it again.
  const [open, setOpen] = useState(true);
  const [showDetail, setShowDetail] = useState(false);
  const primaryRef = useRef<HTMLButtonElement | null>(null);

  // Lock the page behind the dialog and let Escape close it.
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);

    // Move focus into the dialog so keyboard users land on the button.
    const focusTimer = window.setTimeout(() => primaryRef.current?.focus(), 60);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
      window.clearTimeout(focusTimer);
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="notice-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="privacy-notice-title"
          aria-describedby="privacy-notice-body"
          // Clicking the dimmed background also dismisses it.
          onClick={() => setOpen(false)}
        >
          <motion.div
            className="notice-card"
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: 'spring', damping: 24, stiffness: 320 }}
            onClick={event => event.stopPropagation()}
          >
            <button
              className="notice-close"
              onClick={() => setOpen(false)}
              aria-label="Close privacy notice"
              title="Close"
            >
              <X size={18} />
            </button>

            <div className="notice-head">
              <Logo size={44} />
              <div className="notice-head-text">
                <h2 className="notice-title" id="privacy-notice-title">
                  Your data stays on your device
                </h2>
                <p className="notice-sub">Please read this before you start</p>
              </div>
            </div>

            <div className="notice-body" id="privacy-notice-body">
              <p className="notice-lead">
                This resume builder has <strong>no server, no database and no account</strong>.
                Everything you type is saved only in this browser, on this device.
              </p>

              <ul className="notice-list">
                <li>
                  <HardDrive size={17} aria-hidden="true" />
                  <span>
                    Your <strong>resumes, cover letters, chat history and settings</strong> are
                    kept in your browser's local storage. Using Groq AI sends the relevant resume text and your request through this app's server to Groq.
                  </span>
                </li>
                <li>
                  <Wifi size={17} aria-hidden="true" />
                  <span>
                    This site is <strong>accessed over the internet, so you need a connection to
                    open it</strong>. Your resume is saved in your browser; optional Groq AI needs an internet connection.
                  </span>
                </li>
                <li>
                  <ShieldCheck size={17} aria-hidden="true" />
                  <span>
                    The built-in writing help <strong>runs on your own device</strong>. If you
                    choose Groq AI in Settings, relevant text is sent through the app server to Groq. The Groq API key stays on the server. The app access password is held in memory for this visit only.
                  </span>
                </li>
                <li>
                  <Trash2 size={17} aria-hidden="true" />
                  <span>
                    Clearing your browser data, or using <strong>Settings → Clear All Data</strong>,
                    erases everything permanently. We cannot recover it, because we never had it.
                  </span>
                </li>
              </ul>

              <button
                className="notice-more"
                onClick={() => setShowDetail(value => !value)}
                aria-expanded={showDetail}
              >
                {showDetail ? 'Hide technical detail' : 'What exactly is stored?'}
              </button>

              <AnimatePresence initial={false}>
                {showDetail && (
                  <motion.div
                    className="notice-detail"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.22 }}
                  >
                    <p className="notice-detail-title">{STORAGE_KEY_NOTE}</p>
                    <dl className="notice-detail-grid">
                      <dt>ats-resume-platform</dt>
                      <dd>Your resumes, cover letters, chat messages and preferences.</dd>
                      <dt>ats-resume-platform-ai</dt>
                      <dd>Your AI engine choice and model only. Legacy browser-stored API keys are removed when the app opens.</dd>
                      <dt>resume-ai-sidebar-collapsed</dt>
                      <dd>Whether the sidebar is collapsed.</dd>
                    </dl>
                    <p className="notice-detail-foot">
                      These are browser storage keys, not cookies sent to a server. Your device's
                      settings can erase them at any time.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              <p className="notice-foot">
                This notice appears every time you open the site — it is not remembered.
              </p>
            </div>

            <div className="notice-actions">
              <button
                className="btn btn-primary notice-accept"
                onClick={() => setOpen(false)}
                ref={primaryRef}
              >
                <ShieldCheck size={16} /> I understand
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
