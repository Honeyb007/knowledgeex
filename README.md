# KnowledgeEx

A decentralized peer-to-peer tutoring platform that connects students with tutors through blockchain-verified sessions and smart contract escrow payments.

## What it does

- Students and tutors connect on a decentralized marketplace
- Sessions are booked and paid for through a smart contract escrow on Ethereum Sepolia testnet
- Payments are only released when both parties confirm session completion
- Dual-theme frontend — dark violet/pink for learners, light hot pink/purple for tutors
- MetaMask integration for wallet connection and transaction signing

## Built With

- **Frontend** — HTML, CSS, JavaScript
- **Backend** — Node.js, Express
- **Database** — MongoDB Atlas
- **Blockchain** — Solidity, Ethereum (Sepolia testnet), MetaMask
- **Smart Contract** — Escrow contract for secure payment holding

## Architecture
Student/Tutor connects via the frontend, which communicates with a Node.js/Express API backed by MongoDB Atlas. Session payments flow through a Solidity escrow smart contract deployed on Ethereum Sepolia testnet, with MetaMask handling wallet connection and transaction signing.

## Status

Final year thesis project — fully built, pending deployment.

## Author

[Kudirat Ovayami](https://github.com/Honeyb007)
