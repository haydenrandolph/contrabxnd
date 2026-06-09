import LessonLayout from '@/components/LessonLayout';

export default function BoardingPassLesson() {
  return (
    <LessonLayout slug="your-first-purchase">
      <p>Enough theory. Let's buy some bitcoin.</p>

      <p>This lesson walks through the actual process. We'll use a generic flow that applies to most exchanges, though specific steps vary.</p>

      <h3>Before You Start</h3>

      <p>You'll need:</p>

      <ul>
        <li>Government ID (for KYC verification)</li>
        <li>Bank account or debit card</li>
        <li>Email address</li>
        <li>Phone for two-factor authentication</li>
        <li>15-30 minutes for the initial setup</li>
      </ul>

      <h3>Step 1: Create Your Account</h3>

      <p>Go to your chosen exchange and sign up. You'll provide:</p>

      <ul>
        <li>Email address</li>
        <li>Phone number</li>
        <li>Strong, unique password (use a password manager)</li>
      </ul>

      <p>Enable two-factor authentication (2FA) immediately. Use an authenticator app (like Authy or Google Authenticator), not SMS. SMS can be intercepted.</p>

      <h3>Step 2: Verify Your Identity</h3>

      <p>This is the KYC part. Most exchanges require:</p>

      <ul>
        <li>Photo of government ID</li>
        <li>Selfie for face matching</li>
        <li>Sometimes proof of address</li>
      </ul>

      <p>Verification can take minutes or days depending on the exchange and their backlog. Some offer tiered verification—basic for small amounts, full for larger.</p>

      <h3>Step 3: Add a Funding Method</h3>

      <p>Link a bank account or card. Options typically include:</p>

      <ul>
        <li><strong>ACH transfer (US):</strong> Free or cheap, takes 3-5 days</li>
        <li><strong>Wire transfer:</strong> Faster, costs $10-30</li>
        <li><strong>Debit card:</strong> Instant, 2-3% fee</li>
        <li><strong>Credit card:</strong> Often not allowed, highest fees</li>
      </ul>

      <p>For regular purchases, set up ACH. For a one-time immediate purchase, debit card works despite the fee.</p>

      <h3>Step 4: Deposit Funds</h3>

      <p>Transfer money to the exchange. If using ACH:</p>

      <ul>
        <li>Initiate transfer from the exchange</li>
        <li>Wait for it to clear (3-5 days typically)</li>
        <li>Some exchanges let you buy immediately but not withdraw until cleared</li>
      </ul>

      <h3>Step 5: Place Your Order</h3>

      <p>Navigate to the buy section. You'll see:</p>

      <ul>
        <li><strong>Market order:</strong> Buy immediately at current price</li>
        <li><strong>Limit order:</strong> Buy only if price reaches your target</li>
      </ul>

      <p>For your first purchase, market order is fine. You're learning the process, not optimizing for a few dollars.</p>

      <p>Enter the amount you want to buy. You can enter in dollars ($100) or bitcoin (0.002 BTC). The exchange shows the conversion.</p>

      <p>Review the order:</p>

      <ul>
        <li>Amount of bitcoin you'll receive</li>
        <li>Fees</li>
        <li>Total cost</li>
      </ul>

      <p>Click buy.</p>

      <h3>Step 6: Verify the Purchase</h3>

      <p>Check your balance. You should see bitcoin (or the fraction thereof) in your exchange account.</p>

      <p>Congratulations—you own bitcoin.</p>

      <p>But you're not done.</p>

      <h3>Step 7: Withdraw to Your Own Wallet</h3>

      <p>This is the most important step that most beginners skip.</p>

      <p>Leaving bitcoin on the exchange means trusting the exchange. Exchanges get hacked. Exchanges go bankrupt. Exchanges freeze accounts.</p>

      <p>In the next lessons, we'll cover setting up your own wallet. For now, know that the process is:</p>

      <ol>
        <li>Get your wallet's receiving address</li>
        <li>Go to the exchange withdrawal section</li>
        <li>Paste the address</li>
        <li>Enter the amount</li>
        <li>Confirm the withdrawal</li>
        <li>Wait for network confirmation</li>
      </ol>

      <p>The bitcoin is truly yours only when it's in a wallet you control.</p>

      <h3>How Much Should You Buy?</h3>

      <p>There's no right answer. Consider:</p>

      <ul>
        <li>Only invest what you can afford to lose (volatility is real)</li>
        <li>Enough to make it meaningful to you (skin in the game helps learning)</li>
        <li>Not so much that you'll panic during price drops</li>
      </ul>

      <p>Many people start with $50-$100 as a learning experience. Others dive in deeper. Bitcoin doesn't care—you can buy $10 or $10 million.</p>

      <h3>Don't Stare at the Price</h3>

      <p>Once you've bought, resist the urge to check the price constantly. Bitcoin is volatile. It will go down sometimes. It will go up sometimes. If you're in it for the long term, daily price movements are noise.</p>

      <p>The best bitcoiners buy regularly, secure their coins, and then largely ignore the price.</p>

      <div className="lesson-summary">
        <h3 className="summary-title">Lesson Summary</h3>
        <ul className="summary-list">
          <li>Sign up, verify identity, enable 2FA</li>
          <li>Link a funding method (bank account is cheapest)</li>
          <li>Start with a market order for simplicity</li>
          <li>Buy an amount you're comfortable with</li>
          <li>Withdraw to your own wallet (covered in next lessons)</li>
          <li>Don't obsess over price after buying</li>
        </ul>
      </div>
    </LessonLayout>
  );
}
