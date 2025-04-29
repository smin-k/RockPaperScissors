# RockPaperScissors (Forked & Updated)

## 🔄 Updates from Original

This project is **forked** from [Noah-Vincenz Noeh's original RockPaperScissors DApp](https://github.com/Noah-Vincenz/RockPaperScissors) and includes the following key updates:

- ✅ **Updated for Solidity 0.8.x (London Hardfork compatible)**  
- ✅ **Smart contract deployed via Remix** (no Truffle migration used)
- ✅ **Frontend runs independently using `npm run dev`**, with manual contract address input
- ⏱ **Timeout Reset Mechanism added**: If a player is inactive for over 10 minutes, the other player can reset
- 💰 **Penalty Logic**: Timeout rewards only active participants (or splits if both inactive)

---

## 📝 Description

Rock Paper Scissors is a zero-sum game where two players choose one of three options:

- **Rock beats Scissors**
- **Paper beats Rock**
- **Scissors beats Paper**
- **Same choice → Draw**

This implementation ensures fairness by using a **commit-reveal scheme** through Ethereum smart contracts.

---

## 🏗 Architecture

![Architecture](https://user-images.githubusercontent.com/16804823/52737891-586b4a80-2fc5-11e9-9ad8-2ada031897e3.jpg)

### Key Changes:

- ✨ Modernized to **Solidity 0.8.x**
- ✨ Compatible with **London EVM**
- 🚀 **Deployed via Remix**
- 🌐 Frontend uses **Web3.js** (no Truffle contract wrapper)
- ⏱ Introduced timeout + reset protection

---

## 🚀 How to Use

### 1. Deploy Contract (via Remix)

- Visit [https://remix.ethereum.org](https://remix.ethereum.org)
- Compile `RockPaperScissors.sol` using **Solidity 0.8.x**
- Deploy to a network (e.g., Ganache or Sepolia)
- Copy the deployed contract address

### 2. Run Frontend Locally

```bash
npm install
npm run dev
