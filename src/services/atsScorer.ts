import type { Resume, ATSScore, ATSIssue, ATSAnalysis } from '../types/resume';
import { createId } from '../types/resume';

export const ACTION_VERBS = [
  'achieved', 'administered', 'analyzed', 'architected', 'automated', 'built',
  'collaborated', 'consolidated', 'coordinated', 'created', 'decreased', 'delivered',
  'designed', 'developed', 'directed', 'drove', 'eliminated', 'enabled', 'engineered',
  'established', 'exceeded', 'executed', 'expanded', 'facilitated', 'generated',
  'grew', 'guided', 'headed', 'identified', 'implemented', 'improved', 'increased',
  'influenced', 'initiated', 'innovated', 'integrated', 'introduced', 'launched',
  'led', 'leveraged', 'managed', 'maximized', 'mentored', 'migrated', 'modernized',
  'negotiated', 'optimized', 'orchestrated', 'organized', 'oversaw', 'partnered',
  'pioneered', 'planned', 'produced', 'programmed', 'proposed', 'redesigned',
  'reduced', 'refactored', 'resolved', 'revamped', 'scaled', 'secured',
  'simplified', 'spearheaded', 'standardized', 'streamlined', 'strengthened',
  'supervised', 'surpassed', 'transformed', 'unified', 'upgraded',
];

export const WEAK_WORDS = [
  'helped', 'worked on', 'was responsible for', 'assisted', 'participated',
  'was involved in', 'handled', 'did', 'made', 'got', 'went',
];

function countNumbers(text: string): number {
  return (text.match(/\d+[%$KkMm]?|\$[\d,.]+/g) || []).length;
}

function hasActionVerb(bullet: string): boolean {
  const lower = bullet.toLowerCase().trim();
  return ACTION_VERBS.some(v => lower.startsWith(v) || lower.startsWith(v + ' '));
}

function hasWeakWord(bullet: string): boolean {
  const lower = bullet.toLowerCase();
  return WEAK_WORDS.some(w => lower.includes(w));
}

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

export function analyzeResume(resume: Resume): ATSAnalysis {
  const issues: ATSIssue[] = [];
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const allBullets = resume.experience.flatMap(e => e.bullets);
  const totalBullets = allBullets.length;

  // ===== FORMAT SCORE =====
  let formatScore = 100;

  if (!resume.personalInfo.fullName) {
    formatScore -= 15;
    issues.push({ id: createId(), type: 'error', category: 'format', title: 'Missing Full Name', description: 'Your resume must include your full name at the top.', fix: 'Add your full name in the Personal Info section.', impact: 8 });
  }
  if (!resume.personalInfo.email) {
    formatScore -= 10;
    issues.push({ id: createId(), type: 'error', category: 'format', title: 'Missing Email', description: 'Contact email is essential for recruiters to reach you.', fix: 'Add your professional email address.', impact: 7 });
  }
  if (!resume.personalInfo.phone) {
    formatScore -= 5;
    issues.push({ id: createId(), type: 'warning', category: 'format', title: 'Missing Phone Number', description: 'Most recruiters prefer having a phone number.', fix: 'Add your phone number.', impact: 4 });
  }
  if (!resume.personalInfo.location) {
    formatScore -= 5;
    issues.push({ id: createId(), type: 'warning', category: 'format', title: 'Missing Location', description: 'Location helps recruiters assess your availability.', fix: 'Add your city and state/country.', impact: 3 });
  }
  if (!resume.personalInfo.linkedin) {
    formatScore -= 3;
    issues.push({ id: createId(), type: 'suggestion', category: 'format', title: 'No LinkedIn Profile', description: 'Adding LinkedIn increases credibility.', fix: 'Add your LinkedIn profile URL.', impact: 2 });
  }
  if (resume.experience.length === 0) {
    formatScore -= 20;
    issues.push({ id: createId(), type: 'error', category: 'structure', title: 'No Work Experience', description: 'Experience is the most critical section for ATS systems.', fix: 'Add at least one work experience entry.', impact: 10 });
  }
  if (resume.education.length === 0) {
    formatScore -= 10;
    issues.push({ id: createId(), type: 'warning', category: 'structure', title: 'No Education Listed', description: 'Most ATS systems look for education details.', fix: 'Add your education background.', impact: 6 });
  }
  if (resume.personalInfo.fullName && resume.personalInfo.email) {
    strengths.push('Complete contact information provided');
  }
  formatScore = Math.max(0, formatScore);

  // ===== KEYWORDS SCORE =====
  let keywordsScore = 50;
  const bulletsWithActionVerbs = allBullets.filter(b => hasActionVerb(b)).length;
  const bulletsWithWeakWords = allBullets.filter(b => hasWeakWord(b)).length;
  const actionVerbRatio = totalBullets > 0 ? bulletsWithActionVerbs / totalBullets : 0;

  if (actionVerbRatio >= 0.8) {
    keywordsScore += 30;
    strengths.push('Strong use of action verbs in bullet points');
  } else if (actionVerbRatio >= 0.5) {
    keywordsScore += 15;
  } else if (totalBullets > 0) {
    issues.push({ id: createId(), type: 'warning', category: 'keywords', title: 'Weak Action Verbs', description: `Only ${Math.round(actionVerbRatio * 100)}% of your bullets start with strong action verbs.`, fix: 'Start each bullet point with a powerful action verb like "Led", "Developed", "Increased", etc.', impact: 6 });
  }

  if (bulletsWithWeakWords > 0) {
    keywordsScore -= bulletsWithWeakWords * 5;
    issues.push({ id: createId(), type: 'warning', category: 'keywords', title: 'Weak Wording Detected', description: `${bulletsWithWeakWords} bullet(s) use weak phrases like "helped", "worked on", or "was responsible for".`, fix: 'Replace weak phrases with strong action verbs that showcase impact.', impact: 5 });
    weaknesses.push('Some bullet points use passive or weak language');
  }

  if (resume.skills.length > 0) {
    keywordsScore += 10;
    strengths.push(`${resume.skills.length} skills listed`);
  }
  if (resume.certifications.length > 0) {
    keywordsScore += 10;
    strengths.push('Professional certifications included');
  }
  keywordsScore = Math.max(0, Math.min(100, keywordsScore));

  // ===== READABILITY SCORE =====
  let readabilityScore = 70;
  const longBullets = allBullets.filter(b => wordCount(b) > 30);
  const shortBullets = allBullets.filter(b => wordCount(b) < 8);

  if (longBullets.length > 0) {
    readabilityScore -= longBullets.length * 5;
    issues.push({ id: createId(), type: 'warning', category: 'readability', title: 'Bullet Points Too Long', description: `${longBullets.length} bullet(s) exceed 30 words. Ideal range is 15-25 words.`, fix: 'Shorten long bullet points to improve readability.', impact: 4 });
  }
  if (shortBullets.length > 0) {
    readabilityScore -= shortBullets.length * 3;
    issues.push({ id: createId(), type: 'suggestion', category: 'readability', title: 'Bullet Points Too Short', description: `${shortBullets.length} bullet(s) have fewer than 8 words. Add more detail.`, fix: 'Expand short bullets with specific achievements and metrics.', impact: 3 });
  }

  const summaryWords = wordCount(resume.summary);
  if (summaryWords === 0) {
    readabilityScore -= 15;
    issues.push({ id: createId(), type: 'error', category: 'readability', title: 'Missing Professional Summary', description: 'A professional summary is critical for making a strong first impression.', fix: 'Add a 2-4 sentence professional summary highlighting your key strengths.', impact: 8 });
    weaknesses.push('No professional summary');
  } else if (summaryWords < 20) {
    readabilityScore -= 5;
    issues.push({ id: createId(), type: 'suggestion', category: 'readability', title: 'Summary Too Short', description: 'Your summary should be 30-60 words for optimal impact.', fix: 'Expand your summary with key skills and career highlights.', impact: 3 });
  } else if (summaryWords > 80) {
    readabilityScore -= 5;
    issues.push({ id: createId(), type: 'suggestion', category: 'readability', title: 'Summary Too Long', description: 'Keep your summary concise (30-60 words) for best results.', fix: 'Trim your summary to focus on the most impactful points.', impact: 2 });
  } else {
    strengths.push('Professional summary is well-structured');
  }

  readabilityScore = Math.max(0, Math.min(100, readabilityScore));

  // ===== EXPERIENCE SCORE =====
  let experienceScore = 0;
  if (resume.experience.length >= 2) {
    experienceScore += 30;
    strengths.push('Multiple work experiences listed');
  } else if (resume.experience.length === 1) {
    experienceScore += 15;
  }

  const quantifiedBullets = allBullets.filter(b => countNumbers(b) > 0).length;
  const quantificationRatio = totalBullets > 0 ? quantifiedBullets / totalBullets : 0;

  if (quantificationRatio >= 0.6) {
    experienceScore += 40;
    strengths.push('Excellent use of quantified achievements');
  } else if (quantificationRatio >= 0.3) {
    experienceScore += 20;
    issues.push({ id: createId(), type: 'suggestion', category: 'experience', title: 'More Metrics Needed', description: `Only ${Math.round(quantificationRatio * 100)}% of bullets include numbers. Aim for 60%+.`, fix: 'Add specific numbers, percentages, or dollar amounts to more bullet points.', impact: 5 });
  } else if (totalBullets > 0) {
    issues.push({ id: createId(), type: 'warning', category: 'experience', title: 'Lacking Quantified Results', description: 'Most bullet points lack measurable achievements.', fix: 'Quantify your impact with numbers (e.g., "increased revenue by 25%").', impact: 7 });
    weaknesses.push('Bullet points lack quantified achievements');
  }

  const avgBulletsPerJob = resume.experience.length > 0 ? totalBullets / resume.experience.length : 0;
  if (avgBulletsPerJob >= 3 && avgBulletsPerJob <= 6) {
    experienceScore += 20;
  } else if (avgBulletsPerJob < 3 && resume.experience.length > 0) {
    experienceScore += 5;
    issues.push({ id: createId(), type: 'suggestion', category: 'experience', title: 'Few Bullet Points Per Role', description: 'Aim for 3-5 bullet points per work experience.', fix: 'Add more achievement-focused bullet points to each role.', impact: 4 });
  }

  experienceScore += Math.min(10, resume.experience.length * 3);
  experienceScore = Math.max(0, Math.min(100, experienceScore));

  // ===== SKILLS SCORE =====
  let skillsScore = 0;
  const skillCount = resume.skills.length;
  if (skillCount >= 8 && skillCount <= 15) {
    skillsScore = 90;
    strengths.push('Optimal number of skills listed (8-15)');
  } else if (skillCount >= 5) {
    skillsScore = 70;
  } else if (skillCount >= 1) {
    skillsScore = 40;
    issues.push({ id: createId(), type: 'warning', category: 'skills', title: 'Too Few Skills', description: `Only ${skillCount} skill(s) listed. ATS systems look for 8-15 skills.`, fix: 'Add more relevant skills to match common job requirements.', impact: 6 });
    weaknesses.push('Insufficient skills listed');
  } else {
    issues.push({ id: createId(), type: 'error', category: 'skills', title: 'No Skills Section', description: 'Skills section is critical for ATS keyword matching.', fix: 'Add a skills section with 8-15 relevant skills.', impact: 9 });
    weaknesses.push('Missing skills section');
  }

  if (skillCount > 20) {
    skillsScore -= 10;
    issues.push({ id: createId(), type: 'suggestion', category: 'skills', title: 'Too Many Skills', description: 'Having 20+ skills can dilute the impact. Focus on the most relevant.', fix: 'Narrow your skills to the top 10-15 most relevant.', impact: 3 });
  }

  const hasHardSkills = resume.skills.some(s => s.category === 'hard');
  const hasSoftSkills = resume.skills.some(s => s.category === 'soft');
  if (hasHardSkills && hasSoftSkills) {
    skillsScore += 10;
    strengths.push('Good mix of hard and soft skills');
  }
  skillsScore = Math.max(0, Math.min(100, skillsScore));

  // ===== RECRUITER APPEAL SCORE =====
  let recruiterAppealScore = 50;

  if (resume.summary && summaryWords >= 20) recruiterAppealScore += 15;
  if (resume.personalInfo.fullName) recruiterAppealScore += 5;
  if (resume.personalInfo.email && resume.personalInfo.phone) recruiterAppealScore += 5;
  if (resume.personalInfo.linkedin) recruiterAppealScore += 5;
  if (resume.projects.length > 0) {
    recruiterAppealScore += 5;
    strengths.push('Projects section adds depth to your profile');
  }
  if (resume.certifications.length > 0) recruiterAppealScore += 5;
  if (resume.awards.length > 0) {
    recruiterAppealScore += 5;
    strengths.push('Awards demonstrate recognition');
  }
  if (resume.languages.length > 1) {
    recruiterAppealScore += 5;
    strengths.push('Multiple languages listed');
  }
  recruiterAppealScore = Math.max(0, Math.min(100, recruiterAppealScore));

  // ===== OVERALL =====
  const overall = Math.round(
    formatScore * 0.20 +
    keywordsScore * 0.20 +
    readabilityScore * 0.15 +
    experienceScore * 0.20 +
    skillsScore * 0.10 +
    recruiterAppealScore * 0.15
  );

  const score: ATSScore = {
    overall,
    format: formatScore,
    keywords: keywordsScore,
    readability: readabilityScore,
    experience: experienceScore,
    skills: skillsScore,
    recruiterAppeal: recruiterAppealScore,
  };

  // Collect present/missing action verbs
  const usedVerbs = ACTION_VERBS.filter(v =>
    allBullets.some(b => b.toLowerCase().includes(v))
  );
  const missingVerbs = ACTION_VERBS.filter(v => !usedVerbs.includes(v)).slice(0, 10);

  // Interview probability
  let interviewProb = 15;
  if (overall >= 90) interviewProb = 85;
  else if (overall >= 80) interviewProb = 70;
  else if (overall >= 70) interviewProb = 55;
  else if (overall >= 60) interviewProb = 40;
  else if (overall >= 50) interviewProb = 28;
  else interviewProb = 15;

  return {
    score,
    issues: issues.sort((a, b) => b.impact - a.impact),
    strengths,
    weaknesses,
    missingKeywords: missingVerbs,
    presentKeywords: usedVerbs,
    actionVerbs: usedVerbs,
    missingActionVerbs: missingVerbs,
    quantifiedAchievements: quantifiedBullets,
    totalBullets,
    interviewProbability: interviewProb,
  };
}
