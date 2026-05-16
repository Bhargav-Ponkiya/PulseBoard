export const statusColors: Record<string, string> = {
  UP: 'bg-green-500',
  DOWN: 'bg-red-500',
  PENDING: 'bg-yellow-500',
  UNKNOWN: 'bg-gray-500',
};

export const statusDotColors: Record<string, string> = {
  UP: 'bg-green-500',
  DOWN: 'bg-red-500',
  PENDING: 'bg-yellow-500',
  UNKNOWN: 'bg-gray-500',
};

export function latencyColor(ms: number): string {
  if (ms < 200) return 'text-green-500';
  if (ms < 1000) return 'text-yellow-500';
  return 'text-red-500';
}
