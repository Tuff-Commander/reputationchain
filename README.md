## Deployment

### Smart Contracts
```bash
cd contracts
npm install
cp .env.example .env
# Edit .env and add your private key
npx hardhat compile
npx hardhat run scripts/deploy.js --network moonbase
```

### Frontend
```bash
cd frontend
npm install
# Update CONTRACT_ADDRESS in src/App.js with deployed address
npm start
```

LIVE APP
Try it here (https://reputationchain.vercel.app/)
Contracts: https://moonbase.moonscan.io/address/0x800528CC62833AE351FB4aC26dB3671B49177d35

# ReputationChain – Decentralized Freelancer Reputation System

ReputationChain solves a major problem affecting **1.57 billion freelancers**:  
centralized platforms own your work history. If Upwork or Fiverr bans you, your **10+ years of reviews, job history, and reputation vanish instantly**.

ReputationChain fixes this by storing freelancer reputation **on-chain**, permanently, verifiably, and beyond platform control.

---

## 🚀 What It Does

### ⭐ For Freelancers
- Create on-chain profiles (name, skills, bio)
- Accept and complete jobs recorded on the blockchain  
- Build **portable**, **verifiable** reputation  
- Export proof of reputation as JSON  
- Maintain work history forever — no platform can delete it

### 💼 For Clients
- Post jobs with **smart contract escrow**
- Payments locked until work is approved  
- Give ratings & reviews stored permanently  
- Only **3% fee** (vs Upwork’s 20%)  
- Hire confidently with blockchain-verified history  

---

## 🔧 How It Works (Flow)

1. **Client posts job** and stakes payment  
2. **Freelancer accepts** — recorded on-chain  
3. Freelancer **submits work**  
4. Client **approves and rates**  
5. Smart contract **releases payment**:
   - 97% → Freelancer  
   - 3% → Platform fee  
6. Reputation updated using:

```
R = (J × 10) + (E × 5) + (avg_rating × 20)
```

Where:  
- **J** = Jobs Completed  
- **E** = Total Earned  
- **avg_rating** = Average Rating  

Anyone can independently **verify** all data via blockchain or JSON export.

---

## 🏗️ Tech Stack

| Layer | Technology |
|------|------------|
| Smart Contracts | Solidity (0.8.20) |
| Blockchain | Moonbeam → Moonbase Alpha Testnet |
| Frontend | React + Ethers.js |
| Deployment | Vercel |
| Dev Tools | Hardhat |

---

## 📁 Project Structure

```
reputationchain/
├── frontend/          # React UI
└── smart-contract/    # Solidity contract + Hardhat
```

---

## ⚙️ Setup Instructions (Local Development)

### 1. Clone Repository
```bash
git clone https://github.com/Tuff-Commander/reputationchain.git
cd reputationchain
```

### 2. Install Dependencies

#### Frontend:
```bash
cd frontend
npm install
```

#### Smart Contract:
```bash
cd smart-contract
npm install
```

---

## 🔑 Environment Variables

### Frontend → `/frontend/.env.local`
```
NEXT_PUBLIC_CONTRACT_ADDRESS=0xYourContractAddress
NEXT_PUBLIC_NETWORK=moonbase-alpha
```

### Smart Contract → `/smart-contract/.env`
```
PRIVATE_KEY=your_wallet_private_key
RPC_URL=https://rpc.testnet.moonbeam.network
```

---

## 📦 Contract Deployment

```bash
cd smart-contract
npx hardhat compile
npx hardhat run scripts/deploy.js --network moonbase-alpha
```

Copy the deployed contract address and paste it into the frontend `.env.local`.

---

## 🖥️ Run Frontend Locally

```bash
cd frontend
npm run dev
```

Visit:  
👉 http://localhost:3000/

---

## 🌐 Live Project

👉 **https://reputationchain.vercel.app/**

---

## Video
https://www.youtube.com/watch?v=e7mZee8CrGc&t=230s

---

## ✨ Credits

Built for the Polkadot ecosystem leveraging Moonbeam's EVM compatibility.

