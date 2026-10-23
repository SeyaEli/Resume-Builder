import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileUp, X, Loader2, FileText, AlertTriangle, CheckCircle2,
  ShieldCheck, ArrowRight, Briefcase, GraduationCap, Wrench,
} from 'lucide-react';
import { useResumeStore } from '../stores/resumeStore';
import { importResumeFromPdf, PdfImportError } from '../services/pdfImport';
import type { PdfImportResult } from '../services/pdfImport';

type Stage = 'pick' | 'reading' | 'review' | 'failed';

interface Props {
  open: boolean;
  onClose: () => void;
}

/**
 * Upload a resume as a PDF and open it in the Resume Builder for editing.
 *
 * PDF only, on purpose: it is the one format every job board produces and the
 * one this reader can pull text out of. The file is read inside the browser -
 * it is never uploaded to a server, because this app has no server.
 */
export default function PdfImportDialog({ open, onClose }: Props) {
  const { addResume, setPage, addToast } = useResumeStore();

  const [stage, setStage] = useState<Stage>('pick');
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const [errorDetail, setErrorDetail] = useState('');
  const [result, setResult] = useState<PdfImportResult | null>(null);
  const [fileName, setFileName] = useState('');

  const inputRef = useRef<HTMLInputElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);

  // Reset each time the dialog opens, so a second import starts clean.
  useEffect(() => {
    if (open) {
      setStage('pick');
      setError('');
      setErrorDetail('');
      setResult(null);
      setFileName('');
      setDragging(false);
      const timer = window.setTimeout(() => closeRef.current?.focus(), 60);
      return () => window.clearTimeout(timer);
    }
  }, [open]);

  // Lock the page behind the dialog and let Escape close it.
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;

    // 20 MB ceiling, checked before reading a single byte.
    const MAX_PDF_BYTES = 20 * 1024 * 1024;
    if (file.size > MAX_PDF_BYTES) {
      setFileName(file.name);
      setError(
        `"${file.name}" is ${(file.size / (1024 * 1024)).toFixed(1)} MB — the limit is 20 MB. Try a smaller PDF (re-export it, or compress it first), then upload again.`,
      );
      setStage('failed');
      return;
    }

    // Check the type before reading a single byte.
    if (!(file.type === 'application/pdf' || /\.pdf$/i.test(file.name))) {
      setFileName(file.name);
      setError(
        `"${file.name}" is not a PDF. Only PDF files can be imported — open your resume, choose "Save as PDF" (or "Export as PDF"), then upload that file.`,
      );
      setStage('failed');
      return;
    }

    setFileName(file.name);
    setError('');
    setErrorDetail('');
    setResult(null);
    setStage('reading');

    try {
      const imported = await importResumeFromPdf(file);
      setResult(imported);
      setStage('review');
    } catch (caught) {
      setError(
        caught instanceof PdfImportError
          ? caught.message
          : 'Something went wrong while reading that PDF. Try a different file.',
      );
      const detail = caught instanceof PdfImportError ? caught.details : undefined;
      setErrorDetail(
        detail
          ? `Reader saw ${detail.pages} page${detail.pages === 1 ? '' : 's'}, ${detail.rawItems} text pieces, ${detail.rawChars} characters.`
          : '',
      );
      setStage('failed');
    }
  };

  const confirmImport = () => {
    if (!result) return;
    addResume(result.resume);
    setPage('builder');
    addToast(
      'success',
      result.stats.sections.length
        ? `Imported ${result.stats.sections.length} sections. Check each step, then edit.`
        : 'Imported. Fill in the steps, then edit.',
    );
    onClose();
  };

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    handleFile(event.dataTransfer.files?.[0]);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="pdf-import-title"
          onClick={onClose}
        >
          <motion.div
            className="modal-content"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            onClick={event => event.stopPropagation()}
            style={{ maxWidth: 620 }}
          >
            <div className="modal-header">
              <div className="flex items-center gap-3">
                <div className="import-dialog-icon">
                  <FileUp size={20} />
                </div>
                <div>
                  <h3 className="modal-title" id="pdf-import-title">Upload a resume</h3>
                  <p className="text-xs text-tertiary mt-1">PDF only · opens straight into the Resume Builder</p>
                </div>
              </div>
              <button
                ref={closeRef}
                className="btn btn-ghost btn-icon"
                onClick={onClose}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* ---- Step 1: choose a file ---- */}
            {stage === 'pick' && (
              <>
                <div
                  className={`upload-zone ${dragging ? 'dragging' : ''}`}
                  onClick={() => inputRef.current?.click()}
                  onDragOver={event => { event.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={onDrop}
                  role="button"
                  tabIndex={0}
                  onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') inputRef.current?.click(); }}
                >
                  <div className="upload-zone-icon">
                    <FileText size={28} />
                  </div>
                  <div className="upload-zone-title">Drop your resume PDF here</div>
                  <div className="upload-zone-subtitle">or click to choose a file — maximum 20 MB</div>
                </div>

                <input
                  ref={inputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  className="hidden-file-input"
                  onChange={event => {
                    handleFile(event.target.files?.[0]);
                    // Clear it so choosing the same file again still fires.
                    event.target.value = '';
                  }}
                />

                <div className="import-note">
                  <ShieldCheck size={15} />
                  <span>
                    Your PDF is read inside this browser tab. It is not uploaded anywhere — this app has
                    no server to send it to.
                  </span>
                </div>

                <p className="text-xs text-tertiary mt-4">
                  A PDF made by Word, Google Docs or Canva works best. A <strong>scan or photo</strong> of
                  a resume has no readable text, so it cannot be imported.
                </p>
              </>
            )}

            {/* ---- Step 2: reading ---- */}
            {stage === 'reading' && (
              <div className="import-reading">
                <Loader2 size={30} className="spin" style={{ color: 'var(--accent-primary)' }} />
                <p className="text-sm font-semibold mt-4">Reading {fileName}</p>
                <p className="text-xs text-tertiary mt-1">Finding your details, sections and skills…</p>
              </div>
            )}

            {/* ---- Step 3: what was read ---- */}
            {stage === 'review' && result && (
              <>
                <div className="import-success">
                  <CheckCircle2 size={18} />
                  <div>
                    <div className="text-sm font-semibold">Read {result.stats.pages} page{result.stats.pages === 1 ? '' : 's'} successfully</div>
                    <div className="text-xs" style={{ opacity: 0.85 }}>
                      {result.stats.sections.length
                        ? `Found: ${result.stats.sections.join(', ')}`
                        : 'No named sections were recognised — the text was kept so you can sort it.'}
                    </div>
                  </div>
                </div>

                <div className="import-summary-grid">
                  <ImportCount label="Name" value={result.resume.personalInfo.fullName} icon={<FileText size={14} />} />
                  <ImportCount label="Experience" value={`${result.resume.experience.length} entr${result.resume.experience.length === 1 ? 'y' : 'ies'}`} icon={<Briefcase size={14} />} />
                  <ImportCount label="Education" value={`${result.resume.education.length} entr${result.resume.education.length === 1 ? 'y' : 'ies'}`} icon={<GraduationCap size={14} />} />
                  <ImportCount label="Skills" value={`${result.resume.skills.length} found`} icon={<Wrench size={14} />} />
                </div>

                {result.warnings.length > 0 && (
                  <div className="import-warning">
                    <AlertTriangle size={16} />
                    <div>
                      {result.warnings.map((warning, index) => (
                        <p key={index} className="text-xs" style={{ marginTop: index ? 6 : 0 }}>{warning}</p>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-xs text-tertiary mt-4">
                  You will land in the Resume Builder with this as a new resume. Nothing is overwritten —
                  your other resumes stay as they are.
                </p>

                <div className="flex gap-3 mt-6">
                  <button className="btn btn-primary" onClick={confirmImport}>
                    Open in Builder <ArrowRight size={16} />
                  </button>
                  <button className="btn btn-ghost" onClick={() => setStage('pick')}>
                    Choose another file
                  </button>
                </div>
              </>
            )}

            {/* ---- Failure ---- */}
            {stage === 'failed' && (
              <>
                <div className="import-error">
                  <AlertTriangle size={18} />
                  <div style={{ minWidth: 0 }}>
                    <p className="text-sm">{error}</p>
                    {errorDetail && (
                      <p className="text-xs text-tertiary mt-2">{errorDetail}</p>
                    )}
                    <p className="text-xs text-tertiary mt-2">
                      Still stuck? Open the PDF, choose Print → Save as PDF, and upload that copy —
                      it rebuilds the text layer most readers miss.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button className="btn btn-primary" onClick={() => setStage('pick')}>
                    <FileUp size={16} /> Try another PDF
                  </button>
                  <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ImportCount({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  const empty = !value || /^0\b/.test(value);
  return (
    <div className="import-count">
      <span className="import-count-icon">{icon}</span>
      <div style={{ minWidth: 0 }}>
        <div className="import-count-label">{label}</div>
        <div className={`import-count-value ${empty ? 'is-empty' : ''}`}>
          {empty ? 'not found' : value}
        </div>
      </div>
    </div>
  );
}
