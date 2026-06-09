import LessonLayout from '@/components/LessonLayout';

export default function BoardingPassLesson() {
  return (
    <LessonLayout slug="ways-to-acquire-bitcoin">
      <p>You understand what Bitcoin is. Now you want some. The good news: there are more ways to acquire bitcoin than ever before. The bad news: each method has tradeoffs you should understand.</p>

      <h3>Method 1: Centralized Exchanges</h3>

      <p>The most common way to buy bitcoin. You sign up for an account, verify your identity, link a bank account or card, and buy.</p>

      <p><strong>Popular options:</strong> Coinbase, Kraken, Gemini, River, Swan</p>

      <p><strong>Pros:</strong></p>
      <ul>
        <li>Easy to use</li>
        <li>High liquidity (you can buy/sell any amount)</li>
        <li>Regulated (some protection if things go wrong)</li>
        <li>Accept various payment methods</li>
      </ul>

      <p><strong>Cons:</strong></p>
      <ul>
        <li>Require identity verification (KYC)</li>
        <li>Your purchase history is linked to your identity</li>
        <li>You're trusting the exchange to not lose your bitcoin</li>
        <li>Fees vary (sometimes hidden in the spread)</li>
      </ul>

      <p><strong>Best for:</strong> Beginners making their first purchase, larger amounts, DCA (regular automated purchases)</p>

      <div className="highlight-box">
        <h4>Critical</h4>
        <p>Don't leave large amounts on exchanges long-term. We'll cover why in Week 3.</p>
      </div>

      <h3>Method 2: Bitcoin-Only Exchanges</h3>

      <p>A subset of centralized exchanges that focus exclusively on Bitcoin. They tend to have better customer service for bitcoiners and often offer auto-withdrawal features.</p>

      <p><strong>Popular options:</strong> River, Swan, Strike</p>

      <p><strong>Pros:</strong></p>
      <ul>
        <li>Bitcoin-focused support and education</li>
        <li>Often have automatic withdrawal to self-custody</li>
        <li>Generally lower fees for recurring purchases</li>
        <li>No altcoin distractions</li>
      </ul>

      <p><strong>Cons:</strong></p>
      <ul>
        <li>Still require KYC</li>
        <li>May have lower liquidity than larger exchanges</li>
        <li>Limited to fewer regions</li>
      </ul>

      <p><strong>Best for:</strong> People who know they only want Bitcoin, DCA strategies</p>

      <h3>Method 3: Peer-to-Peer (P2P)</h3>

      <p>Buy directly from another person, often through platforms that facilitate the trade.</p>

      <p><strong>Popular options:</strong> Bisq, Hodl Hodl, RoboSats, Peach</p>

      <p><strong>Pros:</strong></p>
      <ul>
        <li>Often no or minimal KYC</li>
        <li>More private</li>
        <li>Supports various payment methods</li>
        <li>Decentralized (some platforms can't be shut down)</li>
      </ul>

      <p><strong>Cons:</strong></p>
      <ul>
        <li>Usually higher prices (premium for privacy)</li>
        <li>Lower liquidity</li>
        <li>More complex to use</li>
        <li>Counterparty risk (though platforms use escrow)</li>
      </ul>

      <p><strong>Best for:</strong> Privacy-conscious buyers, people in regions without good exchanges, small amounts</p>

      <h3>Method 4: Bitcoin ATMs</h3>

      <p>Physical machines where you can buy bitcoin with cash.</p>

      <p><strong>Pros:</strong></p>
      <ul>
        <li>Cash purchases possible</li>
        <li>Sometimes lower KYC for small amounts</li>
        <li>No bank account needed</li>
      </ul>

      <p><strong>Cons:</strong></p>
      <ul>
        <li>High fees (often 5-15%!)</li>
        <li>May still require identity for larger amounts</li>
        <li>Limited locations</li>
        <li>Often worse exchange rates</li>
      </ul>

      <p><strong>Best for:</strong> Cash purchases, people without bank accounts, emergencies only (due to fees)</p>

      <h3>Method 5: Earning Bitcoin</h3>

      <p>Getting paid for work, products, or services in bitcoin.</p>

      <p><strong>Ways to earn:</strong></p>
      <ul>
        <li>Ask your employer for partial salary in BTC</li>
        <li>Freelance on bitcoin-friendly platforms</li>
        <li>Sell products and accept bitcoin payment</li>
        <li>Create content and accept bitcoin tips</li>
        <li>Use services like Fold or Lolli for "cash back" in bitcoin</li>
      </ul>

      <p><strong>Pros:</strong></p>
      <ul>
        <li>No KYC on the bitcoin itself</li>
        <li>Potentially better tax treatment (income vs. capital gains)</li>
        <li>Aligns incentives (you want bitcoin to succeed)</li>
      </ul>

      <p><strong>Cons:</strong></p>
      <ul>
        <li>Requires finding willing payers</li>
        <li>May complicate taxes</li>
        <li>Volatile income if priced in BTC</li>
      </ul>

      <p><strong>Best for:</strong> Freelancers, people with skills in demand, long-term bitcoiners</p>

      <h3>Method 6: Mining</h3>

      <p>Running computers to secure the network and earn block rewards.</p>

      <p><strong>Reality check:</strong> Home mining is rarely profitable today. It requires:</p>
      <ul>
        <li>Specialized hardware (ASICs)</li>
        <li>Cheap electricity (under $0.06/kWh to be competitive)</li>
        <li>Technical knowledge</li>
        <li>Tolerance for noise and heat</li>
      </ul>

      <p>For most people, buying bitcoin is more cost-effective than mining it. Mining is now primarily done by large operations with economies of scale.</p>

      <p><strong>Exception:</strong> Some people mine despite unprofitability because it's a way to acquire bitcoin without KYC, or they have free/excess electricity.</p>

      <h2>The KYC Question</h2>

      <p>KYC (Know Your Customer) requirements mean exchanges collect your identity information. This has implications:</p>

      <ul>
        <li><strong>Privacy:</strong> Your bitcoin purchases are linked to your identity</li>
        <li><strong>Taxation:</strong> Governments know you own bitcoin</li>
        <li><strong>Security:</strong> Your data could be leaked in breaches</li>
      </ul>

      <p>Some people don't mind this. They're in stable countries, they plan to pay taxes, and they value the convenience. Others prefer to minimize the data trail.</p>

      <p>Both approaches are valid. Just make the choice consciously.</p>

      <div className="highlight-box">
        <h4>Note</h4>
        <p>Non-KYC bitcoin usually costs more (P2P premiums). You're paying for privacy.</p>
      </div>

      <h2>Fees to Watch For</h2>

      <p>Bitcoin purchases involve several potential fees:</p>

      <ul>
        <li><strong>Trading fees:</strong> Percentage of your purchase (0.1-1.5%)</li>
        <li><strong>Spread:</strong> Difference between buy and sell price (often hidden)</li>
        <li><strong>Deposit fees:</strong> For funding your account</li>
        <li><strong>Withdrawal fees:</strong> For moving bitcoin off the exchange</li>
        <li><strong>Network fees:</strong> For the actual blockchain transaction</li>
      </ul>

      <p>Always check the total cost, not just the headline fee. Some "zero fee" services make money on the spread.</p>

      <h2>Dollar-Cost Averaging (DCA)</h2>

      <p>You don't have to buy all at once. Many people set up automatic recurring purchases—weekly or monthly.</p>

      <p><strong>Why DCA:</strong></p>
      <ul>
        <li>Removes timing decisions (no trying to "buy the dip")</li>
        <li>Smooths out volatility</li>
        <li>Builds the habit of accumulating</li>
        <li>Psychologically easier than lump sum decisions</li>
      </ul>

      <p><strong>How to DCA:</strong></p>
      <ul>
        <li>Set a fixed amount (e.g., $50/week)</li>
        <li>Use a service with auto-purchase</li>
        <li>Set up auto-withdrawal to your own wallet</li>
        <li>Forget about it</li>
      </ul>

      <p>Services like River and Swan are designed for this approach.</p>

      <div className="lesson-summary">
        <h3 className="summary-title">Lesson Summary</h3>
        <ul className="summary-list">
          <li>Centralized exchanges are easiest but require KYC</li>
          <li>Bitcoin-only exchanges often have better features for bitcoiners</li>
          <li>P2P is more private but more complex and expensive</li>
          <li>Bitcoin ATMs have high fees—use sparingly</li>
          <li>Earning bitcoin is possible and often underrated</li>
          <li>Mining is not practical for most individuals</li>
          <li>Consider whether KYC matters to you before choosing a method</li>
          <li>DCA (regular purchases) is often better than timing the market</li>
        </ul>
      </div>
    </LessonLayout>
  );
}
