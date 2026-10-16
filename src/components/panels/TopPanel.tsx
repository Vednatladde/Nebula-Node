// ============================================================================
// NEBULA NODE — TOP PANEL: Global Alert Ticker (Section 4.2)
// ============================================================================

import { useEffect } from 'react';
import { useNebulaStore } from '../../store/nebulaStore';

export function TopPanel() {
  const { alerts, utcTime, updateUtcTime, accountState, trades, signals } = useNebulaStore();

  // Update UTC clock every second
  useEffect(() => {
    const timer = setInterval(updateUtcTime, 1000);
    return () => clearInterval(timer);
  }, [updateUtcTime]);

  const formatTime = (isoStr: string) => {
    return isoStr.slice(11, 19) + ' UTC';
  };

  const activeSignals = signals.filter(s => s.status === 'ACTIVE').length;
  const openTrades = trades.filter(t => t.status === 'OPEN').length;
  const drawdownPct = (accountState.current_drawdown * 100).toFixed(1);

  // Duplicate alerts for seamless scrolling
  const tickerAlerts = [...alerts, ...alerts];

  return (
    <div className="top-panel">
      <div className="ticker-wrap">
        <div className="ticker-track">
          {tickerAlerts.map((alert, i) => (
            <div key={`${alert.id}-${i}`} className="ticker-item">
              <span className={`ticker-item__level ticker-item__level--${alert.level}`}>
                [ L{alert.level} ]
              </span>
              <span className="ticker-item__time">{formatTime(alert.timestamp)}</span>
              <span className="ticker-item__dot">●</span>
              {alert.asset && (
                <span className="ticker-item__assets">${alert.asset}</span>
              )}
              <span className="ticker-item__dot">●</span>
              <span className={`ticker-item__text ${alert.level >= 3 ? 'ticker-item__text--urgent' : ''}`}>
                {alert.message}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="top-panel__status">
        <div className="status-item">
          <span className="status-dot" />
          <span>Signals:</span>
          <span className="status-value">{activeSignals}</span>
        </div>
        <div className="status-item">
          <span className="status-dot" />
          <span>Trades:</span>
          <span className="status-value">{openTrades}</span>
        </div>
        <div className="status-item">
          <span className={`status-dot ${Number(drawdownPct) > 10 ? 'status-dot--warning' : ''}`} />
          <span>DD:</span>
          <span className="status-value">-{drawdownPct}%</span>
        </div>
        <div className="status-item">
          <span style={{ color: 'var(--text-muted)' }}>UTC</span>
          <span className="status-value">{utcTime}</span>
        </div>
      </div>
    </div>
  );
}
