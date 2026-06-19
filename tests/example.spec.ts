/**
 * End-to-end tests for ResumeAI Pro
 * https://resume-builderly.vercel.app/
 *
 * Setup:
 *   npm init playwright@latest   (first time)
 *   npx playwright install        (download browsers)
 *
 * Run:
 *   npx playwright test                     # headless
 *   npx playwright test --headed            # headed
 *   npx playwright test --ui                # interactive UI mode
 *   npx playwright show-report              # open HTML report after run
 */

import { test, expect, Page } from '@playwright/test';
import { goto, navTo, openBuilder, nextStep, backStep, goToStep } from './helpers';

// ---------------------------------------------------------------------------
// 1. App shell & homepage
// ---------------------------------------------------------------------------

test.describe('App shell', () => {
  test('homepage loads and sidebar is visible', async ({ page }) => {
    await goto(page);
    await expect(page).toHaveTitle(/resume/i);
    await expect(page.getByText('ResumeAI Pro')).toBeVisible();
  });

  test('all sidebar navigation items are visible', async ({ page }) => {
    await goto(page);

    const navItems = [
      'Dashboard',
      'Resume Builder',
      'ATS Checker',
      'AI Optimizer',
      'Cover Letter',
      'Job Match',
      'LinkedIn',
      'Career Coach',
      'Settings',
    ];

    for (const item of navItems) {
      await expect(page.getByRole('button', { name: item })).toBeVisible();
    }
  });

  test('header shows correct page title and "New Resume" button', async ({ page }) => {
    await goto(page);
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByRole('button', { name: /new resume/i })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 2. Dashboard
// ---------------------------------------------------------------------------

test.describe('Dashboard', () => {
  test('stat cards are rendered', async ({ page }) => {
    await goto(page);
    await expect(page.getByText('Total Resumes')).toBeVisible();
    await expect(page.getByText('Avg ATS Score')).toBeVisible();
    await expect(page.getByText('Job Matches')).toBeVisible();
    await expect(page.getByText('Cover Letters')).toBeVisible();
  });

  test('all quick-action cards are clickable without breaking the page', async ({ page }) => {
    await goto(page);

    const actions = [
      'ATS Score Check',
      'Match to Job',
      'Cover Letter',
      'Career Coach',
    ];

    for (const action of actions) {
      await goto(page); // reset to dashboard each time
      await page.getByRole('button', { name: action }).click();
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('"Create New Resume" navigates to builder', async ({ page }) => {
    await goto(page);
    await page.getByRole('button', { name: 'Create New Resume' }).click();
    await expect(page.getByText('Personal Information')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 3. Resume Builder — full flow
// ---------------------------------------------------------------------------

test.describe('Resume Builder — full form flow', () => {
  test.beforeEach(async ({ page }) => {
    await goto(page);
    await openBuilder(page);
  });

  test('step 1 — fills personal information', async ({ page }) => {
    await expect(page.getByText('Personal Information')).toBeVisible();

    // Use placeholder-based locators since labels contain raw text + <span>*</span>
    await page.getByPlaceholder('John Doe').fill('Jane Smith');
    await page.getByPlaceholder('Software Engineer').fill('Frontend Developer');
    await page.getByPlaceholder('john@example.com').fill('jane@example.com');
    await page.getByPlaceholder('(555) 123-4567').fill('555-000-1234');
    await page.getByPlaceholder('San Francisco, CA').fill('New York, NY');
    await page.getByPlaceholder('linkedin.com/in/johndoe').fill('linkedin.com/in/janesmith');
    await page.getByPlaceholder('johndoe.com').fill('janesmith.dev');

    // Verify values persisted in the live preview
    await expect(page.getByText('Jane Smith').first()).toBeVisible();
  });

  test('step 2 — writes professional summary', async ({ page }) => {
    await nextStep(page); // → Summary
    await expect(page.getByText('Professional Summary')).toBeVisible();

    await page.getByPlaceholder(/compelling/i).fill(
      'Experienced frontend developer with 5+ years building scalable web apps.'
    );
    await expect(page.getByText(/words/)).toBeVisible();
  });

  test('step 2 — AI Generate button populates summary', async ({ page }) => {
    await nextStep(page);
    await page.getByRole('button', { name: /ai generate/i }).click();
    const textarea = page.getByPlaceholder(/compelling/i);
    await expect(textarea).not.toHaveValue('');
  });

  test('step 3 — adds work experience', async ({ page }) => {
    await nextStep(page); // Summary
    await nextStep(page); // Experience

    await expect(page.getByText('Work Experience')).toBeVisible();

    // Add an experience entry
    await page.getByRole('button', { name: /add experience/i }).first().click();
    await page.getByPlaceholder('Software Engineer').fill('Senior Engineer');
    await page.getByPlaceholder('Company Inc.').fill('Acme Corp');

    // Fill the first achievement bullet
    await page.getByPlaceholder(/led a team/i).fill('Built a CI/CD pipeline that cut deploy time by 40%.');

    await expect(page.getByText('Experience 1')).toBeVisible();
  });

  test('step 3 — removes an experience entry', async ({ page }) => {
    await nextStep(page);
    await nextStep(page);

    await page.getByRole('button', { name: /add experience/i }).first().click();
    await expect(page.getByText('Experience 1')).toBeVisible();

    // Trash button inside the experience card
    await page.locator('.glass-card').filter({ hasText: 'Experience 1' })
      .getByRole('button').filter({ hasText: '' }).first().click();

    await expect(page.getByText('Experience 1')).not.toBeVisible();
  });

  test('step 4 — adds education', async ({ page }) => {
    await nextStep(page);
    await nextStep(page);
    await nextStep(page); // Education

    await expect(page.getByText('Education')).toBeVisible();
    await page.getByRole('button', { name: /add/i }).first().click();

    await page.getByPlaceholder('Bachelor of Science in Computer Science').fill('B.Sc. Computer Science');
    await page.getByPlaceholder('University of California').fill('MIT');
    await page.getByPlaceholder('2024').fill('2023');

    await expect(page.getByText('Education 1')).toBeVisible();
  });

  test('step 5 — adds and removes skills', async ({ page }) => {
    await nextStep(page);
    await nextStep(page);
    await nextStep(page);
    await nextStep(page); // Skills

    await expect(page.getByText('Skills')).toBeVisible();

    await page.getByPlaceholder(/python/i).fill('TypeScript');
    await page.getByRole('button', { name: /add/i }).click();

    await expect(page.getByText('TypeScript ×')).toBeVisible();

    // Click the badge to remove it
    await page.getByText('TypeScript ×').click();
    await expect(page.getByText('TypeScript ×')).not.toBeVisible();
  });

  test('step 6 — adds a project', async ({ page }) => {
    for (let i = 0; i < 5; i++) await nextStep(page); // Projects

    await expect(page.getByText('Projects')).toBeVisible();
    await page.getByRole('button', { name: /add/i }).first().click();

    await page.getByPlaceholder('My Awesome Project').fill('ResumeAI');
    await page.getByPlaceholder(/react, node/i).fill('React, TypeScript');

    await expect(page.getByText('Project 1')).toBeVisible();
  });

  test('step 7 — adds a certification', async ({ page }) => {
    for (let i = 0; i < 6; i++) await nextStep(page); // Certs

    await expect(page.getByText('Certifications')).toBeVisible();
    await page.getByRole('button', { name: /add/i }).first().click();

    await page.getByPlaceholder('Certification Name').fill('AWS Solutions Architect');
    await page.getByPlaceholder('Issuer').fill('Amazon Web Services');

    await expect(page.getByText('Cert 1')).toBeVisible();
  });

  test('step 8 — adds a language', async ({ page }) => {
    for (let i = 0; i < 7; i++) await nextStep(page); // Languages

    await expect(page.getByText('Languages')).toBeVisible();
    await page.getByPlaceholder(/english, spanish/i).fill('Spanish');
    await page.getByRole('button', { name: /add/i }).click();

    await expect(page.getByText('Spanish')).toBeVisible();
  });

  test('step 9 — finalize: selects template and sees export buttons', async ({ page }) => {
    for (let i = 0; i < 8; i++) await nextStep(page); // Finalize

    await expect(page.getByText('Choose Template & Export')).toBeVisible();
    await expect(page.getByRole('button', { name: /export pdf/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /export txt/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /check ats score/i })).toBeVisible();
  });

  test('step 9 — "Check ATS Score" button navigates to ATS Checker', async ({ page }) => {
    for (let i = 0; i < 8; i++) await nextStep(page);
    await page.getByRole('button', { name: /check ats score/i }).click();
    await expect(page.getByText('ATS Resume Scanner')).toBeVisible();
  });

  test('live preview updates as user types name', async ({ page }) => {
    await page.getByPlaceholder('John Doe').fill('Preview User');
    // The preview panel mirrors the form value
    await expect(page.locator('#resume-preview-content')).toContainText('Preview User');
  });

  test('step counter shows correct current step', async ({ page }) => {
    await expect(page.getByText('Step 1 of 9')).toBeVisible();
    await nextStep(page);
    await expect(page.getByText('Step 2 of 9')).toBeVisible();
  });

  test('Back button is disabled on first step', async ({ page }) => {
    await expect(page.getByRole('button', { name: /back/i })).toBeDisabled();
  });

  test('Next button is disabled on last step', async ({ page }) => {
    for (let i = 0; i < 8; i++) await nextStep(page);
    await expect(page.getByRole('button', { name: /next/i })).toBeDisabled();
  });

  test('can jump to any step via step pill', async ({ page }) => {
    await goToStep(page, 'Skills');
    await expect(page.getByText('Skills')).toBeVisible();
  });

  test('back navigation preserves entered data', async ({ page }) => {
    await page.getByPlaceholder('John Doe').fill('Persistent Name');
    await nextStep(page);
    await backStep(page);
    await expect(page.getByPlaceholder('John Doe')).toHaveValue('Persistent Name');
  });
});

// ---------------------------------------------------------------------------
// 4. ATS Checker
// ---------------------------------------------------------------------------

test.describe('ATS Checker', () => {
  test.beforeEach(async ({ page }) => {
    await goto(page);
    await navTo(page, 'ATS Checker');
  });

  test('page heading and subtitle are visible', async ({ page }) => {
    await expect(page.getByText('ATS Resume Scanner')).toBeVisible();
    await expect(page.getByText(/analyze your resume/i)).toBeVisible();
  });

  test('Analyze button is disabled when no resume is selected', async ({ page }) => {
    await expect(page.getByRole('button', { name: /analyze resume/i })).toBeDisabled();
  });

  test('shows "Create Resume" link when no resumes exist', async ({ page }) => {
    // On a fresh load there may be no resumes yet
    const createBtn = page.getByRole('button', { name: /create resume/i });
    if (await createBtn.isVisible()) {
      await createBtn.click();
      await expect(page.getByText('Personal Information')).toBeVisible();
    }
  });
});

// ---------------------------------------------------------------------------
// 5. Cover Letter Generator
// ---------------------------------------------------------------------------

test.describe('Cover Letter Generator', () => {
  test.beforeEach(async ({ page }) => {
    await goto(page);
    await navTo(page, 'Cover Letter');
  });

  test('page heading is visible', async ({ page }) => {
    await expect(page.getByText('Cover Letter Generator')).toBeVisible();
  });

  test('all four style cards are visible', async ({ page }) => {
    for (const style of ['Formal', 'Modern', 'Executive', 'Entry-Level']) {
      await expect(page.getByText(style)).toBeVisible();
    }
  });

  test('Generate button is disabled without required fields', async ({ page }) => {
    await expect(page.getByRole('button', { name: /generate cover letter/i })).toBeDisabled();
  });

  test('Job Title and Company Name fields accept input', async ({ page }) => {
    await page.getByPlaceholder(/software engineer/i).fill('Backend Engineer');
    await page.getByPlaceholder(/google/i).fill('OpenAI');

    await expect(page.getByPlaceholder(/software engineer/i)).toHaveValue('Backend Engineer');
    await expect(page.getByPlaceholder(/google/i)).toHaveValue('OpenAI');
  });

  test('History button toggles the view', async ({ page }) => {
    await page.getByRole('button', { name: /history/i }).click();
    // Either shows history list or empty state
    await expect(
      page.getByText(/no cover letters yet/i).or(page.getByText(/new letter/i))
    ).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 6. Job Match
// ---------------------------------------------------------------------------

test.describe('Job Match', () => {
  test.beforeEach(async ({ page }) => {
    await goto(page);
    await navTo(page, 'Job Match');
  });

  test('page heading and instructions are visible', async ({ page }) => {
    await expect(page.getByText('Job Description Match')).toBeVisible();
    await expect(page.getByText(/paste a job description/i)).toBeVisible();
  });

  test('Analyze Match button is disabled with empty textarea', async ({ page }) => {
    await expect(page.getByRole('button', { name: /analyze match/i })).toBeDisabled();
  });

  test('job description textarea accepts input and shows word count', async ({ page }) => {
    await page.getByPlaceholder(/paste the job description/i).fill(
      'We are looking for a skilled React developer with TypeScript experience.'
    );
    await expect(page.getByText(/words/)).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 7. Settings
// ---------------------------------------------------------------------------

test.describe('Settings', () => {
  test.beforeEach(async ({ page }) => {
    await goto(page);
    await navTo(page, 'Settings');
  });

  test('all settings sections are visible', async ({ page }) => {
    await expect(page.getByText('Language')).toBeVisible();
    await expect(page.getByText('Default Template')).toBeVisible();
    await expect(page.getByText('Auto-Save')).toBeVisible();
    await expect(page.getByText('Your Data')).toBeVisible();
    await expect(page.getByText('Data Management')).toBeVisible();
  });

  test('language dropdown contains expected options', async ({ page }) => {
    const select = page.locator('select').first();
    await expect(select.locator('option', { hasText: 'English' })).toHaveCount(1);
    await expect(select.locator('option', { hasText: 'Español' })).toHaveCount(1);
  });

  test('auto-save toggle is interactive', async ({ page }) => {
    const checkbox = page.locator('input[type="checkbox"]').first();
    const before = await checkbox.isChecked();
    await checkbox.click({ force: true });
    await expect(checkbox).toBeChecked({ checked: !before });
  });

  test('"Export All Data" button is visible and clickable', async ({ page }) => {
    const btn = page.getByRole('button', { name: /export all data/i });
    await expect(btn).toBeVisible();
    // Just verify it does not throw/navigate away
    await btn.click();
    await expect(page.getByText('Settings')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 8. Page navigation — all routes reachable
// ---------------------------------------------------------------------------

test.describe('Navigation — all pages reachable', () => {
  const pages: Array<{ nav: string; heading: RegExp }> = [
    { nav: 'Dashboard', heading: /welcome back/i },
    { nav: 'Resume Builder', heading: /personal information/i },
    { nav: 'ATS Checker', heading: /ats resume scanner/i },
    { nav: 'AI Optimizer', heading: /ai optimizer/i },
    { nav: 'Cover Letter', heading: /cover letter generator/i },
    { nav: 'Job Match', heading: /job description match/i },
    { nav: 'LinkedIn', heading: /linkedin/i },
    { nav: 'Career Coach', heading: /career coach/i },
    { nav: 'Settings', heading: /settings/i },
  ];

  for (const { nav, heading } of pages) {
    test(`navigates to "${nav}" and shows correct heading`, async ({ page }) => {
      await goto(page);
      await navTo(page, nav);
      await expect(page.getByText(heading).first()).toBeVisible();
    });
  }
});

// ---------------------------------------------------------------------------
// 9. Responsiveness
// ---------------------------------------------------------------------------

test.describe('Responsiveness', () => {
  test('desktop (1280×800) — sidebar visible by default', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await goto(page);
    await expect(page.getByText('ResumeAI Pro')).toBeVisible();
  });

  test('tablet (768×1024) — app loads without layout errors', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await goto(page);
    await expect(page.locator('body')).toBeVisible();
  });

  test('mobile (390×844) — app loads and mobile menu button is accessible', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await goto(page);
    // On mobile the sidebar collapses; a hamburger menu should be present
    await expect(page.getByRole('button', { name: /toggle menu/i })).toBeVisible();
  });

  test('mobile — menu opens and sidebar items are visible', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await goto(page);
    await page.getByRole('button', { name: /toggle menu/i }).click();
    await expect(page.getByRole('button', { name: 'Resume Builder' })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 10. Form validation / edge cases
// ---------------------------------------------------------------------------

test.describe('Form validation & edge cases', () => {
  test('builder step 1 — Next works even with empty required fields (soft validation)', async ({ page }) => {
    await goto(page);
    await openBuilder(page);
    // App uses soft validation — "Next" still advances the step
    await nextStep(page);
    await expect(page.getByText('Professional Summary')).toBeVisible();
  });

  test('cover letter — Generate stays disabled without a resume selected', async ({ page }) => {
    await goto(page);
    await navTo(page, 'Cover Letter');
    await page.getByPlaceholder(/software engineer/i).fill('Engineer');
    await page.getByPlaceholder(/google/i).fill('Acme');
    // No resume selected → button should remain disabled
    await expect(page.getByRole('button', { name: /generate cover letter/i })).toBeDisabled();
  });

  test('skill input — empty skill is not added', async ({ page }) => {
    await goto(page);
    await openBuilder(page);
    await goToStep(page, 'Skills');
    const before = await page.locator('.badge').count();
    await page.getByRole('button', { name: /add/i }).click(); // click Add with empty input
    const after = await page.locator('.badge').count();
    expect(after).toBe(before); // no new badge
  });

  test('language input — empty language is not added', async ({ page }) => {
    await goto(page);
    await openBuilder(page);
    await goToStep(page, 'Languages');
    const before = await page.locator('.glass-card').count();
    await page.getByRole('button', { name: /add/i }).click();
    const after = await page.locator('.glass-card').count();
    expect(after).toBe(before);
  });
});
