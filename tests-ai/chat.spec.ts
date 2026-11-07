import { test, expect } from '@playwright/test';

const answer = '**Answering “What is your weakness?”**\n\n1. **Pick a real, work-related weakness**\n   - Choose something you are actively improving.\n   - Avoid clichés and explain your own experience.\n\n2. **Demonstrate improvement**\n   - Describe the steps you have taken.\n\n> I used to take on too much work. Now I discuss priorities before committing.\n\nKeep your answer honest and specific.';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Escape');
  await page.evaluate(async content => {
    const { useResumeStore } = await import('/src/stores/resumeStore.ts');
    const state = useResumeStore.getState();
    useResumeStore.setState({ currentPage: 'career-coach', sidebarOpen: false, preferences: { ...state.preferences, theme: 'dark', palette: 'amber', surface: 'flat' }, chatMessages: [
      { id: 'q1', role: 'user', content: 'How can I answer “What is your weakness?”', timestamp: new Date().toISOString() },
      { id: 'a1', role: 'assistant', content, timestamp: new Date().toISOString() },
    ] });
  }, answer);
  await expect(page.locator('.app-content > div')).toHaveCSS('opacity', '1');
  await expect(page.locator('.career-chat').locator('..')).toHaveCSS('opacity', '1');
});

test('coach renders readable emphasis, lists and quotes without raw markers', async ({ page }) => {
  const reply = page.locator('.chat-message.assistant');
  await expect(reply.locator('strong').first()).toHaveText('Answering “What is your weakness?”');
  await expect(reply.locator('ol > li')).toHaveCount(2);
  await expect(reply.locator('blockquote')).toContainText('I used to take on too much work.');
  expect(await reply.innerText()).not.toContain('**');
  expect(parseFloat(await reply.evaluate(el => getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(16);
  await page.locator('.chat-messages').evaluate(el => { el.scrollTop = 0; });
  await page.screenshot({ path: 'test-results/chat-desktop.png', fullPage: true, animations: 'disabled' });
});

test('model output cannot create HTML scripts or tracking images', async ({ page }) => {
  await page.evaluate(async () => {
    const { useResumeStore } = await import('/src/stores/resumeStore.ts');
    useResumeStore.getState().addChatMessage({ id: 'unsafe', role: 'assistant', content: '<script>window.chatInjected=true</script>\n\n![tracker](https://tracker.invalid/pixel)\n\n[Unsafe](javascript:alert(1))', timestamp: new Date().toISOString() });
  });
  const reply = page.locator('.chat-message.assistant').last();
  await expect(reply.locator('script, img, iframe')).toHaveCount(0);
  await expect(reply.locator('a[href^="javascript:"]')).toHaveCount(0);
});

test('chat fits mobile and supports multiline messages', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('.app-main')).toHaveCSS('margin-left', '0px');
  const input = page.getByRole('textbox', { name: 'Message the career coach' });
  await input.fill('First line');
  await input.press('Shift+Enter');
  await input.press('End');
  await input.press('x');
  await expect(input).toHaveValue('First line\nx');
  await expect(page.getByRole('button', { name: 'Send message' })).toBeEnabled();
  const size = await page.evaluate(() => ({ width: document.documentElement.clientWidth, content: document.documentElement.scrollWidth,
    overflow: [...document.querySelectorAll('body *')].map(el => ({ name: el.className, right: el.getBoundingClientRect().right, width: el.getBoundingClientRect().width })).filter(el => el.right > innerWidth && el.width > 0).slice(0, 12) }));
  await page.locator('.chat-messages').evaluate(el => { el.scrollTop = 0; });
  await page.screenshot({ path: 'test-results/chat-mobile.png', fullPage: true, animations: 'disabled' });
  expect(size.content, JSON.stringify(size.overflow)).toBeLessThanOrEqual(size.width);
});

test('user messages retain readable contrast across themes and surfaces', async ({ page }) => {
  await expect(page.locator('.chat-message.user')).toBeVisible();
  const results = await page.evaluate(async () => {
    const { useResumeStore } = await import('/src/stores/resumeStore.ts');
    function luminance(value: string) {
      const channels = value.match(/[\d.]+/g)!.slice(0, 3).map(Number).map(n => {
        const s = n / 255; return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      });
      return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
    }
    const results = [];
    for (const theme of ['light', 'dark']) for (const surface of ['flat', 'glass', 'neomorph', 'elevated']) {
      useResumeStore.setState({ preferences: { ...useResumeStore.getState().preferences, theme, surface } });
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const style = getComputedStyle(document.querySelector('.chat-message.user')!);
      const a = luminance(style.color), b = luminance(style.backgroundColor);
      results.push({ theme, surface, ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) });
    }
    return results;
  });
  for (const result of results) expect(result.ratio, `${result.theme}/${result.surface}`).toBeGreaterThanOrEqual(4.5);
});
