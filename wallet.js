/**
 * EduChain - Solana Devnet Wallet Integration Module
 * Official supported integration with Solana Web3.js & Phantom Wallet (window.solana).
 * Safe, read-only balance checks, Devnet cluster targeting, and verifiable hash anchoring.
 */

import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';

// Configuration
export const SOLANA_DEVNET_RPC = 'https://api.devnet.solana.com';
export const NETWORK_LABEL = 'Solana Devnet';

let devnetConnection = null;

/**
 * Get or initialize the Solana Devnet Connection
 * @returns {Connection}
 */
export function getDevnetConnection() {
  if (!devnetConnection) {
    devnetConnection = new Connection(SOLANA_DEVNET_RPC, 'confirmed');
  }
  return devnetConnection;
}

// Current reactive wallet state
export const walletState = {
  isConnected: false,
  publicKey: null,
  formattedAddress: '',
  balanceSol: null,
  network: NETWORK_LABEL
};

/**
 * Detect if a compatible Solana provider (Phantom / standard wallet) is available
 * @returns {Object|null}
 */
export function getSolanaProvider() {
  if (typeof window !== 'undefined' && 'solana' in window) {
    const provider = window.solana;
    if (provider.isPhantom || provider) {
      return provider;
    }
  }
  return null;
}

/**
 * Connect to user's Solana wallet
 * @returns {Promise<{ success: boolean, address?: string, error?: string }>}
 */
export async function connectWallet() {
  const provider = getSolanaProvider();

  if (!provider) {
    return {
      success: false,
      error: 'NO_WALLET_FOUND',
      message: 'Phantom or compatible Solana wallet extension was not detected. Please install Phantom from phantom.app or explore in Demo Mode.'
    };
  }

  try {
    const resp = await provider.connect();
    const pubKey = resp.publicKey ? resp.publicKey.toString() : provider.publicKey.toString();

    walletState.isConnected = true;
    walletState.publicKey = pubKey;
    walletState.formattedAddress = formatWalletAddress(pubKey);

    // Fetch Devnet balance
    await refreshDevnetBalance();

    emitWalletChangeEvent('connected');

    return {
      success: true,
      address: pubKey
    };
  } catch (err) {
    console.warn('[EduChain Wallet] User rejected or failed wallet connection:', err);
    return {
      success: false,
      error: 'USER_REJECTED',
      message: err.message || 'Connection request was cancelled by the user.'
    };
  }
}

/**
 * Disconnect current wallet
 */
export async function disconnectWallet() {
  const provider = getSolanaProvider();
  if (provider && provider.disconnect) {
    try {
      await provider.disconnect();
    } catch (e) {
      console.warn('Disconnect error:', e);
    }
  }

  walletState.isConnected = false;
  walletState.publicKey = null;
  walletState.formattedAddress = '';
  walletState.balanceSol = null;

  emitWalletChangeEvent('disconnected');
}

/**
 * Refresh Devnet SOL balance for connected public key
 */
export async function refreshDevnetBalance() {
  if (!walletState.publicKey) return;

  try {
    const conn = getDevnetConnection();
    const pubKey = new PublicKey(walletState.publicKey);
    const lamports = await conn.getBalance(pubKey);
    walletState.balanceSol = (lamports / 1e9).toFixed(4);
    emitWalletChangeEvent('balance-updated');
  } catch (error) {
    console.warn('[EduChain Wallet] Could not fetch Devnet balance:', error.message);
    walletState.balanceSol = '0.0000';
  }
}

/**
 * Format public key into abbreviated string: e.g. "7xKv...9wPq"
 * @param {string} address
 * @returns {string}
 */
export function formatWalletAddress(address) {
  if (!address) return '';
  if (address.length <= 10) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

/**
 * Generate a SHA-256 cryptographic digest of a credential object
 * Native Web Crypto API
 * @param {Object} credentialData
 * @returns {Promise<string>} Hex hash
 */
export async function computeCredentialHash(credentialData) {
  const normalizedString = JSON.stringify(credentialData, Object.keys(credentialData).sort());
  const encoder = new TextEncoder();
  const data = encoder.encode(normalizedString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate Solana Devnet Explorer URL for transaction or address
 * @param {string} identifier
 * @param {'tx'|'address'} type
 * @returns {string}
 */
export function getSolanaExplorerUrl(identifier, type = 'tx') {
  return `https://explorer.solana.com/${type}/${identifier}?cluster=devnet`;
}

/**
 * Emit wallet events for reactive UI
 */
function emitWalletChangeEvent(eventType) {
  window.dispatchEvent(new CustomEvent('educhain:wallet-changed', {
    detail: { ...walletState, eventType }
  }));
}

/**
 * Auto-listen for account changes if provider is present
 */
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    const provider = getSolanaProvider();
    if (provider) {
      provider.on('accountChanged', (publicKey) => {
        if (publicKey) {
          walletState.publicKey = publicKey.toString();
          walletState.formattedAddress = formatWalletAddress(walletState.publicKey);
          refreshDevnetBalance();
          emitWalletChangeEvent('accountChanged');
        } else {
          disconnectWallet();
        }
      });

      provider.on('disconnect', () => {
        disconnectWallet();
      });
    }
  });
}
