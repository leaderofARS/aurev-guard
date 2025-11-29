import React, { createContext, useState, useCallback } from "react";

export const WalletContext = createContext();

export function WalletProvider({ children }) {
  const [wallet, setWalletState] = useState({
    api: null,
    address: null,
    walletName: null,
    isConnected: false,
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const connectWallet = useCallback((api, address, walletName = "manual") => {
    try {
      setError(null);
      setWalletState({
        api: api || null,
        address,
        walletName,
        isConnected: !!address,
      });
      localStorage.setItem("aurev_wallet_address", address);
      localStorage.setItem("aurev_wallet_name", walletName);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setWalletState({
      api: null,
      address: null,
      walletName: null,
      isConnected: false,
    });
    localStorage.removeItem("aurev_wallet_address");
    localStorage.removeItem("aurev_wallet_name");
    setError(null);
  }, []);

  const restoreWallet = useCallback(() => {
    const savedAddress = localStorage.getItem("aurev_wallet_address");
    const savedWalletName = localStorage.getItem("aurev_wallet_name");
    if (savedAddress) {
      setWalletState({
        api: null,
        address: savedAddress,
        walletName: savedWalletName || "manual",
        isConnected: true,
      });
    }
  }, []);

  return (
    <WalletContext.Provider
      value={{
        wallet,
        error,
        loading,
        setError,
        setLoading,
        connectWallet,
        disconnectWallet,
        restoreWallet,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}
