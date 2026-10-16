// ============================================================================
// NEBULA NODE — CENTER PANEL: Propagation Graph (Section 4.4)
// D3.js force-directed graph visualization
// ============================================================================

import { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { useNebulaStore } from '../../store/nebulaStore';
import type { ImpactNode } from '../../core/types';

interface D3Node extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  type: string;
  impact: number;
  isOrigin: boolean;
  direction: number;
  hopCount: number;
}

interface D3Link extends d3.SimulationLinkDatum<D3Node> {
  probability: number;
  direction: number;
  impactStrength: number;
}

export function CenterPanel() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<d3.Simulation<D3Node, D3Link> | null>(null);

  const {
    graphNodes, graphEdges, propagationResults, selectedEventNodeId,
    graphDepth, graphMinImpact, setGraphDepth, setGraphMinImpact,
  } = useNebulaStore();

  // Build D3 data from propagation results
  const { nodes: d3Nodes, links: d3Links } = useMemo(() => {
    if (!selectedEventNodeId || propagationResults.length === 0) {
      // Default: show event nodes as pulsing overview
      const eventNodes = graphNodes.filter(n =>
        ['COUNTRY', 'MACRO', 'COMMODITY'].includes(n.node_type)
      );
      return {
        nodes: eventNodes.map(n => ({
          id: n.id,
          name: n.name,
          type: n.node_type,
          impact: 0.5,
          isOrigin: true,
          direction: 0,
          hopCount: 0,
        })),
        links: [] as D3Link[],
      };
    }

    const nodesMap = new Map<string, D3Node>();

    // Add origin node
    const originNode = graphNodes.find(n => n.id === selectedEventNodeId);
    if (originNode) {
      nodesMap.set(originNode.id, {
        id: originNode.id,
        name: originNode.name,
        type: originNode.node_type,
        impact: 1.0,
        isOrigin: true,
        direction: 0,
        hopCount: 0,
      });
    }

    // Add impact nodes
    const filteredResults = propagationResults.filter(
      r => Math.abs(r.final_impact) >= graphMinImpact && r.hop_count <= graphDepth
    );

    for (const result of filteredResults) {
      if (!nodesMap.has(result.node_id)) {
        nodesMap.set(result.node_id, {
          id: result.node_id,
          name: result.node_name,
          type: result.node_type,
          impact: Math.abs(result.final_impact),
          isOrigin: false,
          direction: result.direction,
          hopCount: result.hop_count,
        });
      }

      // Add intermediate nodes from chain path
      for (const nodeName of result.chain_path) {
        const matchingNode = graphNodes.find(n => n.name === nodeName);
        if (matchingNode && !nodesMap.has(matchingNode.id)) {
          nodesMap.set(matchingNode.id, {
            id: matchingNode.id,
            name: matchingNode.name,
            type: matchingNode.node_type,
            impact: Math.abs(result.final_impact) * 1.2,
            isOrigin: false,
            direction: result.direction,
            hopCount: Math.max(0, result.hop_count - 1),
          });
        }
      }
    }

    // Build links from edges that connect visible nodes
    const links: D3Link[] = [];
    for (const edge of graphEdges) {
      if (nodesMap.has(edge.from_node_id) && nodesMap.has(edge.to_node_id)) {
        links.push({
          source: edge.from_node_id,
          target: edge.to_node_id,
          probability: edge.probability,
          direction: edge.direction,
          impactStrength: edge.magnitude_coeff,
        });
      }
    }

    return {
      nodes: Array.from(nodesMap.values()),
      links,
    };
  }, [graphNodes, graphEdges, propagationResults, selectedEventNodeId, graphDepth, graphMinImpact]);

  // D3 force simulation
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;
    if (d3Nodes.length === 0) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('viewBox', `0 0 ${width} ${height}`);

    // Gradient definitions
    const defs = svg.append('defs');

    // Arrowhead marker
    defs.append('marker')
      .attr('id', 'arrowhead-pos')
      .attr('viewBox', '0 0 10 7')
      .attr('refX', 10).attr('refY', 3.5)
      .attr('markerWidth', 8).attr('markerHeight', 5)
      .attr('orient', 'auto')
      .append('path')
      .attr('fill', '#00cc66')
      .attr('d', 'M 0 0 L 10 3.5 L 0 7 z');

    defs.append('marker')
      .attr('id', 'arrowhead-neg')
      .attr('viewBox', '0 0 10 7')
      .attr('refX', 10).attr('refY', 3.5)
      .attr('markerWidth', 8).attr('markerHeight', 5)
      .attr('orient', 'auto')
      .append('path')
      .attr('fill', '#cc1a1a')
      .attr('d', 'M 0 0 L 10 3.5 L 0 7 z');

    // Glow filter
    const glow = defs.append('filter').attr('id', 'glow');
    glow.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'coloredBlur');
    const feMerge = glow.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    const g = svg.append('g');

    // Zoom
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });
    svg.call(zoom);

    // Force simulation
    const simulation = d3.forceSimulation<D3Node>(d3Nodes)
      .force('link', d3.forceLink<D3Node, D3Link>(d3Links)
        .id(d => d.id)
        .distance(120)
        .strength(0.4))
      .force('charge', d3.forceManyBody().strength(-350))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(d => getNodeRadius(d as D3Node) + 10));

    simulationRef.current = simulation;

    // Draw edges
    const link = g.append('g')
      .selectAll<SVGLineElement, D3Link>('line')
      .data(d3Links)
      .join('line')
      .attr('class', 'graph-edge__line')
      .attr('stroke', d => d.direction >= 0 ? '#00cc66' : '#cc1a1a')
      .attr('stroke-width', d => Math.max(1, d.probability * 3))
      .attr('stroke-opacity', 0.5)
      .attr('marker-end', d => d.direction >= 0 ? 'url(#arrowhead-pos)' : 'url(#arrowhead-neg)');

    // Draw nodes
    const nodeGroup = g.append('g')
      .selectAll<SVGGElement, D3Node>('g')
      .data(d3Nodes)
      .join('g')
      .attr('class', 'graph-node')
      .call(d3.drag<SVGGElement, D3Node>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
      );

    // Node circles
    nodeGroup.append('circle')
      .attr('class', 'graph-node__circle')
      .attr('r', d => getNodeRadius(d))
      .attr('fill', d => getNodeColor(d))
      .attr('filter', d => d.isOrigin ? 'url(#glow)' : 'none')
      .attr('stroke', d => d.isOrigin ? '#ff6b1a' : '#2a2a2a')
      .attr('stroke-width', d => d.isOrigin ? 2.5 : 1.5);

    // Pulse animation for origin node
    nodeGroup.filter(d => d.isOrigin)
      .append('circle')
      .attr('r', d => getNodeRadius(d) + 5)
      .attr('fill', 'none')
      .attr('stroke', '#ff6b1a')
      .attr('stroke-width', 1)
      .attr('opacity', 0)
      .append('animate')
      .attr('attributeName', 'r')
      .attr('from', (d: D3Node) => getNodeRadius(d))
      .attr('to', (d: D3Node) => getNodeRadius(d) + 20)
      .attr('dur', '2s')
      .attr('repeatCount', 'indefinite');

    nodeGroup.filter(d => d.isOrigin)
      .select('circle:last-child')
      .append('animate')
      .attr('attributeName', 'opacity')
      .attr('from', '0.6')
      .attr('to', '0')
      .attr('dur', '2s')
      .attr('repeatCount', 'indefinite');

    // Node labels
    nodeGroup.append('text')
      .attr('class', 'graph-node__label')
      .attr('dy', d => getNodeRadius(d) + 14)
      .text(d => d.name)
      .attr('fill', d => d.isOrigin ? '#ff6b1a' : '#aaa')
      .attr('font-size', d => d.isOrigin ? '11px' : '9px')
      .attr('font-weight', d => d.isOrigin ? '700' : '400');

    // Impact labels
    nodeGroup.filter(d => !d.isOrigin && d.impact > 0.01)
      .append('text')
      .attr('class', 'graph-node__label')
      .attr('dy', d => getNodeRadius(d) + 24)
      .text(d => `${d.direction >= 0 ? '+' : ''}${(d.impact * 100).toFixed(1)}%`)
      .attr('fill', d => d.direction >= 0 ? '#00cc66' : '#cc1a1a')
      .attr('font-size', '8px')
      .attr('font-weight', '600');

    // Tick update
    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as D3Node).x!)
        .attr('y1', d => (d.source as D3Node).y!)
        .attr('x2', d => (d.target as D3Node).x!)
        .attr('y2', d => (d.target as D3Node).y!);

      nodeGroup.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [d3Nodes, d3Links]);

  return (
    <div className="panel center-panel">
      <div className="graph-controls">
        <div className="graph-control-group">
          <span className="graph-control-label">Depth:</span>
          {[1, 2, 3, 4].map(d => (
            <button
              key={d}
              className={`graph-control-btn ${graphDepth === d ? 'graph-control-btn--active' : ''}`}
              onClick={() => setGraphDepth(d)}
            >{d}</button>
          ))}
        </div>

        <div className="graph-control-group">
          <span className="graph-control-label">Min:</span>
          {[0.01, 0.02, 0.05].map(m => (
            <button
              key={m}
              className={`graph-control-btn ${graphMinImpact === m ? 'graph-control-btn--active' : ''}`}
              onClick={() => setGraphMinImpact(m)}
            >{`>${(m * 100).toFixed(0)}%`}</button>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        <span style={{ color: 'var(--text-muted)', fontSize: '9px' }}>
          {selectedEventNodeId ?
            `PROPAGATION: ${propagationResults.length} nodes` :
            'LIVE PULSE — SELECT SIGNAL'}
        </span>
      </div>

      <div className="graph-container" ref={containerRef}>
        <svg ref={svgRef} />
      </div>
    </div>
  );
}

// ─── Helper Functions ────────────────────────────────────────────────────────

function getNodeRadius(d: D3Node): number {
  if (d.isOrigin) return 22;
  const base = Math.max(8, Math.min(20, d.impact * 200));
  return base;
}

function getNodeColor(d: D3Node): string {
  if (d.isOrigin) return '#ff6b1a';

  if (d.type === 'SECTOR') return '#1a1a2e';

  if (d.direction >= 0) {
    // Positive: amber → green gradient
    const intensity = Math.min(1, d.impact * 10);
    const r = Math.round(255 * (1 - intensity * 0.5));
    const g = Math.round(149 + (204 - 149) * intensity);
    const b = Math.round(intensity * 102);
    return `rgb(${r},${g},${b})`;
  } else {
    // Negative: amber → crimson gradient
    const intensity = Math.min(1, d.impact * 10);
    const r = Math.round(204 + (255 - 204) * (1 - intensity));
    const g = Math.round(149 * (1 - intensity));
    const b = Math.round(26);
    return `rgb(${r},${g},${b})`;
  }
}
