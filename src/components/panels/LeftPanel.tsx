// ============================================================================
// NEBULA NODE — LEFT PANEL: Signal Feed (Section 4.3)
// ============================================================================

import { useMemo } from 'react';
import { useNebulaStore } from '../../store/nebulaStore';
import type { ScoredSignal, SignalCategory } from '../../core/types';

const FILTERS: (SignalCategory | 'ALL')[] = ['ALL', 'CRYPTO', 'EQUITY', 'MACRO', 'GEO'];

export function LeftPanel() {
  const {
    signals, selectedSignalId, signalFilter, signalSort,
    selectSignal, setSignalFilter, setSignalSort, tradeCandidates,
  } = useNebulaStore();

  const filteredSignals = useMemo(() => {
    let list = [...signals];

    // Filter
    if (signalFilter !== 'ALL') {
      list = list.filter(s => s.category === signalFilter);
    }

    // Sort
    switch (signalSort) {
      case 'score':
        list.sort((a, b) => b.signal_score - a.signal_score);
        break;
      case 'confidence':
        list.sort((a, b) => b.confidence - a.confidence);
        break;
      case 'time':
        list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        break;
      case 'rr': {
        // Sort by best R/R of associated trade candidates
        const getRR = (s: ScoredSignal) => {
          const cands = tradeCandidates.filter(c => c.signal_id === s.id);
          return cands.length > 0 ? Math.max(...cands.map(c => c.risk_reward_ratio)) : 0;
        };
        list.sort((a, b) => getRR(b) - getRR(a));
        break;
      }
    }

    return list;
  }, [signals, signalFilter, signalSort, tradeCandidates]);

  const getTimeRemaining = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return 'EXPIRED';
    const hours = Math.floor(diff / 3600000);
    if (hours >= 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
    const mins = Math.floor((diff % 3600000) / 60000);
    return `${hours}h ${mins}m`;
  };

  const getScoreClass = (score: number): string => {
    if (score > 0.80) return 'high';
    if (score >= 0.65) return 'mid';
    return 'low';
  };

  return (
    <div className="panel left-panel">
      <div className="panel__header">
        <div className="panel__header-title">
          <span>SIGNAL FEED</span>
          <span className="panel__badge">{filteredSignals.length}</span>
        </div>
      </div>

      <div className="signal-tabs">
        {FILTERS.map(f => (
          <button
            key={f}
            className={`signal-tab ${signalFilter === f ? 'signal-tab--active' : ''}`}
            onClick={() => setSignalFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="signal-sort">
        <select
          value={signalSort}
          onChange={e => setSignalSort(e.target.value as 'score' | 'confidence' | 'time' | 'rr')}
        >
          <option value="score">Sort by: Score</option>
          <option value="confidence">Sort by: Confidence</option>
          <option value="time">Sort by: Time</option>
          <option value="rr">Sort by: R/R Ratio</option>
        </select>
      </div>

      <div className="panel__body signal-list">
        {filteredSignals.map((signal, index) => {
          const scoreClass = getScoreClass(signal.signal_score);
          const isSelected = signal.id === selectedSignalId;

          return (
            <div
              key={signal.id}
              className={`signal-card ${isSelected ? 'signal-card--selected' : ''}`}
              onClick={() => selectSignal(signal.id)}
            >
              <div className="signal-card__top">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="signal-card__rank">{index + 1}</span>
                  <span className={`signal-card__asset ${scoreClass === 'high' ? 'text-orange' : scoreClass === 'mid' ? 'text-amber' : ''}`}>
                    <span className={`signal-card__arrow ${signal.direction === 1 ? 'signal-card__arrow--up' : 'signal-card__arrow--down'}`}>
                      {signal.direction === 1 ? '↑' : '↓'}
                    </span>
                    {signal.asset}
                  </span>
                </div>
                <span className="signal-card__type">{signal.category}</span>
              </div>

              <div className="signal-card__score-bar">
                <div
                  className={`signal-card__score-fill signal-card__score-fill--${scoreClass}`}
                  style={{ width: `${signal.signal_score * 100}%` }}
                />
              </div>

              <div className="signal-card__meta">
                <span className={`signal-card__confidence signal-card__confidence--${scoreClass}`}>
                  {(signal.confidence * 100).toFixed(0)}%
                </span>
                <span>{(signal.signal_score * 100).toFixed(0)} score</span>
                <span>⏱ {getTimeRemaining(signal.expires_at)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
