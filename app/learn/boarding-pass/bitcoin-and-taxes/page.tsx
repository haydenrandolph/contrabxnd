import LessonLayout from '@/components/LessonLayout';

export default function BoardingPassLesson() {
  return (
    <LessonLayout slug="bitcoin-and-taxes">
      <p>Nobody likes talking about taxes. But if you're buying Bitcoin, you need to understand the basics—because ignorance won't protect you from the IRS or your local tax authority.</p>

      <p><strong>Disclaimer:</strong> This is general education, not tax advice. Tax laws vary by country and change frequently. Consult a tax professional for your specific situation.</p>

      <h3>The Basic Framework (US)</h3>

      <p>In the United States, Bitcoin is treated as property, not currency. This has significant implications:</p>

      <p><strong>Buying Bitcoin:</strong> Not a taxable event. You're just exchanging one form of property for another.</p>

      <p><strong>Selling Bitcoin:</strong> Taxable event. You realize a gain or loss.</p>

      <p><strong>Spending Bitcoin:</strong> Also a taxable event. When you buy coffee with bitcoin, you're technically selling bitcoin and must report any gain or loss.</p>

      <p><strong>Receiving Bitcoin as income:</strong> Taxable as ordinary income at fair market value when received.</p>

      <h3>Capital Gains 101</h3>

      <p>When you sell bitcoin for more than you paid, you have a capital gain. When you sell for less, a capital loss.</p>

      <p><strong>Short-term gains</strong> (held less than 1 year): Taxed as ordinary income (up to 37%)</p>

      <p><strong>Long-term gains</strong> (held more than 1 year): Taxed at preferential rates (0%, 15%, or 20% depending on income)</p>

      <p>This creates a strong incentive to hold for at least a year before selling—the "long-term capital gains" threshold.</p>

      <h3>Cost Basis</h3>

      <p>Your "cost basis" is what you paid for the bitcoin, including fees. When you sell, your gain is:</p>

      <p>Sale Price - Cost Basis = Capital Gain (or Loss)</p>

      <p>Example:</p>
      <ul>
        <li>You bought 0.1 BTC for $5,000</li>
        <li>You sold 0.1 BTC for $8,000</li>
        <li>Your capital gain is $3,000</li>
      </ul>

      <p>If you've bought bitcoin multiple times at different prices, tracking cost basis becomes more complex. You'll need to use an accounting method (FIFO, LIFO, or specific identification).</p>

      <h3>Record Keeping</h3>

      <p>Keep records of every transaction:</p>
      <ul>
        <li>Date of purchase</li>
        <li>Amount purchased</li>
        <li>Price paid (in USD)</li>
        <li>Fees paid</li>
        <li>Date of sale (if applicable)</li>
        <li>Sale price (if applicable)</li>
      </ul>

      <p>Many exchanges provide transaction history exports. There are also crypto tax software tools (CoinTracker, Koinly, etc.) that can help aggregate data across exchanges and wallets.</p>

      <h3>Common Taxable Events</h3>

      <p><strong>Taxable:</strong></p>
      <ul>
        <li>Selling bitcoin for fiat (dollars, euros, etc.)</li>
        <li>Trading bitcoin for another cryptocurrency</li>
        <li>Spending bitcoin on goods or services</li>
        <li>Receiving bitcoin as payment for work</li>
        <li>Mining bitcoin (income when received, then capital gains when sold)</li>
        <li>Receiving bitcoin from a fork or airdrop (varies—consult professional)</li>
      </ul>

      <p><strong>Not taxable:</strong></p>
      <ul>
        <li>Buying bitcoin with fiat</li>
        <li>Transferring bitcoin between your own wallets</li>
        <li>Giving bitcoin as a gift (but gift tax rules may apply)</li>
        <li>Donating bitcoin to charity (may even get a deduction)</li>
      </ul>

      <h3>The DCA Complexity</h3>

      <p>If you're dollar-cost averaging, you're creating many small purchases with different cost bases. Each sale will need to reference the appropriate cost basis.</p>

      <p>This is where tax software becomes valuable. Manually tracking hundreds of small purchases is tedious and error-prone.</p>

      <h3>Losses Can Help</h3>

      <p>If you sell bitcoin at a loss, that loss can offset gains—either from other crypto sales or from other investments. If your losses exceed your gains, you can deduct up to $3,000 per year against ordinary income, carrying forward any excess.</p>

      <p>This is called "tax loss harvesting." Some people strategically realize losses to reduce their tax burden.</p>

      <p><strong>Note:</strong> Wash sale rules (which prevent selling and immediately rebuying to claim a loss) currently don't apply to crypto in the US, but this may change.</p>

      <h3>Other Countries</h3>

      <p>Tax treatment varies significantly:</p>
      <ul>
        <li><strong>Germany:</strong> No tax on bitcoin held over 1 year</li>
        <li><strong>Portugal:</strong> Historically favorable, but changing</li>
        <li><strong>Singapore:</strong> No capital gains tax</li>
        <li><strong>UK:</strong> Capital gains tax applies, with allowances</li>
        <li><strong>Canada:</strong> 50% of capital gains are taxable</li>
      </ul>

      <p>Research your jurisdiction or consult a professional who understands crypto taxation in your country.</p>

      <h3>Reporting Requirements</h3>

      <p>In the US, you're required to report cryptocurrency transactions on your tax return. There's a checkbox on Form 1040 asking about virtual currency transactions.</p>

      <p>Exchanges are increasingly required to report to the IRS (1099 forms). The days of crypto being a tax "gray area" are ending. Assume the government knows about your exchange transactions.</p>

      <h3>The Simple Path</h3>

      <p>If taxes feel overwhelming, the simplest approach:</p>

      <ol>
        <li><strong>Buy and hold.</strong> No tax until you sell.</li>
        <li><strong>Use one exchange.</strong> Easier record keeping.</li>
        <li><strong>Don't trade.</strong> Trading creates taxable events and complexity.</li>
        <li><strong>Hold over 1 year.</strong> Get long-term capital gains rates when you do sell.</li>
        <li><strong>Use tax software.</strong> Let it aggregate your transactions.</li>
        <li><strong>Consult a professional.</strong> Especially if amounts are significant.</li>
      </ol>

      <p>The DCA-and-hold strategy isn't just good for returns—it's good for tax simplicity.</p>

      <div className="key-concept">
        <p className="key-concept-label">Key Concept</p>
        <p className="key-concept-text">Every sale or spend of bitcoin is a taxable event. The simplest tax strategy is the simplest investment strategy: buy, hold, don't trade.</p>
      </div>

      <div className="lesson-summary">
        <h3 className="summary-title">Lesson Summary</h3>
        <ul className="summary-list">
          <li>In the US, bitcoin is property—buying isn't taxable, but selling/spending is</li>
          <li>Short-term gains (under 1 year) are taxed higher than long-term gains</li>
          <li>Track cost basis for every purchase</li>
          <li>Keep detailed records of all transactions</li>
          <li>Tax software can help manage DCA complexity</li>
          <li>Tax laws vary by country—research yours</li>
          <li>The simplest approach: buy, hold, don't trade frequently</li>
          <li>When in doubt, consult a tax professional</li>
        </ul>
      </div>
    </LessonLayout>
  );
}
