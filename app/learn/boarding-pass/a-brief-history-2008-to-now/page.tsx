import LessonLayout from '@/components/LessonLayout';

export default function BoardingPassLesson() {
  return (
    <LessonLayout slug="a-brief-history-2008-to-now">
      <p>Every technology has an origin story. Bitcoin's is better than most—mysterious founder, decades of failed predecessors, perfect timing, and a community of idealists who kept it alive when no one else cared.</p>

      <p>Understanding the history helps you understand what Bitcoin is for.</p>

      <h3>The Prehistory: Cypherpunks</h3>

      <p>Bitcoin didn't emerge from nothing. It was the culmination of decades of work by cryptographers and privacy advocates known as "cypherpunks."</p>

      <p>In the 1990s, this loose community saw what was coming: digital surveillance, corporate control of information, governments with unprecedented power to monitor citizens. They believed cryptography—the mathematics of secure communication—could preserve freedom in the digital age.</p>

      <p>They tried to build digital cash. DigiCash (1989), e-gold (1996), bit gold (1998), b-money (1998), RPOW (2004). Each one failed, usually because they required trusted third parties or couldn't solve the double-spend problem.</p>

      <p>The ideas were right. The technology wasn't ready.</p>

      <h3>The Whitepaper: October 31, 2008</h3>

      <p>On Halloween 2008, someone calling themselves Satoshi Nakamoto posted a message to a cryptography mailing list:</p>

      <p><em>"I've been working on a new electronic cash system that's fully peer-to-peer, with no trusted third party."</em></p>

      <p>The linked paper—"Bitcoin: A Peer-to-Peer Electronic Cash System"—was just nine pages. It described a solution to the double-spend problem using proof of work and a distributed ledger. The ideas weren't all new, but the combination was.</p>

      <p>The timing was perfect. Lehman Brothers had collapsed six weeks earlier. The global financial system was in freefall. Trust in institutions was at a generational low.</p>

      <h3>The Genesis Block: January 3, 2009</h3>

      <p>Satoshi mined the first Bitcoin block on January 3, 2009. Embedded in it was a message:</p>

      <p><em>"The Times 03/Jan/2009 Chancellor on brink of second bailout for banks"</em></p>

      <p>This headline from a British newspaper served two purposes: proving the block wasn't mined before that date, and making a statement about why Bitcoin existed.</p>

      <p>For the first year, Bitcoin was essentially worthless—a curiosity among cryptographers. Satoshi kept mining, communicating on forums, and improving the code.</p>

      <h3>The First Transaction: 2010</h3>

      <p>The first known commercial Bitcoin transaction happened on May 22, 2010. A programmer named Laszlo Hanyecz paid 10,000 BTC for two pizzas, worth about $41 at the time.</p>

      <p>Those bitcoin would later be worth over $600 million. May 22 is now celebrated as "Bitcoin Pizza Day."</p>

      <p>Later that year, the first Bitcoin exchanges launched. Mt. Gox, named after a Magic: The Gathering card exchange (yes, really), would become the dominant exchange before its spectacular collapse in 2014.</p>

      <h3>Satoshi Disappears: 2011</h3>

      <p>In April 2011, Satoshi sent a final email: "I've moved on to other things." They were never heard from again.</p>

      <p>This disappearance was crucial. With the creator gone, there was no one to appeal to, no authority figure, no cult of personality. Bitcoin had to stand on its own.</p>

      <p>Satoshi's coins—estimated at around 1 million BTC—have never moved. Whoever Satoshi was, they left behind a monetary network worth hundreds of billions while keeping nothing for themselves.</p>

      <h3>The Early Years: 2011-2013</h3>

      <p>Bitcoin attracted a motley crew: libertarians, technologists, drug dealers (Silk Road launched in 2011), speculators, and the genuinely curious.</p>

      <p>Prices were volatile. $1 became $30 became $2 became $100. Each boom brought new attention; each crash was declared the end. "Bitcoin is dead" became a recurring headline.</p>

      <p>The community grew. Core developers maintained the code. Businesses built infrastructure. Enthusiasts spread the word.</p>

      <h3>Mt. Gox and the First Big Crash: 2014</h3>

      <p>In February 2014, Mt. Gox—handling about 70% of all Bitcoin trades—suspended withdrawals and then declared bankruptcy. 850,000 BTC had been stolen over several years, worth about $450 million at the time.</p>

      <p>The price crashed. Mainstream coverage was brutal. Many declared Bitcoin finished.</p>

      <p>But the network kept running. Every block was still being mined. Every transaction was still being verified. The protocol was fine—it was a company that failed, not the technology.</p>

      <p>This distinction would prove important again and again.</p>

      <h3>The Maturation: 2015-2020</h3>

      <p>The post-Mt. Gox years saw professionalization:</p>

      <ul>
        <li>Regulated exchanges replaced sketchy early platforms</li>
        <li>Custody solutions emerged for institutional investors</li>
        <li>The Lightning Network began development for faster payments</li>
        <li>Major companies started taking Bitcoin seriously</li>
      </ul>

      <p>Each halving (2012, 2016, 2020) reduced new supply and seemed to catalyze price increases. Theories emerged about four-year cycles driven by halving events.</p>

      <h3>The Institutional Era: 2020-Present</h3>

      <p>COVID-19 changed everything. Governments worldwide printed unprecedented amounts of money. Inflation, dormant for decades, returned with a vengeance.</p>

      <p>Suddenly, Bitcoin's pitch—money that can't be printed—resonated with a much wider audience.</p>

      <p>The dominoes fell quickly:</p>
      <ul>
        <li>MicroStrategy became the first public company to put Bitcoin on its balance sheet (2020)</li>
        <li>Tesla bought $1.5 billion in Bitcoin (2021)</li>
        <li>El Salvador made Bitcoin legal tender (2021)</li>
        <li>Major banks started offering Bitcoin services</li>
        <li>Fidelity, BlackRock, and other giants filed for Bitcoin ETFs</li>
        <li>Bitcoin ETFs were approved in the US (2024)</li>
      </ul>

      <p>Bitcoin went from "internet funny money" to a recognized asset class in under fifteen years—faster than any previous monetary transition in history.</p>

      <h3>What Comes Next?</h3>

      <p>No one knows. Predictions about Bitcoin have been consistently wrong in both directions.</p>

      <p>What we can say:</p>
      <ul>
        <li>The network has never been stronger technically</li>
        <li>Institutional adoption is accelerating</li>
        <li>Nation-state adoption is beginning</li>
        <li>The regulatory picture is slowly clarifying</li>
        <li>Each halving will continue reducing new supply</li>
      </ul>

      <p>Bitcoin's history suggests that reports of its death are always premature and that most people underestimate how far it can go.</p>

      <div className="lesson-summary">
        <h3 className="summary-title">Lesson Summary</h3>
        <ul className="summary-list">
          <li>Bitcoin built on decades of cypherpunk research into digital cash</li>
          <li>Launched in January 2009 with a message referencing bank bailouts</li>
          <li>Satoshi disappeared in 2011, leaving no authority figure</li>
          <li>Early years were volatile but the network never failed</li>
          <li>Mt. Gox collapse (2014) proved the protocol could survive company failures</li>
          <li>2020s brought institutional adoption and nation-state interest</li>
          <li>History shows: never bet against Bitcoin long-term</li>
        </ul>
      </div>
    </LessonLayout>
  );
}
