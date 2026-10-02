// ============================================
// Resume Preview — one renderer, twelve looks
// ============================================
// Every template draws from the same data and the same sections, but in its
// own order, with its own spacing, accents and heading style. All text stays
// in normal document flow (no absolute positioning, no tables), because that
// is what an ATS parser reads and what html2canvas photographs for the PDF.
// ============================================

import type { ReactNode } from 'react';
import type {
  Resume, TemplateType, TemplateLayout, Experience, Education,
} from '../types/resume';
import { TEMPLATE_INFO } from '../types/resume';

const SANS = "'Inter', 'Segoe UI', Arial, sans-serif";
const SERIF = "Georgia, 'Times New Roman', serif";
const MONO = "'JetBrains Mono', Consolas, 'Courier New', monospace";

function fmtDate(d: string): string {
  if (!d) return '';
  const dt = new Date(`${d}-01`);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function dateRange(exp: Experience): string {
  const start = fmtDate(exp.startDate);
  const end = exp.current ? 'Present' : fmtDate(exp.endDate);
  if (!start && !end) return '';
  if (!start) return end;
  return `${start} – ${end || 'Present'}`;
}

function hasText(value?: string): boolean {
  return Boolean(value && value.trim());
}

function contactParts(resume: Resume): string[] {
  const p = resume.personalInfo;
  return [p.email, p.phone, p.location, p.linkedin, p.portfolio].filter(hasText);
}

function topAchievements(resume: Resume, limit = 4): string[] {
  const bullets = resume.experience.flatMap((e) => e.bullets).filter(hasText);
  const withNumbers = bullets.filter((b) => /(\d|%|\$|₱)/.test(b));
  const picked = (withNumbers.length >= 2 ? withNumbers : bullets).slice(0, limit);
  return picked;
}

/** Everything a layout needs: the data plus its own visual settings. */
interface Ctx {
  resume: Resume;
  accent: string;
  /** Body font family. */
  font: string;
  /** Base font size in px. */
  size: number;
  /** Space between sections. */
  gap: number;
  /** Heading treatment. */
  heading: HeadingStyle;
  compact?: boolean;
}

type HeadingStyle =
  | 'rule'          // small caps with an accent underline (modern, creative)
  | 'centerRule'    // centered with a full rule (corporate, government)
  | 'wideRule'      // uppercase, letterspaced, long thin rule (executive)
  | 'monoBar'       // // HEADING with a left accent bar (technical)
  | 'band'          // heading sits on a light grey band (graduate, compact)
  | 'underline'     // plain text with a thin underline only (minimal)
  | 'letterspaced'  // centered small caps, hairline rule (elegant, academic)
  | 'plain';        // bold text, no decoration (government, academic body)

// ============================================
// Heading
// ============================================

function SectionTitle({ text, ctx }: { text: string; ctx: Ctx }) {
  const { accent, heading, size, compact, font } = ctx;
  const base = { color: '#111', fontFamily: font };

  switch (heading) {
    case 'rule':
      return (
        <h2 style={{
          ...base, fontSize: size + 0.5, fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.06em', marginTop: ctx.gap, marginBottom: 5,
          paddingBottom: 3, borderBottom: `1.5px solid ${accent}`,
        }}>{text}</h2>
      );
    case 'centerRule':
      return (
        <h2 style={{
          ...base, fontSize: size + 0.5, fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.09em', textAlign: 'center', marginTop: ctx.gap,
          marginBottom: 7, paddingBottom: 3, borderBottom: '1px solid #333',
        }}>{text}</h2>
      );
    case 'wideRule':
      return (
        <h2 style={{
          ...base, fontSize: size + 0.5, fontWeight: 600, textTransform: 'uppercase',
          letterSpacing: '0.22em', marginTop: ctx.gap + 2, marginBottom: 8,
          paddingBottom: 5, borderBottom: '1px solid #999',
        }}>{text}</h2>
      );
    case 'monoBar':
      return (
        <h2 style={{
          ...base, fontFamily: MONO, fontSize: size + 0.5, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: ctx.gap,
          marginBottom: 6, paddingLeft: 8, borderLeft: `3px solid ${accent}`,
        }}>{`// ${text}`}</h2>
      );
    case 'band':
      return (
        <h2 style={{
          ...base, fontSize: size + 0.5, fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.07em', marginTop: compact ? ctx.gap - 4 : ctx.gap,
          marginBottom: 6, padding: compact ? '2px 6px' : '3px 8px',
          background: '#f1f1f1', borderLeft: `3px solid ${accent}`,
        }}>{text}</h2>
      );
    case 'underline':
      return (
        <h2 style={{
          ...base, fontSize: size + 0.5, fontWeight: 600, marginTop: ctx.gap + 4,
          marginBottom: 6, paddingBottom: 3, borderBottom: '1px solid #d4d4d4',
        }}>{text}</h2>
      );
    case 'letterspaced':
      return (
        <h2 style={{
          ...base, fontSize: size + 0.5, fontWeight: 600, textTransform: 'uppercase',
          letterSpacing: '0.18em', textAlign: 'center', marginTop: ctx.gap + 2,
          marginBottom: 7, paddingBottom: 4, borderBottom: '0.5px solid #bbb',
        }}>{text}</h2>
      );
    default:
      return (
        <h2 style={{
          ...base, fontSize: size + 0.5, fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.05em', marginTop: ctx.gap, marginBottom: 5,
        }}>{text}</h2>
      );
  }
}

// ============================================
// Section blocks
// ============================================

function SummaryBlock({ ctx }: { ctx: Ctx }) {
  const { summary } = ctx.resume;
  if (!hasText(summary)) return null;
  return (
    <>
      <SectionTitle text="Professional Summary" ctx={ctx} />
      <p style={{ fontSize: ctx.size, color: '#222', marginBottom: 4, textAlign: ctx.heading === 'centerRule' ? 'justify' : 'left' }}>
        {summary}
      </p>
    </>
  );
}

function HighlightsBlock({ ctx, title = 'Career Highlights' }: { ctx: Ctx; title?: string }) {
  const items = topAchievements(ctx.resume, ctx.compact ? 3 : 4);
  if (items.length < 2) return null;
  return (
    <>
      <SectionTitle text={title} ctx={ctx} />
      <ul style={{ paddingLeft: 16, margin: '4px 0 8px' }}>
        {items.map((b, i) => (
          <li key={i} style={{ fontSize: ctx.size, color: '#222', marginBottom: 3 }}>{b}</li>
        ))}
      </ul>
    </>
  );
}

type SkillsMode = 'chips' | 'inline' | 'twoCol' | 'list';

function SkillsBlock({ ctx, mode }: { ctx: Ctx; mode: SkillsMode }) {
  const skills = ctx.resume.skills;
  if (!skills.length) return null;
  const { accent, size, font } = ctx;

  if (mode === 'twoCol') {
    const half = Math.ceil(skills.length / 2);
    return (
      <>
        <SectionTitle text="Skills" ctx={ctx} />
        <div style={{ display: 'flex', gap: 24 }}>
          {[skills.slice(0, half), skills.slice(half)].map((col, ci) => (
            <ul key={ci} style={{ paddingLeft: 16, margin: '2px 0 6px', flex: 1 }}>
              {col.map((s) => (
                <li key={s.id} style={{ fontSize: size, color: '#222', marginBottom: 2 }}>{s.name}</li>
              ))}
            </ul>
          ))}
        </div>
      </>
    );
  }

  if (mode === 'inline') {
    return (
      <>
        <SectionTitle text="Skills" ctx={ctx} />
        <p style={{ fontSize: size, color: '#222', marginBottom: 6 }}>
          {skills.map((s) => s.name).join(' · ')}
        </p>
      </>
    );
  }

  if (mode === 'chips') {
    return (
      <>
        <SectionTitle text="Skills" ctx={ctx} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
          {skills.map((s) => (
            <span key={s.id} style={{
              fontSize: size - 0.5, color: '#111', fontFamily: font,
              border: `1px solid ${accent}`, borderRadius: 3, padding: '1px 6px',
            }}>{s.name}</span>
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <SectionTitle text="Skills" ctx={ctx} />
      <ul style={{ paddingLeft: 16, margin: '2px 0 6px', columns: 2, columnGap: 24 }}>
        {skills.map((s) => (
          <li key={s.id} style={{ fontSize: size, color: '#222', marginBottom: 2 }}>{s.name}</li>
        ))}
      </ul>
    </>
  );
}

type DateSide = 'right' | 'left' | 'inline';

function ExperienceBlock({
  ctx, dateSide = 'right', title = 'Professional Experience', maxRoles,
}: { ctx: Ctx; dateSide?: DateSide; title?: string; maxRoles?: number }) {
  const roles = ctx.resume.experience;
  if (!roles.length) return null;
  const { size } = ctx;
  const shown = maxRoles ? roles.slice(0, maxRoles) : roles;

  return (
    <>
      <SectionTitle text={title} ctx={ctx} />
      {shown.map((exp) => {
        const range = dateRange(exp);
        const headRow = (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, marginBottom: 1 }}>
            <div style={{ minWidth: 0 }}>
              <span style={{ fontSize: size, fontWeight: 600, color: '#111' }}>{exp.jobTitle || 'Job Title'}</span>
              {hasText(exp.company) && <span style={{ fontSize: size, color: '#333' }}>{' — '}{exp.company}</span>}
              {hasText(exp.location) && <span style={{ fontSize: size - 1, color: '#666' }}>{' · '}{exp.location}</span>}
            </div>
            {dateSide === 'right' && range && (
              <span style={{ fontSize: size - 1, color: '#555', whiteSpace: 'nowrap' }}>{range}</span>
            )}
          </div>
        );

        if (dateSide === 'left') {
          return (
            <div key={exp.id} style={{ display: 'flex', gap: 14, marginBottom: 10 }}>
              <div style={{ width: 92, flexShrink: 0, fontSize: size - 1, color: '#666', paddingTop: 1 }}>
                {range}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: size, fontWeight: 600, color: '#111' }}>{exp.jobTitle || 'Job Title'}</div>
                <div style={{ fontSize: size, color: '#333' }}>
                  {exp.company}{hasText(exp.location) ? ` · ${exp.location}` : ''}
                </div>
                {exp.bullets.filter(hasText).length > 0 && (
                  <ul style={{ paddingLeft: 16, margin: '3px 0 0' }}>
                    {exp.bullets.map((b, i) => hasText(b) && (
                      <li key={i} style={{ fontSize: size, color: '#222', marginBottom: 2 }}>{b}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          );
        }

        return (
          <div key={exp.id} style={{ marginBottom: ctx.compact ? 8 : 12 }}>
            {headRow}
            {dateSide === 'inline' && range && (
              <div style={{ fontSize: size - 1, color: '#666', marginBottom: 2 }}>{range}</div>
            )}
            {exp.bullets.filter(hasText).length > 0 && (
              <ul style={{ paddingLeft: 16, margin: '3px 0 0' }}>
                {exp.bullets.map((b, i) => hasText(b) && (
                  <li key={i} style={{ fontSize: size, color: '#222', marginBottom: ctx.compact ? 1 : 3 }}>{b}</li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
      {maxRoles && roles.length > maxRoles && (
        <p style={{ fontSize: size - 1, color: '#666', marginBottom: 6 }}>
          + {roles.length - maxRoles} earlier role{roles.length - maxRoles === 1 ? '' : 's'} available on request
        </p>
      )}
    </>
  );
}

function ProjectsBlock({ ctx, title = 'Projects', withTech = true }: { ctx: Ctx; title?: string; withTech?: boolean }) {
  const projects = ctx.resume.projects;
  if (!projects.length) return null;
  const { size } = ctx;
  return (
    <>
      <SectionTitle text={title} ctx={ctx} />
      {projects.map((p) => (
        <div key={p.id} style={{ marginBottom: ctx.compact ? 5 : 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
            <span style={{ fontSize: size, fontWeight: 600, color: '#111' }}>{p.name}</span>
            {hasText(p.url) && <span style={{ fontSize: size - 1, color: '#555' }}>{p.url}</span>}
          </div>
          {hasText(p.description) && (
            <p style={{ fontSize: size, color: '#222', marginTop: 1 }}>{p.description}</p>
          )}
          {hasText(p.results) && (
            <p style={{ fontSize: size, color: '#222', marginTop: 1 }}>
              <span style={{ fontWeight: 600 }}>Result: </span>{p.results}
            </p>
          )}
          {withTech && p.technologies.length > 0 && (
            <p style={{ fontSize: size - 1, color: '#555', marginTop: 1 }}>
              Technologies: {p.technologies.join(', ')}
            </p>
          )}
        </div>
      ))}
    </>
  );
}

function educationLine(edu: Education): string {
  return [edu.degree, edu.gpa ? `GPA ${edu.gpa}` : '', edu.honors || ''].filter(Boolean).join(' · ');
}

function EducationBlock({ ctx, title = 'Education' }: { ctx: Ctx; title?: string }) {
  const education = ctx.resume.education;
  if (!education.length) return null;
  const { size } = ctx;
  return (
    <>
      <SectionTitle text={title} ctx={ctx} />
      {education.map((edu) => (
        <div key={edu.id} style={{ marginBottom: ctx.compact ? 5 : 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
            <span style={{ fontSize: size, fontWeight: 600, color: '#111' }}>
              {educationLine(edu) || 'Degree'}
            </span>
            {hasText(edu.year) && (
              <span style={{ fontSize: size - 1, color: '#555', whiteSpace: 'nowrap' }}>{edu.year}</span>
            )}
          </div>
          <div style={{ fontSize: size, color: '#333' }}>
            {edu.institution}{hasText(edu.location) ? ` · ${edu.location}` : ''}
          </div>
        </div>
      ))}
    </>
  );
}

function CertificationsBlock({ ctx, title = 'Certifications' }: { ctx: Ctx; title?: string }) {
  const certs = ctx.resume.certifications;
  if (!certs.length) return null;
  return (
    <>
      <SectionTitle text={title} ctx={ctx} />
      <ul style={{ paddingLeft: 16, margin: '2px 0 6px' }}>
        {certs.map((c) => (
          <li key={c.id} style={{ fontSize: ctx.size, color: '#222', marginBottom: 2 }}>
            {c.name}{hasText(c.issuer) ? ` — ${c.issuer}` : ''}{hasText(c.date) ? ` (${fmtDate(c.date)})` : ''}
          </li>
        ))}
      </ul>
    </>
  );
}

function AwardsBlock({ ctx, title = 'Awards' }: { ctx: Ctx; title?: string }) {
  const awards = ctx.resume.awards;
  if (!awards.length) return null;
  return (
    <>
      <SectionTitle text={title} ctx={ctx} />
      <ul style={{ paddingLeft: 16, margin: '2px 0 6px' }}>
        {awards.map((a) => (
          <li key={a.id} style={{ fontSize: ctx.size, color: '#222', marginBottom: 2 }}>
            {a.name}{hasText(a.issuer) ? ` — ${a.issuer}` : ''}{hasText(a.date) ? ` (${a.date})` : ''}
          </li>
        ))}
      </ul>
    </>
  );
}

function LanguagesBlock({ ctx, mode = 'inline', title = 'Languages' }: { ctx: Ctx; mode?: 'inline' | 'list'; title?: string }) {
  const languages = ctx.resume.languages;
  if (!languages.length) return null;
  const { size } = ctx;
  return (
    <>
      <SectionTitle text={title} ctx={ctx} />
      {mode === 'inline' ? (
        <p style={{ fontSize: size, color: '#222', marginBottom: 6 }}>
          {languages.map((l) => `${l.name} (${l.proficiency})`).join(' · ')}
        </p>
      ) : (
        <ul style={{ paddingLeft: 16, margin: '2px 0 6px' }}>
          {languages.map((l) => (
            <li key={l.id} style={{ fontSize: size, color: '#222', marginBottom: 2 }}>
              {l.name} — {l.proficiency}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function VolunteerBlock({ ctx, title = 'Activities' }: { ctx: Ctx; title?: string }) {
  const volunteer = ctx.resume.volunteer;
  if (!volunteer.length) return null;
  const { size } = ctx;
  return (
    <>
      <SectionTitle text={title} ctx={ctx} />
      {volunteer.map((v) => (
        <div key={v.id} style={{ marginBottom: 6 }}>
          <span style={{ fontSize: size, fontWeight: 600, color: '#111' }}>{v.role}</span>
          <span style={{ fontSize: size, color: '#333' }}>{' — '}{v.organization}</span>
          {hasText(v.description) && (
            <p style={{ fontSize: size, color: '#222', marginTop: 1 }}>{v.description}</p>
          )}
        </div>
      ))}
    </>
  );
}

// ============================================
// Headers (one per family — these differ a lot)
// ============================================

function AlignedHeader({ ctx, bold = false }: { ctx: Ctx; bold?: boolean }) {
  const p = ctx.resume.personalInfo;
  return (
    <header style={{ marginBottom: 10 }}>
      <h1 style={{
        fontSize: ctx.size + (bold ? 16 : 13), fontWeight: 700, color: '#111',
        fontFamily: ctx.font, marginBottom: 2, letterSpacing: ctx.heading === 'letterspaced' ? '0.04em' : undefined,
      }}>{p.fullName || 'Your Name'}</h1>
      {hasText(p.title) && (
        <div style={{
          fontSize: ctx.size + 1, color: ctx.accent,
          fontWeight: 600, marginBottom: 3,
        }}>{p.title}</div>
      )}
      <div style={{ fontSize: ctx.size - 1, color: '#444' }}>{contactParts(ctx.resume).join('  |  ')}</div>
    </header>
  );
}

function CenteredHeader({ ctx, serif = false }: { ctx: Ctx; serif?: boolean }) {
  const p = ctx.resume.personalInfo;
  return (
    <header style={{ textAlign: 'center', marginBottom: 10 }}>
      <h1 style={{
        fontSize: serif ? ctx.size + 15 : ctx.size + 12, fontWeight: 700, color: '#111',
        fontFamily: serif ? SERIF : ctx.font, marginBottom: 2,
        textTransform: serif ? 'none' : 'uppercase', letterSpacing: serif ? '0.02em' : '0.05em',
      }}>{p.fullName || 'Your Name'}</h1>
      {hasText(p.title) && (
        <div style={{ fontSize: ctx.size + 1, color: '#333', marginBottom: 3 }}>{p.title}</div>
      )}
      <div style={{ fontSize: ctx.size - 1, color: '#444' }}>{contactParts(ctx.resume).join('  |  ')}</div>
    </header>
  );
}

function SideBarHeader({ ctx }: { ctx: Ctx }) {
  const p = ctx.resume.personalInfo;
  return (
    <header style={{ marginBottom: 12, borderTop: `4px solid ${ctx.accent}`, paddingTop: 8 }}>
      <h1 style={{ fontSize: ctx.size + 15, fontWeight: 600, color: '#111', fontFamily: ctx.font, marginBottom: 2 }}>
        {p.fullName || 'Your Name'}
      </h1>
      {hasText(p.title) && (
        <div style={{ fontSize: ctx.size + 1, color: '#444', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          {p.title}
        </div>
      )}
      <div style={{ fontSize: ctx.size - 1, color: '#444', marginTop: 3 }}>
        {contactParts(ctx.resume).join('  ·  ')}
      </div>
    </header>
  );
}

function TechnicalHeader({ ctx }: { ctx: Ctx }) {
  const p = ctx.resume.personalInfo;
  return (
    <header style={{ marginBottom: 10 }}>
      <h1 style={{ fontSize: ctx.size + 14, fontWeight: 700, color: '#111', fontFamily: MONO, marginBottom: 1 }}>
        {p.fullName || 'Your Name'}
      </h1>
      {hasText(p.title) && (
        <div style={{ fontSize: ctx.size + 1, fontFamily: MONO, color: ctx.accent, marginBottom: 3 }}>
          {'> '}{p.title}
        </div>
      )}
      <div style={{ fontSize: ctx.size - 1, color: '#444', fontFamily: MONO }}>
        {contactParts(ctx.resume).join('  |  ')}
      </div>
      {ctx.resume.skills.length > 0 && (
        <div style={{ fontSize: ctx.size - 1, color: '#333', fontFamily: MONO, marginTop: 4 }}>
          <span style={{ fontWeight: 700 }}>Stack: </span>
          {ctx.resume.skills.slice(0, 12).map((s) => s.name).join(', ')}
        </div>
      )}
    </header>
  );
}

// ============================================
// Layouts
// ============================================

type LayoutFn = (ctx: Ctx) => ReactNode;

const LAYOUTS: Record<TemplateLayout, LayoutFn> = {
  modern: (ctx) => (
    <>
      <AlignedHeader ctx={ctx} />
      <HighlightsBlock ctx={ctx} title="Highlights" />
      <SummaryBlock ctx={ctx} />
      <ExperienceBlock ctx={ctx} />
      <SkillsBlock ctx={ctx} mode="chips" />
      <ProjectsBlock ctx={ctx} />
      <EducationBlock ctx={ctx} />
      <CertificationsBlock ctx={ctx} />
      <AwardsBlock ctx={ctx} />
      <LanguagesBlock ctx={ctx} />
      <VolunteerBlock ctx={ctx} />
    </>
  ),

  corporate: (ctx) => (
    <>
      <CenteredHeader ctx={ctx} />
      <SummaryBlock ctx={ctx} />
      <ExperienceBlock ctx={ctx} dateSide="right" />
      <EducationBlock ctx={ctx} />
      <SkillsBlock ctx={ctx} mode="twoCol" />
      <CertificationsBlock ctx={ctx} />
      <ProjectsBlock ctx={ctx} withTech={false} />
      <LanguagesBlock ctx={ctx} mode="list" />
      <VolunteerBlock ctx={ctx} />
    </>
  ),

  executive: (ctx) => (
    <>
      <AlignedHeader ctx={ctx} bold />
      <HighlightsBlock ctx={ctx} />
      <SummaryBlock ctx={ctx} />
      <ExperienceBlock ctx={ctx} dateSide="right" />
      <EducationBlock ctx={ctx} />
      <CertificationsBlock ctx={ctx} />
      <SkillsBlock ctx={ctx} mode="inline" />
      <AwardsBlock ctx={ctx} />
      <ProjectsBlock ctx={ctx} withTech={false} />
      <VolunteerBlock ctx={ctx} />
      <LanguagesBlock ctx={ctx} />
    </>
  ),

  technical: (ctx) => (
    <>
      <TechnicalHeader ctx={ctx} />
      <SummaryBlock ctx={ctx} />
      <ProjectsBlock ctx={ctx} withTech />
      <ExperienceBlock ctx={ctx} dateSide="right" />
      <SkillsBlock ctx={ctx} mode="list" />
      <EducationBlock ctx={ctx} />
      <CertificationsBlock ctx={ctx} />
      <AwardsBlock ctx={ctx} />
      <VolunteerBlock ctx={ctx} />
      <LanguagesBlock ctx={ctx} />
    </>
  ),

  graduate: (ctx) => (
    <>
      <CenteredHeader ctx={ctx} />
      <EducationBlock ctx={ctx} title="Education" />
      <SummaryBlock ctx={ctx} />
      <SkillsBlock ctx={ctx} mode="chips" />
      <ProjectsBlock ctx={ctx} title="Academic Projects" />
      <ExperienceBlock ctx={ctx} title="Internships & Work Experience" dateSide="right" />
      <VolunteerBlock ctx={ctx} title="Activities & Leadership" />
      <CertificationsBlock ctx={ctx} />
      <AwardsBlock ctx={ctx} />
      <LanguagesBlock ctx={ctx} />
    </>
  ),

  creative: (ctx) => (
    <>
      <header style={{ marginBottom: 10, borderLeft: `6px solid ${ctx.accent}`, paddingLeft: 12 }}>
        <h1 style={{ fontSize: ctx.size + 14, fontWeight: 700, color: '#111', marginBottom: 2 }}>
          {ctx.resume.personalInfo.fullName || 'Your Name'}
        </h1>
        {hasText(ctx.resume.personalInfo.title) && (
          <div style={{ fontSize: ctx.size + 1, color: ctx.accent, fontWeight: 600 }}>
            {ctx.resume.personalInfo.title}
          </div>
        )}
        <div style={{ fontSize: ctx.size - 1, color: '#444' }}>{contactParts(ctx.resume).join('  |  ')}</div>
      </header>
      <SummaryBlock ctx={ctx} />
      <SkillsBlock ctx={ctx} mode="chips" />
      <ExperienceBlock ctx={ctx} />
      <ProjectsBlock ctx={ctx} />
      <EducationBlock ctx={ctx} />
      <AwardsBlock ctx={ctx} />
      <CertificationsBlock ctx={ctx} />
      <LanguagesBlock ctx={ctx} />
      <VolunteerBlock ctx={ctx} />
    </>
  ),

  government: (ctx) => (
    <>
      <CenteredHeader ctx={ctx} />
      <SummaryBlock ctx={ctx} />
      <ExperienceBlock ctx={ctx} dateSide="right" />
      <EducationBlock ctx={ctx} />
      <SkillsBlock ctx={ctx} mode="list" />
      <CertificationsBlock ctx={ctx} />
      <AwardsBlock ctx={ctx} />
      <VolunteerBlock ctx={ctx} />
      <ProjectsBlock ctx={ctx} />
      <LanguagesBlock ctx={ctx} mode="list" />
    </>
  ),

  academic: (ctx) => (
    <>
      <CenteredHeader ctx={ctx} serif />
      <SummaryBlock ctx={ctx} />
      <EducationBlock ctx={ctx} />
      <ExperienceBlock ctx={ctx} title="Teaching & Research Experience" dateSide="left" />
      <ProjectsBlock ctx={ctx} title="Publications & Projects" />
      <CertificationsBlock ctx={ctx} />
      <AwardsBlock ctx={ctx} title="Grants & Awards" />
      <SkillsBlock ctx={ctx} mode="inline" />
      <VolunteerBlock ctx={ctx} title="Service" />
      <LanguagesBlock ctx={ctx} />
    </>
  ),

  minimal: (ctx) => (
    <>
      <AlignedHeader ctx={ctx} />
      <SummaryBlock ctx={ctx} />
      <ExperienceBlock ctx={ctx} dateSide="right" />
      <ProjectsBlock ctx={ctx} withTech={false} />
      <EducationBlock ctx={ctx} />
      <SkillsBlock ctx={ctx} mode="inline" />
      <CertificationsBlock ctx={ctx} />
      <AwardsBlock ctx={ctx} />
      <LanguagesBlock ctx={ctx} />
      <VolunteerBlock ctx={ctx} />
    </>
  ),

  elegant: (ctx) => (
    <>
      <CenteredHeader ctx={ctx} serif />
      <SummaryBlock ctx={ctx} />
      <ExperienceBlock ctx={ctx} dateSide="right" />
      <EducationBlock ctx={ctx} />
      <AwardsBlock ctx={ctx} />
      <SkillsBlock ctx={ctx} mode="inline" />
      <LanguagesBlock ctx={ctx} />
      <CertificationsBlock ctx={ctx} />
      <ProjectsBlock ctx={ctx} withTech={false} />
      <VolunteerBlock ctx={ctx} />
    </>
  ),

  sidebar: (ctx) => (
    <>
      <SideBarHeader ctx={ctx} />
      <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
        <div style={{ flex: '1 1 auto', minWidth: 0 }}>
          <SummaryBlock ctx={ctx} />
          <ExperienceBlock ctx={ctx} dateSide="inline" />
          <ProjectsBlock ctx={ctx} />
          <VolunteerBlock ctx={ctx} />
        </div>
        <aside style={{
          width: '31%', flexShrink: 0, borderLeft: `2px solid ${ctx.accent}`,
          paddingLeft: 12, background: '#fafafa',
        }}>
          <SkillsBlock ctx={ctx} mode="list" />
          <CertificationsBlock ctx={ctx} />
          <EducationBlock ctx={ctx} />
          <AwardsBlock ctx={ctx} />
          <LanguagesBlock ctx={ctx} mode="list" />
        </aside>
      </div>
    </>
  ),

  compact: (ctx) => (
    <>
      <header style={{ marginBottom: 6 }}>
        <h1 style={{ fontSize: ctx.size + 10, fontWeight: 700, color: '#111', marginBottom: 1 }}>
          {ctx.resume.personalInfo.fullName || 'Your Name'}
          {hasText(ctx.resume.personalInfo.title) && (
            <span style={{ fontSize: ctx.size + 1, fontWeight: 500, color: '#444' }}>
              {'  —  '}{ctx.resume.personalInfo.title}
            </span>
          )}
        </h1>
        <div style={{ fontSize: ctx.size - 1, color: '#444' }}>{contactParts(ctx.resume).join('  |  ')}</div>
      </header>
      <SummaryBlock ctx={ctx} />
      <ExperienceBlock ctx={ctx} dateSide="right" maxRoles={3} />
      <SkillsBlock ctx={ctx} mode="inline" />
      <EducationBlock ctx={ctx} />
      <ProjectsBlock ctx={ctx} withTech={false} />
      <CertificationsBlock ctx={ctx} />
      <AwardsBlock ctx={ctx} />
      <VolunteerBlock ctx={ctx} />
      <LanguagesBlock ctx={ctx} />
    </>
  ),
};

// Per-template visual settings. fonts, sizes, spacing, heading treatment.
const DESIGN: Record<TemplateLayout, Omit<Ctx, 'resume' | 'accent'>> = {
  modern: { font: SANS, size: 11, gap: 16, heading: 'rule' },
  corporate: { font: SANS, size: 11, gap: 14, heading: 'centerRule' },
  executive: { font: SANS, size: 11, gap: 20, heading: 'wideRule' },
  technical: { font: SANS, size: 10.5, gap: 14, heading: 'monoBar' },
  graduate: { font: SANS, size: 11, gap: 14, heading: 'band' },
  creative: { font: SANS, size: 11, gap: 16, heading: 'rule' },
  government: { font: SANS, size: 11.5, gap: 14, heading: 'plain' },
  academic: { font: SERIF, size: 11, gap: 16, heading: 'letterspaced' },
  minimal: { font: SANS, size: 11, gap: 22, heading: 'underline' },
  elegant: { font: SERIF, size: 11, gap: 18, heading: 'letterspaced' },
  sidebar: { font: SANS, size: 10.5, gap: 14, heading: 'rule' },
  compact: { font: SANS, size: 9.5, gap: 9, heading: 'band', compact: true },
};

/** Page padding per template is set in globals.css so small screens can shrink it. */

export interface ResumePreviewProps {
  resume: Resume;
  /** Falls back to the template saved on the resume. */
  template?: TemplateType;
}

export default function ResumePreview({ resume, template }: ResumePreviewProps) {
  const key = template || resume.metadata.template || 'modern';
  const info = TEMPLATE_INFO[key] || TEMPLATE_INFO.modern;
  const layout = info.layout;
  const design = DESIGN[layout];

  const ctx: Ctx = { resume, accent: info.accent, ...design };

  return (
    <div
      className="resume-preview"
      id="resume-preview-content"
      data-template={layout}
      style={{
        fontFamily: design.font,
        fontSize: design.size,
        lineHeight: design.compact ? 1.4 : 1.5,
      }}
    >
      {LAYOUTS[layout](ctx)}
    </div>
  );
}
