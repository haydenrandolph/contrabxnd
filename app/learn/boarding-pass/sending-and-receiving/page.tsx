'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';

export default function BoardingPassLesson13() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isLightMode, toggleTheme } = useTheme();

  useEffect(() => {
    document.title = 'Sending and Receiving | Contraband';
  }, []);

  return (
    <>
      <style jsx global>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Space+Mono:wght@400;700&display=swap');
:root { --safe-top: env(safe-area-inset-top); --safe-bottom: env(safe-area-inset-bottom); } * { -webkit-tap-highlight-color: transparent; }
.lesson-page { background: #0a0a0a; color: #e8e4dc; font-family: 'Space Mono', monospace; font-size: 14px; line-height: 1.7; overflow-x: hidden; min-height: 100vh; -webkit-font-smoothing: antialiased; }
.lesson-page.light-mode { background: #e8e4dc; color: #0a0a0a; }
.lesson-page::before { content: ''; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E"); opacity: 0.03; pointer-events: none; z-index: 1000; }
.progress-container { position: fixed; top: 0; left: 0; right: 0; height: 3px; background: #1a1a1a; z-index: 200; }
.lesson-page.light-mode .progress-container { background: #d8d4cc; }
.progress-bar { height: 100%; background: #F7931A; width: 61.9%; transition: width 0.3s ease; }
.lesson-nav { position: fixed; top: 0; left: 0; right: 0; padding: 2rem 3rem; display: flex; justify-content: space-between; align-items: center; z-index: 100; background: linear-gradient(to bottom, #0a0a0a 0%, transparent 100%); margin-top: 3px; }
.lesson-page.light-mode .lesson-nav { background: linear-gradient(to bottom, #e8e4dc 0%, transparent 100%); }
.lesson-logo-link { display: flex; align-items: center; gap: 0.75rem; text-decoration: none; color: #f5f3f0; }
.lesson-page.light-mode .lesson-logo-link { color: #0a0a0a; }
.lesson-logo-text { font-family: 'Space Mono', monospace; font-size: 11px; letter-spacing: 0.3em; text-transform: uppercase; }
.lesson-nav-links { display: flex; gap: 3rem; }
.mobile-back-btn { display: none; align-items: center; gap: 0.5rem; color: #8a8a8a; text-decoration: none; font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; padding: 0.5rem; margin: -0.5rem; }
.mobile-back-btn svg { width: 18px; height: 18px; }
.mobile-back-btn:active { color: #F7931A; }
.lesson-page.light-mode .mobile-back-btn { color: #5a5a5a; }
.lesson-page.light-mode .mobile-back-btn:active { color: #F7931A; }
.lesson-nav-links a { color: #f5f3f0; text-decoration: none; font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; position: relative; padding: 0.25rem 0; }
.lesson-page.light-mode .lesson-nav-links a { color: #0a0a0a; }
.lesson-nav-links a::after { content: ''; position: absolute; bottom: 0; left: 0; width: 0; height: 1px; background: #F7931A; transition: width 0.3s ease; }
.lesson-nav-links a:hover::after, .lesson-nav-links a.active::after { width: 100%; }
.lesson-nav-links a.coming-soon { text-decoration: line-through; opacity: 0.5; cursor: not-allowed; }
.lesson-nav-links a.coming-soon:hover::after { width: 0; }
.lesson-theme-toggle { position: fixed; bottom: 2rem; right: 2rem; width: 50px; height: 50px; border-radius: 50%; background: #1a1a1a; border: 1px solid #3a3a3a; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 1001; transition: all 0.3s ease; }
.lesson-theme-toggle:hover { background: #F7931A; border-color: #F7931A; transform: scale(1.1); }
.lesson-theme-toggle svg { width: 24px; height: 24px; stroke: #e8e4dc; }
.lesson-page.light-mode .lesson-theme-toggle { background: #f5f3f0; border-color: #c8c4bc; }
.lesson-page.light-mode .lesson-theme-toggle svg { stroke: #070713; }
.lesson-header { padding: 10rem 3rem 3rem; max-width: 800px; margin: 0 auto; }
.lesson-breadcrumb { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 2rem; }
.breadcrumb-link { color: #8a8a8a; text-decoration: none; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; transition: color 0.3s ease; }
.breadcrumb-link:hover { color: #F7931A; }
.breadcrumb-sep { color: #3a3a3a; font-size: 10px; }
.breadcrumb-current { color: #e8e4dc; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; }
.lesson-page.light-mode .breadcrumb-current { color: #0a0a0a; }
.lesson-meta { display: flex; align-items: center; gap: 2rem; margin-bottom: 1.5rem; }
.lesson-number { font-family: 'Cormorant Garamond', serif; font-size: 1rem; color: #F7931A; }
.lesson-week, .lesson-duration { font-size: 11px; color: #3a3a3a; letter-spacing: 0.1em; text-transform: uppercase; }
.lesson-page.light-mode .lesson-week, .lesson-page.light-mode .lesson-duration { color: #8a8a8a; }
.lesson-title { font-family: 'Cormorant Garamond', serif; font-size: clamp(2rem, 5vw, 3rem); font-weight: 400; line-height: 1.2; margin-bottom: 1rem; }
.lesson-page.light-mode .lesson-title { color: #0a0a0a; }
.lesson-subtitle { font-family: 'Cormorant Garamond', serif; font-size: 1.25rem; font-style: italic; color: #8a8a8a; }
.lesson-content { max-width: 700px; margin: 0 auto; padding: 3rem 3rem 4rem; }
.lesson-content p { font-family: 'Cormorant Garamond', serif; font-size: 1.25rem; line-height: 1.9; margin-bottom: 1.75rem; color: #e8e4dc; }
.lesson-page.light-mode .lesson-content p { color: #0a0a0a; }
.lesson-content p:first-of-type::first-letter { font-size: 4rem; float: left; line-height: 1; margin-right: 0.75rem; margin-top: 0.25rem; color: #F7931A; }
.lesson-content h2 { font-family: 'Cormorant Garamond', serif; font-size: 1.75rem; font-weight: 400; margin: 3rem 0 1.5rem; color: #f5f3f0; }
.lesson-page.light-mode .lesson-content h2 { color: #0a0a0a; }
.lesson-content h3 { font-family: 'Cormorant Garamond', serif; font-size: 1.35rem; font-weight: 400; margin: 2.5rem 0 1rem; color: #f5f3f0; }
.lesson-page.light-mode .lesson-content h3 { color: #0a0a0a; }
.lesson-content ul, .lesson-content ol { margin: 1.5rem 0; padding-left: 1.5rem; }
.lesson-content li { font-family: 'Cormorant Garamond', serif; font-size: 1.15rem; line-height: 1.8; margin-bottom: 0.75rem; color: #e8e4dc; }
.lesson-page.light-mode .lesson-content li { color: #0a0a0a; }
.lesson-content strong { color: #f5f3f0; font-weight: 600; }
.lesson-page.light-mode .lesson-content strong { color: #0a0a0a; }
.key-concept { background: #141414; border: 1px solid #3a3a3a; padding: 2rem; margin: 2.5rem 0; text-align: center; }
.lesson-page.light-mode .key-concept { background: #f5f3f0; border-color: #d8d4cc; }
.key-concept-label { font-size: 9px; letter-spacing: 0.3em; text-transform: uppercase; color: #F7931A; margin-bottom: 1rem; }
.key-concept-text { font-family: 'Cormorant Garamond', serif; font-size: 1.5rem; font-style: italic; line-height: 1.5; color: #e8e4dc; margin: 0; }
.lesson-page.light-mode .key-concept-text { color: #0a0a0a; }
.lesson-summary { background: #141414; border: 1px solid #1a1a1a; padding: 2rem; margin: 3rem 0; }
.lesson-page.light-mode .lesson-summary { background: #f5f3f0; border-color: #d8d4cc; }
.summary-title { font-family: 'Cormorant Garamond', serif; font-size: 1.25rem; font-weight: 400; margin-bottom: 1rem; color: #f5f3f0; }
.lesson-page.light-mode .summary-title { color: #0a0a0a; }
.summary-list { list-style: none; padding: 0; margin: 0; }
.summary-list li { display: flex; align-items: flex-start; gap: 0.75rem; font-size: 1rem; margin-bottom: 0.75rem; }
.summary-list li::before { content: '◆'; color: #F7931A; font-size: 0.75rem; margin-top: 0.35rem; }
.lesson-navigation { max-width: 700px; margin: 0 auto; padding: 3rem; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #1a1a1a; }
.lesson-page.light-mode .lesson-navigation { border-top-color: #d8d4cc; }
.nav-btn { display: flex; align-items: center; gap: 0.75rem; padding: 1rem 1.5rem; background: transparent; border: 1px solid #3a3a3a; color: #e8e4dc; font-family: 'Space Mono', monospace; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; text-decoration: none; transition: all 0.3s ease; }
.lesson-page.light-mode .nav-btn { border-color: #c8c4bc; color: #0a0a0a; }
.nav-btn:hover { border-color: #F7931A; color: #F7931A; }
.nav-btn svg { width: 16px; height: 16px; }
.nav-btn.primary { background: #F7931A; border-color: #F7931A; color: #f5f3f0; }
.nav-btn.primary:hover { background: #ff6600; border-color: #ff6600; }
.lesson-footer { padding: 4rem 3rem; border-top: 1px solid #1a1a1a; max-width: 1400px; margin: 0 auto; }
.lesson-page.light-mode .lesson-footer { border-top-color: #d8d4cc; }
.lesson-footer-content { display: flex; justify-content: space-between; align-items: center; }
.lesson-footer-left { display: flex; align-items: center; gap: 2rem; }
.lesson-footer-copy { font-size: 12px; color: #8a8a8a; }
.lesson-footer-links { display: flex; gap: 2rem; }
.lesson-footer-links a { font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; color: #8a8a8a; text-decoration: none; transition: color 0.3s ease; }
.lesson-footer-links a:hover { color: #F7931A; }
@media (max-width: 768px) {
  .progress-container { top: 0; }
  .lesson-nav { padding: calc(0.75rem + var(--safe-top)) 1rem 0.75rem; background: #0a0a0a; border-bottom: 1px solid #1a1a1a; margin-top: 3px; }
  .lesson-page.light-mode .lesson-nav { background: #e8e4dc; border-bottom-color: #d8d4cc; }
  .lesson-logo-link { gap: 0.5rem; }
  .lesson-logo-text { font-size: 10px; letter-spacing: 0.2em; }
  .lesson-nav-links { display: none; }
  .mobile-back-btn { display: flex; }
  .lesson-header { padding: calc(5.5rem + var(--safe-top)) 1.5rem 2rem; }
  .lesson-breadcrumb { display: none; }
  .lesson-meta { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; margin-bottom: 1rem; }
  .lesson-number { font-size: 11px; font-weight: 700; }
  .lesson-week, .lesson-duration { font-size: 10px; }
  .lesson-title { font-size: 1.75rem; line-height: 1.25; margin-bottom: 0.5rem; }
  .lesson-subtitle { font-size: 1.1rem; }
  .lesson-content { padding: 0 1.5rem calc(5rem + var(--safe-bottom)); }
  .lesson-content p { font-size: 1.15rem; line-height: 1.85; margin-bottom: 1.5rem; }
  .lesson-content p:first-of-type::first-letter { font-size: 3.5rem; margin-right: 0.6rem; margin-top: 0.2rem; }
  .lesson-content h2 { font-size: 1.4rem; margin: 2.5rem 0 1.25rem; }
  .lesson-content h3 { font-size: 1.2rem; margin: 2rem 0 1rem; }
  .lesson-content ul, .lesson-content ol { margin: 1.25rem 0; padding-left: 1.25rem; }
  .lesson-content li { font-size: 1.1rem; line-height: 1.75; margin-bottom: 0.6rem; }
  .key-concept { padding: 1.25rem 1.5rem; margin: 2rem 0; border: none; border-left: 3px solid #F7931A; text-align: left; }
  .key-concept-label { font-size: 9px; letter-spacing: 0.2em; margin-bottom: 0.5rem; }
  .key-concept-text { font-size: 1.15rem; line-height: 1.5; }
  .highlight-box { padding: 1.25rem 1.5rem; margin: 2rem 0; }
  .highlight-box h4 { font-size: 9px; }
  .highlight-box p { font-size: 1rem; }
  .illustration { padding: 2rem 1.5rem; margin: 2rem 0; min-height: 180px; }
  .illustration-label { font-size: 9px; margin-bottom: 0.35rem; }
  .illustration-title { font-size: 1rem; }
  .lesson-summary { padding: 1.5rem; margin: 2.5rem 0; }
  .summary-title { font-size: 1.1rem; margin-bottom: 1rem; }
  .summary-list li { font-size: 0.95rem; gap: 0.6rem; margin-bottom: 0.6rem; }
  .summary-list li::before { font-size: 0.6rem; margin-top: 0.4rem; }
  .lesson-navigation { position: fixed; bottom: 0; left: 0; right: 0; padding: 1rem 1rem calc(1rem + var(--safe-bottom)); background: #0a0a0a; border-top: 1px solid #1a1a1a; display: flex; justify-content: space-between; align-items: center; z-index: 100; max-width: none; flex-direction: row; gap: 0; }
  .lesson-page.light-mode .lesson-navigation { background: #e8e4dc; border-top-color: #d8d4cc; }
  .nav-btn { padding: 0.75rem 1rem; min-width: 90px; font-size: 10px; width: auto; }
  .nav-btn:active { border-color: #F7931A; color: #F7931A; }
  .nav-btn.primary:active { background: #d4854c; border-color: #d4854c; }
  .nav-btn svg { width: 16px; height: 16px; }
  .lesson-footer { padding: 2rem 1.25rem calc(6rem + var(--safe-bottom)); }
  .lesson-footer-content { flex-direction: column; gap: 1.5rem; text-align: center; }
  .lesson-footer-left { flex-direction: column; gap: 1rem; }
  .lesson-footer-copy { font-size: 11px; }
  .lesson-footer-links { flex-wrap: wrap; justify-content: center; gap: 1.5rem; }
  .lesson-footer-links a { font-size: 10px; }
  .lesson-footer-links a:active { color: #F7931A; }
  .lesson-theme-toggle { bottom: calc(5rem + var(--safe-bottom)); right: 1rem; width: 44px; height: 44px; }
  .lesson-theme-toggle:active { background: #F7931A; border-color: #F7931A; }
}`}</style>

      <div className={`lesson-page ${isLightMode ? 'light-mode' : ''}`}>
        <div className="progress-container"><div className="progress-bar"></div></div>
        <button className="lesson-theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
          {isLightMode ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          )}
        </button>
        <nav className="lesson-nav">
          <Link href="/learn/boarding-pass" className="mobile-back-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Course
          </Link>
          <Link href="/" className="lesson-logo-link">
            <Image src="/contraband-logo-v3.png" alt="Contraband logo" width={40} height={40} />
            <span className="lesson-logo-text">Contra₿and</span>
          </Link>
          <div className="lesson-nav-links">
            <Link href="/learn" className="active">Stu₿y</Link>
            <Link href="/writings">Writings</Link>
            <a href="#podcasts" className="coming-soon">Podcasts</a>
            <a href="#videos" className="coming-soon">Videos</a>
            <a href="#merch" className="coming-soon">Merch</a>
            <Link href="/about">About</Link>
            <Link href="/">Hank C. Moody</Link>
          </div>
          <button
            className={`mobile-menu-btn ${menuOpen ? 'open' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </nav>

        {/* Mobile Menu Overlay */}
        <div className={`mobile-menu-overlay ${menuOpen ? 'open' : ''}`}>
          <nav className="mobile-menu-nav">
            <Link href="/learn" onClick={() => setMenuOpen(false)}>Stu₿y</Link>
            <Link href="/writings" onClick={() => setMenuOpen(false)}>Writings</Link>
            <a href="#podcasts" className="coming-soon">Podcasts</a>
            <a href="#videos" className="coming-soon">Videos</a>
            <a href="#merch" className="coming-soon">Merch</a>
            <Link href="/about" onClick={() => setMenuOpen(false)}>About</Link>
            <Link href="/" onClick={() => setMenuOpen(false)}>Hank C. Moody</Link>
          </nav>
        </div>
        <header className="lesson-header">
          <div className="lesson-breadcrumb">
            <Link href="/learn" className="breadcrumb-link">Stu₿y</Link>
            <span className="breadcrumb-sep">→</span>
            <Link href="/learn/boarding-pass" className="breadcrumb-link">The Boarding Pass</Link>
            <span className="breadcrumb-sep">→</span>
            <span className="breadcrumb-current">Lesson 13</span>
          </div>
          <div className="lesson-meta">
            <span className="lesson-number">Lesson 13 of 21</span>
            <span className="lesson-week">Week 2</span>
            <span className="lesson-duration">14 min read</span>
          </div>
          <h1 className="lesson-title">Sending and Receiving</h1>
          <p className="lesson-subtitle">Addresses, transactions, and fees.</p>
        </header>
        <article className="lesson-content">
          <p>You have a wallet. You've received some bitcoin. Now let's understand what's actually happening when you send and receive—and how to do it well.</p>

          <h2>Understanding Bitcoin Addresses</h2>
          <p>A Bitcoin address is like a mailbox. Anyone can drop letters (bitcoin) into it, but only the person with the key (your private key) can open it and move what's inside.</p>
          <p>Addresses look like gibberish: <code>bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh</code>. They're long strings of letters and numbers generated by your wallet. Modern wallets can encode addresses as QR codes for easy scanning.</p>
          <p>Here's the crucial part: <strong>Bitcoin addresses are public by design.</strong> You can share them freely. Posting your address online doesn't compromise your security—only your privacy. Your private key (stored safely in your wallet) is what actually controls the bitcoin sent to that address.</p>

          <h3>Address Types</h3>
          <p>Bitcoin has evolved through several address formats:</p>
          <ul>
            <li><strong>Legacy (P2PKH):</strong> Starts with "1". The original format. Still works but has higher fees and less efficiency.</li>
            <li><strong>SegWit (P2SH):</strong> Starts with "3". A transitional format from 2017 that reduced fees.</li>
            <li><strong>Native SegWit (Bech32):</strong> Starts with "bc1q". The current standard. Lower fees, better efficiency. Most modern wallets default to this.</li>
            <li><strong>Taproot (Bech32m):</strong> Starts with "bc1p". The newest format (2021). Enhanced privacy and future features. Growing adoption but not yet universal.</li>
          </ul>
          <p>For beginners: use whatever address format your wallet generates by default, which is likely native SegWit. All formats are compatible—you can send from any address type to any other address type.</p>

          <h2>Receiving Bitcoin: Step by Step</h2>
          <p>Receiving bitcoin is simple:</p>
          <ol>
            <li>Open your wallet app and tap "Receive."</li>
            <li>Your wallet generates a fresh receiving address (or displays your current one).</li>
            <li>Share this address with the sender—either the QR code (in person) or the text string (via message/email).</li>
            <li>Once the sender broadcasts the transaction, it appears in your wallet almost instantly as "unconfirmed."</li>
            <li>Miners include the transaction in a block (usually 10-60 minutes). It gains its first "confirmation."</li>
            <li>Each subsequent block adds another confirmation. After 1-3 confirmations, the transaction is effectively final.</li>
          </ol>
          <p>Your wallet will automatically track the transaction and update your balance. No further action required.</p>

          <h2>Sending Bitcoin: The Careful Process</h2>
          <p>Sending is where Bitcoin's irreversibility demands caution. Once you broadcast a transaction, there's no undo button. No customer service. No chargebacks. Here's how to do it right:</p>

          <ol>
            <li><strong>Get the recipient's address:</strong> Ask them for their Bitcoin address. Verify it carefully—typos send funds to the wrong person permanently.</li>
            <li><strong>Open your wallet and tap "Send":</strong> Paste the recipient's address. Most wallets let you scan a QR code instead.</li>
            <li><strong>Enter the amount:</strong> Specify how much bitcoin to send. Your wallet will show the amount in BTC and your local currency.</li>
            <li><strong>Choose a fee:</strong> Bitcoin transactions require a fee paid to miners. Higher fees = faster confirmation. More on this below.</li>
            <li><strong>Review everything twice:</strong> Check the address, the amount, and the fee. Bitcoin transactions are irreversible.</li>
            <li><strong>Confirm and broadcast:</strong> Your wallet signs the transaction with your private key and broadcasts it to the network.</li>
          </ol>

          <p>The transaction now waits in the "mempool" (memory pool) until a miner includes it in a block. Depending on your fee and network congestion, this can take minutes to hours.</p>

          <div className="key-concept">
            <div className="key-concept-label">Critical Rule</div>
            <p className="key-concept-text">Always double-check addresses before sending. Copy-paste carefully. Verify the first and last few characters. Bitcoin has no undo. A wrong address means permanent loss.</p>
          </div>

          <h2>Transaction Fees: How They Work</h2>
          <p>Bitcoin transaction fees are not fixed—they're determined by supply and demand. When the network is busy, fees rise. When it's quiet, fees drop.</p>
          <p>Fees are measured in <strong>satoshis per vbyte (sat/vB)</strong>. A satoshi is the smallest unit of bitcoin (0.00000001 BTC). A vbyte (virtual byte) measures transaction size. Larger transactions (more inputs/outputs) cost more.</p>
          <p>Most wallets offer three fee options:</p>
          <ul>
            <li><strong>Low priority:</strong> Cheap but slow (hours to days). Use for non-urgent transfers.</li>
            <li><strong>Medium priority:</strong> Moderate cost, moderate speed (30-120 minutes). The default for most transactions.</li>
            <li><strong>High priority:</strong> Expensive but fast (next block, ~10 minutes). Use for time-sensitive payments.</li>
          </ul>
          <p>To check current fee rates, visit <strong>mempool.space</strong>—a website showing the Bitcoin mempool in real-time. It recommends optimal fees based on how fast you want confirmation.</p>

          <h2>Confirmations: When Is It Final?</h2>
          <p>A Bitcoin transaction isn't truly final until it's buried under multiple blocks. Here's what each confirmation level means:</p>
          <ul>
            <li><strong>0 confirmations (unconfirmed):</strong> Visible in the mempool but not yet in a block. Technically reversible (though rare). Don't rely on unconfirmed transactions for large amounts.</li>
            <li><strong>1 confirmation:</strong> Included in a block. The transaction is now part of the blockchain. For small amounts, this is usually enough.</li>
            <li><strong>3-6 confirmations:</strong> Standard for larger transactions. Each additional block makes reversal exponentially harder.</li>
            <li><strong>6+ confirmations:</strong> Considered irreversible by the entire ecosystem. Exchanges typically require 3-6 confirmations before crediting your account.</li>
          </ul>

          <h2>Common Mistakes (and How to Avoid Them)</h2>
          <ul>
            <li><strong>Not verifying addresses:</strong> Always check the first and last characters. Clipboard malware exists that replaces copied addresses.</li>
            <li><strong>Sending to the wrong network:</strong> Bitcoin addresses only work on the Bitcoin network. Never send bitcoin to an Ethereum address (or vice versa).</li>
            <li><strong>Using too-low fees during congestion:</strong> Your transaction could get stuck for days. Check mempool.space first.</li>
            <li><strong>Ignoring confirmations:</strong> Don't ship a product or deliver a service until the transaction has at least one confirmation (more for large amounts).</li>
            <li><strong>Reusing addresses:</strong> For privacy, generate a fresh address for each transaction. Modern wallets do this automatically.</li>
          </ul>

          <h2>Privacy Considerations</h2>
          <p>Bitcoin transactions are public. Anyone can view the blockchain, see transaction amounts, addresses involved, and timing. This doesn't reveal your identity directly—addresses aren't linked to names—but transaction patterns can be traced.</p>
          <p>Best practices for privacy:</p>
          <ul>
            <li>Use a new address for every transaction.</li>
            <li>Avoid posting your addresses publicly.</li>
            <li>Use coin control features (in advanced wallets) to avoid linking unrelated transactions.</li>
            <li>Consider privacy-focused wallets like Wasabi or Samourai (advanced topics).</li>
          </ul>

          <p>We'll explore privacy in more depth in Week 4. For now, just know: Bitcoin is pseudonymous, not anonymous. Act accordingly.</p>

          <div className="lesson-summary">
            <h3 className="summary-title">Lesson Summary</h3>
            <ul className="summary-list">
              <li>Addresses are like mailboxes—share freely, generate fresh ones for each receive</li>
              <li>Transactions include inputs, outputs, fees, and cryptographic signatures</li>
              <li>Fees vary with network congestion; check mempool.space for current rates</li>
              <li>Wait for confirmations before considering large receipts final</li>
              <li>Double-check addresses and amounts—transactions are irreversible</li>
              <li>Every transaction is public; practice basic privacy hygiene</li>
            </ul>
          </div>
        </article>
        <nav className="lesson-navigation">
          <Link href="/learn/boarding-pass/your-first-wallet" className="nav-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Lesson 12
          </Link>
          <Link href="/learn/boarding-pass/the-seed-phrase-your-master-key" className="nav-btn primary">
            14
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
        </nav>
        <footer className="lesson-footer">
          <div className="lesson-footer-content">
            <div className="lesson-footer-left">
              <Image src="/contraband-logo-v3.png" alt="Contraband logo" width={32} height={32} />
              <span className="lesson-footer-copy">© 2025 Contraband. All rights reserved.</span>
            </div>
            <div className="lesson-footer-links">
              <a href="https://x.com/hankCmoody" target="_blank" rel="noopener noreferrer">Twitter</a>
              <a href="https://youtube.com/@hankcmoody" target="_blank" rel="noopener noreferrer">YouTube</a>
              <a href="https://hankcmoody.substack.com" target="_blank" rel="noopener noreferrer">Substack</a>
              <a href="#">RSS</a>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
