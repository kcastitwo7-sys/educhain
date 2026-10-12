/**
 * EduChain - Main Application Orchestration Module
 * Manages global navigation, mobile drawer, wallet connection in header,
 * persistent toast system, badge counters, and page initializers.
 */

import { connectWallet, disconnectWallet, walletState, formatWalletAddress } from './wallet.js';
import { getApplications } from './storage.js';
import { initScholarshipsDirectory } from './scholarships.js';
import { initDashboard } from './dashboard.js';

document.addEventListener('DOMContentLoaded', () => {
  initGlobalNavigation();
  initWalletButtons();
  initBadgeCounters();
  initPrivacySettingsModal();

  // Page specific initializers
  const path = window.location.pathname;
  if (path.includes('scholarships.html')) {
    initScholarshipsDirectory();
  } else if (path.includes('dashboard.html')) {
    initDashboard();
  }
});

/**
 * Initialize responsive navigation and active tab highlighting
 */
function initGlobalNavigation() {
  const mobileToggle = document.getElementById('mobile-toggle');
  const navLinks = document.getElementById('nav-links');

  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('mobile-open');
      mobileToggle.setAttribute('aria-expanded', isOpen);
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (!navLinks.contains(e.target) && !mobileToggle.contains(e.target) && navLinks.classList.contains('mobile-open')) {
        navLinks.classList.remove('mobile-open');
        mobileToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Highlight current active link
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href').split('/').pop() || 'index.html';
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });
}

/**
 * Initialize wallet buttons in navbar
 */
function initWalletButtons() {
  const walletBtn = document.getElementById('btn-connect-wallet');
  if (!walletBtn) return;

  walletBtn.addEventListener('click', async () => {
    if (walletState.isConnected) {
      if (confirm(`Connected as: ${walletState.publicKey}\nDo you want to disconnect?`)) {
        await disconnectWallet();
        showToast('Wallet Disconnected', 'Disconnected from Solana Devnet.', 'info');
      }
    } else {
      walletBtn.disabled = true;
      walletBtn.innerHTML = `<span>Connecting...</span>`;
      
      const res = await connectWallet();
      walletBtn.disabled = false;

      if (res.success) {
        showToast('Connected to Devnet', `Wallet: ${formatWalletAddress(res.address)}`, 'success');
      } else {
        if (res.error === 'NO_WALLET_FOUND') {
          showNoWalletModal();
        } else {
          showToast('Connection Cancelled', res.message, 'warning');
        }
        updateWalletUI();
      }
    }
  });

  // Listen for wallet state changes
  window.addEventListener('educhain:wallet-changed', () => {
    updateWalletUI();
  });

  updateWalletUI();
}

/**
 * Update header wallet button appearance
 */
function updateWalletUI() {
  const walletBtn = document.getElementById('btn-connect-wallet');
  if (!walletBtn) return;

  if (walletState.isConnected) {
    walletBtn.classList.add('connected');
    walletBtn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="2" y="4" width="20" height="16" rx="2"></rect>
        <path d="M7 15h0M2 10h20"></path>
      </svg>
      <span>${walletState.formattedAddress}</span>
      ${walletState.balanceSol !== null ? `<span style="color:var(--cyan-400); font-size:0.75rem;">(${walletState.balanceSol} SOL)</span>` : ''}
    `;
    walletBtn.title = `Connected to Devnet: ${walletState.publicKey}. Click to disconnect.`;
  } else {
    walletBtn.classList.remove('connected');
    walletBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="2" y="4" width="20" height="16" rx="2"></rect>
        <circle cx="16" cy="12" r="2"></circle>
      </svg>
      <span>Connect Wallet</span>
    `;
    walletBtn.title = 'Connect Phantom Wallet (Solana Devnet)';
  }
}

/**
 * Update tracker count badge in header
 */
export function initBadgeCounters() {
  const badgeEl = document.getElementById('nav-tracker-badge');
  if (!badgeEl) return;

  const update = () => {
    const count = getApplications().length;
    badgeEl.textContent = count;
    badgeEl.style.display = count > 0 ? 'inline-block' : 'none';
  };

  update();
  window.addEventListener('educhain:storage-changed', update);
}

/**
 * Toast Notification Dispatcher
 * @param {string} title
 * @param {string} desc
 * @param {'success'|'info'|'warning'|'error'} type
 */
export function showToast(title, desc = '', type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  let iconSvg = '';
  if (type === 'success') {
    iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
  } else if (type === 'warning') {
    iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
  } else if (type === 'error') {
    iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
  } else {
    iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
  }

  toast.innerHTML = `
    <div class="toast-icon">${iconSvg}</div>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      ${desc ? `<div class="toast-desc">${desc}</div>` : ''}
    </div>
  `;

  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

/**
 * Show polite modal when no wallet is found
 */
function showNoWalletModal() {
  const modal = document.getElementById('wallet-guide-modal');
  if (modal) {
    modal.classList.add('open');
    return;
  }

  // Create on the fly if not on current page
  alert("Phantom Wallet Not Detected:\n\nYou can explore all EduChain features (Scholarship Search, Tracker, Demo Credentials) without a wallet.\n\nTo test real Solana Devnet transactions, install the Phantom extension from https://phantom.app and switch network to Devnet.");
}

/**
 * Initialize Privacy and Settings Modal
 */
function initPrivacySettingsModal() {
  const trigger = document.getElementById('btn-open-settings');
  const modal = document.getElementById('settings-modal');
  if (!trigger || !modal) return;

  trigger.addEventListener('click', (e) => {
    e.preventDefault();
    modal.classList.add('open');
  });

  const closeBtn = modal.querySelector('.modal-close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => modal.classList.remove('open'));
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('open');
  });
}
