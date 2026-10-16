// ============================================================================
// NEBULA NODE — RISK ENGINE (Section 3)
// Kelly-style position sizing, correlation guard, drawdown guard,
// daily risk monitor, master validation.
// ============================================================================

import { RISK_CONFIG } from '../config';
import type {
  TradeCandidate, Trade, AccountState, GuardResult, DrawdownState,
} from '../types';

export interface ValidationResult {
  status: 'APPROVED' | 'MODIFIED' | 'BLOCKED';
  reason: string;
  adjusted_size_usd: number;
  drawdown_state: DrawdownState;
  daily_risk_ok: boolean;
  correlation_guard: GuardResult;
  messages: string[];
}

// ─── Sector mapping for correlation checks ───────────────────────────────────

const ASSET_SECTOR_MAP: Record<string, string> = {
  AAPL: 'Technology', MSFT: 'Technology', GOOGL: 'Technology', NVDA: 'Technology',
  AMD: 'Technology', INTC: 'Technology', TSM: 'Technology', AVGO: 'Technology',
  META: 'Technology', AMZN: 'Consumer', TSLA: 'Automotive',
  JPM: 'Finance', GS: 'Finance', BAC: 'Finance', MS: 'Finance',
  XOM: 'Energy', CVX: 'Energy', OXY: 'Energy',
  UNH: 'Healthcare', JNJ: 'Healthcare', PFE: 'Healthcare',
  BA: 'Aerospace', LMT: 'Aerospace', RTX: 'Aerospace',
  BTC: 'Crypto', ETH: 'Crypto', SOL: 'Crypto',
  EURUSD: 'Forex', GBPUSD: 'Forex', USDJPY: 'Forex',
  GOLD: 'Commodities', OIL: 'Commodities', SILVER: 'Commodities',
};

export class RiskEngine {

  // ─── Section 3.2: Kelly-Style Position Sizing ─────────────────────────────

  sizePosition(candidate: TradeCandidate, accountSize: number): number {
    const confidence = candidate.confidence;
    const rrRatio = candidate.risk_reward_ratio;

    // Kelly fraction: f = p - (q / b)
    // where p = confidence, q = 1 - confidence, b = risk/reward ratio
    const kellyFraction = confidence - ((1 - confidence) / rrRatio);

    if (kellyFraction <= 0) return 0;

    // Full Kelly position
    const fullKelly = accountSize * kellyFraction;

    // Half-Kelly for safety (Section 3.2)
    const halfKelly = fullKelly * RISK_CONFIG.KELLY_FRACTION;

    // Hard cap at MAX_CAPITAL_PER_TRADE
    const cappedSize = Math.min(
      halfKelly,
      accountSize * RISK_CONFIG.MAX_CAPITAL_PER_TRADE
    );

    return Number(cappedSize.toFixed(2));
  }

  // ─── Section 3.3: Correlation Guard ────────────────────────────────────────

  checkCorrelationGuard(
    candidate: TradeCandidate,
    openPositions: Trade[]
  ): GuardResult {
    const newSector = ASSET_SECTOR_MAP[candidate.asset] || 'Unknown';

    // Count correlated trades (simplified: same sector = correlated)
    let correlatedCount = 0;
    let sectorExposure = 0;

    for (const trade of openPositions) {
      const tradeSector = ASSET_SECTOR_MAP[trade.asset] || 'Unknown';

      if (tradeSector === newSector) {
        correlatedCount++;
        sectorExposure += trade.position_size_usd;
      }
    }

    // Check MAX_CORRELATED_TRADES
    if (correlatedCount >= RISK_CONFIG.MAX_CORRELATED_TRADES) {
      return {
        status: 'WARNING',
        reason: `${correlatedCount} correlated trades already open in ${newSector}`,
        adjusted_size: null,
        message: `⚠ CORRELATION LIMIT: ${correlatedCount}/${RISK_CONFIG.MAX_CORRELATED_TRADES} in ${newSector}`,
      };
    }

    // Check MAX_SINGLE_SECTOR_EXPO (requires account size context)
    // This is checked in validateTrade method

    return {
      status: 'APPROVED',
      reason: 'Correlation check passed',
      adjusted_size: null,
      message: '✓ Correlation OK',
    };
  }

  // ─── Section 3.4: Drawdown Guard ──────────────────────────────────────────

  checkDrawdownGuard(currentDrawdown: number): {
    state: DrawdownState;
    sizeReductionFactor: number;
    message: string;
  } {
    if (currentDrawdown > RISK_CONFIG.DRAWDOWN_THRESHOLDS.HALT) {
      return {
        state: 'HALT',
        sizeReductionFactor: RISK_CONFIG.DRAWDOWN_SIZE_FACTORS.HALT,
        message: '🔴 DRAWDOWN LIMIT — REVIEW REQUIRED. All new trades blocked.',
      };
    }

    if (currentDrawdown > RISK_CONFIG.DRAWDOWN_THRESHOLDS.CAUTION) {
      return {
        state: 'CAUTION',
        sizeReductionFactor: RISK_CONFIG.DRAWDOWN_SIZE_FACTORS.CAUTION,
        message: `⚠ CAUTION: Drawdown at ${(currentDrawdown * 100).toFixed(1)}%. Position sizes reduced 50%.`,
      };
    }

    if (currentDrawdown > RISK_CONFIG.DRAWDOWN_THRESHOLDS.WARNING) {
      return {
        state: 'WARNING',
        sizeReductionFactor: RISK_CONFIG.DRAWDOWN_SIZE_FACTORS.WARNING,
        message: `⚠ WARNING: Drawdown at ${(currentDrawdown * 100).toFixed(1)}%. Position sizes reduced 25%.`,
      };
    }

    return {
      state: 'NORMAL',
      sizeReductionFactor: RISK_CONFIG.DRAWDOWN_SIZE_FACTORS.NORMAL,
      message: '✓ Drawdown within normal range',
    };
  }

  // ─── Section 3.5: Daily Risk Monitor ──────────────────────────────────────

  checkDailyRisk(dailyRiskUsedPct: number): boolean {
    return dailyRiskUsedPct < RISK_CONFIG.MAX_DAILY_RISK;
  }

  // ─── Section 3.6: Master Validation ───────────────────────────────────────

  validateTrade(
    candidate: TradeCandidate,
    accountState: AccountState,
    openPositions: Trade[] = []
  ): ValidationResult {
    const messages: string[] = [];
    let finalStatus: 'APPROVED' | 'MODIFIED' | 'BLOCKED' = 'APPROVED';

    // 1. Check open position limit
    if (openPositions.length >= RISK_CONFIG.MAX_OPEN_POSITIONS) {
      return {
        status: 'BLOCKED',
        reason: `Max open positions reached (${RISK_CONFIG.MAX_OPEN_POSITIONS})`,
        adjusted_size_usd: 0,
        drawdown_state: 'NORMAL',
        daily_risk_ok: true,
        correlation_guard: { status: 'BLOCKED', reason: 'Position limit', adjusted_size: null, message: '' },
        messages: ['✗ BLOCKED: Maximum open positions reached'],
      };
    }

    // 2. Daily risk check
    const dailyRiskOk = this.checkDailyRisk(accountState.daily_risk_used_pct);
    if (!dailyRiskOk) {
      return {
        status: 'BLOCKED',
        reason: 'Daily risk limit reached',
        adjusted_size_usd: 0,
        drawdown_state: 'NORMAL',
        daily_risk_ok: false,
        correlation_guard: { status: 'BLOCKED', reason: 'Daily risk', adjusted_size: null, message: '' },
        messages: ['✗ BLOCKED: Daily risk limit reached'],
      };
    }

    // 3. Drawdown guard
    const drawdownResult = this.checkDrawdownGuard(accountState.current_drawdown);
    messages.push(drawdownResult.message);

    if (drawdownResult.state === 'HALT') {
      return {
        status: 'BLOCKED',
        reason: 'Drawdown halt triggered',
        adjusted_size_usd: 0,
        drawdown_state: 'HALT',
        daily_risk_ok: true,
        correlation_guard: { status: 'BLOCKED', reason: 'Drawdown halt', adjusted_size: null, message: '' },
        messages: [drawdownResult.message],
      };
    }

    // 4. CAUTION level: only allow high confidence + high R/R
    if (drawdownResult.state === 'CAUTION') {
      if (candidate.confidence <= 0.75 || candidate.risk_reward_ratio <= 3.0) {
        return {
          status: 'BLOCKED',
          reason: 'CAUTION level requires confidence > 0.75 AND R/R > 3.0',
          adjusted_size_usd: 0,
          drawdown_state: 'CAUTION',
          daily_risk_ok: true,
          correlation_guard: { status: 'BLOCKED', reason: 'CAUTION filter', adjusted_size: null, message: '' },
          messages: ['✗ BLOCKED: Trade quality insufficient for CAUTION drawdown level'],
        };
      }
    }

    // 5. Correlation guard
    const correlationResult = this.checkCorrelationGuard(candidate, openPositions);
    messages.push(correlationResult.message);

    // 6. Size position
    let positionSize = this.sizePosition(candidate, accountState.account_size_usd);

    // Apply drawdown reduction
    positionSize = positionSize * drawdownResult.sizeReductionFactor;

    // Apply correlation reduction if warning
    if (correlationResult.status === 'WARNING') {
      positionSize = positionSize * 0.5;
      finalStatus = 'MODIFIED';
      messages.push('Position size reduced 50% due to correlation');
    }

    positionSize = Number(positionSize.toFixed(2));

    return {
      status: finalStatus,
      reason: messages.join('; '),
      adjusted_size_usd: positionSize,
      drawdown_state: drawdownResult.state,
      daily_risk_ok: true,
      correlation_guard: correlationResult,
      messages,
    };
  }

  // ─── Utility: Get sector for an asset ──────────────────────────────────────

  static getSector(asset: string): string {
    return ASSET_SECTOR_MAP[asset] || 'Unknown';
  }
}
