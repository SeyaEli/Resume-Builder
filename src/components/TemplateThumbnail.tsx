// ============================================
// Template Thumbnail
// ============================================
// A tiny abstract drawing of what a template looks like, built from the
// template's own accent colour and layout. No images to load, and it always
// matches the real preview because both read TEMPLATE_INFO.
// ============================================

import type { TemplateLayout } from '../types/resume';

interface Props {
  layout: TemplateLayout;
  accent: string;
  width?: number;
  height?: number;
}

const BAR = (w: string, h: number, color: string, extra: React.CSSProperties = {}) => (
  <div style={{ width: w, height: h, background: color, borderRadius: 1, ...extra }} />
);

export default function TemplateThumbnail({ layout, accent, width = 92, height = 120 }: Props) {
  const line = '#d9d9d9';
  const soft = '#ececec';
  const ink = '#b9b9b9';

  const page: React.CSSProperties = {
    width, height, background: '#fff', borderRadius: 3,
    border: '1px solid var(--border-primary)', padding: 7,
    display: 'flex', flexDirection: 'column', gap: 3, overflow: 'hidden',
    boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.02)',
  };

  const heading = (w: string) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 2 }}>
      {BAR(w, 3, accent)}
      {BAR('100%', 1, soft)}
    </div>
  );

  const body = (rows: number) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {Array.from({ length: rows }).map((_, i) => BAR(i % 3 === 2 ? '65%' : '92%', 2, line))}
    </div>
  );

  const blocks: Record<TemplateLayout, React.ReactNode> = {
    modern: (
      <>
        {BAR('62%', 5, '#333')}
        {BAR('40%', 3, accent)}
        {BAR('80%', 2, ink)}
        <div style={{ border: `1px solid ${soft}`, borderLeft: `2px solid ${accent}`, padding: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {BAR('85%', 2, line)}{BAR('70%', 2, line)}
        </div>
        {heading('38%')}
        {body(4)}
      </>
    ),
    corporate: (
      <>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          {BAR('55%', 5, '#333')}
          {BAR('70%', 2, ink)}
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ height: 2, background: accent, width: '45%', margin: '3px auto 0' }} />
        </div>
        {heading('40%')}
        {body(3)}
        {heading('30%')}
        {body(3)}
      </>
    ),
    executive: (
      <>
        {BAR('70%', 7, '#2c2c2c')}
        {BAR('35%', 2, accent)}
        <div style={{ height: 1, background: '#999', marginTop: 4 }} />
        {heading('45%')}
        {body(3)}
        {heading('32%')}
        {body(3)}
      </>
    ),
    technical: (
      <>
        {BAR('55%', 5, '#333')}
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <div style={{ width: 3, height: 3, background: accent }} />
          {BAR('60%', 2, ink)}
        </div>
        {heading('45%')}
        {body(2)}
        <div style={{ paddingLeft: 4, borderLeft: `2px solid ${accent}` }}>{BAR('50%', 3, accent)}</div>
        {body(3)}
      </>
    ),
    graduate: (
      <>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          {BAR('58%', 5, '#333')}
          {BAR('72%', 2, ink)}
        </div>
        <div style={{ background: soft, padding: '2px 3px', borderLeft: `2px solid ${accent}` }}>{BAR('45%', 3, '#555')}</div>
        {body(3)}
        <div style={{ background: soft, padding: '2px 3px', borderLeft: `2px solid ${accent}` }}>{BAR('38%', 3, '#555')}</div>
        {body(3)}
      </>
    ),
    creative: (
      <>
        <div style={{ borderLeft: `3px solid ${accent}`, paddingLeft: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {BAR('65%', 5, '#333')}
          {BAR('45%', 2, accent)}
          {BAR('85%', 2, ink)}
        </div>
        {heading('40%')}
        <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {['30%', '24%', '28%', '22%'].map((w, i) => (
            <div key={i} style={{ width: w, height: 6, border: `1px solid ${accent}`, borderRadius: 2 }} />
          ))}
        </div>
        {body(4)}
      </>
    ),
    government: (
      <>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          {BAR('60%', 5, '#222')}
          {BAR('75%', 2, ink)}
        </div>
        {BAR('100%', 1, '#666', { marginTop: 3 })}
        {heading('40%')}
        {body(5)}
      </>
    ),
    academic: (
      <>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          {BAR('62%', 5, '#333')}
          {BAR('70%', 2, ink)}
        </div>
        {heading('42%')}
        {body(4)}
        <div style={{ display: 'flex', gap: 4 }}>
          <div style={{ width: '26%', display: 'flex', flexDirection: 'column', gap: 2 }}>{BAR('100%', 2, ink)}{BAR('80%', 2, ink)}</div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>{BAR('95%', 2, line)}{BAR('90%', 2, line)}{BAR('70%', 2, line)}</div>
        </div>
      </>
    ),
    minimal: (
      <>
        {BAR('45%', 4, '#333', { marginBottom: 4 })}
        {BAR('60%', 2, ink)}
        <div style={{ height: 8 }} />
        {BAR('30%', 3, '#555')}
        {body(3)}
        <div style={{ height: 8 }} />
        {BAR('26%', 3, '#555')}
        {body(3)}
      </>
    ),
    elegant: (
      <>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          {BAR('58%', 6, '#333')}
          {BAR('60%', 2, ink)}
          <div style={{ width: '30%', height: 1, background: accent }} />
        </div>
        {heading('40%')}
        {body(3)}
        {heading('34%')}
        {body(3)}
      </>
    ),
    sidebar: (
      <>
        <div style={{ borderTop: `3px solid ${accent}`, paddingTop: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {BAR('60%', 5, '#333')}
          {BAR('80%', 2, ink)}
        </div>
        <div style={{ display: 'flex', gap: 5, flex: 1 }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {heading('60%')}
            {body(5)}
          </div>
          <div style={{ width: '33%', borderLeft: `2px solid ${accent}`, paddingLeft: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {BAR('70%', 2, accent)}
            {body(4)}
          </div>
        </div>
      </>
    ),
    compact: (
      <>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {BAR('68%', 4, '#333')}
          {BAR('90%', 2, ink)}
        </div>
        <div style={{ background: soft, borderLeft: `2px solid ${accent}`, padding: '1px 3px' }}>{BAR('40%', 2, '#555')}</div>
        {body(6)}
        <div style={{ background: soft, borderLeft: `2px solid ${accent}`, padding: '1px 3px' }}>{BAR('34%', 2, '#555')}</div>
        {body(3)}
      </>
    ),
  };

  return <div style={page}>{blocks[layout]}</div>;
}
