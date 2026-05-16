export interface MonitorConfig {
  id: string;
  name: string;
  url: string;
  type: 'http' | 'tcp';
  intervalSeconds: number;
  expectedStatus: number;
  timeoutMs: number;
  projectId: string;
  isActive: boolean;
  currentStatus?: string;
}
