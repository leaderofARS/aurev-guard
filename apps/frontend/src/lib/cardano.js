import { Lucid, Blockfrost } from "lucid-cardano";

// Enable any CIP-30 wallet (Nami, Flint, Lace)
export async function enableWallet() {
  if (!window.cardano) {
    throw new Error("No Cardano wallet extension found.");
  }

  const availableWallets = Object.entries(window.cardano)
    .filter(([key, wallet]) => wallet && wallet.enable);

  if (availableWallets.length === 0) {
    throw new Error("No CIP-30 compatible wallets found.");
  }

  // Pick the first available wallet (Nami / Flint / Lace)
  const [walletName, walletAPI] = availableWallets[0];

  try {
    const api = await walletAPI.enable();
    return { api, walletName };
  } catch (err) {
    throw new Error("Failed to enable wallet: " + err.message);
  }
}

// Get used/known wallet addresses
export async function getUsedAddresses(api) {
  try {
    const addrs = await api.getUsedAddresses();
    return addrs || [];
  } catch (err) {
    console.warn("getUsedAddresses error:", err);
    return [];
  }
}

// Legacy sendPayment (manual construction) - kept for reference but not used
export async function sendPayment(api, paymentAddress, amountLovelace = 17000000) {
  try {
    // Get network ID
    const networkId = await api.getNetworkId();

    // Build transaction
    const tx = {
      type: "Tx",
      description: "Payment for AUREV Guard Live Analysis",
      cborHex: "", // Will be built by wallet
    };

    // Use Lucid or wallet's buildTx if available
    // For now, use a simple approach with wallet's signTx
    const utxos = await api.getUtxos();

    // Calculate change
    const totalInput = utxos.reduce((sum, utxo) => {
      const amount = utxo.amount?.find(a => a.unit === 'lovelace')?.quantity || '0';
      return sum + BigInt(amount);
    }, BigInt(0));

    const fee = BigInt(200000); // Estimated fee
    const change = totalInput - BigInt(amountLovelace) - fee;

    // Build transaction outputs
    const outputs = [
      {
        address: paymentAddress,
        amount: [{ unit: 'lovelace', quantity: amountLovelace.toString() }],
      },
    ];

    // Add change output if needed
    if (change > 0) {
      const changeAddress = (await api.getUsedAddresses())[0];
      outputs.push({
        address: changeAddress,
        amount: [{ unit: 'lovelace', quantity: change.toString() }],
      });
    }

    // Sign and submit transaction
    const signedTx = await api.signTx(
      JSON.stringify({
        type: 'Tx',
        description: '',
        cborHex: '', // Wallet will build this
      }),
      true // partial sign
    );

    const txHash = await api.submitTx(signedTx);
    return txHash;
  } catch (err) {
    throw new Error(`Payment failed: ${err.message}`);
  }
}

// Simplified payment using wallet's sendPayment if available (Eternl/Nami)
// OR fallback to Lucid for proper transaction building
export async function sendSimplePayment(api, paymentAddress, amountADA = 0.17) {
  try {
    // Check if wallet has sendPayment method (Eternl)
    if (api.sendPayment) {
      const txHash = await api.sendPayment({
        address: paymentAddress,
        amount: amountADA,
      });
      return txHash;
    }

    // Fallback: Use Lucid for proper transaction building
    console.log('Wallet does not support sendPayment, using Lucid fallback');

    const projectId = import.meta.env.VITE_BLOCKFROST_PROJECT_ID;
    if (!projectId) {
      throw new Error("VITE_BLOCKFROST_PROJECT_ID not set in frontend .env. Please add it to enable payments.");
    }

    // Determine network based on project ID (mainnet or preprod/preview)
    const network = projectId.includes("mainnet") ? "Mainnet" :
      projectId.includes("preprod") ? "Preprod" : "Preview";

    console.log(`Initializing Lucid with network: ${network} (Project ID: ${projectId.substring(0, 10)}...)`);
    console.log(`Payment address: ${paymentAddress}`);

    const blockfrostUrl = `https://cardano-${network.toLowerCase()}.blockfrost.io/api/v0`;

    const lucid = await Lucid.new(
      new Blockfrost(blockfrostUrl, projectId),
      network
    );

    lucid.selectWallet(api);

    const tx = await lucid.newTx()
      .payToAddress(paymentAddress, { lovelace: BigInt(Math.floor(amountADA * 1000000)) })
      .complete();

    const signedTx = await tx.sign().complete();
    const txHash = await signedTx.submit();

    return txHash;
  } catch (err) {
    console.error("Payment failed:", err);
    throw new Error(`Payment failed: ${err.message}`);
  }
}