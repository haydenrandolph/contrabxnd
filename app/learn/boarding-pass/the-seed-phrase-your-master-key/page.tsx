'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';

export default function BoardingPassLesson14() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isLightMode, toggleTheme } = useTheme();

  useEffect(() => {
    document.title = 'The Seed Phrase: Your Master Key | Contraband';
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
.progress-bar { height: 100%; background: #F7931A; width: 66.66%; transition: width 0.3s ease; }
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
            <span className="breadcrumb-current">Lesson 14</span>
          </div>
          <div className="lesson-meta">
            <span className="lesson-number">Lesson 14 of 21</span>
            <span className="lesson-week">Week 2</span>
            <span className="lesson-duration">15 min read</span>
          </div>
          <h1 className="lesson-title">The Seed Phrase: Your Master Key</h1>
          <p className="lesson-subtitle">What it is, why it matters, how to protect it.</p>
        </header>
        <article className="lesson-content">
          <p>Your seed phrase is the single most important thing in your bitcoin life. If you remember nothing else from this course, remember this: protect your seed phrase, and you protect your bitcoin. Lose your seed phrase, and you lose everything.</p>

          <h2>What Is a Seed Phrase?</h2>
          <p>A seed phrase (also called a recovery phrase, backup phrase, or mnemonic) is a series of 12 or 24 words generated by your wallet when you first create it. These words—in this specific order—mathematically represent the master key to your entire wallet.</p>
          <p>With your seed phrase, you can restore your wallet on any compatible device. Without it, if you lose your phone, forget your password, or your device breaks, your bitcoin is gone forever. No company can help you. No support ticket can save you. The seed phrase is your only lifeline.</p>
          <p>Example seed phrase (DO NOT USE THIS—it's for illustration only):</p>
          <p><em>witch collapse practice feed shame open despair creek road again ice least</em></p>

          <h2>How Seed Phrases Work</h2>
          <p>The seed phrase is based on a technical standard called <strong>BIP39</strong> (Bitcoin Improvement Proposal 39). This standard defines a list of 2,048 carefully chosen words. Your wallet randomly selects 12 or 24 words from this list to create your seed.</p>
          <p>These words encode a very large random number—your "master seed." From this seed, your wallet can mathematically derive billions of private keys, each corresponding to a different Bitcoin address. So those 12 simple words unlock an entire universe of addresses and keys.</p>
          <p>The beauty (and danger) of this system: anyone with your seed phrase can regenerate all your private keys and thus control all your bitcoin. That's why seed phrase security is paramount.</p>

          <div className="key-concept">
            <div className="key-concept-label">Mathematical Reality</div>
            <p className="key-concept-text">A 12-word seed phrase has 2,048^12 possible combinations—that's 2^128, or approximately 340 undecillion possibilities. It's mathematically impossible to guess. But if someone steals it, they don't need to guess.</p>
          </div>

          <h2>The Golden Rules of Seed Phrase Security</h2>
          <p>These rules are absolute. Break them, and you risk losing everything.</p>

          <h3>Rule 1: Never Store It Digitally</h3>
          <p>Do not take a screenshot. Do not save it in a note app, password manager, or cloud storage. Do not email it to yourself. Do not type it into any device connected to the internet. The moment your seed phrase touches a connected device, it becomes vulnerable to hacking, malware, and data breaches.</p>

          <h3>Rule 2: Write It on Physical Media</h3>
          <p>Use pen and paper at minimum. Write clearly. Double-check every word. Store the paper somewhere secure—a safe, lockbox, or hidden location only you know about. For long-term storage, consider metal backups (products like Cryptosteel or Billfodl) that are fireproof, waterproof, and nearly indestructible.</p>

          <h3>Rule 3: Never Share It with Anyone</h3>
          <p>No legitimate company—not your wallet provider, not an exchange, not Bitcoin support—will ever ask for your seed phrase. If someone does, it's a scam. Even trusted friends and family shouldn't know your seed phrase unless you're planning inheritance (a topic for Week 4).</p>

          <h3>Rule 4: Store Multiple Backups</h3>
          <p>One backup isn't enough. What if your house burns down? What if the paper gets soaked or stolen? Store backups in separate physical locations—your home safe, a trusted family member's safe, a safety deposit box. Geographic redundancy protects against disasters.</p>

          <h3>Rule 5: Test Your Backup</h3>
          <p>After writing down your seed phrase, test it. Some people restore their wallet on a second device to confirm the backup works. Others wait until they've only deposited a small test amount. Either way, verify your backup before you trust it with serious money.</p>

          <h2>Common Seed Phrase Threats</h2>
          <p>Attackers know the seed phrase is the ultimate prize. Here are the most common attack vectors:</p>

          <ul>
            <li><strong>Phishing websites:</strong> Fake wallet sites that ask you to "verify" your wallet by entering your seed phrase. Once you do, your bitcoin is instantly stolen.</li>
            <li><strong>Fake support scams:</strong> Someone posing as customer support claims there's a problem with your wallet and asks for your seed phrase to "fix" it. Hang up. It's always a scam.</li>
            <li><strong>Physical theft:</strong> Someone breaks into your home, finds your written seed phrase, and steals your bitcoin remotely—they don't need your device, just the words.</li>
            <li><strong>Malware/keyloggers:</strong> Malicious software that records what you type or takes screenshots when you enter your seed phrase on a computer.</li>
            <li><strong>Social engineering:</strong> Attackers build trust over weeks or months, then ask for your seed phrase under a "helpful" pretext. Never fall for it.</li>
          </ul>

          <h2>Restoring a Wallet from Your Seed Phrase</h2>
          <p>If you lose your device or switch to a new wallet, you can restore everything using your seed phrase. Here's how:</p>

          <ol>
            <li>Download a compatible wallet (most wallets that support BIP39 seed phrases will work).</li>
            <li>Select "Restore from seed phrase" instead of creating a new wallet.</li>
            <li>Enter your 12 or 24 words in the correct order.</li>
            <li>The wallet scans the blockchain for all transactions associated with your seed.</li>
            <li>Your balance and transaction history reappear. You're back in business.</li>
          </ol>

          <p>This process proves a critical point: your wallet app is just a window into the blockchain. Your bitcoin isn't "stored" on your phone—it's on the blockchain, controlled by your seed phrase. The wallet app is merely a tool for accessing it.</p>

          <h2>Advanced Option: The Passphrase (25th Word)</h2>
          <p>Some advanced users add an optional <strong>passphrase</strong> (sometimes called the "25th word") to their seed phrase. This passphrase acts as a second factor—even if someone finds your seed phrase, they can't access your bitcoin without the passphrase.</p>
          <p>How it works: When you restore your wallet, you enter your seed phrase plus the passphrase. The passphrase mathematically modifies the seed, generating an entirely different set of addresses. Without the passphrase, the wallet shows zero balance (or a small "decoy" balance if you set one up).</p>
          <p><strong>Warning:</strong> If you forget your passphrase, your bitcoin is lost forever—there's no recovery. Passphrases are a powerful security tool for advanced users with large holdings, but beginners should focus on securing the seed phrase first.</p>

          <h2>Inheritance and Emergency Access</h2>
          <p>One question haunts every Bitcoin holder: what happens if I die? If no one else knows your seed phrase, your bitcoin vanishes forever. But sharing it too widely defeats the purpose of self-custody.</p>
          <p>Options for inheritance planning (we'll cover this in depth in Week 4):</p>
          <ul>
            <li>Split the seed phrase into multiple parts and give them to different trusted people (requires 2 or 3 parts to reconstruct).</li>
            <li>Use a time-locked multisig setup that requires your signature plus a backup key held by a trusted person.</li>
            <li>Store your seed phrase in a safe with instructions for access after your death.</li>
            <li>Use a professional Bitcoin custody service that offers inheritance solutions.</li>
          </ul>

          <p>The key principle: balance security (protecting your bitcoin while you're alive) with accessibility (ensuring your heirs can access it after you're gone).</p>

          <div className="lesson-summary">
            <h3 className="summary-title">Lesson Summary</h3>
            <ul className="summary-list">
              <li>Your seed phrase (12 or 24 words) generates all your keys and controls all your bitcoin</li>
              <li>Never store it digitally—paper minimum, metal preferred</li>
              <li>Never share it with anyone for any reason</li>
              <li>No legitimate service will ever ask for it</li>
              <li>Keep backups in separate physical locations</li>
              <li>Consider inheritance planning—someone needs to access this after you</li>
              <li>Passphrase option exists for advanced security (covered later)</li>
            </ul>
          </div>
        </article>
        <nav className="lesson-navigation">
          <Link href="/learn/boarding-pass/sending-and-receiving" className="nav-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Lesson 13
          </Link>
          <Link href="/learn/boarding-pass" className="nav-btn primary">
            Course Overview
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
