import { Page } from '@playwright/test';

export const BASE_URL = 'https://resume-builderly.vercel.app/';

/** Navigate to the app and wait for the shell to be ready. */
export async function goto(page: Page) {
  await page.goto(BASE_URL);
  // Sidebar logo signals the layout has fully hydrated
  await page.getByText('ResumeAI Pro').waitFor();
}

/** Click a sidebar nav item by its visible label. */
export async function navTo(page: Page, label: string) {
  await page.getByRole('button', { name: label }).click();
}

/** Navigate to Resume Builder and wait for Step 1. */
export async function openBuilder(page: Page) {
  await navTo(page, 'Resume Builder');
  await page.getByText('Personal Information').waitFor();
}

/** Click the "Next" step button. */
export async function nextStep(page: Page) {
  await page.getByRole('button', { name: /next/i }).click();
}

/** Click the "Back" step button. */
export async function backStep(page: Page) {
  await page.getByRole('button', { name: /back/i }).click();
}

/** Navigate to a specific builder step by clicking its step pill. */
export async function goToStep(page: Page, label: string) {
  await page.getByRole('button', { name: new RegExp(label, 'i') }).first().click();
}
