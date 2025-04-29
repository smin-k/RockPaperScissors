RockPaperScissors (Forked & Updated)
🔄 Updates from Original
This project is forked from Noah-Vincenz Noeh's original RockPaperScissors DApp and includes significant updates:

✅ Updated for Solidity 0.8.x (London Hardfork compatible)
The smart contract is refactored to use modern Solidity features and syntax based on the London EVM upgrade.

✅ Deployed via Remix, instead of Truffle migrations.

✅ Frontend decoupled: runs independently via npm run dev, and manually connects to a contract address.

⏱ Timeout Reset Mechanism: Prevents game lock-up. If one player is inactive for more than 10 minutes, the other can reset and receive compensation.

💰 Punishment Logic: Timeout reset rewards only the active participant, or splits evenly if both are inactive.

📝 Description
Rock Paper Scissors is a zero-sum game with three choices — Rock, Paper, Scissors. This DApp ensures fair play via Ethereum smart contracts, utilizing a commit-reveal scheme:

Players lock a hash of (shape + secret)

After both are locked, they reveal

Smart contract checks correctness and distributes rewards

🏗 Architecture


Differences from the original:
🛠 Solidity 0.8.x code compatible with London EVM upgrades

🧱 Manual contract deployment via Remix

🌐 Web frontend is separated and connects through Web3.js

⏳ Timeout feature added for resilience and fairness

🚀 How to Use
1. Contract Deployment (Remix)
Open Remix

Paste RockPaperScissors.sol and compile with Solidity 0.8.x

Deploy on any testnet (e.g., Ganache, Sepolia, or MetaMask-injected network)

Copy the deployed contract address

2. Frontend Setup
bash
복사
편집
npm install
npm run dev
Visit http://localhost:3000 in your browser.
Paste the deployed contract address into the input field and click Connect.

🎮 Gameplay Flow
Each player registers (5 ETH entry)

Lock shape using a secret password

Reveal shape using same password

Distribute rewards

If a player delays over 600 seconds, use Timeout Reset

⏱ Timeout Reset
Available when no progress has occurred for 10 minutes

Tracked via lastActionTime on-chain

If only one player has participated, they receive full reward

If both are inactive, the reward is split