import LessonLayout from '@/components/LessonLayout';
import AddressTypeLab from '@/components/labs/AddressTypeLab';

export default function BoardingPassLesson() {
  return (
    <LessonLayout slug="understanding-wallets">
      <p>"Not your keys, not your coins." This phrase, repeated endlessly in Bitcoin circles, isn't just a catchy slogan—it's the foundational principle of Bitcoin self-custody. Understanding wallets is understanding how you actually take control of your money in this new system.</p>

      <h2>What Is a Wallet, Really?</h2>
      <p>Despite the name, a Bitcoin wallet doesn't "hold" your bitcoin the way a leather wallet holds cash. Your bitcoin never leaves the blockchain. What a wallet actually stores is your private keys—the cryptographic passwords that prove ownership and allow you to spend your bitcoin.</p>
      <p>Think of it this way: the blockchain is a vast public ledger showing who owns what. Your wallet is the keyring that lets you unlock and move your portion of that ledger. Without the keys, you can't access your bitcoin. With the keys, you have absolute control.</p>

      <AddressTypeLab />

      <h2>The Four Categories of Wallets</h2>
      <p>Bitcoin wallets are typically classified along two dimensions: connectivity (hot vs. cold) and control (custodial vs. non-custodial). Understanding these distinctions helps you choose the right tool for your needs.</p>

      <h3>Hot vs. Cold</h3>
      <p><strong>Hot wallets</strong> are connected to the internet. They're convenient for everyday transactions—checking balances, sending bitcoin, receiving payments—but their online nature makes them more vulnerable to hacking, malware, and remote attacks.</p>
      <p><strong>Cold wallets</strong> are offline. They store your keys on a physical device (like a hardware wallet) or even on paper. This makes them incredibly secure against digital threats, but less convenient for frequent transactions. Cold storage is the gold standard for long-term holdings.</p>

      <h3>Custodial vs. Non-Custodial</h3>
      <p><strong>Custodial wallets</strong> are provided by a third party—usually an exchange like Coinbase, Kraken, or Cash App. The company holds your private keys on your behalf. You trust them to secure your bitcoin and honor your withdrawal requests. It's convenient and familiar (like a bank account), but it violates the core Bitcoin principle: if someone else holds the keys, they control the bitcoin, not you.</p>
      <p><strong>Non-custodial wallets</strong> give you full control of your private keys. You—and only you—can move your bitcoin. There's no company to freeze your account, no terms of service to violate, no middleman to trust. This is true ownership, but it also means true responsibility: if you lose your keys, no one can help you recover them.</p>

      <div className="key-concept">
        <div className="key-concept-label">Core Principle</div>
        <p className="key-concept-text">Bitcoin custody exists on a spectrum from fully custodial (an exchange holds everything) to fully self-sovereign (you control every aspect). The goal is to move toward self-custody as your holdings and skills grow.</p>
      </div>

      <h2>Common Wallet Formats</h2>
      <p>Beyond these categories, wallets come in different physical forms:</p>
      <ul>
        <li><strong>Mobile wallets:</strong> Apps on your smartphone. Usually hot and non-custodial. Great for daily spending and learning. Examples: Muun, Blue Wallet, Phoenix.</li>
        <li><strong>Desktop wallets:</strong> Software on your computer. More features and control than mobile wallets, often used by intermediate users. Examples: Electrum, Sparrow, Bitcoin Core.</li>
        <li><strong>Hardware wallets:</strong> Physical devices that store your keys offline. Cold and non-custodial. The best option for serious security. Examples: Coldcard, Ledger, Trezor.</li>
        <li><strong>Paper wallets:</strong> Your keys printed or written on paper. Old-school cold storage, but prone to physical damage and human error. Not recommended for beginners.</li>
        <li><strong>Web wallets:</strong> Browser-based wallets, often custodial. The least secure option, but very convenient. Use only for trivial amounts.</li>
      </ul>

      <h2>Security vs. Convenience: The Trade-Off</h2>
      <p>Every wallet choice involves a trade-off. The most secure option (a hardware wallet stored in a safe) is not the most convenient. The most convenient option (an exchange account) is not the most secure.</p>
      <p>Most Bitcoiners adopt a layered approach: a hot mobile wallet for daily spending (think "checking account") and a cold hardware wallet for long-term savings (think "savings account"). As your holdings grow, you graduate to more secure storage.</p>

      <h2>Common Mistakes to Avoid</h2>
      <ul>
        <li><strong>Leaving large amounts on exchanges:</strong> Exchanges get hacked. They go bankrupt. They freeze accounts. If you're not actively trading, move your bitcoin to a wallet you control.</li>
        <li><strong>Using closed-source wallets:</strong> Trust wallets with publicly auditable code. If the code is secret, you can't verify what it's doing with your keys.</li>
        <li><strong>Not backing up immediately:</strong> The moment you set up a wallet, write down your backup phrase. Devices fail. Apps crash. Backups save you.</li>
        <li><strong>Reusing addresses:</strong> For privacy, generate a new address for each transaction. Most modern wallets do this automatically.</li>
      </ul>

      <h2>Which Wallet Should You Choose?</h2>
      <p>If you're just starting (under $1,000 in bitcoin): Use a non-custodial mobile wallet. It's user-friendly, teaches you the basics, and gives you real ownership without overwhelming complexity.</p>
      <p>If you're accumulating (over $1,000): Consider a hardware wallet for most of your holdings, with a small amount in a mobile wallet for spending. This is the sweet spot for most users.</p>
      <p>If you're holding serious wealth (over $10,000): Use a high-quality hardware wallet with strong security practices. Consider multisig setups (requiring multiple keys to spend) for very large amounts.</p>

      <p>In the next lesson, we'll walk through setting up your first non-custodial wallet step by step. You'll see exactly how to take custody of your bitcoin and start using it with confidence.</p>

      <div className="lesson-summary">
        <h3 className="summary-title">Lesson Summary</h3>
        <ul className="summary-list">
          <li>Wallets hold keys, not bitcoin—the bitcoin is always on the blockchain</li>
          <li>Custodial = someone else controls keys; non-custodial = you control keys</li>
          <li>Hot = connected to internet; cold = offline</li>
          <li>Mobile wallets for convenience; hardware wallets for security</li>
          <li>Your seed phrase IS your wallet—protect it absolutely</li>
          <li>Start with mobile, graduate to hardware as amounts grow</li>
        </ul>
      </div>
    </LessonLayout>
  );
}
