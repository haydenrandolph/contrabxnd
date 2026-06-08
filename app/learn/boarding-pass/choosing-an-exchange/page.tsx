import LessonLayout from '@/components/LessonLayout';

export default function BoardingPassLessonChoosingAnExchange() {
  return (
    <LessonLayout slug="choosing-an-exchange">
          <p>Not all exchanges are equal. Some will serve you well. Others will rob you (through fees), betray you (through hacks), or simply frustrate you (through bad design). Here's how to tell the difference.</p>

          <h2>The Non-Negotiables</h2>

          <p>Before anything else, check these boxes:</p>

          <p><strong>1. Regulatory Compliance</strong><br />Is the exchange licensed in your jurisdiction? This isn't about trusting governments—it's about recourse. If something goes wrong with an unlicensed offshore exchange, you have no one to complain to.</p>

          <p><strong>2. Track Record</strong><br />How long has the exchange operated? Have they been hacked? How did they respond? The crypto industry is littered with failed and fraudulent exchanges. Longevity is a signal.</p>

          <p><strong>3. Withdrawal Capability</strong><br />Can you actually withdraw your bitcoin to your own wallet? Some platforms (particularly "trading apps") make this difficult or impossible. If you can't withdraw, you don't own bitcoin—you own an IOU.</p>

          <p><strong>4. Proof of Reserves</strong><br />Does the exchange prove it holds the bitcoin it claims to? After FTX collapsed (they didn't have the assets they claimed), proof of reserves became important. Look for exchanges that publish these audits.</p>

          <h2>Questions to Ask</h2>

          <p><strong>Fees</strong></p>
          <ul>
            <li>What's the trading fee?</li>
            <li>Is there a spread on top of the fee?</li>
            <li>What's the withdrawal fee?</li>
            <li>Are there deposit fees for your payment method?</li>
          </ul>

          <p><strong>Funding Options</strong></p>
          <ul>
            <li>Bank transfer (usually cheapest, but slow)</li>
            <li>Debit card (faster, higher fees)</li>
            <li>Credit card (often not allowed, highest fees)</li>
            <li>Wire transfer (for large amounts)</li>
          </ul>

          <p><strong>Features</strong></p>
          <ul>
            <li>Auto-purchase for DCA?</li>
            <li>Auto-withdrawal to your own wallet?</li>
            <li>Mobile app quality?</li>
            <li>Customer support responsiveness?</li>
          </ul>

          <h2>Red Flags</h2>

          <p><strong>Avoid exchanges that:</strong></p>
          <ul>
            <li>Don't allow withdrawals or make them difficult</li>
            <li>Have anonymous founders</li>
            <li>Offer unrealistic returns or "staking" on BTC (Bitcoin doesn't stake)</li>
            <li>Have been hacked and poorly handled it</li>
            <li>Are based in jurisdictions with no oversight</li>
            <li>Have a native token they heavily promote</li>
            <li>Pressure you to trade frequently</li>
          </ul>

          <h2>Exchange Comparison (As of 2024)</h2>

          <p><strong>For US Users:</strong></p>
          <ul>
            <li><strong>River:</strong> Bitcoin-only, excellent DCA features, auto-withdrawal, US regulated</li>
            <li><strong>Swan:</strong> Similar to River, good for larger amounts, advisory services</li>
            <li><strong>Coinbase:</strong> Largest, high liquidity, but sells altcoins (distracting)</li>
            <li><strong>Kraken:</strong> Good reputation, lower fees, more complex interface</li>
            <li><strong>Strike:</strong> Very easy to use, payment app that happens to sell bitcoin</li>
          </ul>

          <p><strong>For European Users:</strong></p>
          <ul>
            <li><strong>Kraken:</strong> Well-established, EU compliant</li>
            <li><strong>Bitstamp:</strong> One of the oldest, Luxembourg regulated</li>
            <li><strong>Relai:</strong> Swiss, Bitcoin-only, simple</li>
          </ul>

          <p><strong>For Global Users:</strong></p>
          <ul>
            <li><strong>Bisq:</strong> Decentralized, P2P, no KYC, works everywhere</li>
            <li><strong>Hodl Hodl:</strong> P2P, non-custodial, global</li>
          </ul>

          <h2>The Exchange Is Temporary</h2>

          <p>Here's the key mindset: the exchange is a means, not a destination.</p>

          <p>You use the exchange to convert your fiat currency (dollars, euros, etc.) into bitcoin. Then you move that bitcoin to your own wallet. The exchange is a bridge, not a home.</p>

          <p>We'll cover wallets in the next lessons, but remember this: until bitcoin is in your own wallet, with keys you control, it's not really yours. It's a promise from the exchange.</p>

          <div className="key-concept">
            <p className="key-concept-label">Rule</p>
            <p className="key-concept-text">Exchange is for buying. Wallet is for holding.</p>
          </div>

          <h2>Start Small</h2>

          <p>Whatever exchange you choose, start with a small amount. Test the process:</p>
          <ol>
            <li>Create account</li>
            <li>Verify identity</li>
            <li>Deposit a small amount</li>
            <li>Buy a small amount of bitcoin</li>
            <li>Withdraw to your own wallet</li>
          </ol>

          <p>If anything feels wrong at any step, you've learned something valuable without risking much.</p>

          <div className="lesson-summary">
            <h3 className="summary-title">Lesson Summary</h3>
            <ul className="summary-list">
              <li>Check for regulatory compliance, track record, and withdrawal capability</li>
              <li>Compare total fees including spread, not just headline rates</li>
              <li>Avoid exchanges that restrict withdrawals or promote altcoins aggressively</li>
              <li>Bitcoin-only exchanges often have better features for bitcoiners</li>
              <li>Think of the exchange as a bridge—buy there, don't live there</li>
              <li>Start with a small test transaction before committing larger amounts</li>
            </ul>
          </div>
    </LessonLayout>
  );
}
