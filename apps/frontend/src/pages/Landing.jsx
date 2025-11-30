import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProject } from "../lib/api";
import NavBar from "../components/NavBar";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { Shield, Zap, BarChart3, Link2, Lock, FileText } from "lucide-react";

export default function Landing() {
  const navigate = useNavigate();
  const [projectData, setProjectData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getProject()
      .then((res) => {
        if (!mounted) return;
        setProjectData(res);
      })
      .catch((err) => {
        console.warn("Failed to load project metadata:", err);
        if (!mounted) return;
        setError(err.message);
      })
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, []);

  const projectName = projectData?.projectName || "Aurev Guard";
  const tagline =
    projectData?.tagline ||
    "Lightweight Cardano compliance and risk scanning for contracts and wallets.";
  const about =
    projectData?.about ||
    "Aurev Guard is a demo guard agent that scans Cardano contracts and wallet activity for compliance and risk indicators.";
  const features = projectData?.features || [
    {
      id: "contract_scans",
      title: "Contract Scans",
      description:
        "Static and runtime checks for common compliance patterns and suspicious constructs.",
    },
    {
      id: "wallet_risk",
      title: "Wallet Risk",
      description:
        "Score wallets by recent activity, known bad patterns, and heuristics.",
    },
    {
      id: "proofs_minting",
      title: "Proofs & Minting",
      description:
        "Lightweight proof mint flows and sample validators to test offline workflows.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f0a1f] via-purple-950 to-[#0f0a1f] text-foreground">
      <NavBar />
      {/* Header/Hero Section */}
      <header className="pt-20 pb-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="md:max-w-2xl">
              <h1 className="text-5xl md:text-6xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 via-pink-400 to-fuchsia-300">
                {projectName}
              </h1>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                {tagline}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={() => navigate("/connect")}
                  size="lg"
                  className="bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700 text-white font-bold shadow-lg hover:shadow-xl"
                >
                  Get Started
                </Button>
                <Button
                  onClick={() => navigate("/app")}
                  size="lg"
                  variant="outline"
                  className="border-2 border-fuchsia-400 text-fuchsia-300 hover:bg-fuchsia-400/10 font-bold"
                >
                  Open Dashboard
                </Button>
              </div>
              {error && (
                <p className="text-sm text-destructive mt-4">{error}</p>
              )}
            </div>

            {/* Hero Visual */}
            <Card className="w-full md:w-96 h-64 bg-gradient-to-br from-fuchsia-500/20 to-pink-500/20 border-fuchsia-500/30 backdrop-blur-sm">
              <CardContent className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Shield className="h-16 w-16 mx-auto mb-2 text-fuchsia-400" />
                  <p className="text-muted-foreground">
                    Compliance & Risk Protection
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </header>

      {/* About Section */}
      <section className="py-16 px-6 bg-purple-900/20 border-y border-purple-700/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-fuchsia-300">
            About the Project
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed mb-4">
            {about}
          </p>
          <p className="text-muted-foreground">
            The project integrates an AI agent core, backend services, and a
            React frontend for testing wallet connections, proof minting, and
            risk checks.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-fuchsia-300 text-center">
            Key Features
          </h2>
          <p className="text-center text-muted-foreground mb-12">
            Everything you need for wallet compliance and risk management
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {loading ? (
              <p className="text-muted-foreground col-span-full text-center">
                Loading features...
              </p>
            ) : (
              features.map((feature, idx) => (
                <Card
                  key={feature.id || idx}
                  className="hover:border-fuchsia-400/50 hover:shadow-lg hover:shadow-fuchsia-500/20 transition-all"
                >
                  <CardHeader>
                    <CardTitle className="text-fuchsia-300">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-foreground/80">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 px-6 bg-purple-900/20 border-t border-purple-700/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-fuchsia-300 text-center">
            How It Works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                step: "1",
                title: "Connect Wallet",
                desc: "Link your Cardano wallet or enter an address",
              },
              {
                step: "2",
                title: "Risk Scan",
                desc: "AI analyzes wallet for compliance",
              },
              {
                step: "3",
                title: "Generate Proof",
                desc: "Create cryptographic proof of assessment",
              },
              {
                step: "4",
                title: "Anchor On-chain",
                desc: "Record decision hash to blockchain",
              },
            ].map((item) => (
              <Card key={item.step} className="text-center">
                <CardContent className="pt-6">
                  <Badge className="w-12 h-12 rounded-full bg-gradient-to-r from-fuchsia-600 to-pink-600 flex items-center justify-center font-bold text-lg mx-auto mb-3 p-0">
                    {item.step}
                  </Badge>
                  <CardTitle className="text-fuchsia-300 mb-2 text-lg">
                    {item.title}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {item.desc}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-fuchsia-300 text-center">
            Why Aurev Guard?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                icon: Lock,
                title: "Secure & Private",
                desc: "Your wallet private keys never leave your device. CIP-30 standard compliance.",
              },
              {
                icon: Zap,
                title: "Fast Scanning",
                desc: "AI-powered risk assessment in seconds with detailed explanations.",
              },
              {
                icon: BarChart3,
                title: "Detailed Reports",
                desc: "Get comprehensive risk scores, features, and audit trails.",
              },
              {
                icon: Link2,
                title: "On-Chain Records",
                desc: "Immutable proof anchoring on Cardano blockchain.",
              },
            ].map((benefit, idx) => {
              const Icon = benefit.icon;
              return (
                <Card
                  key={idx}
                  className="hover:border-fuchsia-400/50 hover:shadow-lg hover:shadow-fuchsia-500/20 transition-all"
                >
                  <CardHeader>
                    <Icon className="h-10 w-10 mb-4 text-fuchsia-400" />
                    <CardTitle className="text-fuchsia-300">
                      {benefit.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-foreground/80">
                      {benefit.desc}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-6 bg-gradient-to-r from-fuchsia-600/20 to-pink-600/20 border-y border-fuchsia-500/30">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-fuchsia-300">
            Ready to Secure Your Wallet?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Start scanning for compliance risks and generate proofs in minutes.
          </p>
          <Button
            onClick={() => navigate("/connect")}
            size="lg"
            className="bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700 text-white font-bold text-lg shadow-lg hover:shadow-xl"
          >
            Connect Your Wallet Now
          </Button>
        </div>
      </section>

      <Separator className="bg-purple-700/50" />

      {/* Footer */}
      <footer className="py-8 px-6 bg-[#0f0a1f]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between">
          <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Aurev Guard — Built for Cardano
            Compliance
          </div>
          <div className="flex gap-6 mt-4 md:mt-0 text-sm text-muted-foreground">
            <a href="#docs" className="hover:text-fuchsia-400 transition">
              Documentation
            </a>
            <a href="#github" className="hover:text-fuchsia-400 transition">
              GitHub
            </a>
            <a href="#contact" className="hover:text-fuchsia-400 transition">
              Contact
            </a>
          </div>
          <div className="text-sm text-muted-foreground mt-4 md:mt-0">
            Built with ♥ on Cardano
          </div>
        </div>
      </footer>
    </div>
  );
}
