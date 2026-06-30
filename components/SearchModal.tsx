'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';

interface SearchItem {
  type: string;
  title: string;
  href: string;
  excerpt: string;
}

const SEARCH_ITEMS: SearchItem[] = [
  // Lessons — Week 1: Understanding Bitcoin
  { type: 'Lesson', title: 'What Is Bitcoin, Actually?', href: '/learn/boarding-pass/what-is-bitcoin-actually', excerpt: "Forget what you've heard. Let's start from zero." },
  { type: 'Lesson', title: 'The Problem Bitcoin Solves', href: '/learn/boarding-pass/the-problem-bitcoin-solves', excerpt: 'Digital scarcity and the double-spend problem.' },
  { type: 'Lesson', title: '21 Million: The Number That Changes Everything', href: '/learn/boarding-pass/21-million-the-number-that-changes-everything', excerpt: "Why Bitcoin's fixed supply is its superpower." },
  { type: 'Lesson', title: 'How the Network Works', href: '/learn/boarding-pass/how-the-network-works', excerpt: 'Nodes, miners, and the blockchain—demystified.' },
  { type: 'Lesson', title: 'Bitcoin vs. "Crypto"', href: '/learn/boarding-pass/bitcoin-vs-crypto', excerpt: 'Why Bitcoin is different and why that matters.' },
  { type: 'Lesson', title: 'A Brief History: 2008 to Now', href: '/learn/boarding-pass/a-brief-history-2008-to-now', excerpt: 'From cypherpunks to institutional adoption.' },
  { type: 'Lesson', title: 'The Philosophy: Why This Exists', href: '/learn/boarding-pass/the-philosophy-why-this-exists', excerpt: 'Freedom, sovereignty, and opting out.' },
  // Lessons — Week 2: Getting Started
  { type: 'Lesson', title: 'Ways to Acquire Bitcoin', href: '/learn/boarding-pass/ways-to-acquire-bitcoin', excerpt: 'Exchanges, P2P, earning, and more.' },
  { type: 'Lesson', title: 'Choosing an Exchange', href: '/learn/boarding-pass/choosing-an-exchange', excerpt: 'What to look for and what to avoid.' },
  { type: 'Lesson', title: 'Your First Purchase', href: '/learn/boarding-pass/your-first-purchase', excerpt: 'Step-by-step: buying your first sats.' },
  { type: 'Lesson', title: 'Understanding Wallets', href: '/learn/boarding-pass/understanding-wallets', excerpt: 'Hot, cold, custodial, non-custodial—explained.' },
  { type: 'Lesson', title: 'Your First Wallet', href: '/learn/boarding-pass/your-first-wallet', excerpt: 'Setting up a mobile wallet for beginners.' },
  { type: 'Lesson', title: 'Sending and Receiving', href: '/learn/boarding-pass/sending-and-receiving', excerpt: 'Addresses, transactions, and fees.' },
  { type: 'Lesson', title: 'The Seed Phrase: Your Master Key', href: '/learn/boarding-pass/the-seed-phrase-your-master-key', excerpt: 'What it is, why it matters, how to protect it.' },
  // Lessons — Week 3: Thinking Long-Term
  { type: 'Lesson', title: 'DCA: The Boring Strategy That Works', href: '/learn/boarding-pass/dca-the-boring-strategy-that-works', excerpt: 'Why time in the market beats timing the market.' },
  { type: 'Lesson', title: 'Volatility: Feature, Not Bug', href: '/learn/boarding-pass/volatility-feature-not-bug', excerpt: 'How to think about price swings.' },
  { type: 'Lesson', title: 'Common Scams and How to Avoid Them', href: '/learn/boarding-pass/common-scams-and-how-to-avoid-them', excerpt: 'If it sounds too good to be true...' },
  { type: 'Lesson', title: 'Shitcoins: Why Bitcoin Only', href: '/learn/boarding-pass/shitcoins-why-bitcoin-only', excerpt: 'The case for focus over diversification.' },
  { type: 'Lesson', title: 'Bitcoin and Taxes', href: '/learn/boarding-pass/bitcoin-and-taxes', excerpt: 'What you need to know (and track).' },
  { type: 'Lesson', title: 'The Road to Self-Custody', href: '/learn/boarding-pass/the-road-to-self-custody', excerpt: 'Why you should take your coins off the exchange.' },
  { type: 'Lesson', title: "What's Next: Your Sovereign Journey", href: '/learn/boarding-pass/whats-next-your-sovereign-journey', excerpt: 'Where to go from here.' },
  // Articles
  { type: 'Essay', title: 'Letters of Marque for the Digital Age', href: '/writings/why-trump-1m-btc', excerpt: 'When states embrace what they once called piracy.' },
  { type: 'Essay', title: "The Pirate's Guide to Banking", href: '/writings/bankmore', excerpt: 'Why leaving the harbor means carrying more treasure.' },
  { type: 'Analysis', title: 'The Network Eats the Nation', href: '/writings/nation-or-network', excerpt: 'Borders are lines on maps. Networks are lines of code.' },
  { type: 'Essay', title: 'The Contract You Never Signed', href: '/writings/when-did-i-sign', excerpt: "You can't breach an agreement you never made." },
  { type: 'Opinion', title: 'The Counterfeit We All Accept', href: '/writings/dont-stare-at-money-too-long', excerpt: 'On the collective hallucination we call money.' },
  { type: 'Analysis', title: 'Maps of Progress', href: '/writings/hank-are-we-developed', excerpt: 'Who draws the line between developed and developing—and why.' },
  { type: 'Essay', title: 'When the Oracle Lies', href: '/writings/2-10-5-chatgpt', excerpt: 'Confidence without competence is the most dangerous export of our age.' },
  { type: 'Essay', title: 'Coordinates Unknown', href: '/writings/hank-where-are-we', excerpt: "The old maps are wrong. The new ones aren't drawn yet." },
  { type: 'Opinion', title: 'Boarding Call', href: '/writings/call-it-a-blog-call-it-a-newsletter', excerpt: 'A manifesto for the voyage ahead.' },
];

export default function SearchModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { isLightMode } = useTheme();

  const results = query.trim()
    ? SEARCH_ITEMS.filter((item) => {
        const q = query.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.excerpt.toLowerCase().includes(q)
        );
      })
    : SEARCH_ITEMS;

  const open = useCallback(() => {
    setIsOpen(true);
    setQuery('');
    setActiveIndex(0);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery('');
    setActiveIndex(0);
  }, []);

  const navigate = useCallback(
    (href: string) => {
      close();
      router.push(href);
    },
    [close, router],
  );

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          close();
        } else {
          open();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, open, close]);

  // Focus the input when the modal opens
  useEffect(() => {
    if (isOpen) {
      // Small delay so the DOM is ready
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [isOpen]);

  // Reset active index when results change
  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  // Scroll active result into view
  useEffect(() => {
    if (!resultsRef.current) return;
    const active = resultsRef.current.querySelector('[data-active="true"]');
    if (active) {
      active.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (results[activeIndex]) {
          navigate(results[activeIndex].href);
        }
        break;
      case 'Escape':
        e.preventDefault();
        close();
        break;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <style jsx>{`
        .search-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.8);
          z-index: 9999;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding-top: 15vh;
          animation: searchFadeIn 0.15s ease-out;
        }

        .search-overlay.light-mode {
          background: rgba(0, 0, 0, 0.5);
        }

        @keyframes searchFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes searchSlideIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .search-modal {
          background: #141414;
          border: 1px solid #3a3a3a;
          border-radius: 8px;
          width: 100%;
          max-width: 600px;
          overflow: hidden;
          animation: searchSlideIn 0.15s ease-out;
          margin: 0 1rem;
        }

        .search-modal.light-mode {
          background: #f7f7f8;
          border-color: #c0c0c1;
        }

        .search-input-wrapper {
          display: flex;
          align-items: center;
          padding: 0 1.25rem;
          border-bottom: 1px solid #3a3a3a;
          position: relative;
        }

        .search-modal.light-mode .search-input-wrapper {
          border-bottom-color: #c0c0c1;
        }

        .search-icon {
          width: 16px;
          height: 16px;
          color: #8a8a8a;
          flex-shrink: 0;
        }

        .search-input {
          font-family: 'JetBrains Mono', monospace;
          font-size: 14px;
          background: none;
          border: none;
          outline: none;
          color: #e8e4dc;
          padding: 1rem 0.75rem;
          width: 100%;
        }

        .search-modal.light-mode .search-input {
          color: #070713;
        }

        .search-input::placeholder {
          color: #6a6a6a;
        }

        .search-modal.light-mode .search-input::placeholder {
          color: #999;
        }

        .search-hint {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: #6a6a6a;
          background: #1a1a1a;
          border: 1px solid #3a3a3a;
          border-radius: 4px;
          padding: 2px 6px;
          flex-shrink: 0;
          white-space: nowrap;
        }

        .search-modal.light-mode .search-hint {
          background: #e8e4dc;
          border-color: #c0c0c1;
          color: #999;
        }

        .search-results {
          max-height: 400px;
          overflow-y: auto;
          padding: 0.5rem 0;
        }

        .search-results::-webkit-scrollbar {
          width: 6px;
        }

        .search-results::-webkit-scrollbar-track {
          background: transparent;
        }

        .search-results::-webkit-scrollbar-thumb {
          background: #3a3a3a;
          border-radius: 3px;
        }

        .search-result {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 0.75rem 1.25rem;
          cursor: pointer;
          transition: background 0.1s ease;
        }

        .search-result:hover,
        .search-result.active {
          background: #1a1a1a;
        }

        .search-modal.light-mode .search-result:hover,
        .search-modal.light-mode .search-result.active {
          background: #e8e4dc;
        }

        .search-result-badge {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #F7931A;
          background: rgba(247, 147, 26, 0.1);
          padding: 3px 8px;
          border-radius: 3px;
          white-space: nowrap;
          flex-shrink: 0;
          margin-top: 3px;
        }

        .search-result-content {
          flex: 1;
          min-width: 0;
        }

        .search-result-title {
          font-family: 'Inter', serif;
          font-size: 1.1rem;
          font-weight: 400;
          color: #e8e4dc;
          line-height: 1.3;
        }

        .search-modal.light-mode .search-result-title {
          color: #070713;
        }

        .search-result-excerpt {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          color: #6a6a6a;
          margin-top: 2px;
          line-height: 1.5;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .search-empty {
          padding: 2rem 1.25rem;
          text-align: center;
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
          color: #6a6a6a;
        }

        .search-footer {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 1rem;
          padding: 0.6rem 1.25rem;
          border-top: 1px solid #3a3a3a;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: #6a6a6a;
        }

        .search-modal.light-mode .search-footer {
          border-top-color: #c0c0c1;
        }

        .search-footer-key {
          background: #1a1a1a;
          border: 1px solid #3a3a3a;
          border-radius: 3px;
          padding: 1px 5px;
          font-size: 10px;
          color: #8a8a8a;
        }

        .search-modal.light-mode .search-footer-key {
          background: #e8e4dc;
          border-color: #c0c0c1;
        }

        .search-footer-group {
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }
      `}</style>

      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div
        className={`search-overlay ${isLightMode ? 'light-mode' : ''}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
      >
        <div
          className={`search-modal ${isLightMode ? 'light-mode' : ''}`}
          role="dialog"
          aria-label="Search"
          onKeyDown={handleKeyDown}
        >
          <div className="search-input-wrapper">
            <svg
              className="search-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              ref={inputRef}
              className="search-input"
              type="text"
              placeholder="Search lessons and writings..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <span className="search-hint">ESC</span>
          </div>

          <div className="search-results" ref={resultsRef}>
            {results.length > 0 ? (
              results.map((item, i) => (
                <div
                  key={item.href}
                  className={`search-result ${i === activeIndex ? 'active' : ''}`}
                  data-active={i === activeIndex}
                  onClick={() => navigate(item.href)}
                  onMouseEnter={() => setActiveIndex(i)}
                  role="option"
                  aria-selected={i === activeIndex}
                >
                  <span className="search-result-badge">{item.type}</span>
                  <div className="search-result-content">
                    <div className="search-result-title">{item.title}</div>
                    <div className="search-result-excerpt">{item.excerpt}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="search-empty">No results found for &ldquo;{query}&rdquo;</div>
            )}
          </div>

          <div className="search-footer">
            <div className="search-footer-group">
              <span className="search-footer-key">&uarr;</span>
              <span className="search-footer-key">&darr;</span>
              <span>navigate</span>
            </div>
            <div className="search-footer-group">
              <span className="search-footer-key">&crarr;</span>
              <span>open</span>
            </div>
            <div className="search-footer-group">
              <span className="search-footer-key">esc</span>
              <span>close</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
