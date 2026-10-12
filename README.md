# EduChain

**Discover Opportunities. Verify Achievements. Build Your Future.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Solana Devnet](https://img.shields.io/badge/Blockchain-Solana%20Devnet-14f195.svg)](https://solana.com)
[![Vite](https://img.shields.io/badge/Bundler-Vite%208-646cff.svg)](https://vitejs.dev)

EduChain is a modern educational technology and scholarship discovery platform built for the cryptocurrency and Web3 hackathon. It empowers students—particularly high school graduates, undergraduates, postgraduates, and international applicants (including students from Nepal and global emerging regions)—to discover educational funding opportunities, organize scholarship applications through an intuitive 7-stage tracker, and explore tamper-proof verifiable educational credentials anchored on the Solana blockchain.

---

## Table of Contents
1. [Key Features](#key-features)
2. [Technology Stack](#technology-stack)
3. [Architecture & Design Principles](#architecture--design-principles)
4. [Project Structure](#project-structure)
5. [Getting Started (Beginner Friendly)](#getting-started-beginner-friendly)
6. [Solana Devnet Testing Guide](#solana-devnet-testing-guide)
7. [Automated Testing](#automated-testing)
8. [Deployment Instructions](#deployment-instructions)
9. [2-to-3 Minute Hackathon Demo Script](#2-to-3-minute-hackathon-demo-script)
10. [Business & Growth Model](#business--growth-model)
11. [Privacy, Ethics & Transparency Commitment](#privacy-ethics--transparency-commitment)

---

## Key Features

### 1. Centralized Scholarship Discovery
- **Comprehensive Opportunity Directory**: Curated listing of undergraduate, postgraduate, and PhD scholarships across Nepal, the US, the UK, Germany, Singapore, the European Union, Canada, Sweden, and Australia.
- **Multi-Criteria Filtering & Search**: Instant real-time filtering by country, education level, funding category (Fully funded, Tuition waiver, Partially funded, Research funding), and deadline urgency (&le; 60 days).
- **Sorting Options**: Sort by deadline soonest, recently checked date, or alphabetical order.
- **Detailed Modal Views**: Comprehensive breakdown of eligibility, covered financial benefits, required documents, application instructions, and direct official provider links.
- **Transparent Labelling**: All demonstration opportunities are explicitly badged as `Demo Data` to maintain academic integrity.

### 2. Personal Student Application Tracker
- **7-Stage Lifecycle Tracker**: Organize applications across `Interested`, `Preparing`, `Applied`, `Interview`, `Accepted`, `Rejected`, and `Withdrawn`.
- **Summary Metrics**: Real-time counter cards showing total saved scholarships, opportunities in preparation, submitted applications, and upcoming deadlines.
- **Personal Notes & Checklist**: Add custom notes, interview schedules, and submission checklists for each scholarship.
- **Timeline Date Tracking**: Record application submission dates and set custom personal reminder dates.
- **Browser Persistence**: All changes persist in `localStorage` without requiring user accounts or third-party tracking.
- **Data Backup & Reset**: Single-click JSON export for offline backups and clean data reset button.

### 3. Verifiable Credentials on Solana Devnet
- **Two Transparent Operation Modes**:
  - **State 1: Demonstration Mode**: Clearly marked mock credential showing how academic institutions format and cryptographically hash degree records using SHA-256. Includes an interactive live hash re-computation and integrity check.
  - **State 2: Connected Solana Devnet Mode**: Connect Phantom or compatible Solana wallets via `@solana/web3.js` to inspect wallet public keys, check Devnet SOL balance, and anchor credential digests on-chain using the Solana Memo program.
- **Public Auditability**: Generates live transaction links to the public [Solana Explorer](https://explorer.solana.com/?cluster=devnet) on the Devnet cluster.
- **Privacy by Design**: Sensitive student documents and personally identifiable information (PII) are **never** stored on-chain. Only one-way cryptographic SHA-256 digests are anchored.
- **Graceful Fallback**: The entire platform is 100% functional without a cryptocurrency wallet.

---

## Technology Stack

- **Frontend Core**: Semantic HTML5, Vanilla JavaScript (ES Modules), CSS3
- **Design System**: Custom dark slate/navy theme (`#070A13`), electric cyan (`#06B6D4`) and sky blue (`#38BDF8`) accents, glassmorphic card overlays, responsive layouts, and SVG iconography.
- **Data Layer**: Structured JSON dataset (`data/scholarships.json`) and client-side `localStorage`.
- **Blockchain**:
  - **Network**: Solana Devnet (`https://api.devnet.solana.com`)
  - **SDK**: Official `@solana/web3.js` (v1.99.0)
  - **Wallet Support**: Phantom & standard window.solana wallet adapters
  - **On-Chain Mechanism**: Solana Memo program instruction anchoring SHA-256 digests
- **Dev Toolchain**: Node.js (v24+), Vite 8 for lightning-fast hot reloading and production bundling.

---

## Architecture & Design Principles

```
+-------------------------------------------------------------------------+
|                              EduChain UI                                |
|  [Landing Page]  [Scholarship Directory]  [Student Dashboard]  [Creds]  |
+------------------------------------+------------------------------------+
                                     |
               +---------------------+---------------------+
               |                                           |
               v                                           v
    +----------------------+                   +----------------------+
    |    Client Storage    |                   |    Solana Web3.js    |
    |  - LocalStorage      |                   |  - Phantom Provider  |
    |  - 7 Application     |                   |  - Devnet Cluster    |
    |    Lifecycle Stages  |                   |  - SHA-256 Digests   |
    |  - Notes & Dates     |                   |  - On-Chain Memos    |
    +----------------------+                   +----------------------+
               |                                           |
               v                                           v
    +----------------------+                   +----------------------+
    | Browser Environment  |                   |   Solana Explorer    |
    | (100% Offline Capable|                   |   (Public Devnet     |
    |  & Privacy-First)    |                   |    Transaction Proof)|
    +----------------------+                   +----------------------+
```

1. **Working MVP Over Unnecessary Complexity**: No cumbersome server configurations, databases, or closed backend APIs. Runs instantly in any modern web browser.
2. **Honesty & Transparency**: Clear delineation between simulated mock records and confirmed on-chain Devnet transactions. No fabricated partnerships or false claims.
3. **Inclusive Web Design**: Fully responsive across mobile smartphones, tablets, laptops, and ultra-wide desktop monitors.

---

## Project Structure

```
educhain/
├── index.html               # Compelling landing page, hero, 3-step guide & transparency
├── scholarships.html         # Scholarship discovery directory with search & multi-filters
├── dashboard.html           # Student application tracker with 7 pipeline stages
├── credentials.html         # Dual-mode verifiable credentials & Solana Devnet anchor
├── about.html               # Mission, problem statement, roadmap & ethical commitment
├── vite.config.js           # Multi-page Vite configuration
├── package.json             # Dependencies and build scripts
├── .gitignore               # Standard Git ignore rules
├── css/
│   ├── styles.css           # Design tokens, typography, header, footer, toast system
│   ├── components.css       # Buttons, cards, badges, modal dialogs, cert cards
│   └── responsive.css       # Mobile drawer, media queries, touch optimizations
├── js/
│   ├── app.js               # Global site orchestration, wallet UI sync, toast manager
│   ├── scholarships.js      # Card grid renderer, filters integration, detail modal
│   ├── dashboard.js         # Student tracker, metric counters, notes, date inputs
│   ├── credentials.js       # Verifiable credential card, SHA-256 digest, Devnet anchor
│   ├── filters.js           # Multi-criteria filter engine and deadline calculators
│   ├── storage.js           # LocalStorage wrapper, backup export, data reset
│   └── wallet.js            # Solana Devnet connection, Phantom adapter, balance check
├── data/
│   └── scholarships.json    # Structured 10-record sample scholarship dataset
└── tests/
    └── test_educhain.js     # Automated test suite (HTTP routes, schema, crypto hashing)
```

---

## Getting Started (Beginner Friendly)

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your computer (v18 or higher recommended).

### 1. Clone or Download the Repository
```bash
git clone https://github.com/your-username/educhain.git
cd educhain
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start the Development Server
```bash
npm run dev
```
Open your browser and navigate to:
```
http://localhost:3000
```

### 4. Build for Production
To generate an optimized production bundle in the `dist/` directory:
```bash
npm run build
```

---

## Solana Devnet Testing Guide

You can test the entire platform without spending real cryptocurrency.

1. **Install Phantom Wallet**:
   - Download the free browser extension from [phantom.app](https://phantom.app).
2. **Switch Network to Devnet**:
   - Open Phantom &rarr; Settings (gear icon) &rarr; Developer Settings &rarr; Turn on **Testnet / Devnet mode** &rarr; Select **Solana Devnet**.
3. **Get Free Test SOL**:
   - Visit the official faucet at [faucet.solana.com](https://faucet.solana.com).
   - Paste your Phantom wallet public key and request 1 Devnet SOL.
4. **Anchor a Credential**:
   - In EduChain, navigate to the **Credentials** page (`/credentials.html`).
   - Switch toggle to **Solana Devnet Mode**.
   - Click **Connect Wallet** & approve the connection in Phantom.
   - Click **Anchor Credential Hash to Solana Devnet**.
   - Approve the micro-transaction in Phantom.
   - Once confirmed, click the **View on Solana Explorer (Devnet)** link to inspect your live on-chain record!

---

## Automated Testing

EduChain includes a built-in automated test suite verifying server endpoints, JSON schema consistency, cryptographic hash calculations, and application state machines.

Run the test suite with:
```bash
node tests/test_educhain.js
```

Expected output:
```
--- Starting EduChain Test Suite ---
1. Testing Web Server and Route Status Codes: [6 Passed]
2. Testing Scholarship JSON Schema & Quality: [4 Passed]
3. Testing Cryptographic Credential Hashing: [2 Passed]
4. Testing Application Tracker Status Lifecycle: [1 Passed]
--- Test Suite Summary: 14 Passed, 0 Failed ---
```

---

## Deployment Instructions

### Deploying to Netlify (Recommended)
1. Push your code to GitHub.
2. In [Netlify](https://www.netlify.com/), click **Add new site &rarr; Import an existing project**.
3. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
4. Click **Deploy Site**.

### Deploying to Vercel
1. In [Vercel](https://vercel.com/), click **Add New &rarr; Project**.
2. Select your repository.
3. Framework preset: **Vite**.
4. Click **Deploy**.

---

## 2-to-3 Minute Hackathon Demo Script

Here is an effective walkthrough to present to hackathon judges:

1. **The Hook (30 sec)**:
   - *"Hello judges! Finding scholarships is broken: information is scattered across obscure forums, students miss deadlines, and paper credentials can be forged. Meet EduChain: Discover Opportunities, Verify Achievements, Build Your Future."*
2. **Discovery & Filtering (45 sec)**:
   - Go to `/scholarships.html`. Show instant filtering by destination (e.g., Nepal or United Kingdom) and degree level.
   - Click **View Details** on a scholarship to highlight transparent eligibility, required documents, and official portal links.
3. **Application Tracking (45 sec)**:
   - Click **Save & Track**. Navigate to `/dashboard.html`.
   - Highlight the 4 metric cards. Change status from "Interested" to "Preparing".
   - Add a personal note in the checklist. Refresh the page to prove instant LocalStorage persistence.
4. **Verifiable Credentials on Solana (45 sec)**:
   - Navigate to `/credentials.html`. Explain State 1 (Mock demonstration record with SHA-256 digest integrity check).
   - Toggle to State 2 (Solana Devnet Mode). Show connected Phantom wallet, Devnet balance, and anchor the cryptographic digest on-chain. Show the confirmed transaction on Solana Explorer.
5. **Conclusion & Roadmap (15 sec)**:
   - *"EduChain bridges access to education with the security of Solana—usable today, decentralized tomorrow. Thank you!"*

---

## Business & Growth Model

EduChain is designed with a sustainable, mission-driven operational roadmap:

- **Phase 1: Free Open-Source Student Tool (Current MVP)**
  - Zero fees for students. Direct official links. Open-source transparency.
- **Phase 2: Verified Institutional Partnerships (Proposed)**
  - Authorized universities and scholarship foundations subscribe to verified listing management, verified applicant credential checking, and automated portal integration.
- **Phase 3: Decentralized Issuer Network (Proposed)**
  - Academic institutions stake or register authority public keys on Solana to issue tamper-evident diplomas and credentials at sub-cent costs.

---

## Privacy, Ethics & Transparency Commitment

- **No Artificial Claims**: EduChain does not guarantee scholarship awards or university admissions.
- **No PII on Blockchain**: Personal transcripts and confidential records are never published on-chain.
- **Non-Custodial Architecture**: We never request, handle, or store wallet private keys or seed phrases.
- **Client-Side Control**: All tracker data remains in the student's browser and can be exported or purged at any time.

---

*Developed for the Solana Blockchain Hackathon.*
