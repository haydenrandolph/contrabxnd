import LessonLayout from '@/components/LessonLayout';

export default function BoardingPassLesson() {
  return (
    <LessonLayout slug="how-the-network-works">
      <p>You've heard the terms: blockchain, mining, nodes, hash rate. They sound technical because they are. But the concepts underneath aren't complicated—they've just been explained badly by people who either don't understand them or have incentives to keep them mysterious.</p>

      <p>Let's fix that.</p>

      <h3>The Ledger</h3>

      <p>At its core, Bitcoin is a ledger—a list of transactions. That's it. "Alice sent 0.5 BTC to Bob." "Bob sent 0.3 BTC to Carol." On and on, every transaction that's ever happened, all the way back to January 2009.</p>

      <p>This ledger isn't stored in one place. It's copied across thousands of computers worldwide. Every copy is identical. When a new transaction happens, every copy updates. If someone tries to change their copy—to give themselves free bitcoin, say—their copy no longer matches everyone else's, and the network ignores it.</p>

      <p>The magic is in how the network agrees on which transactions are legitimate and which aren't.</p>

      <h3>Nodes: The Verifiers</h3>

      <p>A node is simply a computer running Bitcoin software. Anyone can run one. You could run one on an old laptop if you wanted.</p>

      <p>Nodes do three things:</p>

      <ol>
        <li><strong>Store a complete copy of the ledger</strong> (currently about 500GB)</li>
        <li><strong>Validate new transactions</strong> (checking that senders actually have the bitcoin they're trying to send)</li>
        <li><strong>Relay valid transactions</strong> to other nodes</li>
      </ol>

      <p>When someone sends bitcoin, their transaction gets broadcast to the network. Nodes check it: Does this person actually have the bitcoin they're trying to send? Is the transaction properly signed? If yes, the node passes it along. If no, the transaction gets rejected.</p>

      <p>This is the first layer of security. Fake transactions don't spread because honest nodes refuse to relay them.</p>

      <div className="key-concept">
        <p className="key-concept-label">Why This Matters</p>
        <p className="key-concept-text">With thousands of nodes, no single entity controls what transactions are valid. The rules are the rules, and everyone enforces them.</p>
      </div>

      <div className="illustration">
        <span className="illustration-label">Illustration</span>
        <span className="illustration-title">Network of Nodes Validating Transactions</span>
      </div>

      <h3>Miners: The Writers</h3>

      <p>Nodes verify transactions, but they don't write them to the permanent ledger. That's what miners do.</p>

      <p>Miners bundle pending transactions into "blocks" and compete to add those blocks to the chain. The competition works like this:</p>

      <ol>
        <li>Collect pending transactions into a block</li>
        <li>Try to solve a mathematical puzzle (more on this in a moment)</li>
        <li>If you solve it first, you get to add your block to the chain</li>
        <li>As a reward, you receive newly created bitcoin plus transaction fees</li>
      </ol>

      <p>The puzzle is deliberately hard. It requires massive computational power and electricity. On average, the network adjusts the difficulty so that a new block is found every 10 minutes, regardless of how much total computing power is pointed at the problem.</p>

      <h3>The Puzzle: Proof of Work</h3>

      <p>The mathematical puzzle is called "proof of work," and it's beautifully simple.</p>

      <p>Each block contains:</p>
      <ul>
        <li>A list of transactions</li>
        <li>A reference to the previous block</li>
        <li>A random number called a "nonce"</li>
      </ul>

      <p>Miners have to find a nonce that, when combined with the rest of the block and run through a hash function, produces a result below a certain target. The only way to find it is to try billions of random numbers until one works.</p>

      <p>This is the "work" in proof of work. It costs real money—electricity, hardware. A miner who successfully adds a block has proven they spent real resources, which is why they deserve the reward.</p>

      <div className="key-concept">
        <p className="key-concept-label">The Security Model</p>
        <p className="key-concept-text">To change the ledger, you'd need to redo the work for every block since the change—while the rest of the network keeps adding new blocks. This becomes astronomically expensive within hours.</p>
      </div>

      <h3>The Chain</h3>

      <p>Why "blockchain"? Because each block contains a reference to the previous block, forming a chain. Block 800,000 points to block 799,999, which points to 799,998, all the way back to block 0 (the "genesis block").</p>

      <p>This chain structure is what makes the ledger tamper-proof. If you change anything in block 799,999, it changes that block's hash, which breaks the reference in block 800,000, which breaks every block after it. You can't edit history without rebuilding everything that came after.</p>

      <p>And since the network is constantly adding new blocks, you're not just racing against history—you're racing against the present.</p>

      <h3>Putting It Together</h3>

      <p>Here's how a transaction actually works:</p>

      <ol>
        <li>You sign a transaction with your private key (proving you own the bitcoin)</li>
        <li>You broadcast it to the network</li>
        <li>Nodes verify it and relay it to other nodes</li>
        <li>Miners collect it into a block</li>
        <li>A miner solves the proof-of-work puzzle</li>
        <li>The new block is broadcast to all nodes</li>
        <li>Nodes verify the block and add it to their copy of the chain</li>
        <li>Your transaction is now part of the permanent record</li>
      </ol>

      <p>The whole process takes about 10 minutes on average for the first confirmation, though for small amounts, you can often rely on seeing the transaction in the mempool (the "waiting room" for unconfirmed transactions).</p>

      <h3>Why Not Just Trust a Company?</h3>

      <p>Visa processes thousands of transactions per second. Bitcoin manages about 7. Why go through all this complexity?</p>

      <p>Because Visa requires you to trust Visa. They can reverse transactions. They can freeze accounts. They can deny service. They can be hacked, regulated, or shut down.</p>

      <p>Bitcoin trades speed for something else: finality without trust. Once a transaction has a few confirmations, it's practically impossible to reverse. No one can freeze your bitcoin. No one can deny you service. The tradeoff is worth it for people who need those guarantees.</p>

      <h3>The Energy Question</h3>

      <p>Yes, Bitcoin uses electricity. A lot of it. This is often cited as criticism.</p>

      <p>Here's the context:</p>

      <ul>
        <li>Bitcoin mining increasingly uses stranded, renewable, or otherwise wasted energy</li>
        <li>The energy secures a global, permissionless monetary network</li>
        <li>Traditional finance uses enormous amounts of energy too—bank branches, data centers, armored trucks, the entire military apparatus that backs the dollar</li>
        <li>The question isn't "does it use energy?" but "is it worth it?"</li>
      </ul>

      <p>For people in countries with unstable currencies, capital controls, or corrupt banking systems, the answer is often yes. For people in stable, wealthy countries with functional banks, the answer might be "not yet."</p>

      <div className="lesson-summary">
        <h3 className="summary-title">Lesson Summary</h3>
        <ul className="summary-list">
          <li>The Bitcoin ledger is stored on thousands of nodes worldwide</li>
          <li>Nodes verify transactions and reject invalid ones</li>
          <li>Miners compete to add blocks by solving proof-of-work puzzles</li>
          <li>The blockchain structure makes tampering prohibitively expensive</li>
          <li>Bitcoin trades speed for finality and trustlessness</li>
          <li>Energy consumption is the cost of security without central authority</li>
        </ul>
      </div>
    </LessonLayout>
  );
}
