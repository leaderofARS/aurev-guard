import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { WalletProvider } from "./context/WalletContext";

// Pages
import Landing from "./pages/Landing";
import WalletConnectPage from "./pages/WalletConnectPage";
import Wallet from "./pages/Wallet";
import Risk from "./pages/Risk";
import Proof from "./pages/Proof";

// Legacy / demo pages
import Connect from "./pages/Connect";
import RiskChecker from "./pages/RiskChecker";

export default function App() {
  return (
    <WalletProvider>
      <BrowserRouter>
        <div className="p-6">

          {/* Header + Navigation */}
          <header className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">AUREV Guard</h1>
            <nav className="space-x-4">
              <Link to="/" className="text-blue-600">Home</Link>
              <Link to="/connect" className="text-blue-600">Connect</Link>
              <Link to="/risk" className="text-blue-600">Risk</Link>
              <Link to="/proof" className="text-blue-600">Proof</Link>
            </nav>
          </header>

          {/* Routes */}
          <Routes>
            {/* Modern routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/connect" element={<WalletConnectPage />} />
            <Route path="/app" element={<Wallet />} />
            <Route path="/risk" element={<Risk />} />
            <Route path="/proof" element={<Proof />} />

            {/* Legacy / demo routes */}
            <Route path="/connect-legacy" element={<Connect />} />
            <Route path="/risk-demo" element={<RiskChecker />} />
          </Routes>

        </div>
      </BrowserRouter>
    </WalletProvider>
  );
}
