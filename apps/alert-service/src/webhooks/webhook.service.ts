import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { IncidentReport } from '../ai/ai.service';

interface AlertChannel {
  type: 'discord' | 'slack' | 'webhook';
  webhookUrl: string;
}

interface MonitorInfo {
  name: string;
  url: string;
}

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  /** Truncates text to a maximum length, appending ellipsis if needed. */
  private truncate(text: string, max: number): string {
    return text.length > max ? text.slice(0, max - 3) + '...' : text;
  }

  /** Sends an incident alert to the configured Discord, Slack, or generic webhook channel. */
  async dispatch(
    channel: AlertChannel,
    monitor: MonitorInfo,
    report: IncidentReport,
  ): Promise<void> {
    const severityColors: Record<string, number> = {
      critical: 0xff0000,
      high: 0xff8c00,
      medium: 0xffd700,
      low: 0x00ff00,
    };

    const color = severityColors[report.severity] ?? 0xffd700;

    const rootCause = this.truncate(report.probable_cause, 1000);
    const immediateFix = this.truncate(report.immediate_fix, 1000);

    try {
      switch (channel.type) {
        case 'discord':
          await axios.post(
            channel.webhookUrl,
            {
              embeds: [
                {
                  title: `🔴 Incident: ${monitor.name}`,
                  color,
                  fields: [
                    { name: 'Root Cause', value: rootCause },
                    { name: 'Immediate Fix', value: immediateFix },
                    { name: 'Severity', value: report.severity },
                  ],
                  footer: {
                    text: `PulseBoard | ${new Date().toISOString()}`,
                  },
                },
              ],
            },
            { timeout: 10000 },
          );
          break;

        case 'slack':
          {
            const text = [
              `*Monitor:* ${monitor.name}`,
              `*URL:* ${monitor.url}`,
              `*Severity:* ${report.severity}`,
              `*Root Cause:* ${rootCause}`,
              `*Immediate Fix:* ${immediateFix}`,
            ].join('\n');
            await axios.post(
              channel.webhookUrl,
              {
                text: `🔴 *Incident Alert*`,
                blocks: [
                  {
                    type: 'section',
                    text: {
                      type: 'mrkdwn',
                      text: this.truncate(text, 3900),
                    },
                  },
                ],
              },
              { timeout: 10000 },
            );
          }
          break;

        case 'webhook':
          await axios.post(
            channel.webhookUrl,
            {
              monitor,
              incident: {
                severity: report.severity,
                rootCause,
                evidence: report.evidence,
                immediateFix,
                prevention: this.truncate(report.prevention, 1000),
              },
              report,
            },
            { timeout: 10000, headers: { 'Content-Type': 'application/json' } },
          );
          break;
      }
    } catch (err) {
      this.logger.error(`Failed to dispatch to ${channel.type} webhook`, err);
    }
  }
}
