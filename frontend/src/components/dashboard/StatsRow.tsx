'use client';

import { useEffect, useState, useRef } from 'react';
import { Activity, Gauge, AlertTriangle, CheckCircle2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatsRowProps {
  uptime: number;
  avgLatency: number;
  activeIncidents: number;
  totalChecks: number;
}

function AnimatedNumber({ value, suffix = '', duration = 1000 }: { value: number, suffix?: string, duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0);
  const startTime = useRef<number | null>(null);
  const rafId = useRef<number>(0);

  useEffect(() => {
    startTime.current = null;
    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp;
      const progress = Math.min((timestamp - startTime.current) / duration, 1);
      setDisplayValue(progress * value);
      if (progress < 1) {
        rafId.current = requestAnimationFrame(animate);
      }
    };
    rafId.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId.current);
  }, [value, duration]);

  const isInt = value % 1 === 0;
  const formatted = isInt ? Math.floor(displayValue).toLocaleString() : displayValue.toFixed(1);
  return <span aria-live="polite" aria-atomic="true">{formatted}{suffix}</span>;
}

export function StatsRow({ uptime, avgLatency, activeIncidents, totalChecks }: StatsRowProps) {
  const stats = [
    {
      icon: CheckCircle2,
      label: 'Uptime (24h)',
      value: uptime,
      suffix: '%',
      color: uptime >= 99.9 ? 'text-green-500' : uptime >= 95 ? 'text-yellow-500' : 'text-destructive',
      bgColor: 'bg-green-500/10',
      trend: uptime >= 99.9 ? 'up' : 'down',
      trendLabel: uptime >= 99.9 ? 'Excellent' : 'Needs attention',
    },
    {
      icon: Gauge,
      label: 'Avg Latency',
      value: avgLatency,
      suffix: 'ms',
      color: avgLatency < 200 ? 'text-green-500' : avgLatency < 1000 ? 'text-yellow-500' : 'text-red-500',
      bgColor: 'bg-blue-500/10',
      trend: avgLatency < 200 ? 'good' : avgLatency < 1000 ? 'fair' : 'slow',
      trendLabel: avgLatency < 200 ? 'Fast' : avgLatency < 1000 ? 'Moderate' : 'Slow',
    },
    {
      icon: AlertTriangle,
      label: 'Active Incidents',
      value: activeIncidents,
      suffix: '',
      color: activeIncidents > 0 ? 'text-red-500' : 'text-green-500',
      bgColor: 'bg-red-500/10',
      trend: activeIncidents > 0 ? 'issue' : 'clear',
      trendLabel: activeIncidents === 0 ? 'All clear' : 'Active',
    },
    {
      icon: Activity,
      label: 'Total Checks',
      value: totalChecks,
      suffix: '',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      trend: 'neutral',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, i) => (
        <Card key={stat.label} className="group relative overflow-hidden hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30 transition-all duration-300">
          <CardContent className="flex items-center gap-5 p-6">
            <div className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl transition-transform group-hover:scale-110 duration-300", stat.bgColor, stat.color)}>
              <stat.icon className="h-7 w-7" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-2xl font-bold tracking-tight">
                  <AnimatedNumber value={stat.value} suffix={stat.suffix} />
                </p>
                {stat.trend === 'up' && <span title={stat.trendLabel}><ArrowUpRight className="h-4 w-4 text-green-500 opacity-60" /></span>}
                {stat.trend === 'down' && <span title={stat.trendLabel}><ArrowDownRight className="h-4 w-4 text-destructive opacity-60" /></span>}
                {stat.trend === 'good' && <span title={stat.trendLabel}><ArrowDownRight className="h-4 w-4 text-green-500 opacity-60" /></span>}
                {stat.trend === 'fair' && <span className="text-xs text-yellow-500 font-medium opacity-60">{stat.trendLabel}</span>}
                {stat.trend === 'slow' && <span title={stat.trendLabel}><ArrowUpRight className="h-4 w-4 text-red-500 opacity-60" /></span>}
                {stat.trend === 'issue' && <span title={stat.trendLabel}><ArrowUpRight className="h-4 w-4 text-red-500 opacity-60" /></span>}
                {stat.trend === 'clear' && <span title={stat.trendLabel}><CheckCircle2 className="h-4 w-4 text-green-500 opacity-60" /></span>}
              </div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</p>
            </div>
            
            {/* Background Decoration */}
            <div className={cn("absolute -right-2 -bottom-2 h-16 w-16 opacity-[0.03] transition-transform group-hover:scale-150 duration-500", stat.color)}>
              <stat.icon className="h-full w-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
