import WalletConnect from '../components/WalletConnect';
import Link from 'next/link';
import { useState } from 'react';

export default function Home() {
  const [wallet, setWallet] = useState(null);
  return (
    <div className="min-h-screen p-8 bg-slate-50">
      <div className="max-w-3xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">AUREV Guard</h1>
          <nav className="space-x-3">
            <Link href="/risk"><a className="text-slate-600">Risk Checker</a></Link>
            <Link href="/proof"><a className="text-slate-600">Compliance Proof</a></Link>
          </nav>
        </header>

        <WalletConnect onConnect={(w) => setWallet(w)} />

        <div className="p-4 bg-white rounded-lg border">
          <h3 className="font-semibold">Quick actions</h3>
          <div className="mt-3 space-x-2">
            <Link href="/risk"><a className="px-4 py-2 rounded-md bg-sky-600 text-white">Go to Risk Checker</a></Link>
            <Link href="/proof"><a className="px-4 py-2 rounded-md border">Go to Compliance Proof</a></Link>
          </div>
        </div>
      </div>
    </div>
  );
}
