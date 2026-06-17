import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Contrabxnd — Bitcoin Intelligence Platform';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: '#0a0a0a',
          fontFamily: 'monospace',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <span
              style={{
                fontSize: '64px',
                fontWeight: 700,
                color: '#e8e4dc',
                letterSpacing: '-0.02em',
              }}
            >
              CONTRA
            </span>
            <span
              style={{
                fontSize: '64px',
                fontWeight: 700,
                color: '#F7931A',
                letterSpacing: '-0.02em',
              }}
            >
              B
            </span>
            <span
              style={{
                fontSize: '64px',
                fontWeight: 700,
                color: '#e8e4dc',
                letterSpacing: '-0.02em',
              }}
            >
              XND
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#22c55e',
              }}
            />
            <span
              style={{
                fontSize: '20px',
                color: '#6a6a6a',
                letterSpacing: '0.2em',
                textTransform: 'uppercase' as const,
              }}
            >
              Bitcoin Intelligence Platform
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              gap: '32px',
              marginTop: '24px',
            }}
          >
            {['Terminal', 'Signals', 'FedWatch', 'ETF Flows', 'AI Analyst'].map(
              (label) => (
                <span
                  key={label}
                  style={{
                    fontSize: '14px',
                    color: '#3a3a3a',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase' as const,
                    borderBottom: '1px solid #1a1a1a',
                    paddingBottom: '4px',
                  }}
                >
                  {label}
                </span>
              )
            )}
          </div>
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: '32px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span
            style={{
              fontSize: '13px',
              color: '#3a3a3a',
              letterSpacing: '0.1em',
            }}
          >
            contrabxnd.io
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
