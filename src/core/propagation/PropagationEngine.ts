// ============================================================================
// NEBULA NODE — PROPAGATION ENGINE (Section 1)
// Complete implementation of the market impact propagation mathematics.
// BFS traversal through dependency graph with time decay, hop attenuation,
// and multi-source aggregation.
// ============================================================================

import { PROPAGATION_CONFIG } from '../config';
import type {
  GraphNode, GraphEdge, ImpactNode, DelayCategory, TimeWindow
} from '../types';

// ─── Delay category to time window mapping ──────────────────────────────────

const DELAY_TO_WINDOW: Record<DelayCategory, TimeWindow> = {
  MINUTES: 'minutes',
  HOURS: 'hours',
  DAYS: 'days',
  WEEKS: 'weeks',
};

// ─── The Propagation Engine ──────────────────────────────────────────────────

export class PropagationEngine {
  private nodes: Map<string, GraphNode>;
  private edges: Map<string, GraphEdge[]>; // from_node_id → edges
  private edgeMap: Map<string, GraphEdge>; // edge_id → edge

  constructor(nodes: GraphNode[], edges: GraphEdge[]) {
    this.nodes = new Map(nodes.map(n => [n.id, n]));
    this.edges = new Map();
    this.edgeMap = new Map();

    for (const edge of edges) {
      if (!this.edges.has(edge.from_node_id)) {
        this.edges.set(edge.from_node_id, []);
      }
      this.edges.get(edge.from_node_id)!.push(edge);
      this.edgeMap.set(edge.id, edge);
    }
  }

  // ─── Section 1.1: Core Propagation Formula ────────────────────────────────
  //   impact_strength = event_severity * edge_probability * historical_magnitude

  private calculateImpactStrength(
    eventSeverity: number,
    edgeProbability: number,
    historicalMagnitude: number
  ): number {
    return eventSeverity * edgeProbability * historicalMagnitude;
  }

  // ─── Section 1.2: Time Decay Function ─────────────────────────────────────
  //   time_decay = e^(-delay_factor * elapsed_time)

  private calculateTimeDecay(
    delayCategory: DelayCategory,
    elapsedHours: number
  ): number {
    const delayFactor = PROPAGATION_CONFIG.DELAY_FACTORS[delayCategory];
    return Math.exp(-delayFactor * elapsedHours);
  }

  // ─── Section 1.4: Multi-Hop Attenuation ───────────────────────────────────
  //   hop_attenuation = attenuation_factor ^ hop_count

  private calculateHopAttenuation(
    attenuationFactor: number,
    hopCount: number
  ): number {
    return Math.pow(attenuationFactor, hopCount);
  }

  // ─── Section 1.5: Calculate Edge Impact ───────────────────────────────────
  //   Full formula with all terms:
  //   final_impact = event_severity * edge_probability * historical_magnitude
  //                * time_decay * hop_attenuation * direction

  calculateEdgeImpact(
    sourceNode: string,
    targetNode: string,
    incomingImpact: number,
    hopCount: number,
    elapsedHours: number
  ): number {
    const outEdges = this.edges.get(sourceNode) || [];
    const edge = outEdges.find(e => e.to_node_id === targetNode);
    if (!edge) return 0;

    const impactStrength = Math.abs(incomingImpact) * edge.probability * edge.magnitude_coeff;
    const timeDecay = this.calculateTimeDecay(edge.delay_category, elapsedHours);
    const hopAttenuation = this.calculateHopAttenuation(
      edge.attenuation_factor,
      hopCount
    );

    return impactStrength * timeDecay * hopAttenuation * edge.direction;
  }

  // ─── Section 1.3: Multi-Hop Aggregation ───────────────────────────────────
  //   node_impact = SUM of all incoming_edge_impacts (with directional cancellation)

  aggregateNodeImpacts(
    _node: string,
    incomingImpacts: number[]
  ): number {
    // Algebraic sum — opposing directions partially cancel
    return incomingImpacts.reduce((sum, impact) => sum + impact, 0);
  }

  // ─── Section 1.5: BFS Propagation ─────────────────────────────────────────
  //   Main entry point. Traverses dependency graph from event node.

  propagate(
    eventNodeId: string,
    eventSeverity: number,
    maxDepth: number = PROPAGATION_CONFIG.MAX_PROPAGATION_DEPTH,
    elapsedHours: number = 0
  ): ImpactNode[] {
    // Normalize severity to 0–1
    const normalizedSeverity = Math.min(
      1.0,
      eventSeverity / PROPAGATION_CONFIG.SEVERITY_CEILING
    );

    const results: ImpactNode[] = [];
    const visited = new Set<string>();

    // BFS queue: [nodeId, currentImpact, hopCount, path, cumulativeConfidence]
    type QueueItem = [string, number, number, string[], number];
    const queue: QueueItem[] = [[eventNodeId, normalizedSeverity, 0, [eventNodeId], 1.0]];

    while (queue.length > 0) {
      const [currentNodeId, currentImpact, hopCount, path, cumulativeConfidence] = queue.shift()!;

      if (hopCount > maxDepth) continue;
      if (visited.has(currentNodeId) && hopCount > 0) continue;
      visited.add(currentNodeId);

      const outEdges = this.edges.get(currentNodeId) || [];

      for (const edge of outEdges) {
        const targetNode = this.nodes.get(edge.to_node_id);
        if (!targetNode) continue;

        const nextHop = hopCount + 1;

        // Full propagation formula (Section 1.4)
        const impactStrength = this.calculateImpactStrength(
          Math.abs(currentImpact),
          edge.probability,
          edge.magnitude_coeff
        );

        const timeDecay = this.calculateTimeDecay(edge.delay_category, elapsedHours);
        const hopAttenuation = this.calculateHopAttenuation(
          edge.attenuation_factor,
          nextHop
        );

        const finalImpact = impactStrength * timeDecay * hopAttenuation * edge.direction;

        // Cutoff check (Section 1.4)
        if (Math.abs(finalImpact) < PROPAGATION_CONFIG.PROPAGATION_CUTOFF) continue;

        const newPath = [...path, targetNode.name];
        const newConfidence = cumulativeConfidence * edge.confidence;

        const impactNode: ImpactNode = {
          node_id: targetNode.id,
          node_name: targetNode.name,
          node_type: targetNode.node_type,
          final_impact: finalImpact,
          direction: finalImpact >= 0 ? 1 : -1,
          hop_count: nextHop,
          chain_path: newPath,
          confidence: newConfidence,
          elapsed_decay_factor: timeDecay,
          time_window: DELAY_TO_WINDOW[edge.delay_category],
        };

        results.push(impactNode);

        // Continue traversal
        if (nextHop < maxDepth) {
          queue.push([
            edge.to_node_id,
            finalImpact,
            nextHop,
            newPath,
            newConfidence,
          ]);
        }
      }
    }

    // Sort by absolute impact descending
    return results.sort((a, b) => Math.abs(b.final_impact) - Math.abs(a.final_impact));
  }

  // ─── Section 1.5: Update Historical Magnitude ─────────────────────────────
  //   EMA: new_magnitude = 0.8 * old + 0.2 * observed

  updateHistoricalMagnitude(edgeId: string, observedMagnitude: number): void {
    const edge = this.edgeMap.get(edgeId);
    if (!edge) return;

    edge.magnitude_coeff =
      (1 - PROPAGATION_CONFIG.EMA_ALPHA) * edge.magnitude_coeff +
      PROPAGATION_CONFIG.EMA_ALPHA * observedMagnitude;
  }

  // ─── Utility: Get graph data for D3 visualization ─────────────────────────

  getGraphData() {
    return {
      nodes: Array.from(this.nodes.values()),
      edges: Array.from(this.edgeMap.values()),
    };
  }

  getNode(id: string): GraphNode | undefined {
    return this.nodes.get(id);
  }
}
