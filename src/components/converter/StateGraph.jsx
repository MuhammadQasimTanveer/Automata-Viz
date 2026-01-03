import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { getStateColor } from '../../utils/formatters';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

export const StateGraph = ({ automaton, title }) => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => 
  {
    //graph will only draw when above are true other wise it returns
    if (!automaton || !svgRef.current) return;

    // Only create graph if it doesn't exist
    d3.select(svgRef.current).selectAll('*').remove();

    const { states, startState, finalStates, transitions, deadState } = automaton;

    const containerWidth = containerRef.current.clientWidth;
    const width = containerWidth;
    const height = 600;

    //canvas, //remove the old graph(svg) to draw again
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    // Add zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);  //nodes and edges move/scale with zoom
      });

    svg.call(zoom);

    const g = svg.append('g'); //g group element, inwhich all nodes & edges append

    // Create only nodes with fixed positions
    const nodes = states.map(state => ({
      id: state,
      isStart: state === startState,
      isFinal: finalStates.includes(state),
      isDead: state === deadState, // Check if dead state
    }));

    // Create links
    const links = [];      //store edges
    const edgeLabels = new Map();         //label of each state

    //traverse the transition of each state, ifmany transitionson same symbo, push to edgelabel
    states.forEach(state => {
      const stateTrans = transitions[state] || {};
      Object.entries(stateTrans).forEach(([symbol, targets]) => {
        const targetList = Array.isArray(targets) ? targets : [targets];
        targetList.forEach(target => {
          const key = `${state}-${target}`;
           //if edge exists, add its all multiple symbols to array
          if (edgeLabels.has(key)) {
            edgeLabels.get(key).push(symbol);
          } 
          //if there is no edge create it
          else {
            edgeLabels.set(key, [symbol]);
            links.push({
              source: state,
              target: target,
              symbols: [symbol],
              isSelfLoop: state === target
            });
          }
        });
      });
    });

    links.forEach(link => {
      const key = `${link.source}-${link.target}`;
      link.symbols = edgeLabels.get(key);
    });

    // Force simulation -assign automatic position to Nodes 
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links)
        .id(d => d.id)
        .distance(150))    //length of edge
      .force('charge', d3.forceManyBody().strength(-800))    //how far node is from another
      .force('center', d3.forceCenter(width / 2, height / 2))   //centered graph
      .force('collision', d3.forceCollide().radius(70))  //nodes not collide
      .force('x', d3.forceX(width / 2).strength(0.1))
      .force('y', d3.forceY(height / 2).strength(0.1));

    // Arrow markers
    svg.append('defs').selectAll('marker')
      .data(['arrow'])
      .enter().append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -5 10 10')   //set coordinates
      .attr('refX', 45)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')       //auto direction give to arrow that is same as path
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')         //create triangle as actual marker
      .attr('fill', '#64748b');

    // Draw links
    const link = g.append('g')
      .selectAll('path')   //create visual link between nodes
      .data(links)
      .enter().append('path')   //create path
      .attr('class', 'edge')
      .attr('fill', 'none')
      .attr('stroke', '#64748b')
      .attr('stroke-width', 2)
      .attr('marker-end', d => d.isSelfLoop ? '' : 'url(#arrow)');  //if no self loop, creatw link

    // Edge labels
    const linkLabelGroup = g.append('g');
    const linkLabels = linkLabelGroup.selectAll('g')
      .data(links)
      .enter().append('g')
      .attr('class', 'edge-label-group');

    linkLabels.append('rect')
      .attr('fill', 'white')
      .attr('stroke', '#e2e8f0')
      .attr('rx', 4);

    linkLabels.append('text')
      .attr('class', 'edge-label')
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .attr('font-size', '14px')
      .attr('font-weight', '600')
      .attr('fill', '#1e293b')
      .text(d => d.symbols.join(', '));

    // Draw nodes
    const node = g.append('g')
      .selectAll('g')
      .data(nodes)
      .enter().append('g')
      .attr('class', 'node')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    // Node circles with color based on state type
    node.append('circle')
      .attr('r', 35)
      .attr('fill', d => {
        const colors = getStateColor(d.isStart, d.isFinal, d.isDead);
        return colors.bg;
      })
      .attr('stroke', d => {
        const colors = getStateColor(d.isStart, d.isFinal, d.isDead);
        return colors.border;
      })
      .attr('stroke-width', 3);

    // Double circle for final states
    node.filter(d => d.isFinal)
      .append('circle')
      .attr('r', 40)   
      .attr('fill', 'none')
      .attr('stroke', d => {
        const colors = getStateColor(d.isStart, d.isFinal, d.isDead);
        return colors.border;
      })
      .attr('stroke-width', 2);

    // show an arrow to Start state
    node.filter(d => d.isStart)
      .append('path')
      .attr('d', 'M-50,0 L-35,0')
      .attr('stroke', d => {
        const colors = getStateColor(d.isStart, d.isFinal, d.isDead);
        return colors.border;
      })
      .attr('stroke-width', 3)
      .attr('marker-end', 'url(#arrow)');

    // Node labels
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .attr('font-size', '16px')
      .attr('font-weight', 'bold')
      .attr('fill', d => {
        const colors = getStateColor(d.isStart, d.isFinal, d.isDead);
        return colors.text;
      })
      .text(d => d.id);

    // show upadted positions on screen continuously
    simulation.on('tick', () => {
      nodes.forEach(d => {
        d.x = Math.max(60, Math.min(width - 60, d.x));
        d.y = Math.max(60, Math.min(height - 60, d.y));
      });

      //decide which link is self ornormal
      link.attr('d', d => {
        if (d.isSelfLoop) {
          const x = d.source.x;
          const y = d.source.y;
          return `M ${x},${y - 35} A 25,25 0 1,1 ${x + 35},${y}`;
        } else {
          return `M ${d.source.x},${d.source.y} L ${d.target.x},${d.target.y}`;
        }
      });

      linkLabels.attr('transform', d => {
        const x = d.isSelfLoop ? d.source.x + 25 : (d.source.x + d.target.x) / 2;
        const y = d.isSelfLoop ? d.source.y - 50 : (d.source.y + d.target.y) / 2;
        return `translate(${x},${y})`;
      });

       //give reactangle box shape to edge label
      linkLabels.select('text').each(function() {
        const bbox = this.getBBox();
        d3.select(this.previousSibling)
          .attr('x', bbox.x - 4)
          .attr('y', bbox.y - 2)
          .attr('width', bbox.width + 8)
          .attr('height', bbox.height + 4);
      });

      //continuously update node positions
      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // Drag functions - nodes stay fixed after drag
    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;  //fix x position
      d.fy = d.y;  //fix y position
    }

    function dragged(event, d) {
      d.fx = event.x;  //update fixed x position
      d.fy = event.y;  //update fixed y position
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      // Keep position fixed after drag - node won't float back
      d.fx = d.x;
      d.fy = d.y;
    }

    window.graphZoomIn = () => svg.transition().call(zoom.scaleBy, 1.3);
    window.graphZoomOut = () => svg.transition().call(zoom.scaleBy, 0.7);
    window.graphZoomReset = () => svg.transition().call(zoom.transform, d3.zoomIdentity);

    return () => {
      simulation.stop();  //stop simulation on cleanup
    };
}, [automaton]);

  if (!automaton) {
    return null;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full"
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{title || 'State Diagram'}</CardTitle>
            <div className="flex gap-2">
              <button
                onClick={() => window.graphZoomIn?.()}
                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => window.graphZoomOut?.()}
                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => window.graphZoomReset?.()}
                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
                title="Reset View"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div 
            ref={containerRef}
            className="w-full bg-slate-50 rounded-lg border-2 border-slate-200 overflow-hidde relative"
          >
            <svg ref={svgRef} style={{ width: '100%', height: '600px', cursor: 'grab' }}></svg>
            <div className="absolute bottom-4 left-4 text-xs text-slate-500 bg-white px-3 py-2 rounded-lg shadow-sm">
            
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-green-100 border-2 border-green-500" />
              <span className="text-slate-700">Start State</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-10 h-10 rounded-full bg-blue-100 border-2 border-blue-500">
                <div className="absolute -inset-1 rounded-full border-2 border-blue-500" />
              </div>
              <span className="text-slate-700">Final State</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-white border-2 border-slate-400" />
              <span className="text-slate-700">Normal State</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-red-100 border-2 border-red-600" />
              <span className="text-slate-700">Dead State</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};