'use client';

import { cn } from '@/lib/utils';

interface PulseIndicatorProps {
  status: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const colors: Record<string, string> = {
  UP: 'bg-green-500',
  DOWN: 'bg-red-500',
  PENDING: 'bg-yellow-500',
  UNKNOWN: 'bg-gray-500',
  connected: 'bg-green-500',
  connecting: 'bg-yellow-500',
  disconnected: 'bg-red-500',
};

const sizes: Record<string, string> = {
  sm: 'h-2 w-2',
  md: 'h-3 w-3',
  lg: 'h-4 w-4',
};

export function PulseIndicator({ status, className, size = 'md' }: PulseIndicatorProps) {
  const colorClass = colors[status] || colors.UNKNOWN;
  const sizeClass = sizes[size];

  const statusLabels: Record<string, string> = {
    UP: 'Operational',
    DOWN: 'Down',
    PENDING: 'Pending',
    UNKNOWN: 'Unknown',
    connected: 'Connected',
    connecting: 'Connecting',
    disconnected: 'Disconnected',
  };

  return (
    <div className={cn('relative flex items-center justify-center', sizeClass, className)} role="status" aria-label={`Status: ${statusLabels[status] || status}`}>
      {status === 'connected' || status === 'UP' ? (
        <span className={cn('absolute inline-flex h-full w-full animate-pulse-ring rounded-full opacity-75', colors['UP'])} />
      ) : null}
      {(status === 'disconnected' || status === 'DOWN') ? (
        <span className={cn('absolute inline-flex h-full w-full animate-pulse-ring rounded-full opacity-75', colors['DOWN'])} />
      ) : null}
      {status === 'connecting' ? (
        <span className={cn('absolute inline-flex h-full w-full animate-ping rounded-full opacity-50', colors['PENDING'])} />
      ) : null}
      <span className={cn('relative inline-flex rounded-full', sizeClass, colorClass, (status === 'UP' || status === 'DOWN' || status === 'connected' || status === 'disconnected' || status === 'connecting') && 'animate-pulse-dot')} />
      <span className="sr-only">{statusLabels[status] || status}</span>
    </div>
  );
}
