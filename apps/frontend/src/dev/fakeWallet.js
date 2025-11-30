// Minimal dev-only fake CIP-30 wallet provider
// Exposes window.cardano.fakeWallet and window.cardano (if empty) for testing

(function () {
  const FAKE_ADDRESS = "addr_test1qzqvdevfakeaddress9k3j7";

  function makeApi() {
    return {
      // Simulate enabling wallet
      getUsedAddresses: async () => [FAKE_ADDRESS],
      // signTx returns a hex string representing the "signed" tx
      signTx: async (unsignedHex, returnSigned = true) => {
        // Very simple fake: prefix with SIGNED_ and reverse the string
        const signed = "SIGNED_" + unsignedHex.split("").reverse().join("");
        if (returnSigned) return signed;
        return { signedTx: signed };
      },
      // optional: submitTx stub
      submitTx: async (signedHex) => {
        return { txId: "fake_tx_" + signedHex.slice(0, 8) };
      },
    };
  }

  const fakeWallet = {
    enable: async () => {
      // simulate user approving wallet connection
      await new Promise((r) => setTimeout(r, 100));
      return makeApi();
    },
  };

  if (!window.cardano) window.cardano = {};
  // expose under a deterministic key and also as `fakeWallet`
  window.cardano.fakeWallet = fakeWallet;
  // for convenience, also expose as `injected` (some code may expect different keys)
  window.cardano.injected = fakeWallet;

  console.log("[fakeWallet] injected into window.cardano (dev only)");
})();
