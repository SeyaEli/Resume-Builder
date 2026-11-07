import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => { await page.goto('/'); });

test('legacy browser credentials are removed, and only safe preferences persist', async ({ page }) => {
  const result = await page.evaluate(async () => {
    localStorage.setItem('ats-resume-platform-ai', JSON.stringify({ provider: 'connected', apiKey: 'gsk_OLD_SECRET', baseUrl: 'https://old.example' }));
    const ai = await import('/src/services/aiService.ts');
    ai.getAiConfig();
    ai.saveAiConfig({ provider: 'groq', model: 'openai/gpt-oss-20b' });
    ai.setAiAccessPassword('visit-password');
    return { config: ai.getAiConfig(), stored: JSON.stringify({ ...localStorage }) };
  });
  expect(result.config.provider).toBe('groq');
  expect(result.stored).not.toContain('gsk_OLD_SECRET');
  expect(result.stored).not.toContain('visit-password');
  expect(result.stored).not.toContain('old.example');
});

test('Groq requests go only to the app server and include coaching history', async ({ page }) => {
  await page.route('**/api/ai', async route => {
    const body = route.request().postDataJSON();
    expect(body.history).toEqual([{ role: 'user', content: 'I want to switch careers' }]);
    expect(body).not.toHaveProperty('apiKey');
    expect(route.request().headers().authorization).toBe('Bearer visit-password');
    await route.fulfill({ json: { text: 'Build one relevant portfolio project.' } });
  });
  const result = await page.evaluate(async () => {
    const ai = await import('/src/services/aiService.ts');
    ai.saveAiConfig({ provider: 'groq', model: '' }); ai.setAiAccessPassword('visit-password');
    return ai.runAi({ kind: 'coach', input: 'What next?', history: [{ role: 'user', content: 'I want to switch careers' }] });
  });
  expect(result).toEqual({ text: 'Build one relevant portfolio project.', provider: 'groq' });
});

test('failed Groq requests produce explicit offline fallback', async ({ page }) => {
  await page.route('**/api/ai', route => route.fulfill({ status: 429, json: { error: 'Groq rate limit reached. Try again shortly.' } }));
  const result = await page.evaluate(async () => {
    const ai = await import('/src/services/aiService.ts');
    ai.saveAiConfig({ provider: 'groq', model: '' }); ai.setAiAccessPassword('visit-password');
    return ai.runAi({ kind: 'coach', input: 'Interview preparation' });
  });
  expect(result.provider).toBe('builtin');
  expect(result.text.length).toBeGreaterThan(50);
  expect(result.fallbackReason).toContain('rate limit');
});

test('optimizer preserves identity and rejects changed experience structure', async ({ page }) => {
  let malformed = false;
  await page.route('**/api/ai', route => route.fulfill({ json: { text: JSON.stringify({ summary: 'Engineer building APIs.', experience: malformed ? [] : [{ id: 'exp-1', bullets: ['Built APIs for Acme'] }] }) } }));
  const run = () => page.evaluate(async () => {
    const ai = await import('/src/services/aiService.ts');
    const { createEmptyResume } = await import('/src/types/resume.ts');
    const resume = createEmptyResume(); resume.personalInfo.fullName = 'Ada Example';
    resume.experience = [{ id: 'exp-1', company: 'Acme', jobTitle: 'Engineer', location: '', startDate: '2023-01', endDate: '', current: true, bullets: ['Responsible for APIs'] }];
    ai.saveAiConfig({ provider: 'groq', model: '' }); ai.setAiAccessPassword('visit-password');
    return ai.optimizeWithAi(resume, { generateSummary: true, rewriteBullets: true, addMetrics: false });
  });
  const result = await run();
  expect(result.provider).toBe('groq');
  expect(result.updated.personalInfo.fullName).toBe('Ada Example');
  expect(result.updated.experience[0].company).toBe('Acme');
  expect(result.updated.experience[0].bullets).toEqual(['Built APIs for Acme']);
  malformed = true;
  const fallback = await run();
  expect(fallback.provider).toBe('builtin');
  expect(fallback.fallbackReason).toContain('invalid rewrite');
  expect(fallback.updated.experience).toHaveLength(1);
});

test('Settings unlocks a connection without storing credentials', async ({ page }) => {
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByRole('button', { name: /Groq AI Use Groq/ }).click();
  const password = page.getByLabel('App access password');
  await password.fill('gsk_NOT_AN_APP_PASSWORD');
  await expect(page.getByRole('button', { name: 'Test connection' })).toBeDisabled();
  await password.fill('visit-password');
  await page.route('**/api/ai', route => route.fulfill({ json: { models: ['openai/gpt-oss-20b'] } }));
  await page.getByRole('button', { name: 'Test connection' }).click();
  await expect(page.getByText('Groq connected. Your API key stays on the server.')).toBeVisible();
  expect(await page.evaluate(() => JSON.stringify({ ...localStorage }))).not.toContain('visit-password');
});

test('cover letter screen uses the chosen AI and saves its result', async ({ page }) => {
  await page.evaluate(async () => {
    const { useResumeStore } = await import('/src/stores/resumeStore.ts');
    const { createEmptyResume } = await import('/src/types/resume.ts');
    const ai = await import('/src/services/aiService.ts');
    const resume = createEmptyResume(); resume.personalInfo.fullName = 'Ada Example';
    useResumeStore.getState().addResume(resume);
    useResumeStore.getState().setActiveResume(resume.id);
    ai.saveAiConfig({ provider: 'groq', model: '' }); ai.setAiAccessPassword('visit-password');
  });
  await page.route('**/api/ai', route => {
    const body = route.request().postDataJSON();
    expect(body.kind).toBe('cover-letter'); expect(body.input).toContain('Engineer at Example Co');
    return route.fulfill({ json: { text: 'I build useful software.\n\nMy work fits this role.\n\nThank you for considering my application.' } });
  });
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Cover Letter', exact: true }).click();
  await page.getByPlaceholder('e.g., Software Engineer').fill('Engineer');
  await page.getByPlaceholder('e.g., Google').fill('Example Co');
  await page.getByRole('button', { name: 'Generate Cover Letter', exact: true }).click();
  await expect(page.getByText(/I build useful software/)).toBeVisible();
  const saved = await page.evaluate(async () => {
    const { useResumeStore } = await import('/src/stores/resumeStore.ts');
    return useResumeStore.getState().coverLetters.at(-1);
  });
  expect(saved.content).toContain('I build useful software.');
  expect(saved.targetCompany).toBe('Example Co');
});

test('optimizer refuses a blank replacement for an existing summary', async ({ page }) => {
  await page.route('**/api/ai', route => route.fulfill({ json: { text: JSON.stringify({ summary: '   ', experience: [] }) } }));
  const result = await page.evaluate(async () => {
    const ai = await import('/src/services/aiService.ts');
    const { createEmptyResume } = await import('/src/types/resume.ts');
    const resume = createEmptyResume(); resume.summary = 'Engineer building reliable APIs.';
    ai.saveAiConfig({ provider: 'groq', model: '' }); ai.setAiAccessPassword('visit-password');
    return ai.optimizeWithAi(resume, { generateSummary: true, rewriteBullets: false, addMetrics: false });
  });
  expect(result.provider).toBe('builtin');
  expect(result.updated.summary.trim()).not.toBe('');
});

test('offline optimizer does not append duplicate measurement placeholders', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const { rewriteBullet } = await import('/src/services/aiEngine.ts');
    const once = rewriteBullet('Responsible for reporting', { addMetrics: true });
    const twice = rewriteBullet(once.text, { addMetrics: true });
    return { once: once.text, twice: twice.text };
  });
  expect(result.twice).toBe(result.once);
});

test('optimizer sends skills and education for a graduate without experience', async ({ page }) => {
  await page.route('**/api/ai', route => {
    const body = route.request().postDataJSON();
    expect(body.context).toContain('SQL'); expect(body.context).toContain('Computer Science');
    return route.fulfill({ json: { text: JSON.stringify({ summary: 'Computer Science graduate with SQL skills.', experience: [] }) } });
  });
  const result = await page.evaluate(async () => {
    const ai = await import('/src/services/aiService.ts');
    const { createEmptyResume } = await import('/src/types/resume.ts');
    const resume = createEmptyResume();
    resume.skills = [{ id: 's1', name: 'SQL', category: 'hard' }];
    resume.education = [{ id: 'e1', degree: 'Computer Science', institution: 'Example University', location: 'Manila', year: '2026' }];
    ai.saveAiConfig({ provider: 'groq', model: '' }); ai.setAiAccessPassword('visit-password');
    return ai.optimizeWithAi(resume, { generateSummary: true, rewriteBullets: false, addMetrics: false });
  });
  expect(result.provider).toBe('groq');
  expect(result.updated.summary).toContain('SQL');
});
