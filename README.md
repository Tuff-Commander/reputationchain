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
