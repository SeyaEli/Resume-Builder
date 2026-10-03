/* ============================================
   Theme engine
   Applies the light/dark mode, the accent palette AND the background
   family to the document. Every colour the app uses lives in a CSS
   variable, so switching a theme is just rewriting those variables
   on <html>.

   A palette is a full colour family: it sets the accent (buttons,
   links, highlights) AND the backgrounds (page, sidebar, cards), so
   picking "Violet" recolours the whole app instead of only the
   trimmings.
   ============================================ */

import type { PaletteId, SurfaceStyle, ThemeMode } from '../types/resume';

/** The background steps a palette defines, per mode. */
export interface PaletteSurfaces {
  /** The page behind everything. */
  bgPrimary: string;
  /** Panels that sit on the page (headers, sidebars). */
  bgSecondary: string;
  /** Deeper wells: inputs, code, insets. */
  bgTertiary: string;
  /** Cards and floating panels. */
  bgCard: string;
  /** A card under the pointer. */
  bgCardHover: string;
  /** Text field backgrounds. */
  bgInput: string;
  /** The sidebar rail. */
  bgSidebar: string;
}

export interface PaletteDef {
  id: PaletteId;
  name: string;
  hint: string;
  /** The accent used on dark backgrounds (needs to glow a little). */
  dark: string;
  /** The accent used on light backgrounds (dark enough to read on white). */
  light: string;
  /** Full background family for dark mode. */
  darkSurfaces: PaletteSurfaces;
  /** Full background family for light mode. */
  lightSurfaces: PaletteSurfaces;
}

/** Build a background family from one base hue, keeping the steps related. */
function family(
  bgPrimary: string,
  bgSecondary: string,
  bgTertiary: string,
  bgCard: string,
  bgCardHover: string,
  bgInput: string,
  bgSidebar: string,
): PaletteSurfaces {
  return { bgPrimary, bgSecondary, bgTertiary, bgCard, bgCardHover, bgInput, bgSidebar };
}

export const PALETTES: PaletteDef[] = [
  {
    id: 'amber',
    name: 'Amber',
    hint: 'Warm gold on deep brown — the original look',
    dark: '#FFA929',
    light: '#B26A00',
    darkSurfaces: family('#262524', '#2E2923', '#383129', '#2E2923', '#35302A', '#35302A', '#262524'),
    lightSurfaces: family('#FFFBF5', '#FFFFFF', '#F6EFE4', '#FFFFFF', '#FBF4E9', '#FDF8F1', '#FBF6EE'),
  },
  {
    id: 'emerald',
    name: 'Emerald',
    hint: 'Fresh green on cool slate',
    dark: '#34D399',
    light: '#047857',
    darkSurfaces: family('#0F1A17', '#14211D', '#1B2C26', '#14211D', '#1A2A24', '#1A2A24', '#0F1A17'),
    lightSurfaces: family('#F5FBF8', '#FFFFFF', '#E6F4EE', '#FFFFFF', '#EFF9F4', '#F2FAF6', '#EDF8F2'),
  },
  {
    id: 'azure',
    name: 'Azure',
    hint: 'Clean corporate blue',
    dark: '#60A5FA',
    light: '#1D4ED8',
    darkSurfaces: family('#0D141F', '#121B29', '#182334', '#121B29', '#17202F', '#17202F', '#0D141F'),
    lightSurfaces: family('#F5F8FD', '#FFFFFF', '#E4ECF9', '#FFFFFF', '#EEF4FD', '#F1F6FD', '#ECF3FC'),
  },
  {
    id: 'violet',
    name: 'Violet',
    hint: 'Modern and creative',
    dark: '#A78BFA',
    light: '#6D28D9',
    darkSurfaces: family('#141020', '#1B1629', '#241D36', '#1B1629', '#221B31', '#221B31', '#141020'),
    lightSurfaces: family('#F9F6FE', '#FFFFFF', '#EDE6FA', '#FFFFFF', '#F4EFFD', '#F7F3FE', '#F4EEFD'),
  },
  {
    id: 'rose',
    name: 'Rose',
    hint: 'Bold and friendly',
    dark: '#FB7185',
    light: '#BE123C',
    darkSurfaces: family('#1A1013', '#231619', '#2E1D22', '#231619', '#2A1A1F', '#2A1A1F', '#1A1013'),
    lightSurfaces: family('#FEF6F7', '#FFFFFF', '#FBE4E8', '#FFFFFF', '#FDEFF1', '#FEF3F5', '#FDF0F2'),
  },
  {
    id: 'graphite',
    name: 'Graphite',
    hint: 'Near-monochrome, very serious',
    dark: '#D4D4D8',
    light: '#3F3F46',
    darkSurfaces: family('#17171A', '#1D1D21', '#26262B', '#1D1D21', '#242429', '#242429', '#17171A'),
    lightSurfaces: family('#F7F7F8', '#FFFFFF', '#E8E8EB', '#FFFFFF', '#F1F1F3', '#F4F4F6', '#F0F0F2'),
  },
];

/** Swatch colours shown on the palette buttons, per mode. */
export function paletteSwatch(palette: PaletteId, mode: 'dark' | 'light'): string {
  const def = PALETTES.find(p => p.id === palette) ?? PALETTES[0];
  return mode === 'light' ? def.light : def.dark;
}

// ============================================
// Surface styles
// How cards, panels and inputs are drawn. Each one is a small set of
// numbers the stylesheet reads, so one choice reshapes every panel.
// ============================================

export interface SurfaceDef {
  id: SurfaceStyle;
  name: string;
  hint: string;
  /** Corner rounding. */
  radius: string;
  /** The panel's fill: solid, or a translucent tint for glass. */
  cardBg: string | null;
  cardBgLight: string | null;
  /** Border colour. */
  border: string | null;
  borderLight: string | null;
  /** Layered shadow: the depth of the panel. */
  shadow: string;
  shadowLight: string;
  /** Inner highlight, for the soft 3D neomorph look. */
  innerShadow: string;
  innerShadowLight: string;
  /** Backdrop blur for glass. */
  blur: string;
}

export const SURFACES: SurfaceDef[] = [
  {
    id: 'flat',
    name: 'Flat',
    hint: 'No depth at all — crisp edges, hard 2px corners',
    radius: '2px',
    cardBg: null,
    cardBgLight: null,
    border: 'rgba(255, 255, 255, 0.22)',
    borderLight: 'rgba(16, 24, 40, 0.2)',
    shadow: 'none',
    shadowLight: 'none',
    innerShadow: 'none',
    innerShadowLight: 'none',
    blur: '0px',
  },
  {
    id: 'elevated',
    name: 'Elevated',
    hint: 'Panels clearly lift off the page',
    radius: '14px',
    cardBg: null,
    cardBgLight: null,
    border: null,
    borderLight: null,
    shadow: '0 2px 4px -2px rgba(0, 0, 0, 0.5), 0 10px 22px -8px rgba(0, 0, 0, 0.6), 0 24px 48px -20px rgba(0, 0, 0, 0.65)',
    shadowLight: '0 2px 4px -2px rgba(16, 24, 40, 0.14), 0 10px 22px -8px rgba(16, 24, 40, 0.18), 0 24px 48px -20px rgba(16, 24, 40, 0.22)',
    innerShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.07)',
    innerShadowLight: 'inset 0 1px 0 rgba(255, 255, 255, 0.95)',
    blur: '0px',
  },
  {
    id: 'glass',
    name: 'Glass',
    hint: 'See-through frosted panes with a bright edge',
    radius: '18px',
    cardBg: 'linear-gradient(150deg, rgba(255,255,255,0.14), rgba(255,255,255,0.03))',
    cardBgLight: 'linear-gradient(150deg, rgba(255,255,255,0.85), rgba(255,255,255,0.45))',
    border: 'rgba(255, 255, 255, 0.28)',
    borderLight: 'rgba(255, 255, 255, 0.95)',
    shadow: '0 10px 40px -10px rgba(0, 0, 0, 0.65), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
    shadowLight: '0 10px 40px -12px rgba(16, 24, 40, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.95)',
    innerShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.35), inset 0 -1px 0 rgba(255, 255, 255, 0.08)',
    innerShadowLight: 'inset 0 1px 0 rgba(255, 255, 255, 1), inset 0 -1px 0 rgba(16, 24, 40, 0.06)',
    blur: '22px',
  },
  {
    id: 'neomorph',
    name: 'Neomorph',
    hint: 'Soft 3D — strongly raised out of the surface',
    radius: '24px',
    cardBg: null,
    cardBgLight: null,
    border: 'rgba(255, 255, 255, 0.05)',
    borderLight: 'rgba(255, 255, 255, 0.75)',
    shadow: '14px 14px 34px rgba(0, 0, 0, 0.72), -10px -10px 26px rgba(255, 255, 255, 0.07)',
    shadowLight: '14px 14px 34px rgba(16, 24, 40, 0.2), -10px -10px 26px rgba(255, 255, 255, 1)',
    innerShadow: 'inset 3px 3px 8px rgba(0, 0, 0, 0.5), inset -3px -3px 8px rgba(255, 255, 255, 0.06)',
    innerShadowLight: 'inset 3px 3px 8px rgba(16, 24, 40, 0.11), inset -3px -3px 8px rgba(255, 255, 255, 0.95)',
    blur: '0px',
  },
];

export function surfaceDef(surface: SurfaceStyle): SurfaceDef {
  return SURFACES.find(s => s.id === surface) ?? SURFACES[1];
}

// ============================================
// Colour helpers
// ============================================

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
 * Write the theme onto the document. The stylesheet holds the shared
 * values; this adds the accent family AND the background family on top,
 * so one palette repaints the whole app and one surface choice
 * reshapes every panel.
 */
export function applyTheme(mode: 'dark' | 'light', palette: PaletteId, surface: SurfaceStyle = 'elevated') {
  const def = PALETTES.find(p => p.id === palette) ?? PALETTES[0];
  const surf = surfaceDef(surface);
  const accent = mode === 'light' ? def.light : def.dark;
  const isLight = mode === 'light';
  const root = document.documentElement;

  root.setAttribute('data-theme', mode);
  root.setAttribute('data-palette', def.id);
  root.setAttribute('data-surface', surf.id);
  root.style.colorScheme = mode;

  const s = root.style;

  // ---- Background family: this is what recolours the whole app ----
  const bg = isLight ? def.lightSurfaces : def.darkSurfaces;
  s.setProperty('--bg-primary', bg.bgPrimary);
  s.setProperty('--bg-secondary', bg.bgSecondary);
  s.setProperty('--bg-tertiary', bg.bgTertiary);
  s.setProperty('--bg-card', bg.bgCard);
  s.setProperty('--bg-card-hover', bg.bgCardHover);
  s.setProperty('--bg-input', bg.bgInput);
  s.setProperty('--bg-sidebar', bg.bgSidebar);

  // ---- Accent family ----
  s.setProperty('--accent-primary', accent);
  s.setProperty('--accent-hover', isLight ? mix(accent, 'black', 0.15) : mix(accent, 'white', 0.18));
  s.setProperty('--accent-active', isLight ? mix(accent, 'black', 0.28) : mix(accent, 'black', 0.14));
  s.setProperty('--accent-subtle', rgba(accent, isLight ? 0.1 : 0.14));
  s.setProperty('--accent-soft', rgba(accent, isLight ? 0.06 : 0.09));
  s.setProperty('--accent-selection', rgba(accent, 0.32));
  s.setProperty('--border-accent', rgba(accent, isLight ? 0.35 : 0.3));
  s.setProperty('--text-accent', accent);
  s.setProperty('--gradient-primary', `linear-gradient(135deg, ${accent} 0%, ${mix(accent, isLight ? 'black' : 'white', 0.16)} 100%)`);
  // The readable colour to print on top of the accent (buttons, badges).
  s.setProperty('--text-on-accent', isLight ? '#FFFFFF' : mix(accent, 'black', 0.86));
  s.setProperty('--shadow-glow', `0 0 0 1px ${rgba(accent, 0.25)}, 0 6px 20px -6px ${rgba(accent, 0.35)}`);

  // ---- Surface family ----
  s.setProperty('--radius-card', surf.radius);
  s.setProperty('--surface-shadow', isLight ? surf.shadowLight : surf.shadow);
  s.setProperty('--surface-inner', isLight ? surf.innerShadowLight : surf.innerShadow);
  s.setProperty('--glass-blur', surf.blur);
  s.setProperty('--glass-bg', isLight ? (surf.cardBgLight ?? 'rgba(255,252,245,0.92)') : (surf.cardBg ?? 'rgba(255,255,255,0.04)'));
  // The fill every panel actually paints with. Glass differs strongly here.
  s.setProperty('--panel-fill', isLight ? (surf.cardBgLight ?? 'var(--bg-card)') : (surf.cardBg ?? 'var(--bg-card)'));
  // Hover keeps the surface's own fill, lightened a touch instead of replaced.
  s.setProperty('--glass-bg-hover', surf.cardBg ? (isLight ? surf.cardBgLight : surf.cardBg) : 'var(--bg-card-hover)');
  s.setProperty('--glass-border', isLight ? (surf.borderLight ?? 'rgba(120,100,70,0.18)') : (surf.border ?? 'rgba(255,255,255,0.1)'));
  // A tinted hairline so panels keep a little of the accent's colour.
  s.setProperty('--border-primary', isLight ? rgba(accent, 0.14) : rgba(accent, 0.1));
  s.setProperty('--border-secondary', isLight ? rgba(accent, 0.2) : rgba(accent, 0.16));
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
  let surface: SurfaceStyle = 'elevated';
  try {
    const raw = window.localStorage.getItem('ats-resume-platform');
    if (raw) {
      const saved = JSON.parse(raw)?.state?.preferences ?? {};
      if (saved.theme) mode = saved.theme as ThemeMode;
      if (saved.palette) palette = saved.palette as PaletteId;
      if (saved.surface) surface = saved.surface as SurfaceStyle;
    }
  } catch {
    // Corrupt or unreadable storage: the defaults above are fine.
  }
  applyTheme(resolveMode(mode), palette, surface);
}
