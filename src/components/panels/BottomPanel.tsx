// ============================================================================
// NEBULA NODE — BOTTOM PANEL: Watchlist + Heatmap (Section 4.6)
// ============================================================================

import { useRef, useEffect, useMemo } from 'react';
import { useNebulaStore } from '../../store/nebulaStore';
import type { MarketData } from '../../core/types';

export function BottomPanel() {
  const { marketData, bottomPanelTab, setBottomPanelTab, signals } = useNebulaStore();

  const activeAssets = useMemo(() => {
    return new Set(signals.filter(s => s.status === 'ACTIVE').map(s => s.asset));
  }, [signals]);

  return (
    <div className="panel bottom-panel">
      <div className="panel__header">
        <span className="panel__header-title">
          {bottomPanelTab === 'WATCHLIST' ? 'ASSET WATCHLIST' : 'MARKET HEATMAP'}
        </span>
        <div className="bottom-tabs" style={{ border: 'none', background: 'transparent' }}>
          <button
            className={`bottom-tab ${bottomPanelTab === 'WATCHLIST' ? 'bottom-tab--active' : ''}`}
            onClick={() => setBottomPanelTab('WATCHLIST')}
          >WATCHLIST</button>
          <button
            className={`bottom-tab ${bottomPanelTab === 'HEATMAP' ? 'bottom-tab--active' : ''}`}
            onClick={() => setBottomPanelTab('HEATMAP')}
          >HEATMAP</button>
        </div>
      </div>

      {bottomPanelTab === 'WATCHLIST' ? (
        <Watchlist marketData={marketData} activeAssets={activeAssets} />
      ) : (
        <Heatmap marketData={marketData} activeAssets={activeAssets} />
      )}
    </div>
  );
}

// ─── Watchlist ───────────────────────────────────────────────────────────────

function Watchlist({
  marketData,
  activeAssets,
}: {
  marketData: MarketData[];
  activeAssets: Set<string>;
}) {
  return (
    <div className="watchlist">
      {marketData.map(data => (
        <div key={data.ticker} className="watchlist-card">
          <div className="watchlist-card__header">
            <span className="watchlist-card__ticker">{data.ticker}</span>
            {activeAssets.has(data.ticker) && (
              <span className="watchlist-card__signal-dot" />
            )}
          </div>
          <div className="watchlist-card__price">
            {formatWatchlistPrice(data.price)}
          </div>
          <div className={`watchlist-card__change ${data.change_pct_24h >= 0 ? 'watchlist-card__change--positive' : 'watchlist-card__change--negative'}`}>
            {data.change_pct_24h >= 0 ? '+' : ''}{data.change_pct_24h.toFixed(1)}%
          </div>
          <div className="watchlist-card__sparkline">
            <Sparkline data={data.sparkline} positive={data.change_pct_24h >= 0} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Sparkline ───────────────────────────────────────────────────────────────

function Sparkline({ data, positive }: { data: number[]; positive: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length < 2) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = 120 * dpr;
    canvas.height = 30 * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = '120px';
    canvas.style.height = '30px';

    const w = 120, h = 30;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    ctx.clearRect(0, 0, w, h);
    ctx.beginPath();
    ctx.strokeStyle = positive ? '#00cc66' : '#cc1a1a';
    ctx.lineWidth = 1.2;

    const step = w / (data.length - 1);

    for (let i = 0; i < data.length; i++) {
      const x = i * step;
      const y = h - ((data[i] - min) / range) * (h - 4) - 2;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    ctx.stroke();

    // Fill gradient
    ctx.lineTo((data.length - 1) * step, h);
    ctx.lineTo(0, h);
    ctx.closePath();

    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, positive ? 'rgba(0, 204, 102, 0.15)' : 'rgba(204, 26, 26, 0.15)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fill();
  }, [data, positive]);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />;
}

// ─── Heatmap ─────────────────────────────────────────────────────────────────

function Heatmap({
  marketData,
  activeAssets,
}: {
  marketData: MarketData[];
  activeAssets: Set<string>;
}) {
  // Group by sector
  const sectors = useMemo(() => {
    const map = new Map<string, MarketData[]>();
    for (const d of marketData) {
      const sector = d.sector || 'Other';
      if (!map.has(sector)) map.set(sector, []);
      map.get(sector)!.push(d);
    }
    return map;
  }, [marketData]);

  return (
    <div className="heatmap">
      <div className="heatmap-grid">
        {Array.from(sectors.entries()).map(([sector, assets]) =>
          assets.map(asset => {
            const change = asset.change_pct_24h;
            const bgColor = getHeatmapColor(change);
            const size = getHeatmapSize(asset);

            return (
              <div
                key={asset.ticker}
                className="heatmap-tile"
                style={{
                  backgroundColor: bgColor,
                  width: `${size}px`,
                  height: `${Math.max(50, size * 0.6)}px`,
                  flexBasis: `${size}px`,
                  flexGrow: 1,
                }}
                title={`${asset.ticker} | ${sector} | ${change >= 0 ? '+' : ''}${change.toFixed(1)}%`}
              >
                <span className="heatmap-tile__ticker">{asset.ticker}</span>
                <span className="heatmap-tile__change">
                  {change >= 0 ? '+' : ''}{change.toFixed(1)}%
                </span>
                {activeAssets.has(asset.ticker) && (
                  <span className="heatmap-tile__signal-pulse" />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getHeatmapColor(change: number): string {
  if (change >= 3) return '#0d7b3f';
  if (change >= 1) return '#145a2d';
  if (change > -1) return '#1a1a25';
  if (change > -3) return '#5a1414';
  return '#7b0d0d';
}

function getHeatmapSize(asset: MarketData): number {
  // Bigger tiles for higher volume/larger assets
  if (asset.asset_type === 'CRYPTO' && asset.ticker === 'BTC') return 140;
  if (asset.asset_type === 'CRYPTO') return 90;
  if (asset.price > 400) return 110;
  if (asset.price > 100) return 90;
  return 75;
}

function formatWatchlistPrice(price: number): string {
  if (price >= 10000) return price.toLocaleString(undefined, { maximumFractionDigits: 0 });
  if (price >= 100) return price.toFixed(2);
  return price.toFixed(2);
}
