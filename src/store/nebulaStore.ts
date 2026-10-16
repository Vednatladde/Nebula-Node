// ============================================================================
// NEBULA NODE — ZUSTAND STORE
// Central state management for all panels and engine data.
// ============================================================================

import { create } from 'zustand';
import type {
  ScoredSignal, TradeCandidate, Trade, AccountState, Alert,
  MarketData, ImpactNode, GraphNode, GraphEdge, NebEvent,
  SignalCategory, DrawdownState,
} from '../core/types';
import { PropagationEngine } from '../core/propagation/PropagationEngine';
import { RiskEngine } from '../core/risk/RiskEngine';
import {
  SEED_SIGNALS, SEED_TRADE_CANDIDATES, SEED_TRADES, SEED_ACCOUNT_STATE,
  SEED_ALERTS, SEED_MARKET_DATA, SEED_GRAPH_NODES, SEED_GRAPH_EDGES,
  SEED_EVENTS,
} from '../core/seedData';

// ─── Store Interface ─────────────────────────────────────────────────────────

interface NebulaStore {
  // Auth
  authenticated: boolean;
  authStep: 'WORD_KEY' | 'CHALLENGE' | 'PASSKEY' | 'AUTHENTICATED';
  failedAttempts: number;
  lockoutUntil: number | null;
  sessionToken: string | null;
  setAuthenticated: (val: boolean) => void;
  setAuthStep: (step: 'WORD_KEY' | 'CHALLENGE' | 'PASSKEY' | 'AUTHENTICATED') => void;
  incrementFailedAttempts: () => void;
  resetAuth: () => void;
  setLockout: (until: number) => void;

  // Events
  events: NebEvent[];

  // Signals
  signals: ScoredSignal[];
  selectedSignalId: string | null;
  signalFilter: SignalCategory | 'ALL';
  signalSort: 'score' | 'confidence' | 'time' | 'rr';
  selectSignal: (id: string | null) => void;
  setSignalFilter: (filter: SignalCategory | 'ALL') => void;
  setSignalSort: (sort: 'score' | 'confidence' | 'time' | 'rr') => void;

  // Trade Candidates
  tradeCandidates: TradeCandidate[];
  selectedCandidateId: string | null;
  selectCandidate: (id: string | null) => void;

  // Open Trades
  trades: Trade[];

  // Account State
  accountState: AccountState;
  drawdownState: DrawdownState;

  // Alerts
  alerts: Alert[];
  addAlert: (alert: Alert) => void;

  // Market Data
  marketData: MarketData[];
  getMarketDataMap: () => Map<string, MarketData>;

  // Graph
  graphNodes: GraphNode[];
  graphEdges: GraphEdge[];
  propagationResults: ImpactNode[];
  selectedEventNodeId: string | null;
  graphDepth: number;
  graphMinImpact: number;
  selectEventNode: (id: string | null) => void;
  setGraphDepth: (depth: number) => void;
  setGraphMinImpact: (min: number) => void;
  runPropagation: (eventNodeId: string, severity: number) => void;

  // Engines
  propagationEngine: PropagationEngine | null;
  riskEngine: RiskEngine | null;

  // Right panel tab
  rightPanelTab: 'TRADES' | 'RISK';
  setRightPanelTab: (tab: 'TRADES' | 'RISK') => void;

  // Bottom panel tab
  bottomPanelTab: 'WATCHLIST' | 'HEATMAP';
  setBottomPanelTab: (tab: 'WATCHLIST' | 'HEATMAP') => void;

  // UTC clock
  utcTime: string;
  updateUtcTime: () => void;

  // System status
  nodeStatus: 'STANDALONE' | 'CONNECTED';
  ollamaStatus: boolean;

  // Initialize
  initialize: () => void;
}

// ─── Store Implementation ────────────────────────────────────────────────────

export const useNebulaStore = create<NebulaStore>((set, get) => ({
  // Auth
  authenticated: false,
  authStep: 'WORD_KEY',
  failedAttempts: 0,
  lockoutUntil: null,
  sessionToken: null,
  setAuthenticated: (val) => set({ authenticated: val, authStep: val ? 'AUTHENTICATED' : 'WORD_KEY' }),
  setAuthStep: (step) => set({ authStep: step }),
  incrementFailedAttempts: () => set(s => ({ failedAttempts: s.failedAttempts + 1 })),
  resetAuth: () => set({ failedAttempts: 0, lockoutUntil: null, authStep: 'WORD_KEY' }),
  setLockout: (until) => set({ lockoutUntil: until }),

  // Events
  events: SEED_EVENTS,

  // Signals
  signals: SEED_SIGNALS,
  selectedSignalId: null,
  signalFilter: 'ALL',
  signalSort: 'score',
  selectSignal: (id) => {
    set({ selectedSignalId: id });
    // Auto-run propagation when signal selected
    if (id) {
      const signal = get().signals.find(s => s.id === id);
      if (signal) {
        const event = get().events.find(e => e.id === signal.event_id);
        if (event) {
          const nodes = get().graphNodes;
          const eventNodeTypes = new Set(['COUNTRY', 'MACRO', 'COMMODITY']);
          let eventNodeId: string | null = null;

          // Strategy 1: Use trade candidate chain_path — root element is the event node
          const candidates = get().tradeCandidates.filter(c => c.signal_id === id);
          if (candidates.length > 0) {
            const rootName = candidates[0].chain_path[0];
            const node = nodes.find(n => n.name === rootName);
            if (node) eventNodeId = node.id;
          }

          // Strategy 2: Map source_type to known event nodes
          if (!eventNodeId) {
            const typeNodeMap: Record<string, string> = {
              GEO: 'TAIWAN_CRISIS',
              MACRO: 'FED_RATE_CUT',
              SHIPPING: 'OIL_SHOCK',
              NEWS: 'CRYPTO_REGULATION',
              MARKET: 'TAIWAN_CRISIS',
            };
            const nodeName = typeNodeMap[event.source_type];
            if (nodeName) {
              const node = nodes.find(n => n.name === nodeName);
              if (node) eventNodeId = node.id;
            }
          }

          // Strategy 3: Match asset tags but only to event-type nodes (not assets)
          if (!eventNodeId) {
            for (const tag of event.asset_tags) {
              const node = nodes.find(n => n.name === tag && eventNodeTypes.has(n.node_type));
              if (node) { eventNodeId = node.id; break; }
            }
          }

          if (eventNodeId) {
            get().runPropagation(eventNodeId, event.normalized_value * 10);
          }
        }
      }
    }
  },
  setSignalFilter: (filter) => set({ signalFilter: filter }),
  setSignalSort: (sort) => set({ signalSort: sort }),

  // Trade Candidates
  tradeCandidates: SEED_TRADE_CANDIDATES,
  selectedCandidateId: null,
  selectCandidate: (id) => set({ selectedCandidateId: id }),

  // Open Trades
  trades: SEED_TRADES,

  // Account State
  accountState: SEED_ACCOUNT_STATE,
  drawdownState: 'NORMAL',

  // Alerts
  alerts: SEED_ALERTS,
  addAlert: (alert) => set(s => ({ alerts: [alert, ...s.alerts] })),

  // Market Data
  marketData: SEED_MARKET_DATA,
  getMarketDataMap: () => {
    const map = new Map<string, MarketData>();
    for (const d of get().marketData) {
      map.set(d.ticker, d);
    }
    return map;
  },

  // Graph
  graphNodes: SEED_GRAPH_NODES,
  graphEdges: SEED_GRAPH_EDGES,
  propagationResults: [],
  selectedEventNodeId: null,
  graphDepth: 3,
  graphMinImpact: 0.01,
  selectEventNode: (id) => set({ selectedEventNodeId: id }),
  setGraphDepth: (depth) => set({ graphDepth: depth }),
  setGraphMinImpact: (min) => set({ graphMinImpact: min }),

  runPropagation: (eventNodeId, severity) => {
    const engine = get().propagationEngine;
    if (!engine) return;

    const results = engine.propagate(eventNodeId, severity, get().graphDepth);
    set({
      propagationResults: results,
      selectedEventNodeId: eventNodeId,
    });
  },

  // Engines
  propagationEngine: null,
  riskEngine: null,

  // Panel tabs
  rightPanelTab: 'TRADES',
  setRightPanelTab: (tab) => set({ rightPanelTab: tab }),
  bottomPanelTab: 'WATCHLIST',
  setBottomPanelTab: (tab) => set({ bottomPanelTab: tab }),

  // UTC clock
  utcTime: new Date().toISOString().slice(11, 19),
  updateUtcTime: () => set({ utcTime: new Date().toISOString().slice(11, 19) }),

  // System status
  nodeStatus: 'STANDALONE',
  ollamaStatus: false,

  // Initialize
  initialize: () => {
    const engine = new PropagationEngine(SEED_GRAPH_NODES, SEED_GRAPH_EDGES);
    const riskEngine = new RiskEngine();

    // Run initial propagation from Taiwan crisis
    const taiwanNode = SEED_GRAPH_NODES.find(n => n.name === 'TAIWAN_CRISIS');
    let initialResults: ImpactNode[] = [];
    if (taiwanNode) {
      initialResults = engine.propagate(taiwanNode.id, 9.2, 3);
    }

    set({
      propagationEngine: engine,
      riskEngine,
      propagationResults: initialResults,
      selectedEventNodeId: taiwanNode?.id || null,
    });
  },
}));
