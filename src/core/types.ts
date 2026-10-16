// ============================================================================
// NEBULA NODE — CORE TYPE DEFINITIONS
// All data models from Sections 1–10 of the Nebula Node Specification
// ============================================================================

// ─── Section 1: Propagation Engine Types ─────────────────────────────────────

export type NodeType = 'ASSET' | 'SECTOR' | 'CURRENCY' | 'COMMODITY' | 'COUNTRY' | 'MACRO';
export type TimeWindow = 'minutes' | 'hours' | 'days' | 'weeks';
export type DelayCategory = 'MINUTES' | 'HOURS' | 'DAYS' | 'WEEKS';

export interface GraphNode {
  id: string;
  name: string;
  node_type: NodeType;
  metadata?: Record<string, unknown>;
}

export interface GraphEdge {
  id: string;
  from_node_id: string;
  to_node_id: string;
  probability: number;        // 0.0–1.0
  direction: 1 | -1;          // +1 bullish, -1 bearish
  delay_category: DelayCategory;
  magnitude_coeff: number;    // historical_magnitude
  confidence: number;         // 0.0–1.0
  attenuation_factor: number; // default 0.65
  source?: string;
}

export interface ImpactNode {
  node_id: string;
  node_name: string;
  node_type: NodeType;
  final_impact: number;       // signed decimal (0.045 = 4.5%)
  direction: 1 | -1;
  hop_count: number;
  chain_path: string[];       // full path from event
  confidence: number;         // product of edge confidences
  elapsed_decay_factor: number;
  time_window: TimeWindow;
}

// ─── Section 2: Trade Construction Types ─────────────────────────────────────

export type AssetType = 'EQUITY' | 'CRYPTO' | 'FOREX' | 'COMMODITY' | 'ETF';
export type TradeDirection = 'LONG' | 'SHORT';
export type TradeStatus = 'ACTIVE' | 'EXPIRED' | 'TAKEN' | 'INVALIDATED' | 'HALTED';
export type VolatilityRegime = 'LOW_VOL' | 'NORMAL' | 'HIGH_VOL' | 'CRISIS';

export interface AssetCandidate {
  ticker: string;
  asset_type: AssetType;
  expected_impact: number;
  direction: 1 | -1;
  confidence: number;
  liquidity_score: number;
  rank: number;
}

export interface MoveEstimate {
  asset: string;
  direction: 1 | -1;
  expected_move_pct: number;
  move_range_low: number;
  move_range_high: number;
  time_horizon_hours: number;
  confidence: number;
}

export interface RiskParams {
  entry_low: number;
  entry_high: number;
  entry_mid: number;
  stop_loss: number;
  target_1: number;
  target_2: number;
  target_3: number;
  risk_reward_ratio: number;
  stop_distance_pct: number;
}

export interface TradeCandidate {
  id: string;
  signal_id: string;
  generated_at: string;       // ISO8601
  status: TradeStatus;

  // Asset
  asset: string;
  asset_type: AssetType;
  direction: TradeDirection;

  // Move Estimate
  expected_move_pct: number;
  move_range_low_pct: number;
  move_range_high_pct: number;
  time_horizon: string;
  time_horizon_hours: number;

  // Entry
  entry_zone_low: number;
  entry_zone_high: number;
  entry_mid: number;

  // Targets and Stop
  stop_loss: number;
  target_1: number;
  target_2: number;
  target_3: number;

  // Risk Metrics
  risk_reward_ratio: number;
  stop_distance_pct: number;
  confidence: number;

  // Context
  thesis: string;
  catalyst_event_id: string;
  chain_path: string[];
  catalyst_decay_time: string;
  risk_factors: string[];

  // Sizing (from Risk Engine)
  recommended_position_size_pct: number;
  recommended_position_size_usd: number;

  // Risk Guard
  risk_guard_status: 'APPROVED' | 'WARNING' | 'BLOCKED';
  risk_guard_message: string;
  rank_score: number;
}

// ─── Section 3: Risk Engine Types ────────────────────────────────────────────

export type DrawdownState = 'NORMAL' | 'WARNING' | 'CAUTION' | 'HALT';

export interface GuardResult {
  status: 'APPROVED' | 'WARNING' | 'BLOCKED';
  reason: string;
  adjusted_size: number | null;
  message: string;
}

export interface AccountState {
  account_size_usd: number;
  cash_available_usd: number;
  peak_value_usd: number;
  current_drawdown: number;
  daily_pnl_usd: number;
  daily_risk_used_pct: number;
  open_position_count: number;
}

export interface Trade {
  id: string;
  candidate_id: string;
  signal_id: string;
  asset: string;
  direction: TradeDirection;
  entry_price: number;
  stop_loss: number;
  target_1: number;
  target_2: number;
  position_size_usd: number;
  status: 'OPEN' | 'CLOSED_WIN' | 'CLOSED_LOSS' | 'STOPPED' | 'CANCELLED';
  opened_at: string;
  closed_at?: string;
  exit_price?: number;
  realized_pnl_usd?: number;
  realized_pnl_pct?: number;
}

// ─── Section 4: Event & Signal Types ─────────────────────────────────────────

export type SourceType = 'MARKET' | 'NEWS' | 'SOCIAL' | 'MACRO' | 'GEO' | 'SHIPPING';
export type AlertLevel = 1 | 2 | 3 | 4;
export type SignalStatus = 'ACTIVE' | 'EXPIRED' | 'CONSUMED';
export type SignalCategory = 'CRYPTO' | 'EQUITY' | 'MACRO' | 'GEO';

export interface NebEvent {
  id: string;
  timestamp: string;
  source: string;
  source_type: SourceType;
  headline: string;
  sentiment_score: number;
  urgency_hint: number;
  asset_tags: string[];
  geo_tags: string[];
  sector_tags: string[];
  normalized_value: number;
}

export interface ScoredSignal {
  id: string;
  event_id: string;
  signal_score: number;        // 0–1
  confidence: number;          // 0–1
  component_scores: Record<string, number>;
  chain_nodes: ImpactNode[];
  asset: string;
  direction: 1 | -1;
  status: SignalStatus;
  expires_at: string;
  timestamp: string;
  category: SignalCategory;
  event_headline: string;
}

// ─── Section 8: Auth Types ───────────────────────────────────────────────────

export type AuthStep = 'WORD_KEY' | 'CHALLENGE' | 'PASSKEY' | 'AUTHENTICATED';

export interface AuthState {
  step: AuthStep;
  failed_attempts: number;
  lockout_until: number | null;
  lockout_count: number;
  challenge_phrase: string;
  session_token: string | null;
  session_expires_at: number | null;
}

// ─── Section 9: Alert Types ──────────────────────────────────────────────────

export type AlertChannel = 'DESKTOP' | 'ANDROID' | 'TELEGRAM';

export interface Alert {
  id: string;
  level: AlertLevel;
  event_id?: string;
  signal_id?: string;
  asset?: string;
  message: string;
  timestamp: string;
  delivered: boolean;
  channels: AlertChannel[];
}

// ─── Section 10: Node Expansion Types ────────────────────────────────────────

export type NodeName = 'NEBULA' | 'AURORA' | 'PHALANX' | 'ORACLE' | 'TSR';
export type MessageType = 'SIGNAL' | 'REGIME' | 'OPPORTUNITY' | 'ALERT' | 'HEARTBEAT';

export interface NodeMessage {
  message_id: string;
  source_node: NodeName;
  target_node: NodeName;
  message_type: MessageType;
  payload: Record<string, unknown>;
  priority: 1 | 2 | 3 | 4;
  timestamp: string;
  ttl_seconds: number;
  requires_ack: boolean;
}

// ─── Market Cache ────────────────────────────────────────────────────────────

export interface MarketData {
  ticker: string;
  asset_type: AssetType;
  price: number;
  change_pct_1h: number;
  change_pct_24h: number;
  volume_24h: number;
  atr_14: number;
  beta_30d: number;
  sector: string;
  sparkline: number[];         // 12h price points for mini chart
}
