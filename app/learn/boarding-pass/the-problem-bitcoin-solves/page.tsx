import LessonLayout from '@/components/LessonLayout';

export default function BoardingPassLesson() {
  return (
    <LessonLayout slug="the-problem-bitcoin-solves">
      <p>Before 2009, creating digital money that couldn't be copied was considered impossible. That might sound strange—after all, we send money digitally all the time. But what we call "digital money" is actually just messages about money, not the money itself. The difference matters more than you might think.</p>

      <p>To understand why Bitcoin is significant, you need to understand the problem it solved—a problem that computer scientists had been wrestling with for decades.</p>

      <h3>The Copy Problem</h3>

      <p>Digital things can be copied. That's kind of their superpower. Your MP3s, your photos, your documents—you can make infinite perfect copies with zero effort. That's great for sharing cat videos. It's terrible for money.</p>

      <p>Money only works if it's scarce. If you could copy a dollar as easily as you copy a file, dollars would be worthless within hours. Everyone would have infinite dollars, which means dollars would buy nothing.</p>

      <p>Physical cash solves this with, well, physicality. You can't email someone a $20 bill. If you hand it to them, you no longer have it. The scarcity is enforced by the laws of physics.</p>

      <p>But digital information doesn't work that way. Send someone a photo and you still have the photo. Send someone a file and you still have the file. How do you send someone money and not still have the money?</p>

      <div className="key-concept">
        <p className="key-concept-label">The Core Problem</p>
        <p className="key-concept-text">How do you create something digital that can't be copied?</p>
      </div>

      <h3>The Traditional Solution: Trusted Third Parties</h3>

      <p>Before Bitcoin, there was only one answer: use a trusted intermediary.</p>

      <p>When you Venmo someone $50, you're not sending digital money. You're sending a message to Venmo that says "please decrease my balance by $50 and increase their balance by $50." Venmo maintains the ledger—the record of who has what—and makes sure you can't spend the same $50 twice.</p>

      <p>This works. Mostly. But it has significant drawbacks:</p>

      <ul>
        <li><strong>You need permission.</strong> Venmo has to let you use their service. They can say no. They have said no to entire categories of legal transactions.</li>
        <li><strong>They can freeze your funds.</strong> If Venmo decides you violated their terms, your money is stuck. No appeal to physics is possible.</li>
        <li><strong>They see everything.</strong> Every transaction, every recipient, every pattern. This data is valuable, and it doesn't belong to you.</li>
        <li><strong>They can fail.</strong> Companies go bankrupt. Servers go down. Governments impose sanctions. When the intermediary fails, your money might fail with it.</li>
        <li><strong>They charge for the privilege.</strong> Credit cards: 2-3%. International wire transfers: $30-50 plus exchange rate markups. Remittances: up to 10%. These fees add up to hundreds of billions annually.</li>
      </ul>

      <p>For most transactions, most of the time, these drawbacks are tolerable. We've built an entire financial system around trusting intermediaries, and it sort of works.</p>

      <p>But "sort of works" isn't the same as "actually works." And for a lot of people in a lot of situations, the intermediaries don't work at all.</p>

      <div className="illustration">
        <span className="illustration-label">Illustration</span>
        <span className="illustration-title">The Intermediary Problem: Every Transaction Requires Trust</span>
      </div>

      <h3>The Double-Spend Problem</h3>

      <p>Computer scientists had a name for this challenge: the double-spend problem. If you have a digital token, what prevents you from sending it to two different people at the same time?</p>

      <p>Think about it: you have $100 in some digital wallet. You send $100 to Alice. A millisecond later, before the network has "caught up," you send the same $100 to Bob. Which transaction is valid? Who actually got paid?</p>

      <p>With a central authority, this is easy. The authority processes transactions in order and rejects the second one. But without a central authority? How do distributed computers around the world agree on which transaction came first?</p>

      <p>This was the unsolved problem. Cryptographers had been working on digital cash since the 1980s. DigiCash, e-gold, bit gold, b-money—they all either required trusted third parties or couldn't solve the double-spend problem. Many believed it couldn't be done.</p>

      <h3>Satoshi's Solution</h3>

      <p>In 2008, someone using the name Satoshi Nakamoto posted a paper to a cryptography mailing list. The title was simple: "Bitcoin: A Peer-to-Peer Electronic Cash System."</p>

      <p>The solution was elegant: instead of one authority maintaining the ledger, have thousands of computers maintain identical copies of the same ledger. Instead of trusting an institution, trust mathematics—specifically, the math that makes the ledger prohibitively expensive to fake.</p>

      <p>Here's the key insight: if changing the ledger requires enormous computational work, and if everyone can verify that the work was done, then no one can cheat without spending more than they'd gain. The incentives align toward honesty.</p>

      <div className="key-concept">
        <p className="key-concept-label">The Elegant Part</p>
        <p className="key-concept-text">Bitcoin doesn't prevent double-spending through authority. It prevents it through economic incentives. Cheating costs more than it's worth, so no one cheats.</p>
      </div>

      <h3>Why This Matters</h3>

      <p>The double-spend solution enabled something genuinely new: digital scarcity without trusted intermediaries.</p>

      <p>Before Bitcoin, the only digital things that were scarce were artificially scarce—made rare by companies or governments that could, at any time, make them un-rare. The scarcity of your in-game gold or airline miles or Venmo balance depends entirely on the policies of whoever controls the database.</p>

      <p>Bitcoin's scarcity is enforced by mathematics. No CEO can decide to inflate it. No government can print more. The rules are the rules, and they're enforced by every computer running the software.</p>

      <p>This is the first time in history that a digital asset has been genuinely scarce—not because someone says so, but because mathematics makes it so.</p>

      <div className="key-concept">
        <p className="key-concept-label">The Breakthrough</p>
        <p className="key-concept-text">Bitcoin created digital scarcity without requiring trust in any authority.</p>
      </div>

      <h3>Beyond Money</h3>

      <p>The implications extend beyond payments. What Bitcoin proved was that you can have digital consensus without central authority. You can have thousands of computers agree on the state of a shared ledger, update that ledger reliably, and do so in a way that no one can manipulate.</p>

      <p>This is a new primitive—a new basic building block for digital systems. It's not just money that requires consensus about who owns what. Property records, identity systems, contracts, voting—all of these are fundamentally about maintaining accurate shared records.</p>

      <p>Bitcoin solved the consensus problem for money first. But the solution is bigger than money.</p>

      <h3>The 2008 Context</h3>

      <p>It's not a coincidence that the Bitcoin whitepaper appeared in October 2008, at the height of the financial crisis. Banks were failing. Governments were bailing them out with money created from nothing. The trusted intermediaries that the entire financial system depended on were revealed to be fragile, captured, and often corrupt.</p>

      <p>Satoshi embedded a message in the first Bitcoin block: "The Times 03/Jan/2009 Chancellor on brink of second bailout for banks."</p>

      <p>The timing wasn't random. Bitcoin wasn't just a technical solution to the double-spend problem. It was a response to a system that had failed—a system where trusted third parties turned out to be neither trustworthy nor, in a crisis, particularly third-party.</p>

      <p>The problem Bitcoin solves isn't just technical. It's institutional. And that's why, fifteen years later, people are still arguing about it.</p>

      <div className="lesson-summary">
        <h3 className="summary-title">Lesson Summary</h3>
        <ul className="summary-list">
          <li>Digital information can be copied infinitely, which makes digital money hard</li>
          <li>The "double-spend problem" asks: how do you prevent spending the same digital money twice?</li>
          <li>Traditional solution: trusted intermediaries who maintain the ledger (banks, PayPal, Venmo)</li>
          <li>This works but requires permission, surveillance, and trust that often fails</li>
          <li>Bitcoin's solution: distributed consensus through mathematical proof of work</li>
          <li>The breakthrough: genuine digital scarcity without trusting any central authority</li>
        </ul>
      </div>
    </LessonLayout>
  );
}
