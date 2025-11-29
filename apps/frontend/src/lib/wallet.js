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
