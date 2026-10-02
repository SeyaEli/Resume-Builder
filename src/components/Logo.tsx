/* ============================================
   Brand mark
   A single drawing of the app logo. The plate takes the current accent
   colour, the sheet inside stays legible on every palette because it
   inks with the plate's own contrast colour.
   ============================================ */

interface LogoProps {
  /** Pixel size of the square mark. */
  size?: number;
  /** Show the "ResumeAI Pro" wordmark beside the mark. */
  showText?: boolean;
  className?: string;
}

export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <span className="brand-mark" style={{ width: size, height: size, borderRadius: Math.round(size / 3.2) }}>
      <svg
        width={size * 0.62}
        height={size * 0.62}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        focusable="false"
      >
        {/* Sheet of paper */}
        <path
          d="M5 3.5h8.2L18.5 8.7V20a.9.9 0 0 1-.9.9H5a.9.9 0 0 1-.9-.9V4.4A.9.9 0 0 1 5 3.5Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        {/* Folded corner */}
        <path d="M13.1 3.6v4.2a.9.9 0 0 0 .9.9h4.3" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        {/* Rising bars: the resume is getting stronger */}
        <path d="M7.6 17.2v-3.1M10.6 17.2v-5.2M13.6 17.2v-2.1" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      </svg>
    </span>
  );
}

export default function Logo({ size = 36, showText = true, className }: LogoProps) {
  return (
    <div className={`brand ${className ?? ''}`}>
      <LogoMark size={size} />
      {showText && (
        <span className="brand-text">
          <span className="brand-name" style={{ fontSize: size > 30 ? 'var(--text-lg)' : 'var(--text-base)' }}>
            ResumeAI
          </span>
          <span className="brand-tag">Pro</span>
        </span>
      )}
    </div>
  );
}
