// ============================================================================
// NEBULA NODE — MODEL ROUTER & PROMPT TEMPLATES (Section 7)
// Ollama integration with model loading/unloading strategy.
// Falls back to simulated AI responses when Ollama is unavailable.
// ============================================================================

import { MODEL_CONFIG } from '../config';

// ─── Section 7.4: Prompt Templates ──────────────────────────────────────────

export const PROMPTS = {
  THESIS_GENERATION: `You are a concise financial intelligence analyst.
Given the following event and market impact analysis, write a 3-sentence
trade thesis. Be direct. State: (1) the catalyst, (2) the expected market
move, (3) the key invalidation risk. No hedging language. No "could" or "might".

Event: {event_summary}
Impact chain: {chain_path}
Asset: {asset}
Direction: {direction}
Expected move: {expected_move_pct}% over {time_horizon}
Signal score: {signal_score}

Write the thesis now:`,

  RISK_FACTOR: `You are a risk analyst. List exactly 3 specific risk factors that would
invalidate the following trade thesis. Be specific to the asset and situation.
Format: numbered list, one line each. No generic risks.

Trade thesis: {thesis}
Asset: {asset}
Direction: {direction}
Catalyst: {event_summary}

3 invalidation risks:`,

  CHAIN_ANALYSIS: `You are an expert in market contagion analysis.
Given this triggering event, identify which downstream assets are most
likely to be affected and explain the transmission mechanism in 2 sentences
per asset. Focus on assets that are non-obvious — the first-order effects
are already known.

Event: {event_summary}
Direct impact assets already identified: {direct_impacts}
Propagation depth requested: {depth}

Identify 3 non-obvious downstream impacts:`,
};

// ─── Pre-generated Thesis Library (fallback when Ollama unavailable) ─────────

const THESIS_LIBRARY: Record<string, Record<string, string>> = {
  NVDA: {
    SHORT: 'Taiwan geopolitical escalation reduces TSMC supply availability, directly impacting NVIDIA\'s H100 production pipeline. Semiconductor supply fear will reprice NVDA toward its 30-day support range. Key invalidation: de-escalation statement from PLA or emergency TSMC capacity reallocation.',
    LONG: 'AI infrastructure demand surge drives NVIDIA datacenter revenue above consensus estimates. Hyperscaler CapEx acceleration provides multi-quarter tailwind for GPU orders. Key invalidation: major cloud provider CapEx cut or competitive GPU breakthrough.',
  },
  BTC: {
    LONG: 'Federal Reserve dovish pivot signals looser monetary conditions, historically correlated with digital asset appreciation. Bitcoin hash rate hitting all-time highs confirms network strength and miner confidence. Key invalidation: regulatory crackdown announcement or major exchange insolvency.',
    SHORT: 'Regulatory enforcement action targeting major crypto infrastructure creates systemic contagion risk. Exchange outflows accelerating as institutional holders de-risk ahead of enforcement deadline. Key invalidation: regulatory clarity providing compliance framework.',
  },
  AAPL: {
    SHORT: 'China retaliatory tariffs targeting US consumer electronics create margin compression for Apple\'s hardware segment. Supply chain disruption in Zhengzhou adds 4-6 week production delays. Key invalidation: trade deal breakthrough or supply chain diversification to India.',
    LONG: 'iPhone replacement cycle acceleration driven by AI-enabled features creates pent-up demand exceeding consensus estimates. Services revenue growth rate re-accelerating above 20% YoY. Key invalidation: consumer spending downturn or antitrust ruling impacting App Store.',
  },
  GOLD: {
    LONG: 'Central bank gold accumulation reaches highest level since 1967 as de-dollarization accelerates. Negative real yields make gold\'s zero-yield increasingly attractive for institutional allocation. Key invalidation: surprise Fed rate hike or strong USD rally above DXY 108.',
    SHORT: 'Risk-on rotation triggered by ceasefire agreement reduces safe-haven demand across precious metals. Real yields turning positive as inflation normalizes faster than expected. Key invalidation: geopolitical escalation or inflation surprise to the upside.',
  },
};

const RISK_FACTORS_LIBRARY: Record<string, string[]> = {
  NVDA: ['De-escalation news reverses geopolitical risk premium', 'NVDA earnings beat with raised guidance overrides macro fear', 'Fed liquidity injection overwhelms risk-off sentiment'],
  BTC: ['Regulatory clarity provides bullish framework', 'Major institutional adoption announcement', 'Stablecoin de-peg or exchange hack creates contagion'],
  AAPL: ['Trade deal resolution removes tariff overhang', 'Stronger-than-expected iPhone demand in emerging markets', 'Services revenue miss on antitrust regulatory action'],
  GOLD: ['Risk-on rotation reduces safe-haven demand', 'USD strength driven by hawkish Fed surprise', 'Crypto as alternative safe-haven siphons flows'],
  DEFAULT: ['Unexpected policy reversal or de-escalation', 'Earnings beat overrides macro sentiment', 'Liquidity injection dampens risk-off flow'],
};

// ─── Section 7.3: Model Router ──────────────────────────────────────────────

type ModelState = 'LOADED' | 'UNLOADED' | 'LOADING';

export class ModelRouter {
  private modelStates: Map<string, ModelState> = new Map();
  private ollamaAvailable: boolean = false;

  constructor() {
    this.modelStates.set(MODEL_CONFIG.MODELS.EMBEDDINGS, 'UNLOADED');
    this.modelStates.set(MODEL_CONFIG.MODELS.PRIMARY, 'UNLOADED');
    this.modelStates.set(MODEL_CONFIG.MODELS.SECONDARY, 'UNLOADED');
    this.checkOllamaAvailability();
  }

  private async checkOllamaAvailability(): Promise<void> {
    try {
      const response = await fetch(`${MODEL_CONFIG.OLLAMA_BASE_URL}/api/tags`, {
        signal: AbortSignal.timeout(3000),
      });
      this.ollamaAvailable = response.ok;
    } catch {
      this.ollamaAvailable = false;
    }
  }

  private async callOllama(model: string, prompt: string): Promise<string | null> {
    if (!this.ollamaAvailable) return null;

    for (let attempt = 0; attempt <= MODEL_CONFIG.OLLAMA_RETRIES; attempt++) {
      try {
        const response = await fetch(`${MODEL_CONFIG.OLLAMA_BASE_URL}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model, prompt, stream: false }),
          signal: AbortSignal.timeout(MODEL_CONFIG.OLLAMA_TIMEOUT),
        });
        if (response.ok) {
          const data = await response.json();
          return data.response || null;
        }
      } catch {
        if (attempt < MODEL_CONFIG.OLLAMA_RETRIES) {
          await new Promise(r => setTimeout(r, MODEL_CONFIG.OLLAMA_BACKOFF));
        }
      }
    }
    return null;
  }

  private fillTemplate(template: string, vars: Record<string, string>): string {
    let result = template;
    for (const [key, value] of Object.entries(vars)) {
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }
    return result;
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  async generateThesis(
    asset: string,
    direction: string,
    eventSummary: string,
    chainPath: string[],
    expectedMovePct: number,
    timeHorizon: string,
    signalScore: number
  ): Promise<string> {
    const prompt = this.fillTemplate(PROMPTS.THESIS_GENERATION, {
      event_summary: eventSummary,
      chain_path: chainPath.join(' → '),
      asset,
      direction,
      expected_move_pct: expectedMovePct.toFixed(1),
      time_horizon: timeHorizon,
      signal_score: signalScore.toFixed(2),
    });

    const ollamaResult = await this.callOllama(MODEL_CONFIG.MODELS.PRIMARY, prompt);
    if (ollamaResult) return ollamaResult;

    // Fallback: use pre-generated thesis
    const dir = direction === 'LONG' || direction === '1' ? 'LONG' : 'SHORT';
    return THESIS_LIBRARY[asset]?.[dir]
      || THESIS_LIBRARY.NVDA[dir]
      || `${asset} ${dir.toLowerCase()} setup driven by ${eventSummary}. Expected ${Math.abs(expectedMovePct).toFixed(1)}% move over ${timeHorizon}.`;
  }

  async generateRiskFactors(
    asset: string,
    direction: string,
    thesis: string,
    eventSummary: string
  ): Promise<string[]> {
    const prompt = this.fillTemplate(PROMPTS.RISK_FACTOR, {
      thesis,
      asset,
      direction,
      event_summary: eventSummary,
    });

    const ollamaResult = await this.callOllama(MODEL_CONFIG.MODELS.PRIMARY, prompt);
    if (ollamaResult) {
      // Parse numbered list
      const lines = ollamaResult.split('\n').filter(l => l.trim().match(/^\d/));
      if (lines.length >= 3) return lines.slice(0, 3).map(l => l.replace(/^\d+[\.\)]\s*/, ''));
    }

    return RISK_FACTORS_LIBRARY[asset] || RISK_FACTORS_LIBRARY.DEFAULT;
  }

  isOllamaAvailable(): boolean {
    return this.ollamaAvailable;
  }

  getModelState(model: string): ModelState {
    return this.modelStates.get(model) || 'UNLOADED';
  }
}
