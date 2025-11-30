// Simple in-memory store for decision bundles
const store = {};

export function saveDecisionBundle(key, bundle) {
  store[key] = bundle;
}

export function getDecisionBundle(key) {
  return store[key] || null;
}

export function getAllBundles() {
  return Object.values(store);
}