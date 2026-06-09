'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface HighlightPopoverProps {
  contentType: 'article' | 'lesson';
  contentSlug: string;
}

export default function HighlightPopover({ contentType, contentSlug }: HighlightPopoverProps) {
  const { user } = useAuth();
  const [selectedText, setSelectedText] = useState('');
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const handleSelectionChange = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.toString().trim()) {
      // Small delay so clicking the popover button doesn't immediately dismiss
      return;
    }

    const text = selection.toString().trim();
    if (text.length < 3) return;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    setSelectedText(text);
    setPopoverPos({
      top: rect.top + window.scrollY - 40,
      left: rect.left + window.scrollX + rect.width / 2,
    });
  }, []);

  const dismiss = useCallback(() => {
    setSelectedText('');
    setPopoverPos(null);
  }, []);

  useEffect(() => {
    if (!user) return;

    const onMouseUp = () => {
      // Slight delay to let selection finalize
      setTimeout(handleSelectionChange, 10);
    };

    const onTouchEnd = () => {
      setTimeout(handleSelectionChange, 10);
    };

    const onMouseDown = (e: MouseEvent) => {
      // If clicking outside the popover, dismiss
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        dismiss();
      }
    };

    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('touchend', onTouchEnd);
    document.addEventListener('mousedown', onMouseDown);

    return () => {
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('touchend', onTouchEnd);
      document.removeEventListener('mousedown', onMouseDown);
    };
  }, [user, handleSelectionChange, dismiss]);

  const saveHighlight = async () => {
    if (!selectedText || saving) return;
    setSaving(true);

    try {
      const res = await fetch('/api/highlights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType,
          contentSlug,
          text: selectedText,
        }),
      });

      if (res.ok) {
        setToast(true);
        dismiss();
        window.getSelection()?.removeAllRanges();
        setTimeout(() => setToast(false), 2000);
      }
    } catch {
      /* ignore */
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <style jsx>{`
        .hl-popover {
          position: absolute;
          z-index: 9999;
          transform: translateX(-50%);
          pointer-events: auto;
        }

        .hl-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          height: 28px;
          padding: 0 10px;
          background: #141414;
          border: 1px solid #3a3a3a;
          border-radius: 6px;
          color: #e8e4dc;
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
          white-space: nowrap;
        }

        :global(.light-mode) .hl-btn,
        :global(.article-page.light-mode) .hl-btn,
        :global(.lesson-page.light-mode) .hl-btn {
          background: #ffffff;
          border-color: #d8d4cc;
          color: #0a0a0a;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
        }

        .hl-btn:hover {
          border-color: #F7931A;
          color: #F7931A;
        }

        .hl-btn:active {
          background: #F7931A;
          border-color: #F7931A;
          color: #fff;
        }

        .hl-btn svg {
          width: 14px;
          height: 14px;
          flex-shrink: 0;
        }

        .hl-toast {
          position: fixed;
          bottom: 2rem;
          left: 50%;
          transform: translateX(-50%);
          z-index: 10000;
          background: #141414;
          border: 1px solid #3a3a3a;
          border-radius: 20px;
          padding: 6px 16px;
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          color: #F7931A;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
          animation: hl-fade-in 0.2s ease, hl-fade-out 0.3s ease 1.7s forwards;
        }

        :global(.light-mode) .hl-toast,
        :global(.article-page.light-mode) .hl-toast,
        :global(.lesson-page.light-mode) .hl-toast {
          background: #ffffff;
          border-color: #d8d4cc;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
        }

        @keyframes hl-fade-in {
          from { opacity: 0; transform: translateX(-50%) translateY(8px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }

        @keyframes hl-fade-out {
          from { opacity: 1; transform: translateX(-50%) translateY(0); }
          to { opacity: 0; transform: translateX(-50%) translateY(8px); }
        }
      `}</style>

      {popoverPos && selectedText && (
        <div
          ref={popoverRef}
          className="hl-popover"
          style={{ top: popoverPos.top, left: popoverPos.left }}
        >
          <button className="hl-btn" onClick={saveHighlight} disabled={saving}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            {saving ? '...' : 'Highlight'}
          </button>
        </div>
      )}

      {toast && (
        <div className="hl-toast">Saved!</div>
      )}
    </>
  );
}
