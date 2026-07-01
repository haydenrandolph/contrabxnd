'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import InfraShell from '@/components/infra/InfraShell';

interface Msg { role: 'user' | 'assistant'; content: string; tools?: string[] }

const EXAMPLES = [
  "What's the balance of 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa?",
  "What does the mempool look like right now?",
  "Show me block 840000",
  "What are recommended fees right now?",
];

export default function ExplorerPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const send = useCallback(async (text: string) => {
    const q = text.trim();
    if (!q || loading) return;
    setError(null);
    const next: Msg[] = [...messages, { role: 'user', content: q }];
    setMessages(next);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/explorer/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next.map((m) => ({ role: m.role, content: m.content })) }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Something went wrong'); setLoading(false); return; }
      setMessages((m) => [...m, { role: 'assistant', content: data.answer, tools: data.tools_used }]);
    } catch {
      setError('Network error — try again.');
    }
    setLoading(false);
  }, [messages, loading]);

  const onSubmit = (e: React.FormEvent) => { e.preventDefault(); send(input); };

  return (
    <>
      <style jsx global>{`
        .cx-chat { display: flex; flex-direction: column; height: calc(100vh - 260px); min-height: 420px; }
        .cx-stream { flex: 1; overflow-y: auto; padding-right: 4px; }
        .cx-empty { color: var(--cb-text-muted); font-size: 14px; line-height: 1.7; }
        .cx-examples { display: flex; flex-direction: column; gap: 8px; margin-top: 20px; }
        .cx-example { text-align: left; border: 1px solid var(--cb-border); border-radius: var(--cb-radius); background: var(--cb-surface); color: var(--cb-text); font-family: var(--cb-font-mono); font-size: 12.5px; padding: 12px 14px; cursor: pointer; transition: border-color 0.15s ease; }
        .cx-example:hover { border-color: var(--cb-accent); }

        .cx-msg { margin-bottom: 20px; }
        .cx-role { font-family: var(--cb-font-mono); font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--cb-text-dim); margin-bottom: 6px; }
        .cx-role.you { color: var(--cb-accent); }
        .cx-body { font-size: 14.5px; line-height: 1.7; color: var(--cb-text); white-space: pre-wrap; word-break: break-word; }
        .cx-tools { margin-top: 8px; font-family: var(--cb-font-mono); font-size: 10px; letter-spacing: 0.04em; color: var(--cb-text-dim); }
        .cx-tools code { color: var(--cb-text-muted); }

        .cx-thinking { display: inline-flex; gap: 5px; align-items: center; color: var(--cb-text-muted); font-size: 13px; }
        .cx-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--cb-accent); animation: pulse-dot 1.4s ease-in-out infinite; }

        .cx-error { border: 1px solid var(--cb-border); border-left: 2px solid var(--cb-accent); border-radius: var(--cb-radius); padding: 12px 14px; color: var(--cb-text-muted); font-size: 13px; margin-bottom: 16px; }

        .cx-form { display: flex; gap: 8px; padding-top: 16px; border-top: 1px solid var(--cb-border); }
        .cx-input { flex: 1; background: var(--cb-bg); border: 1px solid var(--cb-border); border-radius: var(--cb-radius); color: var(--cb-text); font-family: var(--cb-font-sans); font-size: 14px; padding: 12px 14px; outline: none; transition: border-color 0.15s ease; }
        .cx-input:focus { border-color: var(--cb-accent); }
        .cx-send { background: var(--cb-text); color: var(--cb-bg); border: none; border-radius: var(--cb-radius); font-family: var(--cb-font-mono); font-size: 12px; letter-spacing: 0.06em; text-transform: uppercase; padding: 0 22px; cursor: pointer; transition: opacity 0.15s ease; }
        .cx-send:hover { opacity: 0.85; }
        .cx-send:disabled { opacity: 0.4; cursor: default; }
      `}</style>

      <InfraShell
        slug="explorer"
        title="Block Explorer"
        subtitle="Ask about any address, transaction, block, the mempool, or fees — answered live from the Contrabxnd sovereign node."
      >
        <div className="cx-chat">
          <div className="cx-stream" ref={scrollRef}>
            {messages.length === 0 && !loading && (
              <div className="cx-empty">
                Ask a question in plain English and the on-chain analyst will query the node to answer.
                <div className="cx-examples">
                  {EXAMPLES.map((ex) => (
                    <button key={ex} className="cx-example" onClick={() => send(ex)}>{ex}</button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div className="cx-msg" key={i}>
                <div className={`cx-role ${m.role === 'user' ? 'you' : ''}`}>{m.role === 'user' ? 'You' : 'Analyst'}</div>
                <div className="cx-body">{m.content}</div>
                {m.tools && m.tools.length > 0 && (
                  <div className="cx-tools">queried: <code>{[...new Set(m.tools)].join(', ')}</code></div>
                )}
              </div>
            ))}

            {loading && (
              <div className="cx-msg">
                <div className="cx-role">Analyst</div>
                <div className="cx-thinking"><span className="cx-dot" /> querying the node…</div>
              </div>
            )}
          </div>

          {error && <div className="cx-error" style={{ marginTop: 16 }}>{error}</div>}

          <form className="cx-form" onSubmit={onSubmit}>
            <input
              className="cx-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about an address, tx, block, mempool, fees…"
              maxLength={500}
              autoComplete="off"
            />
            <button className="cx-send" type="submit" disabled={loading || !input.trim()}>Ask</button>
          </form>
        </div>
      </InfraShell>
    </>
  );
}
