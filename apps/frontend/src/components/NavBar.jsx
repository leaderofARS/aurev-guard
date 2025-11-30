// src/components/NavBar.jsx
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "./ui/sheet";
import { Menu, X } from "lucide-react";

export default function NavBar() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  const links = [
    { to: "/", label: "Home" },
    { to: "/app", label: "Wallet" },
    { to: "/risk", label: "Risk" },
    { to: "/proof", label: "Proof" },
    { to: "/connect", label: "Connect" },
  ];

  return (
    <header className="fixed top-0 left-0 w-full z-50">
      {/* Full-width gradient bar */}
      <div className="w-full backdrop-blur-md bg-gradient-to-r from-[#0f0a1f] via-purple-900 to-fuchsia-900 shadow-lg shadow-purple-900/40">
        <div className="flex items-center justify-between max-w-7xl mx-auto py-4 px-6">
          {/* Logo */}
          <h1 className="text-2xl font-extrabold text-fuchsia-300 tracking-wide animate-pulse">
            <Link to="/">AUREV Guard</Link>
          </h1>

          {/* Desktop Nav */}
          <nav className="hidden md:flex space-x-6">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`relative px-4 py-2 text-sm font-semibold transition-all duration-300 
                  ${
                    pathname === link.to
                      ? "bg-purple-700 text-fuchsia-300 rounded-full shadow-lg shadow-fuchsia-500/40"
                      : "text-purple-200 hover:text-fuchsia-300 hover:-translate-y-1 hover:shadow-[0_0_10px_rgba(236,72,153,0.6)]"
                  }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Mobile Menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-fuchsia-300"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle className="text-fuchsia-300">AUREV Guard</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col space-y-4 mt-8">
                {links.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setOpen(false)}
                    className={`px-4 py-2 rounded-lg text-lg font-semibold transition duration-300 ${
                      pathname === link.to
                        ? "bg-purple-700 text-fuchsia-300 shadow-lg shadow-fuchsia-500/40"
                        : "text-purple-200 hover:bg-purple-700 hover:text-fuchsia-300"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
