# Wallet Integration Guide

## Overview

This document explains how to integrate **Cardano Wallet** (Nami/Eternl/Flint) into the AurevGuard application for:
- Connecting and retrieving wallet addresses
- Fetching transaction history from the blockchain
- Paying testnet fees for live pipeline data processing
- Signing transactions and messages

---

## Wallet Integration Architecture

```
┌──────────────────────┐
│   Frontend (React)   │
│  Port 3000           │
└──────────┬───────────┘
           │
           │ window.cardano API
           │
┌──────────▼──────────────────┐
│  Wallet Extension            │
│  (Nami/Eternl/Flint)         │
│  (Runs in browser)           │
└──────────┬───────────────────┘
           │
           │ Communicates with
           │
┌──────────▼──────────────────┐
│  Cardano Node / Blockfrost   │
│  Testnet                     │
└──────────────────────────────┘
           │
           │ Returns wallet data
           │
┌──────────▼──────────────────┐
│  Backend (Port 5000)         │
│  Processes wallet data       │
└──────────────────────────────┘
           │
           │ Calls orchestrator
           │
┌──────────▼──────────────────┐
│  Orchestrator (Port 8080)    │
│  AI Predictions              │
└──────────────────────────────┘
```

---

## Step 1: Wallet Context Setup

**File:** `apps/frontend/src/contexts/WalletContext.jsx`

```javascript
import React, { createContext, useState, useCallback } from 'react';

export const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
  const [address, setAddress] = useState(null);
  const [connected, setConnected] = useState(false);
  const [balance, setBalance] = useState(null);
  const [network, setNetwork] = useState('testnet');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check if wallet extension exists
  const isWalletAvailable = useCallback(() => {
    return typeof window !== 'undefined' && window.cardano;
  }, []);

  // Detect available wallets
  const getAvailableWallets = useCallback(() => {
    if (!isWalletAvailable()) return [];
    
    const wallets = [];
    if (window.cardano?.nami) wallets.push('Nami');
    if (window.cardano?.eternl) wallets.push('Eternl');
    if (window.cardano?.flint) wallets.push('Flint');
    
    return wallets;
  }, [isWalletAvailable]);

  // Connect to wallet
  const connectWallet = useCallback(async (walletName = 'Nami') => {
    setLoading(true);
    setError(null);
    
    try {
      if (!isWalletAvailable()) {
        throw new Error(`${walletName} wallet not installed`);
      }

      // Get the wallet instance
      const wallet = window.cardano[walletName.toLowerCase()];
      
      if (!wallet) {
        throw new Error(`${walletName} wallet not found`);
      }

      // Enable wallet
      const enabledWallet = await wallet.enable();

      // Get network ID (0 = testnet, 1 = mainnet)
      const netId = await enabledWallet.getNetworkId();
      setNetwork(netId === 0 ? 'testnet' : 'mainnet');

      // Get unused addresses
      const addresses = await enabledWallet.getUsedAddresses();
      const unusedAddresses = await enabledWallet.getUnusedAddresses();
      const allAddresses = [...addresses, ...unusedAddresses];

      if (allAddresses.length === 0) {
        throw new Error('No addresses found in wallet');
      }

      const selectedAddress = allAddresses[0];
      setAddress(selectedAddress);

      // Fetch balance
      const utxos = await enabledWallet.getUtxos();
      const totalLovelace = utxos.reduce((sum, utxo) => {
        return sum + utxo.amount.find(a => a.unit === 'lovelace')?.quantity || 0;
      }, 0);

      setBalance({
        lovelace: totalLovelace,
        ada: totalLovelace / 1000000
      });

      setConnected(true);
      return selectedAddress;

    } catch (err) {
      setError(err.message);
      setConnected(false);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isWalletAvailable]);

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    setAddress(null);
    setConnected(false);
    setBalance(null);
    setError(null);
  }, []);

  // Get transaction history
  const getTransactionHistory = useCallback(async (maxTx = 100) => {
    if (!connected || !address) {
      throw new Error('Wallet not connected');
    }

    try {
      const wallet = window.cardano[Object.keys(window.cardano)[0]];
      const enabledWallet = await wallet.enable();
      
      // Get UTXOs
      const utxos = await enabledWallet.getUtxos();
      
      return {
        address,
        utxoCount: utxos.length,
        utxos: utxos.slice(0, maxTx)
      };
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [connected, address]);

  // Sign message for verification
  const signMessage = useCallback(async (message) => {
    if (!connected) {
      throw new Error('Wallet not connected');
    }

    try {
      const wallet = window.cardano[Object.keys(window.cardano)[0]];
      const enabledWallet = await wallet.enable();

      const signature = await enabledWallet.signData(
        address,
        message
      );

      return signature;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [connected, address]);

  const value = {
    address,
    connected,
    balance,
    network,
    loading,
    error,
    isWalletAvailable,
    getAvailableWallets,
    connectWallet,
    disconnectWallet,
    getTransactionHistory,
    signMessage
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};
```

---

## Step 2: Custom Wallet Hook

**File:** `apps/frontend/src/hooks/useWallet.js`

```javascript
import { useContext } from 'react';
import { WalletContext } from '../contexts/WalletContext';

export const useWallet = () => {
  const context = useContext(WalletContext);
  
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  
  return context;
};
```

---

## Step 3: Connect Wallet Component

**File:** `apps/frontend/src/components/WalletConnect.jsx`

```javascript
import React, { useState } from 'react';
import { Wallet, ChevronDown } from 'lucide-react';
import { useWallet } from '../hooks/useWallet';

const WalletConnect = () => {
  const {
    connected,
    address,
    balance,
    network,
    loading,
    error,
    getAvailableWallets,
    connectWallet,
    disconnectWallet
  } = useWallet();

  const [showDropdown, setShowDropdown] = useState(false);
  const availableWallets = getAvailableWallets();

  const handleConnect = async (walletName) => {
    try {
      await connectWallet(walletName);
      setShowDropdown(false);
    } catch (err) {
      console.error('Connection failed:', err);
    }
  };

  if (connected) {
    return (
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm text-gray-600">Balance</p>
          <p className="font-semibold text-gray-800">
            {balance?.ada.toFixed(2)} ADA
          </p>
          <p className="text-xs text-gray-500">{network.toUpperCase()}</p>
        </div>

        <div className="bg-green-100 p-3 rounded-lg">
          <p className="text-xs text-gray-600">Address</p>
          <p className="text-sm font-mono text-gray-800 break-all">
            {address?.substring(0, 20)}...
          </p>
        </div>

        <button
          onClick={disconnectWallet}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={loading || availableWallets.length === 0}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition disabled:opacity-50"
      >
        <Wallet size={18} />
        {loading ? 'Connecting...' : 'Connect Wallet'}
        <ChevronDown size={16} />
      </button>

      {showDropdown && availableWallets.length > 0 && (
        <div className="absolute top-full mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-lg z-50">
          {availableWallets.map(wallet => (
            <button
              key={wallet}
              onClick={() => handleConnect(wallet)}
              className="block w-full text-left px-4 py-2 hover:bg-blue-50 border-b last:border-b-0"
            >
              {wallet}
            </button>
          ))}
        </div>
      )}

      {error && (
        <p className="text-red-600 text-sm mt-2">{error}</p>
      )}

      {availableWallets.length === 0 && (
        <p className="text-gray-600 text-sm mt-2">
          No wallet extensions detected. Install Nami, Eternl, or Flint.
        </p>
      )}
    </div>
  );
};

export default WalletConnect;
```

---

## Step 4: Payment for Live Pipeline

**File:** `apps/frontend/src/components/PaymentProcessor.jsx`

```javascript
import React, { useState } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { useWallet } from '../hooks/useWallet';

const PaymentProcessor = ({ onPaymentComplete }) => {
  const { connected, address, balance } = useWallet();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [transactionId, setTransactionId] = useState(null);

  const PAYMENT_AMOUNT_ADA = 2.0; // Cost per live pipeline analysis

  const handlePayment = async () => {
    if (!connected) {
      setStatus({ type: 'error', message: 'Wallet not connected' });
      return;
    }

    if (balance.ada < PAYMENT_AMOUNT_ADA) {
      setStatus({
        type: 'error',
        message: `Insufficient balance. Need ${PAYMENT_AMOUNT_ADA} ADA, have ${balance.ada.toFixed(2)} ADA`
      });
      return;
    }

    setLoading(true);
    try {
      // Get enabled wallet
      const walletName = Object.keys(window.cardano).find(
        key => window.cardano[key]?.isEnabled?.()
      );
      const wallet = window.cardano[walletName];
      const enabledWallet = await wallet.enable();

      // Create transaction
      const lovelace = Math.floor(PAYMENT_AMOUNT_ADA * 1000000);
      const recipientAddress = process.env.REACT_APP_PAYMENT_ADDRESS;

      // Get UTXOs
      const utxos = await enabledWallet.getUtxos();

      // Build transaction (simplified - use proper Cardano library for production)
      const txBody = {
        inputs: utxos.slice(0, 2),
        outputs: [{
          address: recipientAddress,
          amount: [{ unit: 'lovelace', quantity: lovelace }]
        }],
        fee: '200000',
        ttl: 3600
      };

      // Sign transaction
      const txSigned = await enabledWallet.signTx(txBody, true);

      // Submit transaction
      const txId = await enabledWallet.submitTx(txSigned);
      setTransactionId(txId);

      setStatus({
        type: 'success',
        message: `Payment successful! Transaction: ${txId}`
      });

      // Notify parent component
      if (onPaymentComplete) {
        onPaymentComplete(txId);
      }

    } catch (error) {
      setStatus({
        type: 'error',
        message: `Payment failed: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Live Pipeline Analysis
      </h3>

      <div className="bg-blue-50 p-4 rounded-lg mb-4">
        <p className="text-sm text-blue-800">
          Cost: <strong>{PAYMENT_AMOUNT_ADA} ADA</strong>
        </p>
        <p className="text-sm text-blue-800 mt-1">
          This enables live transaction data processing and AI analysis.
        </p>
      </div>

      {status && (
        <div
          className={`p-4 rounded-lg mb-4 flex gap-3 ${
            status.type === 'success'
              ? 'bg-green-50'
              : 'bg-red-50'
          }`}
        >
          {status.type === 'success' ? (
            <CheckCircle className="text-green-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="text-red-600 flex-shrink-0" />
          )}
          <p
            className={status.type === 'success' ? 'text-green-800' : 'text-red-800'}
          >
            {status.message}
          </p>
        </div>
      )}

      <button
        onClick={handlePayment}
        disabled={loading || !connected || balance.ada < PAYMENT_AMOUNT_ADA}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Processing...' : `Pay ${PAYMENT_AMOUNT_ADA} ADA`}
      </button>

      {transactionId && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600">Transaction ID:</p>
          <p className="text-xs font-mono text-gray-800 break-all">{transactionId}</p>
        </div>
      )}
    </div>
  );
};

export default PaymentProcessor;
```

---

## Step 5: Backend Wallet Verification

**File:** `apps/backend/src/middleware/walletAuth.js`

```javascript
import axios from 'axios';

// Verify wallet signature
async function verifyWalletSignature(address, message, signature) {
  try {
    // Call Blockfrost API to verify signature (if using Blockfrost)
    // Or implement manual signature verification using Cardano libraries
    
    // For now, just verify address format
    if (!address || !address.startsWith('addr_test')) {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
}

// Middleware to check payment
async function checkPayment(req, res, next) {
  try {
    const { walletAddress, transactionId } = req.body;
    
    if (!walletAddress || !transactionId) {
      return res.status(400).json({ error: 'Missing wallet or transaction' });
    }

    // Verify transaction on blockchain using Blockfrost
    const blockfrost = axios.create({
      baseURL: 'https://cardano-testnet.blockfrost.io/api/v0',
      headers: { 'project_id': process.env.BLOCKFROST_API_KEY }
    });

    const tx = await blockfrost.get(`/txs/${transactionId}`);
    
    // Check if transaction is confirmed and correct amount
    if (tx.data.block === null) {
      return res.status(400).json({ error: 'Transaction not confirmed' });
    }

    // Verify amount (2 ADA = 2,000,000 lovelace)
    const paymentAmount = 2000000;
    const received = tx.data.output_amount.find(a => a.unit === 'lovelace');
    
    if (!received || received.quantity < paymentAmount) {
      return res.status(400).json({ error: 'Insufficient payment' });
    }

    // Store payment record
    await savePaidTransaction({
      walletAddress,
      transactionId,
      amount: received.quantity,
      timestamp: new Date()
    });

    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export { verifyWalletSignature, checkPayment };
```

---

## Environment Variables

**Frontend `.env.local`:**

```env
REACT_APP_PAYMENT_ADDRESS=addr_test1qpaymentrecipientaddress
REACT_APP_BLOCKFROST_API_KEY=your_blockfrost_key
REACT_APP_NETWORK=testnet
```

**Backend `.env`:**

```env
BLOCKFROST_API_KEY=your_blockfrost_key
CARDANO_NETWORK=testnet
PAYMENT_ADDRESS=addr_test1qpaymentrecipientaddress
PAYMENT_AMOUNT_LOVELACE=2000000
```

---

## Supported Wallets

| Wallet | Install Link | Network Support |
|--------|-------------|-----------------|
| Nami | https://namiwallet.io | Testnet + Mainnet |
| Eternl | https://eternl.io | Testnet + Mainnet |
| Flint | https://flint-wallet.com | Testnet + Mainnet |

---

## Testing Checklist

- [ ] Wallet connection works
- [ ] Balance displays correctly
- [ ] Transaction history loads
- [ ] Payment processing works
- [ ] Transaction verification succeeds
- [ ] Failed payments handled gracefully
- [ ] Network switching (testnet/mainnet) works
- [ ] Multiple wallet types supported

---

## Next Steps

1. Implement live pipeline transaction processing (see `LIVE_PIPELINE_GUIDE.md`)
2. Set up payment verification and storage
3. Test with testnet wallets

