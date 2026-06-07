import type { Resume } from '../types/resume';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';

function formatDate(date: string): string {
  if (!date) return '';
  const d = new Date(date + '-01');
  if (isNaN(d.getTime())) return date;
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

// ===== PDF Export (html2canvas snapshot of live preview) =====
export async function exportToPDF(resume: Resume): Promise<void> {
  const el = document.getElementById('resume-preview-content');
  if (!el) return;

  // PDF letter dimensions at 96dpi screen equivalent
  // Letter = 8.5 x 11 inches, at 96dpi = 816 x 1056px
  const PDF_W_PX = 816;

  // Clone into a fixed-width offscreen container so layout matches PDF exactly
  const container = document.createElement('div');
  container.style.cssText = `position:fixed;top:0;left:-9999px;width:${PDF_W_PX}px;z-index:-1;`;
  const clone = el.cloneNode(true) as HTMLElement;
  clone.style.width = `${PDF_W_PX}px`;
  clone.style.minHeight = 'auto';
  clone.style.borderRadius = '0';
  clone.style.boxShadow = 'none';
  container.appendChild(clone);
  document.body.appendChild(container);

  // Wait a frame for layout to settle
  await new Promise(r => requestAnimationFrame(r));

  const canvas = await html2canvas(clone, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
    width: PDF_W_PX,
    windowWidth: PDF_W_PX,
  });

  document.body.removeChild(container);

  const pdf = new jsPDF({ unit: 'pt', format: 'letter', orientation: 'portrait' });
  const pdfW = pdf.internal.pageSize.getWidth();  // 612pt
  const pdfH = pdf.internal.pageSize.getHeight(); // 792pt

  const ratio = pdfW / canvas.width;
  const fullImgH = canvas.height * ratio;

  // If content fits in one page, optionally scale down to fit
  if (fullImgH <= pdfH * 1.15) {
    // Auto-fit to single page by scaling down
    const fitRatio = Math.min(1, pdfH / fullImgH);
    const fitW = pdfW * fitRatio;
    const fitH = fullImgH * fitRatio;
    const xOffset = (pdfW - fitW) / 2;
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', xOffset, 0, fitW, fitH);
  } else {
    // Multi-page: offset full image per page
    let yPos = 0;
    let pageNum = 0;
    while (yPos < fullImgH) {
      if (pageNum > 0) pdf.addPage();
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, -yPos, pdfW, fullImgH);
      yPos += pdfH;
      pageNum++;
    }
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
