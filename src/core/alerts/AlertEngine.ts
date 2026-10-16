// ============================================================================
// NEBULA NODE — ALERT ENGINE (Section 9)
// Multi-level, multi-channel notification system.
// ============================================================================

import { v4 as uuid } from 'uuid';
import type { Alert, AlertLevel, AlertChannel } from '../types';

// ─── Section 9.1: Alert Level Configuration ─────────────────────────────────

interface AlertLevelConfig {
  level: AlertLevel;
  name: string;
  color: string;
  channels: AlertChannel[];
  sound: boolean;
  pushPriority: number;
}

const ALERT_LEVELS: Record<AlertLevel, AlertLevelConfig> = {
  1: {
    level: 1, name: 'INFO', color: '#444444',
    channels: ['DESKTOP'], sound: false, pushPriority: -1,
  },
  2: {
    level: 2, name: 'WATCH', color: '#ff9500',
    channels: ['DESKTOP', 'ANDROID'], sound: true, pushPriority: 0,
  },
  3: {
    level: 3, name: 'SIGNAL', color: '#ff6b1a',
    channels: ['DESKTOP', 'ANDROID', 'TELEGRAM'], sound: true, pushPriority: 1,
  },
  4: {
    level: 4, name: 'ACTION', color: '#cc1a1a',
    channels: ['DESKTOP', 'ANDROID', 'TELEGRAM'], sound: true, pushPriority: 2,
  },
};

export class AlertEngine {
  private alertLog: Alert[] = [];
  private listeners: ((alert: Alert) => void)[] = [];
  private telegramToken: string | null = null;
  private telegramChatId: string | null = null;
  private pushoverToken: string | null = null;
  private pushoverUserKey: string | null = null;

  // ─── Section 9.3: Main Entry Point ─────────────────────────────────────────

  emitAlert(
    level: AlertLevel,
    message: string,
    eventId?: string,
    signalId?: string,
    asset?: string
  ): Alert {
    const config = ALERT_LEVELS[level];

    const alert: Alert = {
      id: uuid(),
      level,
      event_id: eventId,
      signal_id: signalId,
      asset,
      message,
      timestamp: new Date().toISOString(),
      delivered: false,
      channels: config.channels,
    };

    this.alertLog.push(alert);

    // Deliver to all configured channels
    for (const channel of config.channels) {
      switch (channel) {
        case 'DESKTOP':
          this.deliverDesktop(alert);
          break;
        case 'ANDROID':
          this.deliverAndroid(alert);
          break;
        case 'TELEGRAM':
          this.deliverTelegram(alert);
          break;
      }
    }

    // Notify listeners (for UI updates)
    for (const listener of this.listeners) {
      listener(alert);
    }

    alert.delivered = true;
    return alert;
  }

  // ─── Desktop Delivery (Browser Notifications) ─────────────────────────────

  private async deliverDesktop(alert: Alert): Promise<void> {
    if (typeof Notification === 'undefined') return;

    try {
      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }
      if (Notification.permission === 'granted') {
        const config = ALERT_LEVELS[alert.level];
        new Notification(`NEBULA [L${alert.level}] ${config.name}`, {
          body: alert.message,
          icon: '/nebula-icon.png',
          tag: alert.id,
        });
      }
    } catch {
      // Browser doesn't support notifications
    }
  }

  // ─── Android Delivery (Pushover API stub) ──────────────────────────────────

  private async deliverAndroid(alert: Alert): Promise<void> {
    if (!this.pushoverToken || !this.pushoverUserKey) return;

    const config = ALERT_LEVELS[alert.level];

    try {
      await fetch('https://api.pushover.net/1/messages.json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: this.pushoverToken,
          user: this.pushoverUserKey,
          message: alert.message,
          title: `NEBULA [L${alert.level}]`,
          priority: config.pushPriority,
          ...(config.pushPriority === 2 ? { retry: 60, expire: 3600 } : {}),
        }),
      });
    } catch {
      // Pushover delivery failed silently
    }
  }

  // ─── Telegram Delivery (Bot API stub) ──────────────────────────────────────

  private async deliverTelegram(alert: Alert): Promise<void> {
    if (!this.telegramToken || !this.telegramChatId) return;

    const emoji = alert.level === 4 ? '🔴' : '⚡';
    const text = alert.level === 4
      ? `${emoji} LEVEL 4 ALERT\n${alert.message}\nTime: ${alert.timestamp}\nREVIEW IMMEDIATELY`
      : `${emoji} NEBULA SIGNAL [L${alert.level}]\n${alert.message}`;

    try {
      await fetch(`https://api.telegram.org/bot${this.telegramToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: this.telegramChatId,
          text,
          parse_mode: 'HTML',
        }),
      });
    } catch {
      // Telegram delivery failed silently
    }
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  onAlert(listener: (alert: Alert) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  getUnreadAlerts(since: Date): Alert[] {
    const sinceTime = since.getTime();
    return this.alertLog.filter(a => new Date(a.timestamp).getTime() > sinceTime);
  }

  getAllAlerts(): Alert[] {
    return [...this.alertLog].reverse(); // newest first
  }

  getRecentAlerts(count: number = 50): Alert[] {
    return this.alertLog.slice(-count).reverse();
  }

  configureTelegram(token: string, chatId: string): void {
    this.telegramToken = token;
    this.telegramChatId = chatId;
  }

  configurePushover(token: string, userKey: string): void {
    this.pushoverToken = token;
    this.pushoverUserKey = userKey;
  }

  static getLevelConfig(level: AlertLevel): AlertLevelConfig {
    return ALERT_LEVELS[level];
  }
}
