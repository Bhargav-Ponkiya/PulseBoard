"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Activity, ArrowRight, Bot, CheckCircle, Cpu, ShieldAlert, Sparkles, Terminal, Zap, ExternalLink, RefreshCw, BarChart2, BellRing } from 'lucide-react';

export default function HomePage() {
  // 1. Live Telemetry Simulation Counters
  const [checksCount, setChecksCount] = useState(14820);
  const [avgLatency, setAvgLatency] = useState(384);
  const [uptimePct, setUptimePct] = useState(99.98);

  useEffect(() => {
    const timer = setInterval(() => {
      setChecksCount((prev) => prev + Math.floor(Math.random() * 3) + 1);
      setAvgLatency((prev) => {
        const delta = Math.floor(Math.random() * 11) - 5;
        const next = prev + delta;
        return next > 350 && next < 420 ? next : prev;
      });
      setUptimePct((prev) => {
        const next = prev + (Math.random() * 0.002 - 0.001);
        return next > 99.95 && next <= 100 ? parseFloat(next.toFixed(4)) : prev;
      });
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  // 2. Interactive AI Diagnostics Simulator
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [typedText, setTypedText] = useState("");

  const simulationReport = `[AI ANALYSIS] PROBABLE CAUSE
The recent authentication middleware commit (ref: 6a8d29b) by Bhargav-Ponkiya modified 'auth.middleware.ts' to catch jwt exceptions, but introduced a TypeError on line 24 when 'authorization' header is null/undefined. This caused the API Gateway to crash with HTTP 500 on all incoming client requests.

[IMMEDIATE REMEDIATION]
1. Patch line 24 of 'auth.middleware.ts' to add a null guard:
   if (!header || !header.startsWith('Bearer ')) {
     throw new UnauthorizedException('No token provided');
   }

[FUTURE PREVENTION]
Implement a unit test verifying that requests missing token headers return 401 instead of generating a 500 unhandled runtime error.`;

  const runAiSimulation = () => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);
    setAnalysisStep(1);
    setTypedText("");

    // Step 1: Ingesting Logs
    setTimeout(() => {
      setAnalysisStep(2);
    }, 1500);

    // Step 2: Fetching Commits
    setTimeout(() => {
      setAnalysisStep(3);
    }, 3000);

    // Step 3: Running Gemini
    setTimeout(() => {
      setAnalysisStep(4);
      let index = 0;
      const typewrite = setInterval(() => {
        setTypedText((prev) => prev + simulationReport.charAt(index));
        index++;
        if (index >= simulationReport.length) {
          clearInterval(typewrite);
          setIsAnalyzing(false);
        }
      }, 12);
    }, 4500);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-violet-500/30 selection:text-violet-200 overflow-x-hidden font-sans">
      
      {/* Mesh Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none opacity-20 z-0">
        <div className="absolute top-[-10%] left-[20%] w-[400px] h-[400px] rounded-full bg-violet-600 blur-[120px]" />
        <div className="absolute top-[5%] right-[20%] w-[550px] h-[550px] rounded-full bg-fuchsia-600 blur-[150px]" />
      </div>

      {/* 🚀 Header */}
      <header className="sticky top-0 w-full border-b border-white/5 bg-slate-950/80 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-600/30 relative group">
              <Activity className="h-5 w-5 text-white animate-pulse" />
              <div className="absolute inset-0 rounded-xl bg-violet-600 opacity-0 group-hover:opacity-100 transition-opacity blur" />
            </div>
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              PulseBoard
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#features" className="hover:text-slate-200 transition-colors">Features</a>
            <a href="#demo" className="hover:text-slate-200 transition-colors">AI Demo</a>
            <a href="#stats" className="hover:text-slate-200 transition-colors">Live Stats</a>
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/login">
              <button className="text-slate-400 hover:text-slate-200 text-sm font-medium transition-colors">
                Sign In
              </button>
            </Link>
            <Link href="/register">
              <button className="h-9 px-4 rounded-xl text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-all shadow-md shadow-violet-600/20 hover:shadow-violet-600/30 flex items-center gap-1.5 active:scale-95">
                Get Started
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* 🚀 Hero Section */}
      <section className="relative z-10 pt-20 pb-16 px-6 max-w-7xl mx-auto text-center">
        
        {/* Glow Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/30 bg-violet-500/5 text-violet-300 text-xs font-medium tracking-wide mb-8 animate-fade-in">
          <Sparkles className="h-3.5 w-3.5 text-violet-400 animate-spin-slow" />
          <span>Next-Generation AI Observability</span>
        </div>

        {/* Big Headline */}
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-[1.1] mb-6">
          Observe. Analyze. Recover.
          <span className="block mt-2 bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-500 bg-clip-text text-transparent">
            Powered by Gemini AI.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed mb-10">
          PulseBoard continuously monitors your endpoints, aggregates application logs, and uses state-of-the-art AI to instantly identify root causes and generate dynamic incident fixes.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
          <Link href="/register">
            <button className="h-12 px-8 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-sm font-bold text-white shadow-lg shadow-violet-600/20 transition-all flex items-center gap-2 active:scale-98">
              Start Free Monitoring
              <ArrowRight className="h-4 w-4" />
            </button>
          </Link>
          <a href="#demo">
            <button className="h-12 px-8 rounded-2xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-sm font-semibold text-slate-300 hover:text-white transition-all active:scale-98">
              Watch Interactive Demo
            </button>
          </a>
        </div>

        {/* 🚀 Interactive AI Diagnostics Simulator Widget */}
        <div id="demo" className="max-w-4xl mx-auto rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-xl shadow-2xl p-6 md:p-8 text-left relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
            <Bot className="h-48 w-48 text-violet-500" />
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-6 mb-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-violet-400 flex items-center gap-1.5">
                <Terminal className="h-4 w-4" />
                Live Control Simulation
              </span>
              <h3 className="text-lg font-bold text-slate-200 mt-1">Gemini AI Diagnostics Terminal</h3>
            </div>
            <button
              onClick={runAiSimulation}
              disabled={isAnalyzing}
              className="h-10 px-6 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:bg-violet-700/50 disabled:text-violet-300/70 font-semibold text-xs text-white shadow-md shadow-violet-600/20 transition-all flex items-center gap-2 shrink-0 active:scale-95"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Diagnosing...
                </>
              ) : (
                <>
                  <Bot className="h-4 w-4" />
                  Simulate AI Diagnosis
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Steps Console */}
            <div className="space-y-3.5">
              <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">Analysis Stages</span>
              
              <div className="space-y-2.5">
                <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-300 ${
                  analysisStep >= 1 ? 'border-violet-500/30 bg-violet-500/5 text-violet-300' : 'border-white/5 bg-white/[0.01] text-slate-500'
                }`}>
                  {analysisStep > 1 ? (
                    <CheckCircle className="h-4.5 w-4.5 text-violet-400 shrink-0" />
                  ) : (
                    <div className={`h-4.5 w-4.5 rounded-full border border-current flex items-center justify-center text-[10px] font-bold ${isAnalyzing && analysisStep === 1 ? 'animate-pulse' : ''}`}>1</div>
                  )}
                  <span className="text-xs font-medium">Ingest Failure Telemetry</span>
                </div>

                <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-300 ${
                  analysisStep >= 2 ? 'border-violet-500/30 bg-violet-500/5 text-violet-300' : 'border-white/5 bg-white/[0.01] text-slate-500'
                }`}>
                  {analysisStep > 2 ? (
                    <CheckCircle className="h-4.5 w-4.5 text-violet-400 shrink-0" />
                  ) : (
                    <div className={`h-4.5 w-4.5 rounded-full border border-current flex items-center justify-center text-[10px] font-bold ${isAnalyzing && analysisStep === 2 ? 'animate-pulse' : ''}`}>2</div>
                  )}
                  <span className="text-xs font-medium">Query Log Similarity Index</span>
                </div>

                <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-300 ${
                  analysisStep >= 3 ? 'border-violet-500/30 bg-violet-500/5 text-violet-300' : 'border-white/5 bg-white/[0.01] text-slate-500'
                }`}>
                  {analysisStep > 3 ? (
                    <CheckCircle className="h-4.5 w-4.5 text-violet-400 shrink-0" />
                  ) : (
                    <div className={`h-4.5 w-4.5 rounded-full border border-current flex items-center justify-center text-[10px] font-bold ${isAnalyzing && analysisStep === 3 ? 'animate-pulse' : ''}`}>3</div>
                  )}
                  <span className="text-xs font-medium">Inspect Recent Code Commits</span>
                </div>

                <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-300 ${
                  analysisStep >= 4 ? 'border-violet-500/30 bg-violet-500/5 text-violet-300' : 'border-white/5 bg-white/[0.01] text-slate-500'
                }`}>
                  {analysisStep > 4 || (!isAnalyzing && analysisStep === 4) ? (
                    <CheckCircle className="h-4.5 w-4.5 text-violet-400 shrink-0" />
                  ) : (
                    <div className={`h-4.5 w-4.5 rounded-full border border-current flex items-center justify-center text-[10px] font-bold ${isAnalyzing && analysisStep === 4 ? 'animate-pulse' : ''}`}>4</div>
                  )}
                  <span className="text-xs font-medium">Generate Gemini Diagnosis</span>
                </div>
              </div>
            </div>

            {/* Diagnostic Report Output Terminal */}
            <div className="lg:col-span-2 rounded-2xl border border-white/5 bg-slate-950/80 p-4 font-mono text-[11px] leading-relaxed text-slate-400 h-64 overflow-y-auto relative">
              <div className="absolute top-2 right-3 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                <span className="h-2 w-2 rounded-full bg-yellow-500" />
                <span className="h-2 w-2 rounded-full bg-green-500" />
              </div>
              
              {!isAnalyzing && analysisStep === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center text-slate-600 px-6">
                  <Terminal className="h-8 w-8 mb-2" />
                  <p>Click "Simulate AI Diagnosis" above to start the telemetry mapping simulation.</p>
                </div>
              )}

              {analysisStep === 1 && (
                <div className="text-violet-400 animate-pulse">
                  &gt; [INFO] ping triggered down status for https://httpstat.us/500...<br />
                  &gt; [INFO] StatusCode: 500 | LatencyMs: 472ms | expectedStatus: 200...
                </div>
              )}

              {analysisStep === 2 && (
                <div className="text-violet-400">
                  &gt; [INFO] ping triggered down status for https://httpstat.us/500...<br />
                  &gt; [INFO] Ingesting failure parameters...<br />
                  <span className="text-fuchsia-400 animate-pulse">&gt; [INFO] Fetching 5 most recent database error logs...</span><br />
                  &gt; [SUCCESS] Log match found: "TypeError: Cannot read properties of null (reading 'startsWith') in auth.middleware.ts"...
                </div>
              )}

              {analysisStep === 3 && (
                <div className="text-violet-400">
                  &gt; [INFO] Ingesting failure parameters...<br />
                  &gt; [SUCCESS] Log match found: "TypeError: Cannot read properties of null"...<br />
                  <span className="text-pink-400 animate-pulse">&gt; [INFO] Querying GitHub Repository commits via Octokit...</span><br />
                  &gt; [SUCCESS] Detected 1 new commit: "refactor: update auth middleware response handling" (Bhargav-Ponkiya)
                </div>
              )}

              {analysisStep >= 4 && (
                <div className="whitespace-pre-wrap text-slate-300">
                  {typedText}
                  {isAnalyzing && <span className="inline-block h-3 w-1.5 bg-violet-400 ml-0.5 animate-pulse" />}
                </div>
              )}
            </div>
          </div>
        </div>

      </section>

      {/* 🚀 Feature Grid Section */}
      <section id="features" className="py-24 px-6 max-w-7xl mx-auto border-t border-white/5 relative">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold text-violet-400 uppercase tracking-wider">Features Platform</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-100 mt-2">
            Distributed Microservices. Connected Architecture.
          </h2>
          <p className="text-slate-400 mt-4">
            Four specialized microservices built with NestJS and RabbitMQ to monitor, ingest, compile, and resolve app failures.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div className="p-6 rounded-2xl border border-white/5 bg-slate-900/40 hover:border-violet-500/20 hover:bg-slate-900/60 transition-all duration-300 group">
            <div className="h-10 w-10 rounded-xl bg-violet-600/10 text-violet-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Zap className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-slate-200 text-lg mb-2">HTTP / API Polling</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Poller-Service loads active monitors and schedules lightweight HTTP/HTTPS pings dynamically in a cron-like scheduler registry.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-2xl border border-white/5 bg-slate-900/40 hover:border-violet-500/20 hover:bg-slate-900/60 transition-all duration-300 group">
            <div className="h-10 w-10 rounded-xl bg-violet-600/10 text-violet-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <BarChart2 className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-slate-200 text-lg mb-2">Log Embedding Index</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Ingestor-Service indexes client application logs in MongoDB using Vercel AI SDK text-embeddings for similarity checks during crashes.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-2xl border border-white/5 bg-slate-900/40 hover:border-violet-500/20 hover:bg-slate-900/60 transition-all duration-300 group">
            <div className="h-10 w-10 rounded-xl bg-violet-600/10 text-violet-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Cpu className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-slate-200 text-lg mb-2">Gemini Diagnostics</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              When an endpoint fails, Alert-Service queries log vectors and recent GitHub commits via Octokit to compile exact AI diagnostic fixes.
            </p>
          </div>

          {/* Card 4 */}
          <div className="p-6 rounded-2xl border border-white/5 bg-slate-900/40 hover:border-violet-500/20 hover:bg-slate-900/60 transition-all duration-300 group">
            <div className="h-10 w-10 rounded-xl bg-violet-600/10 text-violet-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <BellRing className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-slate-200 text-lg mb-2">Real-Time Dispatches</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Integrate with Discord, Slack, and generic webhook channels to immediately notify your developers of critical telemetry resolutions.
            </p>
          </div>
        </div>
      </section>

      {/* 🚀 Live Simulation Tickers Section */}
      <section id="stats" className="py-16 px-6 max-w-7xl mx-auto border-t border-white/5 bg-slate-900/10 relative rounded-3xl overflow-hidden mb-24">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-600/5 to-fuchsia-600/5 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-8 md:gap-12 text-center">
          <div className="space-y-2">
            <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">Total Automated Checks</span>
            <p className="text-4xl sm:text-5xl font-extrabold text-violet-400 font-mono tracking-tight transition-all duration-300">
              {checksCount.toLocaleString()}
            </p>
            <p className="text-xs text-slate-500">Pings dispatched and analyzed</p>
          </div>

          <div className="space-y-2 border-y sm:border-y-0 sm:border-x border-white/5 py-6 sm:py-0">
            <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">Average Latency</span>
            <p className="text-4xl sm:text-5xl font-extrabold text-fuchsia-400 font-mono tracking-tight transition-all duration-300">
              {avgLatency}ms
            </p>
            <p className="text-xs text-slate-500">Active endpoint response speed</p>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">Global Uptime Guarantee</span>
            <p className="text-4xl sm:text-5xl font-extrabold text-pink-500 font-mono tracking-tight transition-all duration-300">
              {uptimePct}%
            </p>
            <p className="text-xs text-slate-500">Continuous monitoring reliability</p>
          </div>
        </div>
      </section>

      {/* 🚀 CTA Box Section */}
      <section className="max-w-5xl mx-auto px-6 mb-32">
        <div className="p-12 rounded-3xl border border-violet-500/20 bg-gradient-to-r from-violet-950/20 via-slate-900/60 to-fuchsia-950/20 text-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-violet-600/5 blur-3xl pointer-events-none opacity-50 group-hover:opacity-80 transition-opacity" />
          
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4 max-w-2xl mx-auto leading-tight">
            Ready to supercharge your team's application visibility?
          </h2>
          
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto mb-8 leading-relaxed">
            Create an account, map your microservices url, link your GitHub repositories, and let Gemini keep your endpoints perfectly healthy.
          </p>

          <Link href="/register">
            <button className="h-12 px-10 rounded-2xl bg-white hover:bg-slate-100 text-sm font-extrabold text-slate-950 shadow-xl shadow-white/5 transition-all inline-flex items-center gap-2 active:scale-95">
              Get Started for Free
              <ArrowRight className="h-4 w-4" />
            </button>
          </Link>
        </div>
      </section>

      {/* 🚀 Footer */}
      <footer className="border-t border-white/5 py-12 px-6 max-w-7xl mx-auto text-slate-500 text-xs flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <span className="font-bold text-slate-400 text-sm tracking-tight flex items-center gap-1.5 mb-2">
            <div className="h-6 w-6 rounded-lg bg-violet-600 flex items-center justify-center">
              <Activity className="h-3.5 w-3.5 text-white" />
            </div>
            PulseBoard
          </span>
          <p>&copy; {new Date().getFullYear()} PulseBoard Platform. Observability reimagined.</p>
        </div>

        <div className="flex items-center gap-6">
          <a href="https://github.com/Bhargav-Ponkiya/PulseBoard" target="_blank" rel="noopener noreferrer" className="hover:text-slate-300 transition-colors flex items-center gap-1">
            <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            GitHub
          </a>
          <a href="#" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-slate-300 transition-colors">Terms of Service</a>
        </div>
      </footer>

    </div>
  );
}
