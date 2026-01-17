import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Shield,
  TrendingUp,
  Building2,
  Activity,
  FileCheck,
  ArrowRight,
  Hexagon,
  CheckCircle2,
  Zap,
  Lock,
} from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Provably Fair Verification",
    description:
      "One-click cryptographic verification of bet outcomes. Know instantly if a game was fair.",
  },
  {
    icon: TrendingUp,
    title: "RNG Pattern Analysis",
    description:
      "Statistical analysis to detect anomalies and verify randomness quality against advertised RTPs.",
  },
  {
    icon: Building2,
    title: "Operator Intelligence",
    description:
      "Aggregated trust scores and compliance data from multiple sources for informed decisions.",
  },
  {
    icon: Activity,
    title: "Personal Analytics",
    description:
      "Track your betting patterns with responsible gambling insights and customizable limits.",
  },
  {
    icon: FileCheck,
    title: "Evidence Collection",
    description:
      "Blockchain-anchored documentation for dispute resolution with immutable timestamps.",
  },
  {
    icon: Lock,
    title: "Multi-Chain Security",
    description:
      "Evidence stored across Algorand, Ethereum, and other networks for maximum immutability.",
  },
];

const stats = [
  { value: "100%", label: "Cryptographic Verification" },
  { value: "6+", label: "Statistical Tests" },
  { value: "5", label: "Blockchain Networks" },
  { value: "24/7", label: "Monitoring" },
];

const steps = [
  {
    step: "1",
    title: "Commitment",
    description: "Casino shows you a hash of the server seed before the bet",
  },
  {
    step: "2",
    title: "Your Input",
    description: "You provide a client seed that influences the outcome",
  },
  {
    step: "3",
    title: "Revelation",
    description: "After the bet, casino reveals the actual server seed",
  },
  {
    step: "4",
    title: "Verification",
    description: "We verify the hash matches and compute the fair outcome",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0A0E17]">
      {/* Background Pattern */}
      <div className="fixed inset-0 hex-pattern opacity-30 pointer-events-none" />

      {/* Gradient Orbs */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-[#00F0FF] rounded-full opacity-5 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[400px] h-[400px] bg-[#00F0FF] rounded-full opacity-5 blur-[100px] pointer-events-none" />

      {/* Navigation */}
      <nav className="relative z-50 border-b border-[rgba(0,240,255,0.1)] bg-[#0A0E17]/80 backdrop-blur-xl sticky top-0">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative">
                <Hexagon className="h-9 w-9 text-[#00F0FF] transition-all duration-300 group-hover:drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]" />
                <span className="absolute inset-0 flex items-center justify-center text-[#00F0FF] font-bold text-sm">P</span>
              </div>
              <span className="font-display text-xl font-bold text-[#F8FAFC]">PIVP</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/sign-in"
                className="text-sm font-medium text-[#94A3B8] hover:text-[#00F0FF] transition-colors"
              >
                Sign In
              </Link>
              <Button asChild>
                <Link href="/sign-up">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(0,240,255,0.3)] bg-[rgba(0,240,255,0.1)] px-4 py-1.5 text-sm text-[#00F0FF] mb-6">
            <Zap className="h-4 w-4" />
            Blockchain-Powered Verification
          </div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-[#F8FAFC] sm:text-5xl md:text-6xl lg:text-7xl">
            Player Intelligence &
            <span className="block text-[#00F0FF] drop-shadow-[0_0_30px_rgba(0,240,255,0.3)]">
              Verification Platform
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-[#94A3B8] leading-relaxed">
            Verify provably fair outcomes, analyze RNG patterns, and protect
            yourself with blockchain-backed evidence. The transparency tool
            every online gambler needs.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" asChild className="w-full sm:w-auto">
              <Link href="/sign-up">
                Start Verifying
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="w-full sm:w-auto">
              <Link href="/api/v1">API Documentation</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative z-10 border-y border-[rgba(0,240,255,0.1)] bg-[rgba(0,240,255,0.03)]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold font-display text-[#00F0FF] drop-shadow-[0_0_10px_rgba(0,240,255,0.3)]">
                  {stat.value}
                </div>
                <div className="mt-1 text-sm text-[#94A3B8]">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight text-[#F8FAFC] sm:text-4xl">
            Everything You Need for Gambling Transparency
          </h2>
          <p className="mt-4 text-lg text-[#94A3B8]">
            Comprehensive tools to verify fairness and protect yourself
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} className="group">
              <CardContent className="pt-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-[12px] bg-[rgba(0,240,255,0.1)] border border-[rgba(0,240,255,0.2)] group-hover:shadow-[0_0_20px_rgba(0,240,255,0.2)] transition-all duration-300">
                  <feature.icon className="h-6 w-6 text-[#00F0FF]" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-[#F8FAFC]">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-[#94A3B8] leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 border-y border-[rgba(0,240,255,0.1)] bg-[#111827]/50 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight text-[#F8FAFC] sm:text-4xl">
              How Provably Fair Works
            </h2>
            <p className="mt-4 text-lg text-[#94A3B8]">
              Cryptographic verification in four simple steps
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-4">
            {steps.map((item, index) => (
              <div key={item.step} className="relative text-center group">
                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-6 left-[60%] w-[80%] h-px bg-gradient-to-r from-[#00F0FF] to-transparent opacity-30" />
                )}
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(0,240,255,0.1)] border-2 border-[#00F0FF] text-xl font-bold text-[#00F0FF] shadow-[0_0_20px_rgba(0,240,255,0.3)] group-hover:shadow-[0_0_30px_rgba(0,240,255,0.5)] transition-all duration-300">
                  {item.step}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-[#F8FAFC]">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-[#94A3B8]">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust indicators */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          <div>
            <h2 className="font-display text-3xl font-bold tracking-tight text-[#F8FAFC] sm:text-4xl">
              Built for Trust & Transparency
            </h2>
            <p className="mt-4 text-lg text-[#94A3B8] leading-relaxed">
              PIVP uses industry-standard cryptographic methods and stores evidence
              across multiple blockchain networks for maximum security and immutability.
            </p>
            <ul className="mt-8 space-y-4">
              {[
                "SHA-256, SHA-512, and HMAC verification algorithms",
                "Multi-chain evidence storage (Algorand, Ethereum, Polygon)",
                "Chi-squared, runs, and serial correlation RNG tests",
                "Real-time operator trust scoring",
                "GDPR-compliant data handling",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-[#10B981] mt-0.5 shrink-0" />
                  <span className="text-[#94A3B8]">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[#00F0FF]/10 to-transparent rounded-[24px] blur-xl" />
            <Card className="relative">
              <CardContent className="p-8">
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.3)]">
                      <CheckCircle2 className="h-5 w-5 text-[#10B981]" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[#F8FAFC]">Verification Complete</div>
                      <div className="text-xs text-[#94A3B8]">Outcome verified as fair</div>
                    </div>
                  </div>
                  <div className="space-y-3 rounded-[12px] bg-[#0A0E17] p-4 border border-[rgba(0,240,255,0.1)]">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#64748B]">Server Seed Hash</span>
                      <span className="text-[#00F0FF] font-mono text-xs">a7f2e3...</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#64748B]">Client Seed</span>
                      <span className="text-[#F8FAFC] font-mono text-xs">user_seed_123</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#64748B]">Nonce</span>
                      <span className="text-[#F8FAFC] font-mono text-xs">42</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#64748B]">Result</span>
                      <span className="text-[#10B981] font-semibold">0.7234 (Win)</span>
                    </div>
                  </div>
                  <div className="text-xs text-[#64748B] text-center">
                    Evidence anchored on Algorand • Tx: ABC123...
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[24px] border border-[rgba(0,240,255,0.2)] bg-gradient-to-br from-[#111827] to-[#0A0E17] px-6 py-16 sm:px-12 lg:px-16">
          {/* Glow effect */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-[#00F0FF] opacity-10 blur-[100px] pointer-events-none" />

          <div className="relative text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight text-[#F8FAFC] sm:text-4xl">
              Ready to Verify Your Bets?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-[#94A3B8]">
              Join thousands of players who verify their gambling outcomes with
              PIVP. Free to start, no credit card required.
            </p>
            <div className="mt-8">
              <Button size="lg" asChild>
                <Link href="/sign-up">
                  Create Free Account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[rgba(0,240,255,0.1)] bg-[#0A0E17]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative">
                <Hexagon className="h-7 w-7 text-[#00F0FF] transition-all duration-300 group-hover:drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]" />
                <span className="absolute inset-0 flex items-center justify-center text-[#00F0FF] font-bold text-xs">P</span>
              </div>
              <span className="font-display text-lg font-semibold text-[#F8FAFC]">PIVP</span>
            </Link>
            <p className="text-sm text-[#64748B] text-center">
              Player Intelligence & Verification Platform. Gamble responsibly.
            </p>
            <div className="flex gap-6">
              <Link
                href="/api/v1"
                className="text-sm text-[#64748B] hover:text-[#00F0FF] transition-colors"
              >
                API
              </Link>
              <Link
                href="#"
                className="text-sm text-[#64748B] hover:text-[#00F0FF] transition-colors"
              >
                Privacy
              </Link>
              <Link
                href="#"
                className="text-sm text-[#64748B] hover:text-[#00F0FF] transition-colors"
              >
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
