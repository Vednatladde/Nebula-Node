// ============================================================================
// NEBULA NODE — MASTER CONFIGURATION
// All configurable constants from Sections 1–10
// ============================================================================

// ─── Section 1: Propagation Engine Constants ─────────────────────────────────

export const PROPAGATION_CONFIG = {
  SEVERITY_CEILING: 10.0,
  DEFAULT_ATTENUATION_FACTOR: 0.65,
  ATTENUATION_RANGE: { min: 0.5, max: 0.9 },
  PROPAGATION_CUTOFF: 0.0001,      // 0.01% minimum impact — allows deeper chains
  MAX_PROPAGATION_DEPTH: 4,
  EMA_ALPHA: 0.2,                 // for historical magnitude updates

  // Time decay: delay_factor = ln(2) / T_half_hours
  DELAY_FACTORS: {
    MINUTES: 0.693,    // half-life: 1 hour
    HOURS:   0.0990,   // half-life: 7 hours
    DAYS:    0.0289,   // half-life: 24 hours
    WEEKS:   0.00412,  // half-life: 168 hours (7 days)
  } as const,
};

// ─── Section 2: Trade Construction Constants ─────────────────────────────────

export const TRADE_CONFIG = {
  MIN_IMPACT_THRESHOLD: 0.015,    // 1.5% minimum
  MIN_LIQUIDITY_SCORE: 0.4,
  MAX_ASSETS_PER_SIGNAL: 5,
  DEFAULT_ATR_PCT: 0.025,         // 2.5% default ATR
  MIN_RISK_REWARD: 2.0,
  MAX_TIME_HORIZON_HOURS: 336,    // 14 days
  MAX_CANDIDATES: 10,

  // Entry zone offsets
  ENTRY_BELOW_PCT: 0.003,
  ENTRY_ABOVE_PCT: 0.005,

  // Volatility multipliers (Section 2.3)
  VOLATILITY_MULTIPLIERS: {
    LOW_VOL:  0.7,     // VIX < 15
    NORMAL:   1.0,     // VIX 15–25
    HIGH_VOL: 1.4,     // VIX 25–35
    CRISIS:   1.8,     // VIX > 35
  } as const,

  // Ranking weights (Section 2.6)
  RANK_WEIGHTS: {
    CONFIDENCE: 0.30,
    RISK_REWARD: 0.25,
    SIGNAL_SCORE: 0.25,
    EXPECTED_MOVE: 0.20,
  },
};

// ─── Section 3: Risk Engine Constants ────────────────────────────────────────

export const RISK_CONFIG = {
  MAX_CAPITAL_PER_TRADE: 0.05,      // 5%
  MAX_DAILY_RISK: 0.12,             // 12%
  MAX_CORRELATED_TRADES: 3,
  MAX_OPEN_POSITIONS: 8,
  MIN_RISK_REWARD_RATIO: 2.0,
  MAX_SINGLE_SECTOR_EXPO: 0.20,     // 20%
  CORRELATION_THRESHOLD: 0.70,
  KELLY_FRACTION: 0.5,              // Half-Kelly

  // Drawdown thresholds (Section 3.4)
  DRAWDOWN_THRESHOLDS: {
    WARNING:  0.10,     // 10%
    CAUTION:  0.15,     // 15%
    HALT:     0.20,     // 20%
  },

  // Drawdown size reduction factors
  DRAWDOWN_SIZE_FACTORS: {
    NORMAL:   1.0,
    WARNING:  0.75,
    CAUTION:  0.50,
    HALT:     0.0,
  },
};

// ─── Section 4: UI Theme Constants ───────────────────────────────────────────

export const THEME = {
  // Core palette
  BG_PRIMARY: '#000000',
  BG_SECONDARY: '#0a0a0a',
  BG_PANEL: '#0d0d0d',
  BG_CARD: '#141414',
  BG_HOVER: '#1a1a1a',
  BORDER: '#1e1e1e',
  BORDER_ACTIVE: '#2a2a2a',

  // Text
  TEXT_PRIMARY: '#e0e0e0',
  TEXT_SECONDARY: '#888888',
  TEXT_MUTED: '#444444',

  // Accent colors from spec
  ACCENT_ORANGE: '#ff6b1a',
  ACCENT_AMBER: '#ff9500',
  ACCENT_RED: '#cc1a1a',
  ACCENT_GREEN: '#00cc66',
  ACCENT_CRIMSON: '#cc1a1a',

  // Alert level colors
  ALERT_INFO: '#444444',
  ALERT_WATCH: '#ff9500',
  ALERT_SIGNAL: '#ff6b1a',
  ALERT_ACTION: '#cc1a1a',

  // Fonts
  FONT_MONO: "'Courier New', 'Fira Code', monospace",
  FONT_UI: "'Inter', 'SF Pro', system-ui, sans-serif",
};

// ─── Section 7: Model Configuration ─────────────────────────────────────────

export const MODEL_CONFIG = {
  OLLAMA_BASE_URL: 'http://localhost:11434',
  OLLAMA_TIMEOUT: 30000,
  OLLAMA_RETRIES: 2,
  OLLAMA_BACKOFF: 5000,

  MODELS: {
    PRIMARY: 'mistral:7b-instruct',
    SECONDARY: 'llama3:8b-instruct',
    EMBEDDINGS: 'nomic-embed-text',
    OPTIONAL: 'phi3:mini',
  },
};

// ─── Section 8: Auth Configuration ───────────────────────────────────────────

export const AUTH_CONFIG = {
  SESSION_TIMEOUT_MS: 30 * 60 * 1000,  // 30 minutes
  MAX_FAILED_ATTEMPTS: 3,
  BASE_LOCKOUT_SECONDS: 30,

  // ⚠️  DEMO CREDENTIALS ONLY — for prototype/local use.
  // In production: store hashed credentials server-side,
  // never hardcode secrets in source. See .env.example.
  DEFAULT_WORD_KEY: 'orion 731 helios',
  DEFAULT_PASSKEY: 'nebula01',
};

// ─── Section 9: Alert Configuration ─────────────────────────────────────────

export const ALERT_CONFIG = {
  LEVEL_THRESHOLDS: {
    INFO: 0.3,
    WATCH: 0.4,
    SIGNAL: 0.65,
    ACTION: 0.85,
  },
};

// ─── Section 10: Node Configuration ──────────────────────────────────────────

export const NODE_CONFIG = {
  NODE_NAME: 'NEBULA' as const,
  HEARTBEAT_INTERVAL: 60000,    // 60 seconds
  STANDALONE_TIMEOUT: 30000,    // 30 seconds before standalone mode
  CAPABILITIES: [
    'event_detection',
    'signal_scoring',
    'propagation_engine',
    'trade_generation',
    'risk_engine',
    'market_data',
  ],
};

// ─── Scoring Weights (from original prompt Layer 4) ──────────────────────────

export const SIGNAL_WEIGHTS = {
  w1_rarity: 0.20,
  w2_sentiment: 0.15,
  w3_asset_liquidity: 0.10,
  w4_time_urgency: 0.20,
  w5_cross_source: 0.15,
  w6_historical_pattern: 0.20,
};
