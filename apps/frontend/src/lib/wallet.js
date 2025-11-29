// Wallet utility functions and helpers

// Validate Cardano address format (basic check)
export function isValidCardanoAddress(address) {
  if (!address || typeof address !== "string") return false;
  // Cardano addresses start with 'addr1' (mainnet) or 'addr_test' (testnet)
  return /^addr(1|_test)/.test(address) && address.length > 50;
}

// Simple wallet API holder for the frontend
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

// Format address for display (show first and last 12 chars)
export function formatAddressDisplay(address) {
  if (!address || address.length < 24) return address;
  return `${address.slice(0, 12)}...${address.slice(-12)}`;
}
