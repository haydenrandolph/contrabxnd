import LessonLayout from '@/components/LessonLayout';
import SupplyClockLab from '@/components/labs/SupplyClockLab';

export default function BoardingPassLesson() {
  return (
    <LessonLayout slug="21-million-the-number-that-changes-everything">
      <p>There will only ever be 21 million bitcoin. Not 21 million and one. Not "probably around 21 million." Exactly 21 million, and not a single satoshi more. This isn't a policy decision that could change. It isn't a promise from a CEO or a government. It's math. And it changes everything.</p>

      <div className="stat-highlight">
        <span className="stat-number">21,000,000</span>
        <span className="stat-label">Total Bitcoin That Will Ever Exist</span>
      </div>

      <p>To understand why this matters, you need to understand what it means for something to be truly scarce—and why most things you think are scarce really aren't.</p>

      <h3>The Illusion of Scarcity</h3>

      <p>We're told many things are scarce. Gold. Real estate. Fine art. Limited edition sneakers. But are they really?</p>

      <p><strong>Gold</strong> has a fixed supply... on Earth. But more is mined every year (about 2% of existing supply). And if we ever figure out asteroid mining, there's more gold floating in space than has ever been extracted from our planet.</p>

      <p><strong>Real estate</strong> is "limited"—they're not making more land, as the saying goes. Except we build up, reclaim from the sea, and develop previously uninhabitable areas constantly.</p>

      <p><strong>Limited editions</strong> are only limited until the company decides to release another edition. Just ask anyone who bought a "rare" digital collectible before the creators minted 10,000 more.</p>

      <p>Most scarcity is artificial. It exists because someone with authority says so, and it persists only as long as that authority keeps its word. The moment incentives change, the scarcity evaporates.</p>

      <div className="key-concept">
        <p className="key-concept-label">Key Insight</p>
        <p className="key-concept-text">Artificial scarcity can always be reversed. Bitcoin's scarcity cannot.</p>
      </div>

      <h3>How Bitcoin's Supply Works</h3>

      <p>Bitcoin's supply follows a fixed, predictable schedule that was set at the very beginning and cannot be changed:</p>

      <ul>
        <li>New bitcoin are created as rewards for "miners" who process transactions</li>
        <li>Initially, the reward was 50 bitcoin per block (roughly every 10 minutes)</li>
        <li>Every 210,000 blocks (about 4 years), the reward cuts in half</li>
        <li>This continues until the reward becomes zero, around the year 2140</li>
        <li>At that point, exactly 21 million bitcoin will exist</li>
      </ul>

      <p>This schedule is called the "halving" and it's written into the code that every Bitcoin node runs. Change it, and you're not running Bitcoin anymore—you're running something else that no one else will recognize.</p>

      <div className="illustration">
        <span className="illustration-label">Illustration</span>
        <span className="illustration-title">Bitcoin Supply Curve: Issuance Over Time</span>
      </div>

      <h3>The Halvings</h3>

      <p>The halving events are milestones in Bitcoin's history. As of 2024, about 19.5 million bitcoin have already been created—over 93% of all the bitcoin that will ever exist. The remaining 1.5 million will trickle out over the next 116 years.</p>

      <SupplyClockLab />

      <h3>Why Can't They Just Change It?</h3>

      <p>This is the question everyone asks. If Bitcoin is just software, can't someone just... update it?</p>

      <p>Technically, yes. Anyone can modify the Bitcoin code to allow more than 21 million coins. But here's the thing: that modified code wouldn't be Bitcoin. It would be a fork—a separate network that the rest of the world would ignore.</p>

      <p>For a change to become "real" Bitcoin, it would need to be accepted by:</p>

      <ul>
        <li>The majority of nodes (computers running Bitcoin software)</li>
        <li>The majority of miners (who process transactions)</li>
        <li>The majority of businesses (who accept Bitcoin)</li>
        <li>The majority of users (who hold and spend Bitcoin)</li>
      </ul>

      <p>Every single one of these groups has a massive incentive to reject any change that would devalue their existing bitcoin. It's like asking everyone who owns dollars to vote on whether to devalue their savings. The answer will always be no.</p>

      <div className="key-concept">
        <p className="key-concept-label">The Nuclear Option</p>
        <p className="key-concept-text">If someone tried to change the 21 million cap, the network would simply split. History shows which chain would retain value: the one that keeps its promises.</p>
      </div>

      <h3>Sound Money vs. Unsound Money</h3>

      <p>Economists talk about "sound money"—money that holds its value over time because its supply can't be arbitrarily increased. For most of human history, gold served this function. It's hard to mine, impossible to create from nothing, and its supply increases slowly and predictably.</p>

      <p>But even gold isn't perfectly sound. Governments debased gold coins by mixing in cheaper metals. Paper currencies "backed" by gold were eventually unpegged when governments wanted to print more. And gold's supply still increases by about 2% per year.</p>

      <p>Bitcoin is harder money than gold. Its supply increase is slower, more predictable, and absolutely capped. There's a term for this: Bitcoin is "ultra-sound money."</p>

      <div className="key-concept">
        <p className="key-concept-label">Compare</p>
        <p className="key-concept-text">Gold: ~2% annual supply increase, forever. Bitcoin: Decreasing supply increase, then zero.</p>
      </div>

      <h3>What About Dollars?</h3>

      <p>The US dollar has no supply cap. None. Zero. The Federal Reserve can create as many dollars as it wants, whenever it wants, for whatever reason it decides is important enough.</p>

      <p>And they do. In 2020 alone, roughly 40% of all dollars in existence were created. Not over decades—in a single year. If you held dollars, each one became worth less because there were suddenly a lot more of them chasing the same amount of goods.</p>

      <p>This is called inflation, and it's not a bug—it's a feature of the current system. Central banks target about 2% inflation per year. That might sound small, but it compounds:</p>

      <ul>
        <li>At 2% inflation, your money loses half its value in 35 years</li>
        <li>At 3% inflation (common in many countries), it loses half in 23 years</li>
        <li>At 7% inflation (the US rate in 2022), it loses half in 10 years</li>
      </ul>

      <p>This is the hidden tax that no one votes for. Your savings erode while the numbers in your account stay the same.</p>

      <h3>Thinking in Satoshis</h3>

      <p>A common objection: "21 million isn't enough for a global currency. How can everyone use it?"</p>

      <p>The answer: divisibility. Each bitcoin can be divided into 100 million units called "satoshis" (or "sats"). That means there are actually:</p>

      <div className="stat-highlight">
        <span className="stat-number">2.1 Quadrillion</span>
        <span className="stat-label">Total Satoshis That Will Ever Exist</span>
      </div>

      <p>That's 2,100,000,000,000,000 sats. Plenty for every human on Earth to own millions. The "21 million" limit isn't about how many units exist—it's about ensuring those units can't be multiplied.</p>

      <h3>The Game Theory</h3>

      <p>Here's the beautiful part: the 21 million cap creates a powerful feedback loop.</p>

      <p>Because supply is fixed, any increase in demand must be reflected in price. As price rises, more people become interested. As more people become interested, demand increases. As demand increases, price rises.</p>

      <p>This loop is what critics call a "bubble" and what proponents call "monetization"—the process of a new form of money being discovered and adopted. Either way, the fixed supply is what makes it possible. Without the cap, increased demand would just mean more coins being printed, which would satisfy demand without increasing price, which would remove the incentive to hold.</p>

      <p>The 21 million cap turns Bitcoin into a one-way door. Once you understand it, you can't unsee it.</p>

      <div className="lesson-summary">
        <h3 className="summary-title">Lesson Summary</h3>
        <ul className="summary-list">
          <li>Exactly 21 million bitcoin will ever exist—this is enforced by code, not promises</li>
          <li>New bitcoin are created through mining, with rewards halving every ~4 years</li>
          <li>Over 93% of all bitcoin have already been created</li>
          <li>Changing the cap would require consensus from nodes, miners, businesses, and users—all of whom have incentives to refuse</li>
          <li>Bitcoin is "ultra-sound money"—harder than gold, with a supply that eventually stops growing entirely</li>
          <li>Each bitcoin divides into 100 million satoshis, providing more than enough units for global use</li>
        </ul>
      </div>
    </LessonLayout>
  );
}
