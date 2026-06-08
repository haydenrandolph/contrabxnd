import LessonLayout from '@/components/LessonLayout';

export default function BoardingPassLesson() {
  return (
    <LessonLayout slug="dca-the-boring-strategy-that-works">
      <p>You could try to time the market. Buy the dips. Sell the tops. Catch every swing.</p>

      <p>You won't succeed. Almost no one does. Even professional traders with sophisticated tools mostly fail to beat simple buy-and-hold strategies.</p>

      <p>There's a better approach: dollar-cost averaging (DCA). It's boring. It's simple. It works.</p>

      <h3>What Is DCA?</h3>

      <p>Dollar-cost averaging means investing a fixed amount at regular intervals, regardless of price.</p>

      <p>Instead of: "Bitcoin is at $50,000, should I buy?"<br />You do: "It's Tuesday, I buy $50 of bitcoin."</p>

      <p>That's it. No analysis. No timing. No stress.</p>

      <h3>Why It Works</h3>

      <p><strong>1. You remove emotion from the equation</strong></p>

      <p>When prices are high, you feel like you're buying the top. When prices are low, you're scared it'll go lower. Both feelings lead to bad decisions.</p>

      <p>DCA removes the decision. You buy on schedule. The price is what it is.</p>

      <p><strong>2. You average out volatility</strong></p>

      <p>Sometimes you buy high. Sometimes you buy low. Over time, you get an average price that smooths out the swings.</p>

      <p>Example over 4 weeks:</p>
      <ul>
        <li>Week 1: $60,000/BTC → $100 buys 0.00167 BTC</li>
        <li>Week 2: $50,000/BTC → $100 buys 0.00200 BTC</li>
        <li>Week 3: $55,000/BTC → $100 buys 0.00182 BTC</li>
        <li>Week 4: $65,000/BTC → $100 buys 0.00154 BTC</li>
        <li>Total: $400 invested, 0.00703 BTC</li>
        <li>Average price: $56,900</li>
      </ul>

      <p>You bought some at $60k and some at $50k. Your average is somewhere in between.</p>

      <p><strong>3. You're always buying</strong></p>

      <p>The best time to have bought Bitcoin was 10 years ago. The second best time is now. DCA ensures you're continuously accumulating, not waiting for a "perfect" entry that never comes.</p>

      <h3>Setting Up a DCA Plan</h3>

      <p><strong>Step 1: Decide your amount</strong><br />What can you invest regularly without stress? $20/week? $200/month? The amount matters less than consistency.</p>

      <p><strong>Step 2: Decide your frequency</strong><br />Weekly is common. Biweekly aligns with many paychecks. Monthly works too. More frequent = smoother averaging, but more transactions.</p>

      <p><strong>Step 3: Automate it</strong><br />Use an exchange with auto-purchase features (River, Swan, Coinbase). Set it and forget it.</p>

      <p><strong>Step 4: Auto-withdraw (if possible)</strong><br />Some services can automatically withdraw your bitcoin to your own wallet after purchase. This removes the temptation to leave it on the exchange.</p>

      <h3>DCA vs. Lump Sum</h3>

      <p>What if you have a lump sum to invest? Is it better to DCA in or invest all at once?</p>

      <p>Mathematically, in an appreciating asset, lump sum usually wins. You want your money working as long as possible.</p>

      <p>Psychologically, DCA often wins. If you invest everything and the price immediately drops 30%, you might panic sell. DCA protects you from this.</p>

      <p>Know yourself. If you can handle volatility emotionally, lump sum. If not, DCA in over a few months.</p>

      <h3>The Real Secret</h3>

      <p>The real secret to DCA is that it keeps you in the game.</p>

      <p>Most people who try to time the market eventually:</p>
      <ul>
        <li>Sell during a crash and miss the recovery</li>
        <li>Wait for a dip that never comes and miss the run</li>
        <li>Trade themselves into a loss through fees and taxes</li>
      </ul>

      <p>DCA just keeps accumulating. Through crashes. Through rallies. Through boring periods. Year after year.</p>

      <p>The people with the most bitcoin aren't the best traders. They're the ones who consistently stacked over time.</p>

      <h3>Common Objections</h3>

      <p><strong>"But what if I know it's going down?"</strong><br />You don't know. No one does. And even if it does, do you know when to buy back in? Just DCA.</p>

      <p><strong>"DCA means buying at highs too"</strong><br />Yes, and at lows, and everything in between. That's the point. Over bitcoin's history, all DCA strategies have been profitable given enough time.</p>

      <p><strong>"This is too boring"</strong><br />Boring is good. Exciting trading is usually expensive trading. Wealth is built through consistency, not cleverness.</p>

      <div className="key-concept">
        <p className="key-concept-label">Key Concept</p>
        <p className="key-concept-text">The goal isn't to be smart. The goal is to be consistent. DCA makes consistency automatic.</p>
      </div>

      <div className="lesson-summary">
        <h3 className="summary-title">Lesson Summary</h3>
        <ul className="summary-list">
          <li>DCA = fixed amount at regular intervals, regardless of price</li>
          <li>Removes emotion and timing decisions</li>
          <li>Averages out volatility over time</li>
          <li>Automate purchases so you don't have to decide each time</li>
          <li>Lump sum often beats DCA mathematically, but DCA wins psychologically</li>
          <li>Consistency beats timing—just keep stacking</li>
        </ul>
      </div>
    </LessonLayout>
  );
}
