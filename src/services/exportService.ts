import type { Resume } from '../types/resume';
import jsPDF from 'jspdf';
import { saveAs } from 'file-saver';

function formatDate(date: string): string {
  if (!date) return '';
  const d = new Date(date + '-01');
  if (isNaN(d.getTime())) return date;
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

// ===== PDF Export — real selectable text (ATS-safe, re-uploadable) =====
// Single-column, plain Helvetica, no images. Everything written with
// pdf.text() so readers, ATS parsers and our own PDF importer see words.
export async function exportToPDF(resume: Resume): Promise<void> {
  const pdf = new jsPDF({ unit: 'pt', format: 'letter', orientation: 'portrait' });
  const pageW = pdf.internal.pageSize.getWidth(); // 612
  const pageH = pdf.internal.pageSize.getHeight(); // 792
  const marginX = 48;
  const marginTop = 48;
  const marginBottom = 48;
  const usableW = pageW - marginX * 2;

  let y = marginTop;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageH - marginBottom) {
      pdf.addPage();
      y = marginTop;
    }
  };

  const writeLines = (lines: string[], lineGap: number) => {
    for (const line of lines) {
      ensureSpace(lineGap);
      pdf.text(line, marginX, y);
      y += lineGap;
    }
  };

  const paragraph = (
    text: string,
    fontSize = 10,
    style: 'normal' | 'bold' | 'italic' = 'normal',
    color: [number, number, number] = [40, 40, 40],
    gap = 14,
  ) => {
    pdf.setFont('helvetica', style);
    pdf.setFontSize(fontSize);
    pdf.setTextColor(color[0], color[1], color[2]);
    const lines = pdf.splitTextToSize(text, usableW) as string[];
    writeLines(lines, gap);
  };

  const sectionTitle = (title: string) => {
    ensureSpace(34);
    y += 8;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(17, 17, 17);
    pdf.text(title.toUpperCase(), marginX, y);
    y += 6;
    pdf.setDrawColor(180, 180, 180);
    pdf.setLineWidth(0.75);
    pdf.line(marginX, y, marginX + usableW, y);
    y += 12;
  };

  const p = resume.personalInfo;

  // ---- Header ----
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(20);
  pdf.setTextColor(17, 17, 17);
  const nameLines = pdf.splitTextToSize(p.fullName || 'Your Name', usableW) as string[];
  writeLines(nameLines, 24);

  if (p.title) {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(12);
    pdf.setTextColor(60, 60, 60);
    const titleLines = pdf.splitTextToSize(p.title, usableW) as string[];
    writeLines(titleLines, 16);
  }

  const contact = [p.email, p.phone, p.location, p.linkedin, p.portfolio].filter(Boolean).join(' | ');
  if (contact) {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(90, 90, 90);
    const contactLines = pdf.splitTextToSize(contact, usableW) as string[];
    writeLines(contactLines, 12);
  }
  y += 4;

  // ---- Summary ----
  if (resume.summary) {
    sectionTitle('Summary');
    paragraph(resume.summary, 10, 'normal', [40, 40, 40], 14);
    y += 4;
  }

  // ---- Skills ----
  if (resume.skills.length > 0) {
    sectionTitle('Skills');
    paragraph(resume.skills.map((s) => s.name).join(', '), 10);
    y += 4;
  }

  // ---- Experience ----
  if (resume.experience.length > 0) {
    sectionTitle('Experience');
    for (const exp of resume.experience) {
      ensureSpace(40);
      paragraph(`${exp.jobTitle}${exp.company ? ' — ' + exp.company : ''}`, 11, 'bold', [17, 17, 17], 15);
      const meta = [
        exp.location,
        `${formatDate(exp.startDate)} - ${exp.current ? 'Present' : formatDate(exp.endDate)}`,
      ]
        .filter(Boolean)
        .join(' | ');
      if (meta) paragraph(meta, 9, 'italic', [100, 100, 100], 12);
      for (const b of exp.bullets) {
        if (!b.trim()) continue;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        pdf.setTextColor(40, 40, 40);
        const wrapped = pdf.splitTextToSize(`• ${b}`, usableW - 14) as string[];
        for (let i = 0; i < wrapped.length; i++) {
          ensureSpace(14);
          pdf.text(wrapped[i], marginX + (i === 0 ? 0 : 14), y);
          y += 14;
        }
      }
      y += 8;
    }
  }

  // ---- Education ----
  if (resume.education.length > 0) {
    sectionTitle('Education');
    for (const edu of resume.education) {
      ensureSpace(40);
      paragraph(`${edu.degree}${edu.institution ? ' — ' + edu.institution : ''}`, 11, 'bold', [17, 17, 17], 15);
      const meta = [edu.location, edu.year, edu.gpa ? `GPA: ${edu.gpa}` : '', edu.honors || '']
        .filter(Boolean)
        .join(' | ');
      if (meta) paragraph(meta, 9, 'normal', [100, 100, 100], 12);
      y += 6;
    }
  }

  // ---- Projects ----
  if (resume.projects.length > 0) {
    sectionTitle('Projects');
    for (const proj of resume.projects) {
      ensureSpace(40);
      paragraph(proj.name, 11, 'bold', [17, 17, 17], 15);
      if (proj.description) paragraph(proj.description, 10);
      if (proj.technologies.length > 0) paragraph(`Technologies: ${proj.technologies.join(', ')}`, 9, 'italic', [100, 100, 100], 12);
      if (proj.results) paragraph(proj.results, 10);
      y += 6;
    }
  }

  // ---- Certifications ----
  if (resume.certifications.length > 0) {
    sectionTitle('Certifications');
    for (const c of resume.certifications) {
      paragraph(`• ${c.name} — ${c.issuer}${c.date ? ` (${formatDate(c.date)})` : ''}`, 10);
    }
    y += 4;
  }

  // ---- Languages ----
  if (resume.languages.length > 0) {
    sectionTitle('Languages');
    paragraph(resume.languages.map((l) => `${l.name} (${l.proficiency})`).join(', '), 10);
    y += 4;
  }

  // ---- Awards ----
  if (resume.awards.length > 0) {
    sectionTitle('Awards');
    for (const a of resume.awards) {
      paragraph(`• ${a.name} — ${a.issuer}${a.date ? ` (${a.date})` : ''}${a.description ? ` — ${a.description}` : ''}`, 10);
    }
    y += 4;
  }

  // ---- Volunteer ----
  if (resume.volunteer.length > 0) {
    sectionTitle('Volunteer');
    for (const v of resume.volunteer) {
      ensureSpace(40);
      paragraph(`${v.role} — ${v.organization}`, 11, 'bold', [17, 17, 17], 15);
      const meta = `${formatDate(v.startDate)} - ${formatDate(v.endDate)}`;
      if (meta.trim() !== '-') paragraph(meta, 9, 'italic', [100, 100, 100], 12);
      if (v.description) paragraph(v.description, 10);
      y += 6;
    }
  }

  // ---- References ----
  if (resume.references.length > 0) {
    sectionTitle('References');
    for (const r of resume.references) {
      paragraph(
        `• ${r.name}${r.title ? ` — ${r.title}` : ''}${r.company ? `, ${r.company}` : ''}${r.email ? ` — ${r.email}` : ''}${r.phone ? ` — ${r.phone}` : ''}`,
        10,
      );
    }
    y += 4;
  }

  const filename = `${(resume.personalInfo.fullName || 'Resume').replace(/\s+/g, '_')}_Resume.pdf`;
  pdf.save(filename);
}

// ===== TXT Export =====
export function exportToTXT(resume: Resume): void {
  const lines: string[] = [];
  const div = '='.repeat(60);
  const sdiv = '-'.repeat(40);

  lines.push(div);
  lines.push((resume.personalInfo.fullName || 'YOUR NAME').toUpperCase());
  lines.push(
    [resume.personalInfo.email, resume.personalInfo.phone, resume.personalInfo.location, resume.personalInfo.linkedin]
      .filter(Boolean).join(' | ')
  );
  lines.push(div);
  lines.push('');

  if (resume.summary) {
    lines.push('PROFESSIONAL SUMMARY');
    lines.push(sdiv);
    lines.push(resume.summary);
    lines.push('');
  }

  if (resume.skills.length > 0) {
    lines.push('CORE SKILLS');
    lines.push(sdiv);
    resume.skills.forEach(s => lines.push(`  • ${s.name}`));
    lines.push('');
  }

  if (resume.experience.length > 0) {
    lines.push('PROFESSIONAL EXPERIENCE');
    lines.push(sdiv);
    resume.experience.forEach(exp => {
      lines.push(`${exp.jobTitle}`);
      lines.push(`${exp.company}${exp.location ? ', ' + exp.location : ''}`);
      lines.push(`${formatDate(exp.startDate)} – ${exp.current ? 'Present' : formatDate(exp.endDate)}`);
      exp.bullets.forEach(b => lines.push(`  • ${b}`));
      lines.push('');
    });
  }

  if (resume.education.length > 0) {
    lines.push('EDUCATION');
    lines.push(sdiv);
    resume.education.forEach(edu => {
      lines.push(`${edu.degree}`);
      lines.push(`${edu.institution}${edu.location ? ', ' + edu.location : ''} — ${edu.year}`);
      if (edu.gpa) lines.push(`GPA: ${edu.gpa}`);
      lines.push('');
    });
  }

  if (resume.projects.length > 0) {
    lines.push('PROJECTS');
    lines.push(sdiv);
    resume.projects.forEach(proj => {
      lines.push(proj.name);
      if (proj.description) lines.push(`  ${proj.description}`);
      if (proj.technologies.length > 0) lines.push(`  Technologies: ${proj.technologies.join(', ')}`);
      if (proj.results) lines.push(`  Results: ${proj.results}`);
      lines.push('');
    });
  }

  if (resume.certifications.length > 0) {
    lines.push('CERTIFICATIONS');
    lines.push(sdiv);
    resume.certifications.forEach(c => lines.push(`  • ${c.name} — ${c.issuer} (${formatDate(c.date)})`));
    lines.push('');
  }

  if (resume.languages.length > 0) {
    lines.push('LANGUAGES');
    lines.push(sdiv);
    resume.languages.forEach(l => lines.push(`  • ${l.name} (${l.proficiency})`));
    lines.push('');
  }

  if (resume.awards.length > 0) {
    lines.push('AWARDS');
    lines.push(sdiv);
    resume.awards.forEach(a => lines.push(`  • ${a.name} — ${a.issuer} (${a.date})`));
    lines.push('');
  }

  const content = lines.join('\n');
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  saveAs(blob, `${(resume.personalInfo.fullName || 'Resume').replace(/\s+/g, '_')}_Resume.txt`);
}

// ===== DOCX Export =====
// Note: Full DOCX generation would use the 'docx' npm package.
// For this implementation, we export as a properly formatted text file.
export function exportToDOCX(resume: Resume): void {
  // Create a rich-text compatible format
  exportToTXT(resume);
  // In production, use the 'docx' npm library for native .docx generation
}
