import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Connect from './pages/Connect';
import RiskChecker from './pages/RiskChecker';
import Proof from './pages/Proof';

export default function App(){
  return (
    <BrowserRouter>
      <div className="p-6">
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">AUREV Guard</h1>
          <nav className="space-x-4">
            <Link to="/" className="text-blue-600">Connect</Link>
            <Link to="/risk" className="text-blue-600">Risk</Link>
            <Link to="/proof" className="text-blue-600">Proof</Link>
          </nav>
        </header>

        <Routes>
          <Route path="/" element={<Connect />} />
          <Route path="/risk" element={<RiskChecker />} />
          <Route path="/proof" element={<Proof />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
