// ============================================================================
// NEBULA NODE — NODE INTERFACE (Section 10)
// Inter-node communication for the Terminus Stellae Ruinae architecture.
// Implements NodeMessage protocol, heartbeat, and registration.
// ============================================================================

import { v4 as uuid } from 'uuid';
import { NODE_CONFIG } from '../config';
import type { NodeMessage, NodeName, MessageType, ScoredSignal, TradeCandidate } from '../types';

// ─── Section 10.2: Node Interface ────────────────────────────────────────────

export class NodeInterface {
  private nodeName: NodeName;
  private capabilities: string[];
  private registeredNodes: Map<NodeName, { capabilities: string[]; lastHeartbeat: number }> = new Map();
  private messageQueue: NodeMessage[] = [];
  private listeners: Map<string, ((msg: NodeMessage) => void)[]> = new Map();
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private standaloneMode: boolean = true;

  constructor() {
    this.nodeName = NODE_CONFIG.NODE_NAME;
    this.capabilities = NODE_CONFIG.CAPABILITIES;
  }

  // ─── Section 10.3: Startup Registration ───────────────────────────────────

  async initialize(): Promise<void> {
    // Step 1: Register self
    this.registerNode(this.nodeName, this.capabilities);

    // Step 2: Start heartbeat
    this.startHeartbeat();

    // Step 3: Subscribe to incoming channels
    this.subscribe(`tsr.node.tsr.to.${this.nodeName.toLowerCase()}`);
    this.subscribe(`tsr.node.aurora.to.${this.nodeName.toLowerCase()}`);

    // Step 4: Wait for other nodes (30 second timeout → standalone mode)
    await this.waitForNetwork();
  }

  private async waitForNetwork(): Promise<void> {
    return new Promise(resolve => {
      setTimeout(() => {
        if (this.registeredNodes.size <= 1) {
          this.standaloneMode = true;
          console.log('[NodeInterface] No other nodes detected. Operating in STANDALONE mode.');
        } else {
          this.standaloneMode = false;
          console.log(`[NodeInterface] Connected to ${this.registeredNodes.size - 1} other nodes.`);
        }
        resolve();
      }, NODE_CONFIG.STANDALONE_TIMEOUT);
    });
  }

  // ─── Registration ──────────────────────────────────────────────────────────

  registerNode(nodeName: NodeName, capabilities: string[]): void {
    this.registeredNodes.set(nodeName, {
      capabilities,
      lastHeartbeat: Date.now(),
    });
  }

  // ─── Heartbeat ─────────────────────────────────────────────────────────────

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.heartbeat();
    }, NODE_CONFIG.HEARTBEAT_INTERVAL);
  }

  heartbeat(): void {
    const msg = this.createMessage('TSR', 'HEARTBEAT', {
      node: this.nodeName,
      uptime: Date.now(),
      capabilities: this.capabilities,
      standalone: this.standaloneMode,
    }, 1, 120, false);

    this.messageQueue.push(msg);
  }

  // ─── Message Construction ──────────────────────────────────────────────────

  private createMessage(
    target: NodeName,
    type: MessageType,
    payload: Record<string, unknown>,
    priority: 1 | 2 | 3 | 4 = 2,
    ttl: number = 300,
    requiresAck: boolean = false
  ): NodeMessage {
    return {
      message_id: uuid(),
      source_node: this.nodeName,
      target_node: target,
      message_type: type,
      payload,
      priority,
      timestamp: new Date().toISOString(),
      ttl_seconds: ttl,
      requires_ack: requiresAck,
    };
  }

  // ─── Section 10.2: Publish Methods ─────────────────────────────────────────

  publishSignal(signal: ScoredSignal): void {
    const msg = this.createMessage('TSR', 'SIGNAL', {
      signal_id: signal.id,
      asset: signal.asset,
      score: signal.signal_score,
      direction: signal.direction,
      confidence: signal.confidence,
    }, 3, 3600, true);

    this.messageQueue.push(msg);
    this.emit(`tsr.node.nebula.to.tsr`, msg);
  }

  publishOpportunity(candidate: TradeCandidate): void {
    const msg = this.createMessage('PHALANX', 'OPPORTUNITY', {
      candidate_id: candidate.id,
      asset: candidate.asset,
      direction: candidate.direction,
      entry_mid: candidate.entry_mid,
      stop_loss: candidate.stop_loss,
      target_1: candidate.target_1,
      confidence: candidate.confidence,
      risk_reward: candidate.risk_reward_ratio,
    }, 3, 1800, true);

    this.messageQueue.push(msg);
    this.emit(`tsr.node.nebula.to.phalanx`, msg);
  }

  requestMacroContext(): Record<string, unknown> {
    // AURORA is not yet built — return default context
    return {
      regime: 'NORMAL',
      rate_cycle_stage: 'LATE_HIKE',
      recession_probability: 0.25,
      inflation_trajectory: 'DECLINING',
      vix_level: 22,
    };
  }

  receiveFromTSR(message: NodeMessage): void {
    // Handle incoming TSR commands
    console.log(`[NodeInterface] Received from TSR: ${message.message_type}`);
    this.emit(`tsr.node.tsr.to.nebula`, message);
  }

  // ─── Pub/Sub (Simulated Redis Pub/Sub) ─────────────────────────────────────

  private subscribe(channel: string): void {
    if (!this.listeners.has(channel)) {
      this.listeners.set(channel, []);
    }
  }

  private emit(channel: string, message: NodeMessage): void {
    const handlers = this.listeners.get(channel) || [];
    for (const handler of handlers) {
      handler(message);
    }
  }

  onMessage(channel: string, handler: (msg: NodeMessage) => void): void {
    if (!this.listeners.has(channel)) {
      this.listeners.set(channel, []);
    }
    this.listeners.get(channel)!.push(handler);
  }

  // ─── Utility ───────────────────────────────────────────────────────────────

  isStandalone(): boolean {
    return this.standaloneMode;
  }

  getRegisteredNodes(): Map<NodeName, { capabilities: string[]; lastHeartbeat: number }> {
    return new Map(this.registeredNodes);
  }

  getMessageQueue(): NodeMessage[] {
    return [...this.messageQueue];
  }

  destroy(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
  }
}
