<<<<<<< Updated upstream
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Wallet from "./pages/Wallet";
import Risk from "./pages/Risk";
import Proof from "./pages/Proof";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Wallet />} />
        <Route path="/risk" element={<Risk />} />
        <Route path="/proof" element={<Proof />} />
      </Routes>
    </BrowserRouter>
=======
// src/App.jsx
import { Routes, Route } from "react-router-dom";
import { WalletProvider } from "./context/WalletContext";
import Landing from "./pages/Landing";
import WalletConnectPage from "./pages/WalletConnectPage";
import Wallet from "./pages/Wallet";
import Risk from "./pages/Risk";
import Proof from "./pages/Proof";
import Connect from "./pages/Connect";
import RiskChecker from "./pages/RiskChecker";

export default function App() {
  return (
    <WalletProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/connect" element={<WalletConnectPage />} />
        <Route path="/app" element={<Wallet />} />
        <Route path="/risk" element={<Risk />} />
        <Route path="/proof" element={<Proof />} />
        <Route path="/connect-legacy" element={<Connect />} />
        <Route path="/risk-demo" element={<RiskChecker />} />
      </Routes>
    </WalletProvider>
>>>>>>> Stashed changes
  );
}
