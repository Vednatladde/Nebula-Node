// ============================================================================
// NEBULA NODE — RIGHT PANEL: Trade Candidates + Risk Metrics (Section 4.5)
// ============================================================================

import { useState, useMemo } from 'react';
import { useNebulaStore } from '../../store/nebulaStore';
import { RISK_CONFIG } from '../../core/config';

export function RightPanel() {
  const {
    tradeCandidates, selectedSignalId, trades, accountState, drawdownState,
    rightPanelTab, setRightPanelTab,
  } = useNebulaStore();

  // Filter candidates for selected signal (or show all)
  const displayedCandidates = useMemo(() => {
    if (selectedSignalId) {
      return tradeCandidates.filter(c => c.signal_id === selectedSignalId);
    }
    return tradeCandidates.slice(0, 5);
  }, [tradeCandidates, selectedSignalId]);

  return (
    <div className="panel right-panel">
      <div className="panel__header">
        <span className="panel__header-title">
          {rightPanelTab === 'TRADES' ? 'TRADE CANDIDATES' : 'RISK METRICS'}
        </span>
      </div>

      <div className="right-tabs">
        <button
          className={`right-tab ${rightPanelTab === 'TRADES' ? 'right-tab--active' : ''}`}
          onClick={() => setRightPanelTab('TRADES')}
        >TRADES</button>
        <button
          className={`right-tab ${rightPanelTab === 'RISK' ? 'right-tab--active' : ''}`}
          onClick={() => setRightPanelTab('RISK')}
        >RISK</button>
      </div>

      <div className="panel__body">
        {rightPanelTab === 'TRADES' ? (
          <TradesTab candidates={displayedCandidates} />
        ) : (
          <RiskTab
            accountState={accountState}
            drawdownState={drawdownState}
            trades={trades}
          />
        )}
      </div>
    </div>
  );
}

// ─── Trades Tab ──────────────────────────────────────────────────────────────

function TradesTab({ candidates }: { candidates: typeof useNebulaStore extends () => infer R ? R extends { tradeCandidates: infer T } ? T : never : never }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (candidates.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
        SELECT A SIGNAL TO VIEW TRADE CANDIDATES
      </div>
    );
  }

  return (
    <div>
      {candidates.map(candidate => {
        const isExpanded = expandedId === candidate.id;
        const confClass = candidate.confidence > 0.80 ? 'high' : candidate.confidence >= 0.65 ? 'mid' : 'low';
        const guardClass = candidate.risk_guard_status.toLowerCase();

        return (
          <div
            key={candidate.id}
            className={`trade-card trade-card--${confClass}`}
          >
            <div className="trade-card__header">
              <div className={`trade-card__direction trade-card__direction--${candidate.direction.toLowerCase()}`}>
                {candidate.direction === 'LONG' ? '↑' : '↓'} {candidate.direction} {candidate.asset}
              </div>
              <span className="trade-card__score">
                {(candidate.confidence * 100).toFixed(0)}%
              </span>
            </div>

            <div className="trade-card__row">
              <span>Entry:</span>
              <span className="trade-card__value">
                {formatPrice(candidate.entry_zone_low)} – {formatPrice(candidate.entry_zone_high)}
              </span>
            </div>

            <div className="trade-card__row">
              <span>Stop:</span>
              <span className="trade-card__value" style={{ color: 'var(--accent-red)' }}>
                {formatPrice(candidate.stop_loss)}
              </span>
            </div>

            <div className="trade-card__row">
              <span>Targets:</span>
              <span className="trade-card__value" style={{ color: 'var(--accent-green)' }}>
                {formatPrice(candidate.target_1)} / {formatPrice(candidate.target_2)}
              </span>
            </div>

            <div className="trade-card__row">
              <span>R/R:</span>
              <span className="trade-card__value">{candidate.risk_reward_ratio}x</span>
            </div>

            <div className="trade-card__row">
              <span>Size:</span>
              <span className="trade-card__value">${candidate.recommended_position_size_usd}</span>
            </div>

            <div className="trade-card__row">
              <span>Horizon:</span>
              <span className="trade-card__value">{candidate.time_horizon}</span>
            </div>

            <div className={`trade-card__guard trade-card__guard--${guardClass}`}>
              {candidate.risk_guard_status === 'APPROVED' && '✓'}
              {candidate.risk_guard_status === 'WARNING' && '⚠'}
              {candidate.risk_guard_status === 'BLOCKED' && '✗'}
              <span>{candidate.risk_guard_message}</span>
            </div>

            <button
              className="trade-card__thesis-btn"
              onClick={() => setExpandedId(isExpanded ? null : candidate.id)}
            >
              {isExpanded ? 'HIDE THESIS' : 'REVIEW FULL THESIS'}
            </button>

            {isExpanded && (
              <>
                <div className="trade-card__thesis">{candidate.thesis}</div>
                <div style={{ marginTop: '6px', fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                  CHAIN: {candidate.chain_path.join(' → ')}
                </div>
                <ul className="trade-card__risks">
                  {candidate.risk_factors.map((rf, i) => (
                    <li key={i} className="trade-card__risk-item">{rf}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Risk Tab ────────────────────────────────────────────────────────────────

function RiskTab({
  accountState,
  drawdownState,
  trades,
}: {
  accountState: { account_size_usd: number; daily_pnl_usd: number; daily_risk_used_pct: number; open_position_count: number; current_drawdown: number; cash_available_usd: number; peak_value_usd: number };
  drawdownState: string;
  trades: { asset: string; direction: string; entry_price: number; status: string; position_size_usd: number; stop_loss: number }[];
}) {
  const dailyPnlPct = (accountState.daily_pnl_usd / accountState.account_size_usd * 100).toFixed(2);
  const dailyRiskPct = (accountState.daily_risk_used_pct * 100).toFixed(1);
  const drawdownPct = (accountState.current_drawdown * 100).toFixed(1);
  const openTrades = trades.filter(t => t.status === 'OPEN');

  return (
    <div className="risk-metrics">
      <div className="risk-snapshot">
        <div className="risk-snapshot__row">
          <span className="risk-snapshot__label">Account Size</span>
          <span className="risk-snapshot__value">${accountState.account_size_usd.toLocaleString()}</span>
        </div>
        <div className="risk-snapshot__row">
          <span className="risk-snapshot__label">Cash Available</span>
          <span className="risk-snapshot__value">${accountState.cash_available_usd.toLocaleString()}</span>
        </div>
        <div className="risk-snapshot__row">
          <span className="risk-snapshot__label">Daily P&L</span>
          <span className={`risk-snapshot__value ${accountState.daily_pnl_usd >= 0 ? 'risk-snapshot__value--positive' : 'risk-snapshot__value--negative'}`}>
            {accountState.daily_pnl_usd >= 0 ? '+' : ''}${accountState.daily_pnl_usd.toFixed(2)} ({dailyPnlPct}%)
          </span>
        </div>
        <div className="risk-snapshot__row">
          <span className="risk-snapshot__label">Open Positions</span>
          <span className="risk-snapshot__value">
            {accountState.open_position_count} of {RISK_CONFIG.MAX_OPEN_POSITIONS} max
          </span>
        </div>
        <div className="risk-snapshot__row">
          <span className="risk-snapshot__label">Drawdown</span>
          <span className={`risk-snapshot__value risk-snapshot__value--${drawdownState.toLowerCase()}`}>
            -{drawdownPct}% ({drawdownState})
          </span>
        </div>
      </div>

      {/* Risk Meters */}
      <RiskMeter
        label="Daily Risk"
        value={accountState.daily_risk_used_pct}
        max={RISK_CONFIG.MAX_DAILY_RISK}
        displayValue={`${dailyRiskPct}%`}
        displayMax={`${(RISK_CONFIG.MAX_DAILY_RISK * 100).toFixed(0)}%`}
        colorClass={accountState.daily_risk_used_pct > 0.08 ? 'red' : accountState.daily_risk_used_pct > 0.05 ? 'orange' : 'green'}
      />

      <RiskMeter
        label="Drawdown"
        value={accountState.current_drawdown}
        max={RISK_CONFIG.DRAWDOWN_THRESHOLDS.HALT}
        displayValue={`${drawdownPct}%`}
        displayMax={`${(RISK_CONFIG.DRAWDOWN_THRESHOLDS.HALT * 100).toFixed(0)}%`}
        colorClass={Number(drawdownPct) > 15 ? 'red' : Number(drawdownPct) > 10 ? 'amber' : 'green'}
      />

      <RiskMeter
        label="Correlated Trades"
        value={1}
        max={RISK_CONFIG.MAX_CORRELATED_TRADES}
        displayValue="1"
        displayMax={`${RISK_CONFIG.MAX_CORRELATED_TRADES} max`}
        colorClass="amber"
      />

      {/* Open Positions Table */}
      {openTrades.length > 0 && (
        <>
          <div style={{ marginTop: '16px', marginBottom: '6px', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
            OPEN POSITIONS
          </div>
          <table className="positions-table">
            <thead>
              <tr>
                <th>Asset</th>
                <th>Dir</th>
                <th>Entry</th>
                <th>Size</th>
                <th>Stop</th>
              </tr>
            </thead>
            <tbody>
              {openTrades.map((trade, i) => (
                <tr key={i}>
                  <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{trade.asset}</td>
                  <td style={{ color: trade.direction === 'LONG' ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                    {trade.direction === 'LONG' ? '↑' : '↓'}
                  </td>
                  <td>{formatPrice(trade.entry_price)}</td>
                  <td>${trade.position_size_usd}</td>
                  <td style={{ color: 'var(--accent-red)' }}>{formatPrice(trade.stop_loss)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

// ─── Risk Meter Component ────────────────────────────────────────────────────

function RiskMeter({
  label, value, max, displayValue, displayMax, colorClass,
}: {
  label: string; value: number; max: number; displayValue: string; displayMax: string;
  colorClass: 'green' | 'amber' | 'orange' | 'red';
}) {
  const pct = Math.min(100, (value / max) * 100);

  return (
    <div className="risk-meter">
      <div className="risk-meter__label">
        <span>{label}</span>
        <span>{displayValue} / {displayMax}</span>
      </div>
      <div className="risk-meter__bar">
        <div
          className={`risk-meter__fill risk-meter__fill--${colorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatPrice(price: number): string {
  if (price >= 10000) return price.toLocaleString(undefined, { maximumFractionDigits: 0 });
  if (price >= 100) return price.toFixed(2);
  return price.toFixed(2);
}
