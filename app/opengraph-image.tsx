import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const runtime = 'nodejs';
export const alt = 'CONTRA\u20bfXND - Bitcoin Intelligence. Macro, markets, and on-chain tools.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function SocialImage() {
  const [display, mono] = await Promise.all([
    readFile(join(process.cwd(), 'assets/fonts/Jost-SemiBold.ttf')),
    readFile(join(process.cwd(), 'assets/fonts/SpaceMono-Regular.ttf')),
  ]);

  return new ImageResponse(
    <div style={{
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      background: '#090909', color: '#f1eee7', padding: '56px 60px 44px',
      fontFamily: 'Jost', borderTop: '8px solid #f7931a',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontFamily: 'Space Mono', fontSize: 20, letterSpacing: '0.08em', color: '#b8b3aa' }}>
        <span>BITCOIN INTELLIGENCE</span>
        <span style={{ color: '#f7931a' }}>CONTRABXND.IO</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', flexGrow: 1, paddingBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', fontSize: 164,
          fontWeight: 600, letterSpacing: '-0.045em', lineHeight: 1 }}>
          <span>CONTRA</span>
          {/* Draw the Bitcoin B explicitly so image renderers cannot substitute a missing glyph. */}
          <svg width="96" height="134" viewBox="0 0 86 112" fill="#f7931a"
            style={{ margin: '0 3px 0 1px', flexShrink: 0 }}>
            <path d="M28 0h7v16h-7zM42 0h7v16h-7zM28 96h7v16h-7zM42 96h7v16h-7z" />
            <path fillRule="evenodd" d="M12 12h32c22 0 33 9 33 26 0 9-5 16-14 20 13 3 19 11 19 23 0 15-12 22-36 22H12V88h10V27H12V12zm25 16v22h9c10 0 15-4 15-11s-5-11-15-11h-9zm0 37v23h11c12 0 18-4 18-11 0-8-6-12-18-12H37z" />
          </svg>
          <span>XND</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', borderTop: '1px solid #45413a', paddingTop: 28, gap: 24 }}>
        <span style={{ fontSize: 46, fontWeight: 600, lineHeight: 1.1, letterSpacing: '-0.015em' }}>
          Bitcoin intelligence. Built for conviction.
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14,
          fontFamily: 'Space Mono', fontSize: 21, letterSpacing: '0.04em', color: '#b8b3aa' }}>
          <span style={{ width: 10, height: 10, background: '#f7931a', marginRight: 4 }} />
          <span>MACRO</span><span style={{ color: '#f7931a' }}>/</span>
          <span>MARKETS</span><span style={{ color: '#f7931a' }}>/</span>
          <span>ON-CHAIN</span>
        </div>
      </div>
    </div>,
    {
      ...size,
      fonts: [
        { name: 'Jost', data: display, style: 'normal', weight: 600 },
        { name: 'Space Mono', data: mono, style: 'normal', weight: 400 },
      ],
    },
  );
}
