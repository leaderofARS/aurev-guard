// lib/cardano.js
export async function enableWallet() {
  if (!window?.cardano) throw new Error('No Cardano wallet detected');
  // Try common wallets (nami, flint). Pick first that exists.
  const providerKey = Object.keys(window.cardano).find(k => k && window.cardano[k]?.enable);
  if (!providerKey) throw new Error('No enabling wallet provider found');
  const provider = window.cardano[providerKey];
  const api = await provider.enable(); // CIP-30 enable
  return { api, providerKey };
}

export async function getChangeAddress(api) {
  // returns a hex-encoded address or throw
  if (!api || !api.getChangeAddress) return null;
  try {
    const addrHex = await api.getChangeAddress();
    return addrHex;
  } catch (e) {
    console.warn('getChangeAddress failed', e);
    return null;
  }
}

export async function getUsedAddresses(api) {
  if (!api || !api.getUsedAddresses) return [];
  try {
    // returns array of hex addresses (bech32 conversion left for backend or wallet lib)
    const addrs = await api.getUsedAddresses();
    return addrs || [];
  } catch (e) {
    console.warn('getUsedAddresses failed', e);
    return [];
  }
}
