import LessonLayout from '@/components/LessonLayout';

export default function BoardingPassLesson() {
  return (
    <LessonLayout slug="your-first-wallet">
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
    </LessonLayout>
  );
}
