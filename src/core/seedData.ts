// ============================================================================
// NEBULA NODE — SEED DATA
// Realistic dependency graph, market data, signals, and trade candidates
// for demonstration and development.
// ============================================================================

import { v4 as uuid } from 'uuid';
import type {
  GraphNode, GraphEdge, NebEvent, ScoredSignal, MarketData,
  TradeCandidate, Trade, AccountState, Alert,
} from './types';

// ─── Graph Nodes (Section 5.2) ───────────────────────────────────────────────

const nodeIds: Record<string, string> = {};
const makeNodeId = (name: string) => {
  if (!nodeIds[name]) nodeIds[name] = uuid();
  return nodeIds[name];
};

export const SEED_GRAPH_NODES: GraphNode[] = [
  // Events / Macro triggers
  { id: makeNodeId('TAIWAN_CRISIS'), name: 'TAIWAN_CRISIS', node_type: 'COUNTRY', metadata: { label: 'Taiwan Strait Escalation' } },
  { id: makeNodeId('FED_RATE_CUT'), name: 'FED_RATE_CUT', node_type: 'MACRO', metadata: { label: 'Fed Rate Decision' } },
  { id: makeNodeId('OIL_SHOCK'), name: 'OIL_SHOCK', node_type: 'COMMODITY', metadata: { label: 'Oil Supply Disruption' } },
  { id: makeNodeId('CHINA_TARIFF'), name: 'CHINA_TARIFF', node_type: 'MACRO', metadata: { label: 'China Trade Tariffs' } },
  { id: makeNodeId('CRYPTO_REGULATION'), name: 'CRYPTO_REGULATION', node_type: 'MACRO', metadata: { label: 'Crypto Regulation' } },

  // Sectors
  { id: makeNodeId('SEMICONDUCTORS'), name: 'SEMICONDUCTORS', node_type: 'SECTOR', metadata: { label: 'Semiconductor Sector' } },
  { id: makeNodeId('TECH_SECTOR'), name: 'TECH_SECTOR', node_type: 'SECTOR', metadata: { label: 'Technology Sector' } },
  { id: makeNodeId('ENERGY_SECTOR'), name: 'ENERGY_SECTOR', node_type: 'SECTOR', metadata: { label: 'Energy Sector' } },
  { id: makeNodeId('FINANCE_SECTOR'), name: 'FINANCE_SECTOR', node_type: 'SECTOR', metadata: { label: 'Financial Sector' } },
  { id: makeNodeId('DEFENSE_SECTOR'), name: 'DEFENSE_SECTOR', node_type: 'SECTOR', metadata: { label: 'Defense Sector' } },

  // Assets
  { id: makeNodeId('NVDA'), name: 'NVDA', node_type: 'ASSET', metadata: { label: 'NVIDIA Corp', sector: 'Technology', price: 875 } },
  { id: makeNodeId('TSM'), name: 'TSM', node_type: 'ASSET', metadata: { label: 'Taiwan Semiconductor', sector: 'Technology', price: 165 } },
  { id: makeNodeId('AMD'), name: 'AMD', node_type: 'ASSET', metadata: { label: 'AMD Inc', sector: 'Technology', price: 168 } },
  { id: makeNodeId('AAPL'), name: 'AAPL', node_type: 'ASSET', metadata: { label: 'Apple Inc', sector: 'Technology', price: 192 } },
  { id: makeNodeId('MSFT'), name: 'MSFT', node_type: 'ASSET', metadata: { label: 'Microsoft Corp', sector: 'Technology', price: 428 } },
  { id: makeNodeId('GOOGL'), name: 'GOOGL', node_type: 'ASSET', metadata: { label: 'Alphabet Inc', sector: 'Technology', price: 175 } },
  { id: makeNodeId('META'), name: 'META', node_type: 'ASSET', metadata: { label: 'Meta Platforms', sector: 'Technology', price: 510 } },
  { id: makeNodeId('XOM'), name: 'XOM', node_type: 'ASSET', metadata: { label: 'ExxonMobil', sector: 'Energy', price: 112 } },
  { id: makeNodeId('CVX'), name: 'CVX', node_type: 'ASSET', metadata: { label: 'Chevron Corp', sector: 'Energy', price: 158 } },
  { id: makeNodeId('LMT'), name: 'LMT', node_type: 'ASSET', metadata: { label: 'Lockheed Martin', sector: 'Aerospace', price: 468 } },
  { id: makeNodeId('RTX'), name: 'RTX', node_type: 'ASSET', metadata: { label: 'RTX Corp', sector: 'Aerospace', price: 105 } },
  { id: makeNodeId('JPM'), name: 'JPM', node_type: 'ASSET', metadata: { label: 'JPMorgan Chase', sector: 'Finance', price: 198 } },
  { id: makeNodeId('GS'), name: 'GS', node_type: 'ASSET', metadata: { label: 'Goldman Sachs', sector: 'Finance', price: 462 } },

  // Crypto
  { id: makeNodeId('BTC'), name: 'BTC', node_type: 'ASSET', metadata: { label: 'Bitcoin', sector: 'Crypto', price: 67500 } },
  { id: makeNodeId('ETH'), name: 'ETH', node_type: 'ASSET', metadata: { label: 'Ethereum', sector: 'Crypto', price: 3450 } },
  { id: makeNodeId('SOL'), name: 'SOL', node_type: 'ASSET', metadata: { label: 'Solana', sector: 'Crypto', price: 148 } },

  // Commodities
  { id: makeNodeId('GOLD'), name: 'GOLD', node_type: 'COMMODITY', metadata: { label: 'Gold', price: 2340 } },
  { id: makeNodeId('OIL'), name: 'OIL', node_type: 'COMMODITY', metadata: { label: 'Crude Oil', price: 82 } },

  // Currencies
  { id: makeNodeId('USD'), name: 'USD', node_type: 'CURRENCY', metadata: { label: 'US Dollar' } },
  { id: makeNodeId('TWD'), name: 'TWD', node_type: 'CURRENCY', metadata: { label: 'Taiwan Dollar' } },
];

// ─── Graph Edges (Dependency Chains) ─────────────────────────────────────────

export const SEED_GRAPH_EDGES: GraphEdge[] = [
  // TAIWAN_CRISIS chains
  { id: uuid(), from_node_id: makeNodeId('TAIWAN_CRISIS'), to_node_id: makeNodeId('TSM'), probability: 0.95, direction: -1, delay_category: 'HOURS', magnitude_coeff: 0.08, confidence: 0.9, attenuation_factor: 0.65, source: 'geopolitical' },
  { id: uuid(), from_node_id: makeNodeId('TAIWAN_CRISIS'), to_node_id: makeNodeId('SEMICONDUCTORS'), probability: 0.92, direction: -1, delay_category: 'HOURS', magnitude_coeff: 0.06, confidence: 0.85, attenuation_factor: 0.65, source: 'geopolitical' },
  { id: uuid(), from_node_id: makeNodeId('TAIWAN_CRISIS'), to_node_id: makeNodeId('TWD'), probability: 0.88, direction: -1, delay_category: 'MINUTES', magnitude_coeff: 0.04, confidence: 0.8, attenuation_factor: 0.65, source: 'geopolitical' },
  { id: uuid(), from_node_id: makeNodeId('TAIWAN_CRISIS'), to_node_id: makeNodeId('GOLD'), probability: 0.80, direction: 1, delay_category: 'HOURS', magnitude_coeff: 0.025, confidence: 0.75, attenuation_factor: 0.65, source: 'geopolitical' },
  { id: uuid(), from_node_id: makeNodeId('TAIWAN_CRISIS'), to_node_id: makeNodeId('DEFENSE_SECTOR'), probability: 0.75, direction: 1, delay_category: 'HOURS', magnitude_coeff: 0.035, confidence: 0.7, attenuation_factor: 0.65, source: 'geopolitical' },

  // SEMICONDUCTORS → individual stocks
  { id: uuid(), from_node_id: makeNodeId('SEMICONDUCTORS'), to_node_id: makeNodeId('NVDA'), probability: 0.90, direction: -1, delay_category: 'HOURS', magnitude_coeff: 0.045, confidence: 0.85, attenuation_factor: 0.65, source: 'sector' },
  { id: uuid(), from_node_id: makeNodeId('SEMICONDUCTORS'), to_node_id: makeNodeId('AMD'), probability: 0.88, direction: -1, delay_category: 'HOURS', magnitude_coeff: 0.05, confidence: 0.8, attenuation_factor: 0.65, source: 'sector' },
  { id: uuid(), from_node_id: makeNodeId('SEMICONDUCTORS'), to_node_id: makeNodeId('AAPL'), probability: 0.65, direction: -1, delay_category: 'DAYS', magnitude_coeff: 0.02, confidence: 0.6, attenuation_factor: 0.65, source: 'sector' },

  // DEFENSE_SECTOR → defense stocks
  { id: uuid(), from_node_id: makeNodeId('DEFENSE_SECTOR'), to_node_id: makeNodeId('LMT'), probability: 0.82, direction: 1, delay_category: 'HOURS', magnitude_coeff: 0.03, confidence: 0.75, attenuation_factor: 0.65, source: 'sector' },
  { id: uuid(), from_node_id: makeNodeId('DEFENSE_SECTOR'), to_node_id: makeNodeId('RTX'), probability: 0.78, direction: 1, delay_category: 'HOURS', magnitude_coeff: 0.028, confidence: 0.7, attenuation_factor: 0.65, source: 'sector' },

  // FED_RATE_CUT chains
  { id: uuid(), from_node_id: makeNodeId('FED_RATE_CUT'), to_node_id: makeNodeId('TECH_SECTOR'), probability: 0.85, direction: 1, delay_category: 'HOURS', magnitude_coeff: 0.035, confidence: 0.8, attenuation_factor: 0.65, source: 'macro' },
  { id: uuid(), from_node_id: makeNodeId('FED_RATE_CUT'), to_node_id: makeNodeId('FINANCE_SECTOR'), probability: 0.80, direction: -1, delay_category: 'HOURS', magnitude_coeff: 0.025, confidence: 0.75, attenuation_factor: 0.65, source: 'macro' },
  { id: uuid(), from_node_id: makeNodeId('FED_RATE_CUT'), to_node_id: makeNodeId('BTC'), probability: 0.75, direction: 1, delay_category: 'DAYS', magnitude_coeff: 0.06, confidence: 0.65, attenuation_factor: 0.65, source: 'macro' },
  { id: uuid(), from_node_id: makeNodeId('FED_RATE_CUT'), to_node_id: makeNodeId('GOLD'), probability: 0.70, direction: 1, delay_category: 'HOURS', magnitude_coeff: 0.02, confidence: 0.7, attenuation_factor: 0.65, source: 'macro' },

  // TECH_SECTOR → tech stocks
  { id: uuid(), from_node_id: makeNodeId('TECH_SECTOR'), to_node_id: makeNodeId('MSFT'), probability: 0.88, direction: 1, delay_category: 'HOURS', magnitude_coeff: 0.025, confidence: 0.82, attenuation_factor: 0.65, source: 'sector' },
  { id: uuid(), from_node_id: makeNodeId('TECH_SECTOR'), to_node_id: makeNodeId('GOOGL'), probability: 0.85, direction: 1, delay_category: 'HOURS', magnitude_coeff: 0.028, confidence: 0.8, attenuation_factor: 0.65, source: 'sector' },
  { id: uuid(), from_node_id: makeNodeId('TECH_SECTOR'), to_node_id: makeNodeId('META'), probability: 0.82, direction: 1, delay_category: 'HOURS', magnitude_coeff: 0.03, confidence: 0.78, attenuation_factor: 0.65, source: 'sector' },

  // FINANCE_SECTOR → finance stocks
  { id: uuid(), from_node_id: makeNodeId('FINANCE_SECTOR'), to_node_id: makeNodeId('JPM'), probability: 0.85, direction: -1, delay_category: 'HOURS', magnitude_coeff: 0.02, confidence: 0.8, attenuation_factor: 0.65, source: 'sector' },
  { id: uuid(), from_node_id: makeNodeId('FINANCE_SECTOR'), to_node_id: makeNodeId('GS'), probability: 0.82, direction: -1, delay_category: 'HOURS', magnitude_coeff: 0.025, confidence: 0.75, attenuation_factor: 0.65, source: 'sector' },

  // OIL_SHOCK chains
  { id: uuid(), from_node_id: makeNodeId('OIL_SHOCK'), to_node_id: makeNodeId('OIL'), probability: 0.95, direction: 1, delay_category: 'MINUTES', magnitude_coeff: 0.08, confidence: 0.9, attenuation_factor: 0.65, source: 'commodity' },
  { id: uuid(), from_node_id: makeNodeId('OIL_SHOCK'), to_node_id: makeNodeId('ENERGY_SECTOR'), probability: 0.90, direction: 1, delay_category: 'HOURS', magnitude_coeff: 0.05, confidence: 0.85, attenuation_factor: 0.65, source: 'commodity' },
  { id: uuid(), from_node_id: makeNodeId('ENERGY_SECTOR'), to_node_id: makeNodeId('XOM'), probability: 0.88, direction: 1, delay_category: 'HOURS', magnitude_coeff: 0.04, confidence: 0.82, attenuation_factor: 0.65, source: 'sector' },
  { id: uuid(), from_node_id: makeNodeId('ENERGY_SECTOR'), to_node_id: makeNodeId('CVX'), probability: 0.85, direction: 1, delay_category: 'HOURS', magnitude_coeff: 0.035, confidence: 0.8, attenuation_factor: 0.65, source: 'sector' },

  // CHINA_TARIFF chains
  { id: uuid(), from_node_id: makeNodeId('CHINA_TARIFF'), to_node_id: makeNodeId('AAPL'), probability: 0.82, direction: -1, delay_category: 'DAYS', magnitude_coeff: 0.035, confidence: 0.75, attenuation_factor: 0.65, source: 'macro' },
  { id: uuid(), from_node_id: makeNodeId('CHINA_TARIFF'), to_node_id: makeNodeId('TECH_SECTOR'), probability: 0.70, direction: -1, delay_category: 'DAYS', magnitude_coeff: 0.02, confidence: 0.65, attenuation_factor: 0.65, source: 'macro' },

  // CRYPTO_REGULATION chains
  { id: uuid(), from_node_id: makeNodeId('CRYPTO_REGULATION'), to_node_id: makeNodeId('BTC'), probability: 0.90, direction: -1, delay_category: 'HOURS', magnitude_coeff: 0.07, confidence: 0.82, attenuation_factor: 0.65, source: 'regulation' },
  { id: uuid(), from_node_id: makeNodeId('CRYPTO_REGULATION'), to_node_id: makeNodeId('ETH'), probability: 0.88, direction: -1, delay_category: 'HOURS', magnitude_coeff: 0.08, confidence: 0.78, attenuation_factor: 0.65, source: 'regulation' },
  { id: uuid(), from_node_id: makeNodeId('CRYPTO_REGULATION'), to_node_id: makeNodeId('SOL'), probability: 0.85, direction: -1, delay_category: 'HOURS', magnitude_coeff: 0.10, confidence: 0.72, attenuation_factor: 0.65, source: 'regulation' },

  // BTC → crypto correlation
  { id: uuid(), from_node_id: makeNodeId('BTC'), to_node_id: makeNodeId('ETH'), probability: 0.80, direction: 1, delay_category: 'MINUTES', magnitude_coeff: 1.2, confidence: 0.75, attenuation_factor: 0.65, source: 'correlation' },
  { id: uuid(), from_node_id: makeNodeId('BTC'), to_node_id: makeNodeId('SOL'), probability: 0.70, direction: 1, delay_category: 'MINUTES', magnitude_coeff: 1.5, confidence: 0.65, attenuation_factor: 0.65, source: 'correlation' },
];

// ─── Simulated Events ────────────────────────────────────────────────────────

export const SEED_EVENTS: NebEvent[] = [
  {
    id: uuid(), timestamp: new Date(Date.now() - 1800000).toISOString(),
    source: 'GDELT', source_type: 'GEO',
    headline: 'TAIWAN STRAIT: Vessel density up 340% — PLA Navy exercises expanding beyond declared zones',
    sentiment_score: -0.85, urgency_hint: 0.92,
    asset_tags: ['TSM', 'NVDA', 'AMD'], geo_tags: ['TW', 'CN'], sector_tags: ['Semiconductors', 'Technology'],
    normalized_value: 0.92,
  },
  {
    id: uuid(), timestamp: new Date(Date.now() - 3600000).toISOString(),
    source: 'Reuters', source_type: 'NEWS',
    headline: 'Federal Reserve signals potential rate cut at September meeting — dot plot shifts dovish',
    sentiment_score: 0.65, urgency_hint: 0.78,
    asset_tags: ['SPY', 'QQQ', 'BTC', 'GOLD'], geo_tags: ['US'], sector_tags: ['Finance', 'Technology'],
    normalized_value: 0.78,
  },
  {
    id: uuid(), timestamp: new Date(Date.now() - 7200000).toISOString(),
    source: 'MarineTraffic', source_type: 'SHIPPING',
    headline: 'Strait of Hormuz: 3 tankers diverted — suspected mine field report from UAE coast guard',
    sentiment_score: -0.72, urgency_hint: 0.85,
    asset_tags: ['OIL', 'XOM', 'CVX'], geo_tags: ['IR', 'AE'], sector_tags: ['Energy'],
    normalized_value: 0.85,
  },
  {
    id: uuid(), timestamp: new Date(Date.now() - 900000).toISOString(),
    source: 'Bloomberg', source_type: 'MARKET',
    headline: 'NVDA options flow: Massive put buying at $850 strike — 12,000 contracts in 15 minutes',
    sentiment_score: -0.60, urgency_hint: 0.70,
    asset_tags: ['NVDA'], geo_tags: ['US'], sector_tags: ['Technology'],
    normalized_value: 0.70,
  },
  {
    id: uuid(), timestamp: new Date(Date.now() - 5400000).toISOString(),
    source: 'CoinDesk', source_type: 'NEWS',
    headline: 'SEC enforcement action: Major crypto exchange faces securities violation charges',
    sentiment_score: -0.78, urgency_hint: 0.82,
    asset_tags: ['BTC', 'ETH', 'SOL'], geo_tags: ['US'], sector_tags: ['Crypto'],
    normalized_value: 0.82,
  },
  {
    id: uuid(), timestamp: new Date(Date.now() - 600000).toISOString(),
    source: 'USTR', source_type: 'MACRO',
    headline: 'US Trade Representative announces additional 25% tariffs on Chinese electronics imports',
    sentiment_score: -0.70, urgency_hint: 0.75,
    asset_tags: ['AAPL', 'MSFT'], geo_tags: ['US', 'CN'], sector_tags: ['Technology', 'Consumer'],
    normalized_value: 0.75,
  },
];

// ─── Simulated Signals ───────────────────────────────────────────────────────

export const SEED_SIGNALS: ScoredSignal[] = [
  {
    id: uuid(), event_id: SEED_EVENTS[0].id,
    signal_score: 0.88, confidence: 0.82,
    component_scores: { rarity: 0.9, sentiment: 0.85, liquidity: 0.8, urgency: 0.95, cross_source: 0.75, historical: 0.85 },
    chain_nodes: [], asset: 'NVDA', direction: -1,
    status: 'ACTIVE', expires_at: new Date(Date.now() + 172800000).toISOString(),
    timestamp: SEED_EVENTS[0].timestamp, category: 'GEO',
    event_headline: SEED_EVENTS[0].headline,
  },
  {
    id: uuid(), event_id: SEED_EVENTS[1].id,
    signal_score: 0.76, confidence: 0.74,
    component_scores: { rarity: 0.65, sentiment: 0.7, liquidity: 0.9, urgency: 0.8, cross_source: 0.65, historical: 0.75 },
    chain_nodes: [], asset: 'BTC', direction: 1,
    status: 'ACTIVE', expires_at: new Date(Date.now() + 604800000).toISOString(),
    timestamp: SEED_EVENTS[1].timestamp, category: 'MACRO',
    event_headline: SEED_EVENTS[1].headline,
  },
  {
    id: uuid(), event_id: SEED_EVENTS[2].id,
    signal_score: 0.82, confidence: 0.79,
    component_scores: { rarity: 0.85, sentiment: 0.75, liquidity: 0.85, urgency: 0.88, cross_source: 0.70, historical: 0.80 },
    chain_nodes: [], asset: 'OIL', direction: 1,
    status: 'ACTIVE', expires_at: new Date(Date.now() + 259200000).toISOString(),
    timestamp: SEED_EVENTS[2].timestamp, category: 'GEO',
    event_headline: SEED_EVENTS[2].headline,
  },
  {
    id: uuid(), event_id: SEED_EVENTS[4].id,
    signal_score: 0.79, confidence: 0.76,
    component_scores: { rarity: 0.75, sentiment: 0.80, liquidity: 0.70, urgency: 0.82, cross_source: 0.72, historical: 0.78 },
    chain_nodes: [], asset: 'ETH', direction: -1,
    status: 'ACTIVE', expires_at: new Date(Date.now() + 86400000).toISOString(),
    timestamp: SEED_EVENTS[4].timestamp, category: 'CRYPTO',
    event_headline: SEED_EVENTS[4].headline,
  },
  {
    id: uuid(), event_id: SEED_EVENTS[5].id,
    signal_score: 0.71, confidence: 0.68,
    component_scores: { rarity: 0.60, sentiment: 0.72, liquidity: 0.88, urgency: 0.75, cross_source: 0.60, historical: 0.70 },
    chain_nodes: [], asset: 'AAPL', direction: -1,
    status: 'ACTIVE', expires_at: new Date(Date.now() + 432000000).toISOString(),
    timestamp: SEED_EVENTS[5].timestamp, category: 'MACRO',
    event_headline: SEED_EVENTS[5].headline,
  },
];

// ─── Simulated Market Data ───────────────────────────────────────────────────

const generateSparkline = (base: number, volatility: number): number[] => {
  const points: number[] = [];
  let price = base * (1 - volatility * 2);
  for (let i = 0; i < 24; i++) {
    price += (Math.random() - 0.48) * base * volatility;
    points.push(Number(price.toFixed(2)));
  }
  return points;
};

export const SEED_MARKET_DATA: MarketData[] = [
  { ticker: 'NVDA', asset_type: 'EQUITY', price: 875.40, change_pct_1h: -1.2, change_pct_24h: -3.8, volume_24h: 48200000, atr_14: 28.5, beta_30d: 1.65, sector: 'Technology', sparkline: generateSparkline(875, 0.02) },
  { ticker: 'TSM', asset_type: 'EQUITY', price: 164.20, change_pct_1h: -2.1, change_pct_24h: -5.2, volume_24h: 22100000, atr_14: 5.8, beta_30d: 1.35, sector: 'Technology', sparkline: generateSparkline(165, 0.025) },
  { ticker: 'AMD', asset_type: 'EQUITY', price: 167.80, change_pct_1h: -1.5, change_pct_24h: -4.1, volume_24h: 35600000, atr_14: 6.2, beta_30d: 1.55, sector: 'Technology', sparkline: generateSparkline(168, 0.022) },
  { ticker: 'AAPL', asset_type: 'EQUITY', price: 191.50, change_pct_1h: -0.4, change_pct_24h: -1.8, volume_24h: 52300000, atr_14: 3.8, beta_30d: 1.12, sector: 'Technology', sparkline: generateSparkline(192, 0.012) },
  { ticker: 'MSFT', asset_type: 'EQUITY', price: 427.60, change_pct_1h: 0.2, change_pct_24h: 0.8, volume_24h: 18900000, atr_14: 7.2, beta_30d: 1.08, sector: 'Technology', sparkline: generateSparkline(428, 0.01) },
  { ticker: 'GOOGL', asset_type: 'EQUITY', price: 174.80, change_pct_1h: 0.1, change_pct_24h: 0.5, volume_24h: 21400000, atr_14: 4.1, beta_30d: 1.15, sector: 'Technology', sparkline: generateSparkline(175, 0.014) },
  { ticker: 'META', asset_type: 'EQUITY', price: 509.20, change_pct_1h: 0.3, change_pct_24h: 1.2, volume_24h: 14200000, atr_14: 12.5, beta_30d: 1.28, sector: 'Technology', sparkline: generateSparkline(510, 0.015) },
  { ticker: 'XOM', asset_type: 'EQUITY', price: 114.30, change_pct_1h: 1.8, change_pct_24h: 3.5, volume_24h: 19800000, atr_14: 2.8, beta_30d: 0.82, sector: 'Energy', sparkline: generateSparkline(112, 0.018) },
  { ticker: 'CVX', asset_type: 'EQUITY', price: 160.70, change_pct_1h: 1.5, change_pct_24h: 2.8, volume_24h: 8900000, atr_14: 3.5, beta_30d: 0.78, sector: 'Energy', sparkline: generateSparkline(158, 0.016) },
  { ticker: 'LMT', asset_type: 'EQUITY', price: 472.50, change_pct_1h: 2.1, change_pct_24h: 4.2, volume_24h: 3200000, atr_14: 8.5, beta_30d: 0.55, sector: 'Aerospace', sparkline: generateSparkline(468, 0.012) },
  { ticker: 'RTX', asset_type: 'EQUITY', price: 107.80, change_pct_1h: 1.8, change_pct_24h: 3.6, volume_24h: 4100000, atr_14: 2.2, beta_30d: 0.62, sector: 'Aerospace', sparkline: generateSparkline(105, 0.014) },
  { ticker: 'JPM', asset_type: 'EQUITY', price: 196.40, change_pct_1h: -0.5, change_pct_24h: -1.2, volume_24h: 9800000, atr_14: 3.8, beta_30d: 1.05, sector: 'Finance', sparkline: generateSparkline(198, 0.01) },
  { ticker: 'GS', asset_type: 'EQUITY', price: 459.30, change_pct_1h: -0.7, change_pct_24h: -1.5, volume_24h: 2400000, atr_14: 9.2, beta_30d: 1.22, sector: 'Finance', sparkline: generateSparkline(462, 0.012) },
  { ticker: 'BTC', asset_type: 'CRYPTO', price: 67820, change_pct_1h: 0.8, change_pct_24h: 2.4, volume_24h: 38500000000, atr_14: 2200, beta_30d: 1.0, sector: 'Crypto', sparkline: generateSparkline(67500, 0.02) },
  { ticker: 'ETH', asset_type: 'CRYPTO', price: 3420, change_pct_1h: -1.2, change_pct_24h: -3.5, volume_24h: 18200000000, atr_14: 125, beta_30d: 1.15, sector: 'Crypto', sparkline: generateSparkline(3450, 0.025) },
  { ticker: 'SOL', asset_type: 'CRYPTO', price: 146.50, change_pct_1h: -2.1, change_pct_24h: -5.8, volume_24h: 3200000000, atr_14: 8.5, beta_30d: 1.45, sector: 'Crypto', sparkline: generateSparkline(148, 0.035) },
  { ticker: 'GOLD', asset_type: 'COMMODITY', price: 2348, change_pct_1h: 0.4, change_pct_24h: 1.2, volume_24h: 180000000, atr_14: 22, beta_30d: -0.15, sector: 'Commodities', sparkline: generateSparkline(2340, 0.008) },
  { ticker: 'OIL', asset_type: 'COMMODITY', price: 84.60, change_pct_1h: 2.8, change_pct_24h: 5.2, volume_24h: 420000000, atr_14: 2.1, beta_30d: 0.35, sector: 'Commodities', sparkline: generateSparkline(82, 0.025) },
];

// ─── Simulated Trade Candidates ──────────────────────────────────────────────

export const SEED_TRADE_CANDIDATES: TradeCandidate[] = [
  {
    id: uuid(), signal_id: SEED_SIGNALS[0].id, generated_at: new Date().toISOString(), status: 'ACTIVE',
    asset: 'NVDA', asset_type: 'EQUITY', direction: 'SHORT',
    expected_move_pct: -4.5, move_range_low_pct: -2.25, move_range_high_pct: -8.1, time_horizon: '2 days', time_horizon_hours: 48,
    entry_zone_low: 870, entry_zone_high: 880, entry_mid: 875,
    stop_loss: 905, target_1: 840, target_2: 810, target_3: 785,
    risk_reward_ratio: 3.2, stop_distance_pct: 0.034, confidence: 0.82,
    thesis: 'Taiwan geopolitical escalation reduces TSMC supply availability, directly impacting NVIDIA\'s H100 production pipeline. Semiconductor supply fear will reprice NVDA toward its 30-day support range. Key invalidation: de-escalation statement from PLA.',
    catalyst_event_id: SEED_EVENTS[0].id, chain_path: ['TAIWAN_CRISIS', 'SEMICONDUCTORS', 'NVDA'],
    catalyst_decay_time: new Date(Date.now() + 172800000).toISOString(),
    risk_factors: ['De-escalation news', 'NVDA earnings beat guidance', 'Fed liquidity injection overrides risk-off'],
    recommended_position_size_pct: 5, recommended_position_size_usd: 250,
    risk_guard_status: 'APPROVED', risk_guard_message: '✓ All risk checks passed', rank_score: 0.84,
  },
  {
    id: uuid(), signal_id: SEED_SIGNALS[2].id, generated_at: new Date().toISOString(), status: 'ACTIVE',
    asset: 'XOM', asset_type: 'EQUITY', direction: 'LONG',
    expected_move_pct: 3.8, move_range_low_pct: 1.9, move_range_high_pct: 6.84, time_horizon: '3 days', time_horizon_hours: 72,
    entry_zone_low: 112.5, entry_zone_high: 114.8, entry_mid: 113.65,
    stop_loss: 109.2, target_1: 117.5, target_2: 119.8, target_3: 122.5,
    risk_reward_ratio: 2.8, stop_distance_pct: 0.039, confidence: 0.79,
    thesis: 'Strait of Hormuz disruption creates immediate supply squeeze on crude oil. ExxonMobil benefits from rising crude prices and domestic production advantage. Key invalidation: rapid de-escalation or SPR release.',
    catalyst_event_id: SEED_EVENTS[2].id, chain_path: ['OIL_SHOCK', 'ENERGY_SECTOR', 'XOM'],
    catalyst_decay_time: new Date(Date.now() + 259200000).toISOString(),
    risk_factors: ['Rapid de-escalation in Hormuz', 'Strategic Petroleum Reserve release', 'Global demand downturn overshadows supply fear'],
    recommended_position_size_pct: 4.8, recommended_position_size_usd: 240,
    risk_guard_status: 'APPROVED', risk_guard_message: '✓ All risk checks passed', rank_score: 0.78,
  },
  {
    id: uuid(), signal_id: SEED_SIGNALS[1].id, generated_at: new Date().toISOString(), status: 'ACTIVE',
    asset: 'BTC', asset_type: 'CRYPTO', direction: 'LONG',
    expected_move_pct: 5.2, move_range_low_pct: 2.6, move_range_high_pct: 9.36, time_horizon: '7 days', time_horizon_hours: 168,
    entry_zone_low: 67200, entry_zone_high: 68200, entry_mid: 67700,
    stop_loss: 64500, target_1: 71200, target_2: 73800, target_3: 78500,
    risk_reward_ratio: 2.4, stop_distance_pct: 0.047, confidence: 0.74,
    thesis: 'Federal Reserve dovish pivot signals looser monetary conditions, historically correlated with digital asset appreciation. Bitcoin hash rate at all-time highs confirms network strength. Key invalidation: hawkish reversal or regulatory crackdown.',
    catalyst_event_id: SEED_EVENTS[1].id, chain_path: ['FED_RATE_CUT', 'BTC'],
    catalyst_decay_time: new Date(Date.now() + 604800000).toISOString(),
    risk_factors: ['Hawkish Fed reversal', 'Major exchange insolvency', 'Regulatory crackdown announcement'],
    recommended_position_size_pct: 3.5, recommended_position_size_usd: 175,
    risk_guard_status: 'APPROVED', risk_guard_message: '✓ All risk checks passed', rank_score: 0.72,
  },
  {
    id: uuid(), signal_id: SEED_SIGNALS[3].id, generated_at: new Date().toISOString(), status: 'ACTIVE',
    asset: 'ETH', asset_type: 'CRYPTO', direction: 'SHORT',
    expected_move_pct: -6.2, move_range_low_pct: -3.1, move_range_high_pct: -11.16, time_horizon: '1 day', time_horizon_hours: 24,
    entry_zone_low: 3380, entry_zone_high: 3440, entry_mid: 3410,
    stop_loss: 3580, target_1: 3220, target_2: 3050, target_3: 2880,
    risk_reward_ratio: 2.6, stop_distance_pct: 0.050, confidence: 0.76,
    thesis: 'SEC enforcement action targeting major crypto exchange creates systemic contagion risk. Ethereum faces disproportionate selling pressure due to DeFi protocol exposure. Key invalidation: enforcement scope limited to single entity.',
    catalyst_event_id: SEED_EVENTS[4].id, chain_path: ['CRYPTO_REGULATION', 'ETH'],
    catalyst_decay_time: new Date(Date.now() + 86400000).toISOString(),
    risk_factors: ['Enforcement limited to single exchange', 'ETH ETF approval news overrides', 'DeFi TVL resilience signals market confidence'],
    recommended_position_size_pct: 4.2, recommended_position_size_usd: 210,
    risk_guard_status: 'WARNING', risk_guard_message: '⚠ Correlated with BTC position', rank_score: 0.75,
  },
  {
    id: uuid(), signal_id: SEED_SIGNALS[0].id, generated_at: new Date().toISOString(), status: 'ACTIVE',
    asset: 'LMT', asset_type: 'EQUITY', direction: 'LONG',
    expected_move_pct: 3.2, move_range_low_pct: 1.6, move_range_high_pct: 5.76, time_horizon: '5 days', time_horizon_hours: 120,
    entry_zone_low: 467, entry_zone_high: 474, entry_mid: 470.5,
    stop_loss: 452, target_1: 485, target_2: 495, target_3: 510,
    risk_reward_ratio: 2.5, stop_distance_pct: 0.039, confidence: 0.70,
    thesis: 'Taiwan crisis escalation historically drives defense sector outperformance. Lockheed Martin benefits from increased defense budget expectations and Pacific theater spending. Key invalidation: rapid diplomatic resolution.',
    catalyst_event_id: SEED_EVENTS[0].id, chain_path: ['TAIWAN_CRISIS', 'DEFENSE_SECTOR', 'LMT'],
    catalyst_decay_time: new Date(Date.now() + 432000000).toISOString(),
    risk_factors: ['Diplomatic resolution removes premium', 'Defense budget cuts override', 'Sector rotation out of defensive plays'],
    recommended_position_size_pct: 3.0, recommended_position_size_usd: 150,
    risk_guard_status: 'APPROVED', risk_guard_message: '✓ All risk checks passed', rank_score: 0.68,
  },
  {
    id: uuid(), signal_id: SEED_SIGNALS[4].id, generated_at: new Date().toISOString(), status: 'ACTIVE',
    asset: 'AAPL', asset_type: 'EQUITY', direction: 'SHORT',
    expected_move_pct: -3.5, move_range_low_pct: -1.75, move_range_high_pct: -6.3, time_horizon: '5 days', time_horizon_hours: 120,
    entry_zone_low: 190, entry_zone_high: 193, entry_mid: 191.5,
    stop_loss: 198, target_1: 185, target_2: 180, target_3: 175,
    risk_reward_ratio: 2.2, stop_distance_pct: 0.034, confidence: 0.68,
    thesis: 'Additional 25% tariffs on Chinese electronics directly impact Apple\'s $68B China revenue and Zhengzhou manufacturing base. Margin compression expected as Apple absorbs tariff costs to maintain market share. Key invalidation: trade deal framework or tariff exemption.',
    catalyst_event_id: SEED_EVENTS[5].id, chain_path: ['CHINA_TARIFF', 'AAPL'],
    catalyst_decay_time: new Date(Date.now() + 432000000).toISOString(),
    risk_factors: ['Trade deal resolution', 'India manufacturing ramp offsets China risk', 'Services revenue beats override hardware concern'],
    recommended_position_size_pct: 2.8, recommended_position_size_usd: 140,
    risk_guard_status: 'APPROVED', risk_guard_message: '✓ All risk checks passed', rank_score: 0.65,
  },
];

// ─── Simulated Open Trades ───────────────────────────────────────────────────

export const SEED_TRADES: Trade[] = [
  {
    id: uuid(), candidate_id: SEED_TRADE_CANDIDATES[0].id, signal_id: SEED_SIGNALS[0].id,
    asset: 'TSM', direction: 'SHORT', entry_price: 166.20, stop_loss: 172, target_1: 155, target_2: 148,
    position_size_usd: 200, status: 'OPEN', opened_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: uuid(), candidate_id: SEED_TRADE_CANDIDATES[1].id, signal_id: SEED_SIGNALS[2].id,
    asset: 'OIL', direction: 'LONG', entry_price: 83.20, stop_loss: 80.50, target_1: 87.5, target_2: 90,
    position_size_usd: 180, status: 'OPEN', opened_at: new Date(Date.now() - 7200000).toISOString(),
  },
];

// ─── Simulated Account State ─────────────────────────────────────────────────

export const SEED_ACCOUNT_STATE: AccountState = {
  account_size_usd: 5000,
  cash_available_usd: 4620,
  peak_value_usd: 5120,
  current_drawdown: 0.012,
  daily_pnl_usd: 42.50,
  daily_risk_used_pct: 0.023,
  open_position_count: 2,
};

// ─── Simulated Alerts ────────────────────────────────────────────────────────

export const SEED_ALERTS: Alert[] = [
  {
    id: uuid(), level: 4, event_id: SEED_EVENTS[0].id, signal_id: SEED_SIGNALS[0].id,
    asset: 'NVDA', message: 'TAIWAN STRAIT VESSEL DENSITY UP 340% — NVDA SHORT SIGNAL 0.88',
    timestamp: new Date(Date.now() - 1800000).toISOString(), delivered: true, channels: ['DESKTOP', 'ANDROID', 'TELEGRAM'],
  },
  {
    id: uuid(), level: 3, event_id: SEED_EVENTS[2].id, signal_id: SEED_SIGNALS[2].id,
    asset: 'OIL', message: 'HORMUZ DISRUPTION — OIL LONG SIGNAL 0.82 — R/R 2.8x',
    timestamp: new Date(Date.now() - 7200000).toISOString(), delivered: true, channels: ['DESKTOP', 'ANDROID', 'TELEGRAM'],
  },
  {
    id: uuid(), level: 3, event_id: SEED_EVENTS[4].id, signal_id: SEED_SIGNALS[3].id,
    asset: 'ETH', message: 'SEC ENFORCEMENT — ETH SHORT SIGNAL 0.79 — R/R 2.6x',
    timestamp: new Date(Date.now() - 5400000).toISOString(), delivered: true, channels: ['DESKTOP', 'ANDROID'],
  },
  {
    id: uuid(), level: 2, event_id: SEED_EVENTS[1].id,
    message: 'FED DOVISH SIGNAL — Rate cut probability rising — monitoring BTC, GOLD',
    timestamp: new Date(Date.now() - 3600000).toISOString(), delivered: true, channels: ['DESKTOP', 'ANDROID'],
  },
  {
    id: uuid(), level: 2, event_id: SEED_EVENTS[5].id,
    asset: 'AAPL', message: 'CHINA TARIFF ESCALATION — AAPL exposure $68B China revenue',
    timestamp: new Date(Date.now() - 600000).toISOString(), delivered: true, channels: ['DESKTOP'],
  },
  {
    id: uuid(), level: 1,
    message: 'UK GDP growth revised to 1.1% — below consensus',
    timestamp: new Date(Date.now() - 14400000).toISOString(), delivered: true, channels: ['DESKTOP'],
  },
];

// ─── Helper to get node ID by name ───────────────────────────────────────────
export const getNodeIdByName = (name: string): string => nodeIds[name] || '';
