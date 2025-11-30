// src/lib/wallet.js

// ---------------------------------------------
// Address Validation Helpers
// ---------------------------------------------

// Basic Cardano address validator
export function isValidCardanoAddress(address) {
  if (!address || typeof address !== "string") return false;

  // Mainnet: addr1...  
  // Testnet: addr_test...
  return /^addr(1|_test)/.test(address) && address.length > 50;
}

// Format long addresses for UI display
export function formatAddressDisplay(address) {
  if (!address || address.length < 24) return address;
  return `${address.slice(0, 12)}...${address.slice(-12)}`;
}

// ---------------------------------------------
// Wallet API Storage
// ---------------------------------------------
let _walletApi = null;
let _walletMeta = null;

export function setWallet(api, meta = {}) {
  _walletApi = api;
  _walletMeta = meta;
}

export function clearWallet() {
  _walletApi = null;
  _walletMeta = null;
}

export function getWallet() {
  return { api: _walletApi, meta: _walletMeta };
}

export function hasSign() {
  return !!(_walletApi && typeof _walletApi.signTx === "function");
}
