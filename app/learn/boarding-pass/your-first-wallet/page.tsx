'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';

export default function BoardingPassLesson12() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isLightMode, toggleTheme } = useTheme();

  useEffect(() => {
    document.title = 'Your First Wallet | Contraband';
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
.progress-bar { height: 100%; background: #F7931A; width: 57.14%; transition: width 0.3s ease; }
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
            <span className="breadcrumb-current">Lesson 12</span>
          </div>
          <div className="lesson-meta">
            <span className="lesson-number">Lesson 12 of 21</span>
            <span className="lesson-week">Week 2</span>
            <span className="lesson-duration">12 min read</span>
          </div>
          <h1 className="lesson-title">Your First Wallet</h1>
          <p className="lesson-subtitle">Setting up a mobile wallet for beginners.</p>
        </header>
        <article className="lesson-content">
          <p>Let's get practical. This lesson walks you through setting up your first non-custodial wallet—the tool that transforms you from someone who "has bitcoin on an exchange" to someone who actually controls bitcoin.</p>

          <h2>Choosing Your First Wallet</h2>
          <p>For beginners, we recommend starting with a non-custodial mobile wallet. These apps strike the perfect balance: easy enough for newcomers, powerful enough to teach real Bitcoin principles, and secure enough for moderate amounts.</p>
          <p>Three excellent options: <strong>Muun Wallet</strong> (easiest for absolute beginners), <strong>Blue Wallet</strong> (more features, slightly steeper learning curve), and <strong>Phoenix Wallet</strong> (Lightning-focused, great for small fast payments). All three are free, open-source, and widely trusted.</p>
          <p>For this walkthrough, we'll use Muun. The principles apply to any non-custodial wallet—the interface differs, but the core concepts remain the same.</p>

          <h2>Step-by-Step: Setting Up Muun Wallet</h2>

          <h3>1. Download the App</h3>
          <p>Go to your phone's app store (iOS App Store or Google Play Store). Search for "Muun Wallet" and download the official app. Verify the developer name matches "Muun" before installing—scammers create fake wallets with similar names.</p>

          <h3>2. Open and Create New Wallet</h3>
          <p>Launch the app. You'll see an option to create a new wallet. Tap it. The app will generate your wallet locally on your device—no account signup, no email, no personal information required. This is self-custody.</p>

          <h3>3. Write Down Your Recovery Code</h3>
          <p>This is the most important step. The app will display a 12-word recovery phrase (also called a seed phrase or backup phrase). These words, in this exact order, are the master key to your wallet.</p>
          <p><strong>Critical:</strong> Write these words on paper. Do not screenshot them. Do not email them to yourself. Do not store them in a note-taking app. Use pen and paper. Write clearly. Double-check every word.</p>
          <p>Store this paper somewhere safe—a locked drawer, a safe, somewhere only you can access. These 12 words can restore your entire wallet if your phone is lost or broken. They're also the only way someone could steal your bitcoin remotely, so treat them like cash.</p>

          <h3>4. Verify Your Recovery Code</h3>
          <p>Most wallets will ask you to confirm your recovery phrase by selecting words in the correct order. This ensures you wrote it down accurately. Don't skip this step. If you wrote it wrong, you won't discover the mistake until it's too late.</p>

          <h3>5. Set a PIN</h3>
          <p>Create a PIN or enable biometric authentication (fingerprint/Face ID) for opening the app. This protects your wallet if someone gains physical access to your phone. The PIN isn't your bitcoin's ultimate security—the recovery phrase is—but it's an important second layer.</p>

          <h3>6. Explore the Interface</h3>
          <p>You now have a working Bitcoin wallet. The main screen shows your balance (currently zero), a "Receive" button, and a "Send" button. Take a moment to click around. You can't break anything by exploring.</p>

          <div className="key-concept">
            <div className="key-concept-label">Key Moment</div>
            <p className="key-concept-text">You now control a piece of the Bitcoin network. No company gave you permission. No bank approved your account. You simply generated a pair of cryptographic keys, and now you're part of a global financial system. That's Bitcoin.</p>
          </div>

          <h2>Understanding Your Wallet's Interface</h2>
          <p><strong>Receive:</strong> This generates a Bitcoin address—a string of letters and numbers (or a QR code) that others use to send you bitcoin. You can create unlimited addresses; each one is tied to your wallet. Think of addresses like invoices: you generate a new one for each payment, but they all deposit into the same wallet.</p>
          <p><strong>Send:</strong> This lets you spend bitcoin. You'll enter the recipient's address, the amount to send, and confirm the transaction. We'll cover sending in detail in the next lesson.</p>
          <p><strong>Transaction History:</strong> A list of all bitcoin you've received and sent. Each transaction shows the amount, the date/time, and its status (pending or confirmed).</p>

          <h2>First Transaction: Receiving Bitcoin</h2>
          <p>Now that your wallet is set up, you can receive bitcoin. Tap "Receive" in the wallet. You'll see a QR code and a long string of letters and numbers below it. This is your Bitcoin address.</p>
          <p>To receive bitcoin, share this address with the sender. They can either scan your QR code (if you're in person) or you can copy/paste the address text and send it via email, text, or any messaging app. Bitcoin addresses are public—it's safe to share them.</p>
          <p>Once someone sends bitcoin to your address, the transaction will appear in your wallet within a few seconds. It will show as "unconfirmed" initially, then gain confirmations as Bitcoin miners add it to the blockchain (about 10 minutes per confirmation). One confirmation is usually enough for small amounts; larger transactions benefit from waiting for 3-6 confirmations.</p>

          <h2>Security Best Practices</h2>
          <ul>
            <li><strong>Start small:</strong> Don't put your life savings in your first mobile wallet. Think of it as a "checking account" for spending, not a vault for long-term storage.</li>
            <li><strong>Test your recovery phrase:</strong> After setting up your wallet, consider doing a test restore. Delete the app, reinstall it, and restore from your written recovery phrase. This confirms your backup works. (Only do this with small amounts.)</li>
            <li><strong>Keep your phone secure:</strong> Use a strong phone passcode, enable automatic screen lock, and keep your operating system updated. A compromised phone can compromise your wallet.</li>
            <li><strong>Never share your recovery phrase:</strong> No legitimate company will ever ask for it. Not the wallet developers. Not Bitcoin support. Not anyone. If someone asks, it's a scam.</li>
          </ul>

          <h2>When to Upgrade</h2>
          <p>Mobile wallets are great for learning and daily use, but they're not ideal for large amounts. As your holdings grow past a few thousand dollars, consider upgrading to a hardware wallet—a physical device that stores your keys offline. We'll cover hardware wallets in Week 3.</p>
          <p>Until then, your mobile wallet is perfect for getting comfortable with sending, receiving, and understanding how Bitcoin actually works.</p>

          <div className="lesson-summary">
            <h3 className="summary-title">Lesson Summary</h3>
            <ul className="summary-list">
              <li>Download a reputable mobile wallet (Muun, Blue Wallet, Phoenix)</li>
              <li>Write down your seed phrase on paper immediately</li>
              <li>Set up a PIN for app access</li>
              <li>Generate a receive address to get bitcoin from your exchange</li>
              <li>Practice sending a small amount to get comfortable</li>
              <li>Always verify addresses carefully—mistakes are permanent</li>
            </ul>
          </div>
        </article>
        <nav className="lesson-navigation">
          <Link href="/learn/boarding-pass/understanding-wallets" className="nav-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Lesson 11
          </Link>
          <Link href="/learn/boarding-pass/sending-and-receiving" className="nav-btn primary">
            13
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
