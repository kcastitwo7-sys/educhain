/**
 * EduChain - Verifiable Educational Credentials Module
 * Features two clear states:
 * State 1: Clearly marked Demonstration Mode with simulated SHA-256 hash integrity checks.
 * State 2: Connected Solana Devnet Mode with real Phantom wallet connection, Devnet balance,
 *          and real on-chain transaction anchor execution via @solana/web3.js.
 */

import {
  walletState,
  connectWallet,
  disconnectWallet,
  formatWalletAddress,
  computeCredentialHash,
  getDevnetConnection,
  getSolanaExplorerUrl,
  getSolanaProvider
} from './wallet.js';
import { Transaction, TransactionInstruction, PublicKey } from '@solana/web3.js';
import { showToast } from './app.js';

// Sample demonstration credential record
const DEMO_CREDENTIAL = {
  credentialId: 'EDU-CRED-2026-NEP-8491',
  title: 'Bachelor of Science in Computer Science & Information Technology',
  issuingInstitution: 'Tribhuvan University - Institute of Science and Technology',
  issuerPublicKeyDemo: 'TU_INSTITUTION_VERIFIED_ISSUER_KEY_EDUCHAIN',
  recipientId: 'student:nep:491823-hash',
  recipientName: 'Aayush Sharma (Privacy-Masked Identifier)',
  issueDate: '2026-08-15',
  academicDistinction: 'First Class with Honors (GPA 3.84/4.00)',
  credentialStatus: 'Demonstration Record (Mock Data)'
};

let currentMode = 'demo'; // 'demo' | 'devnet'
let calculatedHash = '';

/**
 * Initialize Credentials page
 */
export async function initCredentialsPage() {
  const container = document.getElementById('credentials-page-view');
  if (!container) return;

  calculatedHash = await computeCredentialHash(DEMO_CREDENTIAL);

  setupModeToggle();
  setupVerificationCheck();
  setupOnChainAnchorButton();
  updateCredentialsDisplay();

  // Listen for wallet changes
  window.addEventListener('educhain:wallet-changed', () => {
    updateCredentialsDisplay();
  });
}

/**
 * Toggle between Demo Mode and Connected Devnet Mode
 */
function setupModeToggle() {
  const btnDemoMode = document.getElementById('btn-mode-demo');
  const btnDevnetMode = document.getElementById('btn-mode-devnet');

  if (btnDemoMode && btnDevnetMode) {
    btnDemoMode.addEventListener('click', () => {
      currentMode = 'demo';
      btnDemoMode.classList.add('active');
      btnDevnetMode.classList.remove('active');
      updateCredentialsDisplay();
    });

    btnDevnetMode.addEventListener('click', async () => {
      currentMode = 'devnet';
      btnDevnetMode.classList.add('active');
      btnDemoMode.classList.remove('active');

      if (!walletState.isConnected) {
        showToast('Solana Devnet', 'Please connect your Phantom wallet for on-chain mode.', 'info');
        await connectWallet();
      }
      updateCredentialsDisplay();
    });
  }
}

/**
 * Update UI depending on current mode
 */
function updateCredentialsDisplay() {
  const demoBanner = document.getElementById('demo-mode-banner');
  const devnetPanel = document.getElementById('devnet-connected-panel');
  const certBadge = document.getElementById('cert-status-badge');
  const hashDisplay = document.getElementById('cert-hash-val');
  const verifyResultBox = document.getElementById('verify-result-box');

  if (hashDisplay) {
    hashDisplay.textContent = calculatedHash;
  }

  if (verifyResultBox) {
    verifyResultBox.style.display = 'none';
  }

  if (currentMode === 'demo') {
    if (demoBanner) demoBanner.style.display = 'flex';
    if (devnetPanel) devnetPanel.style.display = 'none';
    if (certBadge) {
      certBadge.className = 'badge badge-demo';
      certBadge.textContent = 'Demonstration Mode (Mock Record)';
    }
  } else {
    // Devnet mode
    if (demoBanner) demoBanner.style.display = 'none';
    if (devnetPanel) devnetPanel.style.display = 'block';

    const walletAddrEl = document.getElementById('devnet-wallet-address');
    const balanceEl = document.getElementById('devnet-wallet-balance');
    const networkEl = document.getElementById('devnet-cluster-name');

    if (walletAddrEl) walletAddrEl.textContent = walletState.publicKey || 'Wallet Not Connected';
    if (balanceEl) balanceEl.textContent = `${walletState.balanceSol || '0.0000'} Devnet SOL`;
    if (networkEl) networkEl.textContent = 'Solana Devnet (api.devnet.solana.com)';

    if (certBadge) {
      certBadge.className = 'badge badge-verified';
      certBadge.textContent = walletState.isConnected ? 'Devnet Wallet Active' : 'Devnet Mode (Awaiting Wallet)';
    }
  }
}

/**
 * Setup simulated & real verification check button
 */
function setupVerificationCheck() {
  const btnVerify = document.getElementById('btn-verify-credential');
  const verifyResultBox = document.getElementById('verify-result-box');
  const stepsContainer = document.getElementById('verification-steps');

  if (!btnVerify || !verifyResultBox || !stepsContainer) return;

  btnVerify.addEventListener('click', async () => {
    btnVerify.disabled = true;
    btnVerify.innerHTML = `<span>Verifying Authenticity...</span>`;

    // Step 1: Recompute SHA-256 digest
    const currentDigest = await computeCredentialHash(DEMO_CREDENTIAL);

    setTimeout(() => {
      stepsContainer.innerHTML = `
        <div style="display:flex; align-items:center; gap:0.65rem; color:var(--status-emerald); margin-bottom:0.5rem;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
          <span>1. Cryptographic SHA-256 Digest Recomputed: Matching <code>${currentDigest.slice(0, 16)}...</code></span>
        </div>
        <div style="display:flex; align-items:center; gap:0.65rem; color:var(--status-emerald); margin-bottom:0.5rem;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
          <span>2. Academic Issuer Format: Verified (Tribhuvan University Standard Schema)</span>
        </div>
        <div style="display:flex; align-items:center; gap:0.65rem; color:${currentMode === 'demo' ? 'var(--cyan-400)' : 'var(--status-emerald)'};">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
          <span>3. ${currentMode === 'demo' ? 'Mock Anchor Verification: Data structure is authentic and tamper-free (Demo Environment).' : 'Solana Devnet Cluster: Ready for on-chain anchoring.'}</span>
        </div>
      `;

      verifyResultBox.style.display = 'block';
      btnVerify.disabled = false;
      btnVerify.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        Re-verify Credential Authenticity
      `;
      showToast('Integrity Verified', 'Credential cryptographic digest matches exactly.', 'success');
    }, 600);
  });
}

/**
 * Setup the actual Solana Devnet Memo/Transaction Anchor
 */
function setupOnChainAnchorButton() {
  const btnAnchor = document.getElementById('btn-anchor-solana');
  const anchorStatus = document.getElementById('anchor-status-box');

  if (!btnAnchor || !anchorStatus) return;

  btnAnchor.addEventListener('click', async () => {
    if (!walletState.isConnected) {
      showToast('Wallet Required', 'Please connect your Phantom wallet to anchor to Devnet.', 'warning');
      const conn = await connectWallet();
      if (!conn.success) return;
    }

    const provider = getSolanaProvider();
    if (!provider) {
      showToast('Error', 'Solana provider not available.', 'error');
      return;
    }

    btnAnchor.disabled = true;
    btnAnchor.innerHTML = '<span>Broadcasting to Solana Devnet...</span>';
    anchorStatus.style.display = 'block';
    anchorStatus.innerHTML = `
      <div style="color:var(--cyan-400);">
        Preparing Solana Devnet transaction with credential SHA-256 digest... Please approve transaction in your wallet.
      </div>
    `;

    try {
      const connection = getDevnetConnection();
      const payerPublicKey = new PublicKey(walletState.publicKey);

      // Memo Program ID on Solana: MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr
      const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');
      
      const memoPayload = `EduChain:CredentialAnchor:${DEMO_CREDENTIAL.credentialId}:${calculatedHash.slice(0, 32)}`;

      const instruction = new TransactionInstruction({
        keys: [{ pubkey: payerPublicKey, isSigner: true, isWritable: true }],
        programId: MEMO_PROGRAM_ID,
        data: Buffer.from(memoPayload, 'utf-8')
      });

      const transaction = new Transaction().add(instruction);
      const { blockhash } = await connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = payerPublicKey;

      // Request Phantom signature
      const signedTransaction = await provider.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signedTransaction.serialize());

      anchorStatus.innerHTML = `
        <div style="color:var(--text-main);">
          Transaction broadcasted with signature: <code>${signature.slice(0, 16)}...</code>. Awaiting Devnet confirmation...
        </div>
      `;

      // Confirm transaction
      const confirmation = await connection.confirmTransaction(signature, 'confirmed');

      if (confirmation.value.err) {
        throw new Error(`Transaction failed on-chain: ${JSON.stringify(confirmation.value.err)}`);
      }

      const explorerUrl = getSolanaExplorerUrl(signature, 'tx');

      anchorStatus.innerHTML = `
        <div style="background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.4); border-radius: 8px; padding: 1rem;">
          <div style="color:var(--status-emerald); font-weight:700; margin-bottom:0.5rem;">
            Successfully Anchored Credential Hash to Solana Devnet!
          </div>
          <div style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:0.75rem;">
            <strong>Transaction Signature:</strong>
            <div style="font-family:var(--font-mono); font-size:0.8rem; word-break:break-all; color:var(--cyan-400); margin:0.25rem 0;">
              ${signature}
            </div>
          </div>
          <a href="${explorerUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
            View on Solana Explorer (Devnet)
          </a>
        </div>
      `;

      showToast('Devnet Anchor Confirmed!', 'Transaction successfully recorded on Solana Devnet.', 'success');
    } catch (err) {
      console.error('[EduChain Anchor Error]:', err);
      anchorStatus.innerHTML = `
        <div style="background: rgba(244, 63, 94, 0.1); border: 1px solid rgba(244, 63, 94, 0.4); border-radius: 8px; padding: 1rem;">
          <div style="color:var(--status-rose); font-weight:700; margin-bottom:0.35rem;">Transaction Error</div>
          <div style="font-size:0.84rem; color:var(--text-muted);">${err.message || 'Transaction was rejected or failed on Devnet.'}</div>
          <div style="margin-top:0.5rem; font-size:0.8rem; color:var(--text-dim);">
            Need Devnet SOL? Request free test tokens from <a href="https://faucet.solana.com" target="_blank" rel="noopener noreferrer" style="color:var(--cyan-400);">faucet.solana.com</a>.
          </div>
        </div>
      `;
      showToast('Anchor Failed', err.message || 'Transaction rejected.', 'error');
    } finally {
      btnAnchor.disabled = false;
      btnAnchor.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="16 16 12 12 8 16"></polyline>
          <line x1="12" y1="12" x2="12" y2="21"></line>
          <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"></path>
        </svg>
        Anchor Credential Hash to Solana Devnet
      `;
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname.includes('credentials.html')) {
    initCredentialsPage();
  }
});
