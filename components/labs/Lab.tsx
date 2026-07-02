'use client';

import { ReactNode } from 'react';
import { LAB_ANCHOR } from '@/lib/labs';

/**
 * Shared wrapper for interactive lesson labs — a bordered panel with a "LIVE
 * LAB" badge, title, the widget body, and an optional teaching note. Styled to
 * match the FML system; works in light and dark. Carries the LAB_ANCHOR id so
 * the lesson header's "Live Lab" badge can jump straight to it.
 */
export default function Lab({ title, note, children }: { title: string; note?: ReactNode; children: ReactNode }) {
  return (
    <>
      <style jsx global>{`
        .lab { scroll-margin-top: 90px; border: 1px solid var(--cb-border); border-radius: var(--cb-radius); margin: 2rem 0; overflow: hidden; background: var(--cb-surface); }
        .lab-head { display: flex; align-items: center; gap: 12px; padding: 12px 18px; border-bottom: 1px solid var(--cb-border); background: var(--cb-bg-surface); }
        .lab-badge { display: inline-flex; align-items: center; gap: 6px; font-family: var(--cb-font-mono); font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--cb-accent); }
        .lab-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--cb-accent); animation: pulse-dot 2s ease-in-out infinite; }
        .lab-title { font-family: var(--cb-font-mono); font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--cb-text-muted); }
        .lab-body { padding: 18px; }
        .lab-note { padding: 12px 18px; border-top: 1px solid var(--cb-border); background: var(--cb-accent-subtle); font-size: 13px; line-height: 1.6; color: var(--cb-text-muted); }
        .lab-note strong { color: var(--cb-text); }
        .lab-btn { background: var(--cb-text); color: var(--cb-bg); border: none; border-radius: var(--cb-radius); font-family: var(--cb-font-mono); font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase; padding: 8px 16px; cursor: pointer; transition: opacity 0.15s ease; }
        .lab-btn:hover { opacity: 0.85; }
        .lab-btn:disabled { opacity: 0.4; cursor: default; }
      `}</style>
      <div className="lab" id={LAB_ANCHOR}>
        <div className="lab-head">
          <span className="lab-badge"><span className="lab-dot" /> Live Lab</span>
          <span className="lab-title">{title}</span>
        </div>
        <div className="lab-body">{children}</div>
        {note && <div className="lab-note">{note}</div>}
      </div>
    </>
  );
}
