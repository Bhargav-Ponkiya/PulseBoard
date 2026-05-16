'use client';

import React from 'react';
import {
  Book,
  Terminal,
  Zap,
  Shield,
  Activity,
  Code,
  Bell,
  MessageCircle,
  Globe,
  ArrowRight,
  Cpu,
  CheckCircle2,
  Lock,
  BarChart3,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function HandbookPage() {
  return (
    <div className="max-w-5xl mx-auto pb-20">
      <header className="mb-12 space-y-4">
        <div className="flex items-center gap-3 text-primary">
          <Book className="h-8 w-8" />
          <Badge variant="secondary" className="px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary border-none">
            Product Guide
          </Badge>
        </div>
        <h1 className="text-5xl font-black tracking-tight leading-tight">
          Platform <span className="text-primary">Manual</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed font-medium">
          Welcome to PulseBoard. This guide outlines the core features of our observability engine and how you can leverage them to keep your services healthy.
        </p>
      </header>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-16"
      >
        {/* Core Features */}
        <section className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Zap className="h-5 w-5" />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tight">Core Capabilities</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard 
              icon={Activity} 
              title="Real-time Uptime" 
              desc="Configurable HTTP/HTTPS pings with millisecond precision. We monitor your endpoints from our global infrastructure."
            />
            <FeatureCard 
              icon={BarChart3} 
              title="Latency Analytics" 
              desc="Visual representation of response times over 24 hours. Identify trends and peak-load performance issues."
            />
            <FeatureCard 
              icon={Cpu} 
              title="AI Incident Triage" 
              desc="When a monitor fails, Gemini AI correlates application logs and GitHub commits to find the root cause."
            />
            <FeatureCard 
              icon={Bell} 
              title="Smart Alerting" 
              desc="Integration with Slack and Discord. Intelligent debouncing ensures you get notified only once per incident."
            />
            <FeatureCard 
              icon={Terminal} 
              title="Log Aggregation" 
              desc="Centralize logs from all your microservices. High-performance ingestion with AI-ready vector embeddings."
            />
            <FeatureCard 
              icon={ShieldCheck} 
              title="Health Snapshots" 
              desc="Get instant summaries of your entire project infrastructure health on a single dashboard."
            />
          </div>
        </section>

        {/* Integration Guide */}
        <section className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Code className="h-5 w-5" />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tight">How to Integrate</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-xl font-bold">1. Monitor Setup</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Simply add your service URL in the Dashboard. PulseBoard will start pinging it at your specified interval. 
                  We support custom expected status codes and timeout thresholds.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold">2. Log Ingestion</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  To enable AI Root Cause Analysis, send your application logs to our ingestion endpoint. 
                  Use your Project API Key found in Settings.
                </p>
                <div className="bg-zinc-950 rounded-2xl p-5 font-mono text-[11px] text-zinc-300 border border-border/40">
                  <p className="text-zinc-500 mb-2"># Example: Send a structured log</p>
                  <code>
                    curl -X POST https://api.pulseboard.io/ingest/logs \<br />
                    &nbsp;&nbsp;-H "X-API-Key: YOUR_API_KEY" \<br />
                    &nbsp;&nbsp;-d {'\'{"level":"error", "message":"Database connection failed", "metadata": {"service":"auth-svc"}}\''}<br />
                  </code>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold">3. GitHub Correlation</h3>
                <p className="text-xl font-bold text-primary">Optional but Recommended</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Connect your GitHub repository in Settings. This allows PulseBoard to look at recent commits 
                  when an incident occurs, providing even more context to the AI analyzer.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <Card className="border-primary/20 bg-primary/5 overflow-hidden rounded-[2rem]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    Security First
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    PulseBoard uses industry-standard encryption for all stored secrets. 
                    Your GitHub access tokens are encrypted using AES-256-GCM before being persisted.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3 text-xs font-medium">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      Encrypted API Key Storage
                    </li>
                    <li className="flex items-start gap-3 text-xs font-medium">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      Secure Webhook Deliveries
                    </li>
                    <li className="flex items-start gap-3 text-xs font-medium">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      Isolated Project Data
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-border/40 bg-card/40 backdrop-blur-sm rounded-[2rem] relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                  <Globe className="h-16 w-16 text-primary" />
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    Data Sovereignty
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Your monitoring data is strictly isolated. All metrics and logs are processed within your 
                    private project scope and are never used for cross-tenant model training.
                  </p>
                  </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Workflow Summary */}
        <section className="p-10 rounded-[3rem] bg-gradient-to-br from-primary/10 via-background to-background border border-primary/20 text-center space-y-6">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-3xl bg-primary text-white flex items-center justify-center shadow-2xl shadow-primary/40">
              <Globe className="h-8 w-8" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black tracking-tight leading-tight">Ready to Secure Your Services?</h2>
            <p className="text-muted-foreground max-w-lg mx-auto font-medium">
              Start by creating your first monitor and connecting your alert channels. 
              We&apos;ll handle the rest.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
              <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
              SLA 99.9%
            </div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              AI Correlated
            </div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
              <div className="h-1.5 w-1.5 rounded-full bg-orange-500" />
              Instant Alerts
            </div>
          </div>
        </section>
      </motion.div>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <Card className="border-border/40 bg-background/50 hover:border-primary/40 transition-all hover:translate-y-[-4px] duration-500 group rounded-3xl overflow-hidden">
      <CardContent className="p-8 space-y-4">
        <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-500">
          <Icon className="h-7 w-7" />
        </div>
        <div className="space-y-2">
          <h3 className="font-black uppercase tracking-tight text-sm">{title}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed font-medium">{desc}</p>
        </div>
      </CardContent>
    </Card>
  );
}
