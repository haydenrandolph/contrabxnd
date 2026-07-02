'use client';

import { useState, useEffect, useCallback } from 'react';
import { generateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english.js';
import Lab from './Lab';

export default function SeedPhraseLab() {
  const [words, setWords] = useState<string[]>([]);
  const [revealed, setRevealed] = useState(false);

  const generate = useCallback(() => {
    // 128 bits of entropy → a real, valid 12-word BIP39 mnemonic. Generated
    // entirely in your browser and never sent anywhere.
    setWords(generateMnemonic(wordlist, 128).split(' '));
    setRevealed(false);
  }, []);

  useEffect(() => { generate(); }, [generate]);

  return (
    <Lab
      title="Generate a real seed phrase"
      note={
        <>
          These 12 words <strong>are</strong> a wallet — anyone who reads them controls every coin it
          could ever hold. That&apos;s why order matters, why you write them on paper (never a photo or
          cloud), and why the last word carries a built-in <strong>checksum</strong> so typos are
          caught. Generated in your browser and never sent anywhere.
        </>
      }
    >
      <style jsx global>{`
        .sp-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; position: relative; }
        @media (max-width: 480px) { .sp-grid { grid-template-columns: repeat(2, 1fr); } }
        .sp-word { display: flex; align-items: baseline; gap: 8px; border: 1px solid var(--cb-border); border-radius: var(--cb-radius); padding: 9px 11px; background: var(--cb-bg); }
        .sp-num { font-family: var(--cb-font-mono); font-size: 10px; color: var(--cb-text-dim); min-width: 16px; }
        .sp-txt { font-family: var(--cb-font-mono); font-size: 13px; color: var(--cb-text); }
        .sp-blur .sp-grid { filter: blur(7px); user-select: none; pointer-events: none; }
        .sp-cover { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; z-index: 2; }
        .sp-actions { display: flex; gap: 10px; margin-top: 16px; align-items: center; flex-wrap: wrap; }
        .sp-ghost { background: transparent; border: 1px solid var(--cb-border); color: var(--cb-text-muted); border-radius: var(--cb-radius); font-family: var(--cb-font-mono); font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase; padding: 8px 16px; cursor: pointer; transition: border-color 0.15s ease, color 0.15s ease; }
        .sp-ghost:hover { border-color: var(--cb-accent); color: var(--cb-accent); }
        .sp-warn { font-family: var(--cb-font-mono); font-size: 10px; color: var(--cb-text-dim); letter-spacing: 0.04em; }
      `}</style>

      <div className={`sp-wrap ${revealed ? '' : 'sp-blur'}`} style={{ position: 'relative' }}>
        <div className="sp-grid">
          {words.map((w, i) => (
            <div className="sp-word" key={i}>
              <span className="sp-num">{i + 1}</span>
              <span className="sp-txt">{w}</span>
            </div>
          ))}
        </div>
        {!revealed && (
          <div className="sp-cover">
            <button className="lab-btn" onClick={() => setRevealed(true)}>Reveal phrase</button>
          </div>
        )}
      </div>

      <div className="sp-actions">
        <button className="sp-ghost" onClick={generate}>↻ Generate another</button>
        <span className="sp-warn">Demo only — never fund a phrase you generated on a website.</span>
      </div>
    </Lab>
  );
}
