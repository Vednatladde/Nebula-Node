// ============================================================================
// NEBULA NODE — TRADE CONSTRUCTION ENGINE (Section 2)
// All 5 functions from Layer 6: identify assets → calculate move →
// calculate risk → build trade → rank & filter
// ============================================================================

import { v4 as uuid } from 'uuid';
import { TRADE_CONFIG } from '../config';
import type {
  ScoredSignal, ImpactNode, AssetCandidate, MoveEstimate,
  RiskParams, TradeCandidate, VolatilityRegime, MarketData,
} from '../types';

export class TradeConstructionEngine {

  // ─── Function 1: Identify Affected Assets (Section 2.2) ───────────────────

  identifyAffectedAssets(
    signal: ScoredSignal,
    impactNodes: ImpactNode[],
    marketData: Map<string, MarketData>
  ): AssetCandidate[] {
    // Filter for tradeable asset types
    const tradeableTypes = new Set(['ASSET', 'CURRENCY', 'COMMODITY']);

    const candidates = impactNodes
      .filter(node => tradeableTypes.has(node.node_type))
      .filter(node => Math.abs(node.final_impact) > TRADE_CONFIG.MIN_IMPACT_THRESHOLD)
      .filter(node => {
        const data = marketData.get(node.node_name);
        return data ? true : true; // Allow if no market data (simulated)
      })
      .map((node, _index): AssetCandidate => {
        const data = marketData.get(node.node_name);
        return {
          ticker: node.node_name,
          asset_type: data?.asset_type || 'EQUITY',
          expected_impact: node.final_impact,
          direction: node.direction,
          confidence: node.confidence,
          liquidity_score: data ? 0.8 : 0.6,
          rank: 0,
        };
      })
      .sort((a, b) => {
        const scoreA = Math.abs(a.expected_impact) * a.confidence * signal.signal_score;
        const scoreB = Math.abs(b.expected_impact) * b.confidence * signal.signal_score;
        return scoreB - scoreA;
      })
      .slice(0, TRADE_CONFIG.MAX_ASSETS_PER_SIGNAL);

    return candidates.map((c, i) => ({ ...c, rank: i + 1 }));
  }

  // ─── Function 2: Calculate Expected Move (Section 2.3) ────────────────────

  calculateExpectedMove(
    asset: AssetCandidate,
    impactNode: ImpactNode,
    signal: ScoredSignal,
    volatilityRegime: VolatilityRegime = 'NORMAL',
    beta: number = 1.0
  ): MoveEstimate {
    // Step 1: Base move from propagation
    const baseMovePct = impactNode.final_impact * 100;

    // Step 2: Volatility adjustment
    const volMultiplier = TRADE_CONFIG.VOLATILITY_MULTIPLIERS[volatilityRegime];
    const adjustedMovePct = baseMovePct * volMultiplier;

    // Step 3: Beta adjustment
    const betaAdjustedMove = adjustedMovePct * beta;

    // Step 4: Confidence discount
    const finalExpectedMove = betaAdjustedMove * impactNode.confidence;

    // Step 5: Confidence interval
    const moveLow = finalExpectedMove * 0.5;
    const moveHigh = finalExpectedMove * 1.8;

    // Derive time horizon from time window
    const horizonMap: Record<string, number> = {
      minutes: 2, hours: 12, days: 48, weeks: 168,
    };

    return {
      asset: asset.ticker,
      direction: asset.direction,
      expected_move_pct: finalExpectedMove,
      move_range_low: moveLow,
      move_range_high: moveHigh,
      time_horizon_hours: horizonMap[impactNode.time_window] || 48,
      confidence: impactNode.confidence,
    };
  }

  // ─── Function 3: Calculate Trade Risk (Section 2.4) ───────────────────────

  calculateTradeRisk(
    direction: 1 | -1,
    moveEstimate: MoveEstimate,
    currentPrice: number,
    atrPct: number = TRADE_CONFIG.DEFAULT_ATR_PCT
  ): RiskParams | null {
    // Step 1: Entry zone
    let entryLow: number, entryHigh: number;
    if (direction === 1) { // LONG
      entryLow = currentPrice * (1 - TRADE_CONFIG.ENTRY_BELOW_PCT);
      entryHigh = currentPrice * (1 + TRADE_CONFIG.ENTRY_ABOVE_PCT);
    } else { // SHORT
      entryLow = currentPrice * (1 - TRADE_CONFIG.ENTRY_ABOVE_PCT);
      entryHigh = currentPrice * (1 + TRADE_CONFIG.ENTRY_BELOW_PCT);
    }
    const entryMid = (entryLow + entryHigh) / 2;

    // Step 2: Stop loss
    const stopDistancePct = Math.max(
      atrPct * 1.5,
      Math.abs(moveEstimate.move_range_high / 100) * 0.5,
      0.015
    );

    const stopLoss = direction === 1
      ? entryHigh * (1 - stopDistancePct)
      : entryLow * (1 + stopDistancePct);

    // Step 3: Profit targets
    const expectedMoveMag = Math.abs(moveEstimate.expected_move_pct / 100);
    const highMoveMag = Math.abs(moveEstimate.move_range_high / 100);

    const target1 = entryMid + (direction * expectedMoveMag * entryMid * 0.60);
    const target2 = entryMid + (direction * expectedMoveMag * entryMid * 1.00);
    const target3 = entryMid + (direction * highMoveMag * entryMid);

    // Step 4: Risk/Reward ratio
    const distanceToStop = Math.abs(entryMid - stopLoss);
    const distanceToTarget = Math.abs(target1 - entryMid);
    const riskRewardRatio = distanceToStop > 0 ? distanceToTarget / distanceToStop : 0;

    // Filter: R/R must be >= 2.0
    if (riskRewardRatio < TRADE_CONFIG.MIN_RISK_REWARD) return null;

    return {
      entry_low: Number(entryLow.toFixed(2)),
      entry_high: Number(entryHigh.toFixed(2)),
      entry_mid: Number(entryMid.toFixed(2)),
      stop_loss: Number(stopLoss.toFixed(2)),
      target_1: Number(target1.toFixed(2)),
      target_2: Number(target2.toFixed(2)),
      target_3: Number(target3.toFixed(2)),
      risk_reward_ratio: Number(riskRewardRatio.toFixed(1)),
      stop_distance_pct: Number(stopDistancePct.toFixed(4)),
    };
  }

  // ─── Function 4: Build Trade Structure (Section 2.5) ──────────────────────

  buildTradeStructure(
    asset: AssetCandidate,
    moveEstimate: MoveEstimate,
    riskParams: RiskParams,
    signal: ScoredSignal,
    thesis: string = '',
    riskFactors: string[] = []
  ): TradeCandidate {
    const horizonHours = moveEstimate.time_horizon_hours;
    let timeHorizon: string;
    if (horizonHours < 4) timeHorizon = `${Math.round(horizonHours)} hours`;
    else if (horizonHours < 48) timeHorizon = `${Math.round(horizonHours / 24)} day${horizonHours >= 48 ? 's' : ''}`;
    else timeHorizon = `${Math.round(horizonHours / 24)} days`;

    const decayTime = new Date(Date.now() + horizonHours * 3600000).toISOString();

    return {
      id: uuid(),
      signal_id: signal.id,
      generated_at: new Date().toISOString(),
      status: 'ACTIVE',

      asset: asset.ticker,
      asset_type: asset.asset_type,
      direction: asset.direction === 1 ? 'LONG' : 'SHORT',

      expected_move_pct: Number(moveEstimate.expected_move_pct.toFixed(2)),
      move_range_low_pct: Number(moveEstimate.move_range_low.toFixed(2)),
      move_range_high_pct: Number(moveEstimate.move_range_high.toFixed(2)),
      time_horizon: timeHorizon,
      time_horizon_hours: horizonHours,

      entry_zone_low: riskParams.entry_low,
      entry_zone_high: riskParams.entry_high,
      entry_mid: riskParams.entry_mid,

      stop_loss: riskParams.stop_loss,
      target_1: riskParams.target_1,
      target_2: riskParams.target_2,
      target_3: riskParams.target_3,

      risk_reward_ratio: riskParams.risk_reward_ratio,
      stop_distance_pct: riskParams.stop_distance_pct,
      confidence: signal.confidence,

      thesis: thesis || `${asset.ticker} ${asset.direction === 1 ? 'bullish' : 'bearish'} setup triggered by ${signal.event_headline}. Expected ${Math.abs(moveEstimate.expected_move_pct).toFixed(1)}% move over ${timeHorizon}.`,
      catalyst_event_id: signal.event_id,
      chain_path: signal.chain_nodes.length > 0
        ? signal.chain_nodes[0].chain_path
        : [signal.asset],
      catalyst_decay_time: decayTime,
      risk_factors: riskFactors.length > 0 ? riskFactors : [
        'Unexpected policy reversal or de-escalation',
        'Earnings beat overrides macro sentiment',
        'Liquidity injection dampens risk-off flow',
      ],

      recommended_position_size_pct: 0,
      recommended_position_size_usd: 0,
      risk_guard_status: 'APPROVED',
      risk_guard_message: '',
      rank_score: 0,
    };
  }

  // ─── Function 5: Rank and Filter Candidates (Section 2.6) ─────────────────

  rankAndFilterCandidates(candidates: TradeCandidate[]): TradeCandidate[] {
    // Hard filters
    const filtered = candidates.filter(c => {
      if (c.risk_reward_ratio < TRADE_CONFIG.MIN_RISK_REWARD) return false;
      if (c.confidence < 0.50) return false;
      if (c.time_horizon_hours > TRADE_CONFIG.MAX_TIME_HORIZON_HOURS) return false;
      return true;
    });

    // Soft scoring
    const normalize = (val: number, min: number, max: number): number => {
      return Math.min(1, Math.max(0, (val - min) / (max - min)));
    };

    const scored = filtered.map(c => {
      const rankScore =
        TRADE_CONFIG.RANK_WEIGHTS.CONFIDENCE * c.confidence +
        TRADE_CONFIG.RANK_WEIGHTS.RISK_REWARD * normalize(c.risk_reward_ratio, 2.0, 8.0) +
        TRADE_CONFIG.RANK_WEIGHTS.SIGNAL_SCORE * c.confidence + // approximate with confidence
        TRADE_CONFIG.RANK_WEIGHTS.EXPECTED_MOVE * normalize(Math.abs(c.expected_move_pct), 1.5, 15.0);

      return { ...c, rank_score: Number(rankScore.toFixed(3)) };
    });

    // Sort descending and take top 10
    return scored
      .sort((a, b) => b.rank_score - a.rank_score)
      .slice(0, TRADE_CONFIG.MAX_CANDIDATES);
  }
}
