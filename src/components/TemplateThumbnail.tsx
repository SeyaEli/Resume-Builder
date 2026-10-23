// ============================================
// Template Thumbnail
// ============================================
// A tiny abstract drawing of what a template looks like, built from the
// template's own accent colour and layout. No images to load, and it always
// matches the real preview because both read TEMPLATE_INFO.
// ============================================

import type { CSSProperties } from 'react';
import type { TemplateLayout } from '../types/resume';

interface Props {
  layout: TemplateLayout;
  accent: string;
  width?: number;
  height?: number;
}

interface BarProps {
  w: string;
  h: number;
  color: string;
  extra?: CSSProperties;
}

function Bar({ w, h, color, extra }: BarProps) {
  return <div style={{ width: w, height: h, background: color, borderRadius: 1, ...extra }} />;
}

function Heading({ w, accent }: { w: string; accent: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 2 }}>
      <Bar w={w} h={3} color={accent} />
      <Bar w="100%" h={1} color="#ececec" />
    </div>
  );
}

function Body({ rows }: { rows: number }) {
  const line = '#d9d9d9';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          style={{
            width: i % 3 === 2 ? '65%' : '92%',
            height: 2,
            background: line,
            borderRadius: 1,
          }}
        />
      ))}
    </div>
  );
}

export default function TemplateThumbnail({ layout, accent, width = 92, height = 120 }: Props) {
  const line = '#d9d9d9';
  const soft = '#ececec';
  const ink = '#b9b9b9';

  const page: CSSProperties = {
    width, height, background: '#fff', borderRadius: 3,
    border: '1px solid var(--border-primary)', padding: 7,
    display: 'flex', flexDirection: 'column', gap: 3, overflow: 'hidden',
    boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.02)',
  };

  const blocks: Record<TemplateLayout, React.ReactNode> = {
    modern: (
      <>
        <Bar w="62%" h={5} color="#333" />
        <Bar w="40%" h={3} color={accent} />
        <Bar w="80%" h={2} color={ink} />
        <div style={{ border: `1px solid ${soft}`, borderLeft: `2px solid ${accent}`, padding: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Bar w="85%" h={2} color={line} /><Bar w="70%" h={2} color={line} />
        </div>
        <Heading w="38%" accent={accent} />
        <Body rows={4} />
      </>
    ),
    corporate: (
      <>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <Bar w="55%" h={5} color="#333" />
          <Bar w="70%" h={2} color={ink} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ height: 2, background: accent, width: '45%', margin: '3px auto 0' }} />
        </div>
        <Heading w="40%" accent={accent} />
        <Body rows={3} />
        <Heading w="30%" accent={accent} />
        <Body rows={3} />
      </>
    ),
    executive: (
      <>
        <Bar w="70%" h={7} color="#2c2c2c" />
        <Bar w="35%" h={2} color={accent} />
        <div style={{ height: 1, background: '#999', marginTop: 4 }} />
        <Heading w="45%" accent={accent} />
        <Body rows={3} />
        <Heading w="32%" accent={accent} />
        <Body rows={3} />
      </>
    ),
    technical: (
      <>
        <Bar w="55%" h={5} color="#333" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <div style={{ width: 3, height: 3, background: accent }} />
          <Bar w="60%" h={2} color={ink} />
        </div>
        <Heading w="45%" accent={accent} />
        <Body rows={2} />
        <div style={{ paddingLeft: 4, borderLeft: `2px solid ${accent}` }}><Bar w="50%" h={3} color={accent} /></div>
        <Body rows={3} />
      </>
    ),
    graduate: (
      <>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <Bar w="58%" h={5} color="#333" />
          <Bar w="72%" h={2} color={ink} />
        </div>
        <div style={{ background: soft, padding: '2px 3px', borderLeft: `2px solid ${accent}` }}><Bar w="45%" h={3} color="#555" /></div>
        <Body rows={3} />
        <div style={{ background: soft, padding: '2px 3px', borderLeft: `2px solid ${accent}` }}><Bar w="38%" h={3} color="#555" /></div>
        <Body rows={3} />
      </>
    ),
    creative: (
      <>
        <div style={{ borderLeft: `3px solid ${accent}`, paddingLeft: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Bar w="65%" h={5} color="#333" />
          <Bar w="45%" h={2} color={accent} />
          <Bar w="85%" h={2} color={ink} />
        </div>
        <Heading w="40%" accent={accent} />
        <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {['30%', '24%', '28%', '22%'].map((w, i) => (
            <div key={i} style={{ width: w, height: 6, border: `1px solid ${accent}`, borderRadius: 2 }} />
          ))}
        </div>
        <Body rows={4} />
      </>
    ),
    government: (
      <>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <Bar w="60%" h={5} color="#222" />
          <Bar w="75%" h={2} color={ink} />
        </div>
        <Bar w="100%" h={1} color="#666" extra={{ marginTop: 3 }} />
        <Heading w="40%" accent={accent} />
        <Body rows={5} />
      </>
    ),
    academic: (
      <>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <Bar w="62%" h={5} color="#333" />
          <Bar w="70%" h={2} color={ink} />
        </div>
        <Heading w="42%" accent={accent} />
        <Body rows={4} />
        <div style={{ display: 'flex', gap: 4 }}>
          <div style={{ width: '26%', display: 'flex', flexDirection: 'column', gap: 2 }}><Bar w="100%" h={2} color={ink} /><Bar w="80%" h={2} color={ink} /></div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}><Bar w="95%" h={2} color={line} /><Bar w="90%" h={2} color={line} /><Bar w="70%" h={2} color={line} /></div>
        </div>
      </>
    ),
    minimal: (
      <>
        <Bar w="45%" h={4} color="#333" extra={{ marginBottom: 4 }} />
        <Bar w="60%" h={2} color={ink} />
        <div style={{ height: 8 }} />
        <Bar w="30%" h={3} color="#555" />
        <Body rows={3} />
        <div style={{ height: 8 }} />
        <Bar w="26%" h={3} color="#555" />
        <Body rows={3} />
      </>
    ),
    elegant: (
      <>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <Bar w="58%" h={6} color="#333" />
          <Bar w="60%" h={2} color={ink} />
          <div style={{ width: '30%', height: 1, background: accent }} />
        </div>
        <Heading w="40%" accent={accent} />
        <Body rows={3} />
        <Heading w="34%" accent={accent} />
        <Body rows={3} />
      </>
    ),
    sidebar: (
      <>
        <div style={{ borderTop: `3px solid ${accent}`, paddingTop: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Bar w="60%" h={5} color="#333" />
          <Bar w="80%" h={2} color={ink} />
        </div>
        <div style={{ display: 'flex', gap: 5, flex: 1 }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Heading w="60%" accent={accent} />
            <Body rows={5} />
          </div>
          <div style={{ width: '33%', borderLeft: `2px solid ${accent}`, paddingLeft: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Bar w="70%" h={2} color={accent} />
            <Body rows={4} />
          </div>
        </div>
      </>
    ),
    compact: (
      <>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Bar w="68%" h={4} color="#333" />
          <Bar w="90%" h={2} color={ink} />
        </div>
        <div style={{ background: soft, borderLeft: `2px solid ${accent}`, padding: '1px 3px' }}><Bar w="40%" h={2} color="#555" /></div>
        <Body rows={6} />
        <div style={{ background: soft, borderLeft: `2px solid ${accent}`, padding: '1px 3px' }}><Bar w="34%" h={2} color="#555" /></div>
        <Body rows={3} />
      </>
    ),
  };

  return <div style={page}>{blocks[layout]}</div>;
}
