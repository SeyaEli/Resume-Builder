/* ============================================
   Theme engine
   Applies the light/dark mode and the accent palette to the document.
   Every colour the app uses lives in a CSS variable, so switching a
   theme is just rewriting those variables on <html>.
   ============================================ */

import type { PaletteId, ThemeMode } from '../types/resume';

export interface PaletteDef {
  id: PaletteId;
  name: string;
  hint: string;
  /** The accent used on dark backgrounds (needs to glow a little). */
  dark: string;
  /** The accent used on light backgrounds (dark enough to read on white). */
  light: string;
}

export const PALETTES: PaletteDef[] = [
  { id: 'amber', name: 'Amber', hint: 'Warm gold — the original look', dark: '#FFA929', light: '#B26A00' },
  { id: 'emerald', name: 'Emerald', hint: 'Fresh green, easy on the eyes', dark: '#34D399', light: '#047857' },
  { id: 'azure', name: 'Azure', hint: 'Clean corporate blue', dark: '#60A5FA', light: '#1D4ED8' },
  { id: 'violet', name: 'Violet', hint: 'Modern and creative', dark: '#A78BFA', light: '#6D28D9' },
  { id: 'rose', name: 'Rose', hint: 'Bold and friendly', dark: '#FB7185', light: '#BE123C' },
  { id: 'graphite', name: 'Graphite', hint: 'Near-monochrome, very serious', dark: '#D4D4D8', light: '#3F3F46' },
];

/** Swatch colours shown on the palette buttons, per mode. */
export function paletteSwatch(palette: PaletteId, mode: 'dark' | 'light'): string {
  const def = PALETTES.find(p => p.id === palette) ?? PALETTES[0];
  return mode === 'light' ? def.light : def.dark;
}

const HEX = /^#?([0-9a-f]{6})$/i;

function mix(hex: string, target: 'white' | 'black', amount: number): string {
  const m = HEX.exec(hex.trim());
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const t = target === 'white' ? 255 : 0;
  const x = (c: number) => Math.round(c + (t - c) * amount);
  return `rgb(${x(r)}, ${x(g)}, ${x(b)})`;
}

function rgba(hex: string, alpha: number): string {
  const m = HEX.exec(hex.trim());
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

/**
 * Write the theme onto the document. The stylesheet holds both light and
 * dark values; this adds the accent family on top so one accent drives
 * every button, badge and highlight in the app.
 */
export function applyTheme(mode: 'dark' | 'light', palette: PaletteId) {
  const def = PALETTES.find(p => p.id === palette) ?? PALETTES[0];
  const accent = mode === 'light' ? def.light : def.dark;
  const root = document.documentElement;

  root.setAttribute('data-theme', mode);
  root.setAttribute('data-palette', def.id);
  root.style.colorScheme = mode;

  const s = root.style;
  s.setProperty('--accent-primary', accent);
  s.setProperty('--accent-hover', mode === 'light' ? mix(accent, 'black', 0.15) : mix(accent, 'white', 0.18));
  s.setProperty('--accent-active', mode === 'light' ? mix(accent, 'black', 0.28) : mix(accent, 'black', 0.14));
  s.setProperty('--accent-subtle', rgba(accent, mode === 'light' ? 0.1 : 0.14));
  s.setProperty('--accent-soft', rgba(accent, mode === 'light' ? 0.06 : 0.09));
  s.setProperty('--accent-selection', rgba(accent, 0.32));
  s.setProperty('--border-accent', rgba(accent, mode === 'light' ? 0.35 : 0.3));
  s.setProperty('--text-accent', accent);
  s.setProperty('--gradient-primary', `linear-gradient(135deg, ${accent} 0%, ${mix(accent, mode === 'light' ? 'black' : 'white', 0.16)} 100%)`);
  // The readable colour to print on top of the accent (buttons, badges).
  s.setProperty('--text-on-accent', mode === 'light' ? '#FFFFFF' : mix(accent, 'black', 0.86));
  s.setProperty('--shadow-glow', `0 0 0 1px ${rgba(accent, 0.25)}, 0 6px 20px -6px ${rgba(accent, 0.35)}`);
}

/** What the mode actually resolves to right now (follows the OS for 'system'). */
export function resolveMode(mode: ThemeMode): 'dark' | 'light' {
  if (mode !== 'system') return mode;
  if (typeof window === 'undefined' || !window.matchMedia) return 'dark';
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

/** Live listener so 'system' follows the OS while the app is open. */
export function watchSystemTheme(onChange: () => void): () => void {
  if (typeof window === 'undefined' || !window.matchMedia) return () => { };
  const mq = window.matchMedia('(prefers-color-scheme: light)');
  const handler = () => onChange();
  mq.addEventListener('change', handler);
  return () => mq.removeEventListener('change', handler);
}

/**
 * Read the saved theme straight out of localStorage, before React mounts.
 * Painting the right colours on the very first frame avoids a white flash
 * for people who chose dark mode (and a dark flash for light mode).
 */
export function applyStoredThemeEarly(): void {
  if (typeof window === 'undefined') return;
  let mode: ThemeMode = 'dark';
  let palette: PaletteId = 'amber';
  try {
    const raw = window.localStorage.getItem('ats-resume-platform');
    if (raw) {
      const saved = JSON.parse(raw)?.state?.preferences ?? {};
      if (saved.theme) mode = saved.theme as ThemeMode;
      if (saved.palette) palette = saved.palette as PaletteId;
    }
  } catch {
    // Corrupt or unreadable storage: the defaults above are fine.
  }
  applyTheme(resolveMode(mode), palette);
}
