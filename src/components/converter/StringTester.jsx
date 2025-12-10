import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { CheckCircle, XCircle, AlertCircle, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useAutomataStore from '../../store/useAutomataStore';
import { getStateColor } from '../../utils/formatters';

export const StringTester = () => {
  const { minimizedDFA, testString } = useAutomataStore();
  const [inputString, setInputString] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const simulationRef = useRef(null);
  const nodesDataRef = useRef(null);

  const handleTest = (e) => {
    e.preventDefault();
    const result = testString(inputString);
    setTestResult(result);
    setCurrentStep(0);
  };

  const handleReset = () => {
    setInputString('');
    setTestResult(null);
    setCurrentStep(0);
  };

  // Initial graph setup (only once)
  useEffect(() => {
    //graph will only draw when above are true other wise it returns
    if (!testResult || !testResult.steps || !svgRef.current) return;

    // Only create graph if it doesn't exist
    if (nodesDataRef.current) return;

    const { states, startState, finalStates, transitions, deadState } = minimizedDFA;
    const containerWidth = containerRef.current?.clientWidth || 600;
    const width = containerWidth;
    const height = 400;

    //remove the old graph(svg) to draw again
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Add zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);  //nodes and edges move/scale with zoom
      });

    svg.call(zoom);

    const g = svg.append('g');   //make nodes and edges together as one group

    // Create only nodes with fixed positions
    const nodes = states.map((state, index) => ({
      id: state,
      isStart: state === startState,
      isFinal: finalStates.includes(state),
      isDead: state === deadState,
      x: (width / (states.length + 1)) * (index + 1),  //make nodes evenly horizontal spaced
      y: height / 2,
    }));

    // Create links
    const links = [];   //store edges
    const edgeLabels = new Map();     //store edges if anyedge has many symbols

    //make edges betwen nodes
    states.forEach(state => {
      const stateTrans = transitions[state] || {};
      Object.entries(stateTrans).forEach(([symbol, target]) => {
        const key = `${state}-${target}`;
        //if edge exists, add its all multiple symbols to array
        if (edgeLabels.has(key)) 
          {
          edgeLabels.get(key).push(symbol);
        } 
        //if there is no edge create it
        else {
          edgeLabels.set(key, [symbol]);
          links.push({
            source: state,
            target: target,
            symbols: [symbol],
            isSelfLoop: state === target,
          });
        }
      });
    });

    links.forEach(link => {
      const key = `${link.source}-${link.target}`;
      link.symbols = edgeLabels.get(key);
    });

    // Run simulation to get better positions
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(150))   //length of edge
      .force('charge', d3.forceManyBody().strength(-800))             //how far node is from another
      .force('center', d3.forceCenter(width / 2, height / 2))    //centered graph
      .force('collision', d3.forceCollide().radius(60))      //nodes not collide
      .force('x', d3.forceX(width / 2).strength(0.1)) 
      .force('y', d3.forceY(height / 2).strength(0.1));

    simulationRef.current = simulation;    //store this ref for later use(drag, zoom)

    // Arrow markers
    svg.append('defs').selectAll('marker')
      .data(['arrow', 'arrow-active'])
      .enter().append('marker')
      .attr('id', d => d)
      .attr('viewBox', '0 -5 10 10')        //set coordinats
      .attr('refX', 45)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')         //auto direction give to arrow that is same as path
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')        //create triangle as actual marker
      .attr('fill', d => d === 'arrow-active' ? '#6366f1' : '#64748b');

    // Draw links
    const link = g.append('g')
      .selectAll('path')          //create visual link between nodes
      .data(links)
      .enter().append('path')    //create path
      .attr('class', 'edge')  
      .attr('fill', 'none')
      .attr('stroke', '#64748b')
      .attr('stroke-width', 2)
      .attr('marker-end', d => d.isSelfLoop ? '' : 'url(#arrow)');   //if no self loop, creatw link

    // Edge labels
    const linkLabelGroup = g.append('g');
    const linkLabels = linkLabelGroup.selectAll('g')
      .data(links)
      .enter().append('g');

    linkLabels.append('rect')
      .attr('fill', 'white')
      .attr('stroke', '#e2e8f0')
      .attr('rx', 4);

    linkLabels.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .attr('font-size', '12px')
      .attr('font-weight', '600')
      .attr('fill', '#1e293b')
      .text(d => d.symbols.join(', '));

    // make each nodes as one container to that it is dragable, or zoom
    const node = g.append('g')
      .selectAll('g')
      .data(nodes)
      .enter().append('g')
      .attr('class', 'node')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended)); 

      // draw circle for each Node
    node.append('circle')
      .attr('class', 'node-circle')
      .attr('r', 30)  //radius
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
      .attr('class', 'node-final-circle')
      .attr('r', 35)
      .attr('fill', 'none')
      .attr('stroke', d => {
        const colors = getStateColor(d.isStart, d.isFinal, d.isDead);
        return colors.border;
      })
      .attr('stroke-width', 2);

    // show an arrow to Start state
    node.filter(d => d.isStart)
      .append('path')
      .attr('d', 'M-45,0 L-30,0')
      .attr('stroke', d => {
        const colors = getStateColor(d.isStart, d.isFinal, d.isDead);
        return colors.border;
      })
      .attr('stroke-width', 3)
      .attr('marker-end', 'url(#arrow)');

    // Node labels
    node.append('text')
      .attr('class', 'node-text')
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .attr('fill', d => {
        const colors = getStateColor(d.isStart, d.isFinal, d.isDead);
        return colors.text;
      })
      .text(d => d.id);

    // show upadted positions on screen continuously
    simulation.on('tick', () => {
      nodes.forEach(d => {
        d.x = Math.max(50, Math.min(width - 50, d.x));
        d.y = Math.max(50, Math.min(height - 50, d.y));
      });

        //decide which link is self ornormal
      link.attr('d', d => {
        if (d.isSelfLoop) {
          return `M ${d.source.x},${d.source.y - 30} A 20,20 0 1,1 ${d.source.x + 30},${d.source.y}`;
        } else {
          return `M ${d.source.x},${d.source.y} L ${d.target.x},${d.target.y}`;
        }
      });

      linkLabels.attr('transform', d => {
        const x = d.isSelfLoop ? d.source.x + 20 : (d.source.x + d.target.x) / 2;
        const y = d.isSelfLoop ? d.source.y - 45 : (d.source.y + d.target.y) / 2;
        return `translate(${x},${y})`;
      });

      //give reactangle box shape to edge label
      linkLabels.select('text').each(function () {
        const bbox = this.getBBox();
        d3.select(this.previousSibling)
          .attr('x', bbox.x - 3)
          .attr('y', bbox.y - 2)
          .attr('width', bbox.width + 6)
          .attr('height', bbox.height + 4);
      });

      //continuously update node positions
      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // Drag functions
    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      // Keep position after drag
      d.fx = d.x;
      d.fy = d.y;
    }

    // Store nodes and links for color updates
    nodesDataRef.current = { nodes, links, node, link, svg, zoom, g };

    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
    };

  }, [testResult, minimizedDFA]);

  // Update only colors when step changes
  useEffect(() => {
    if (!testResult || !nodesDataRef.current) return;

    const { nodes, links, node, link } = nodesDataRef.current;
    const currentStateInStep = testResult.steps[currentStep]?.state;

    // Update node colors
    nodes.forEach(n => {
      n.isActive = n.id === currentStateInStep;
    });

    // Update active links
    let activeSource = null;
    let activeTarget = null;
    if (currentStep > 0 && currentStep < testResult.steps.length) {
      activeSource = testResult.steps[currentStep - 1].state;
      activeTarget = testResult.steps[currentStep].state;
    }

    links.forEach(l => {
      l.isActive = (l.source.id === activeSource && l.target.id === activeTarget);
    });

    // Apply color changes
    node.select('.node-circle')
      .transition()
      .duration(300)
      .attr('fill', d => {
        if (d.isActive) return '#818cf8';
        const colors = getStateColor(d.isStart, d.isFinal, d.isDead);
        return colors.bg;
      })
      .attr('stroke', d => {
        if (d.isActive) return '#4f46e5';
        const colors = getStateColor(d.isStart, d.isFinal, d.isDead);
        return colors.border;
      })
      .attr('stroke-width', d => d.isActive ? 4 : 3)
      .style('filter', d => d.isActive ? 'drop-shadow(0 0 10px rgba(79, 70, 229, 0.8))' : 'none');

    node.select('.node-final-circle')
      .transition()
      .duration(300)
      .attr('stroke', d => {
        if (d.isActive) return '#4f46e5';
        const colors = getStateColor(d.isStart, d.isFinal, d.isDead);
        return colors.border;
      });

    node.select('.node-text')
      .transition()
      .duration(300)
      .attr('fill', d => {
        if (d.isActive) return '#ffffff';
        const colors = getStateColor(d.isStart, d.isFinal, d.isDead);
        return colors.text;
      });

    link
      .transition()
      .duration(300)
      .attr('stroke', d => d.isActive ? '#6366f1' : '#64748b')
      .attr('stroke-width', d => d.isActive ? 4 : 2)
      .attr('marker-end', d => d.isSelfLoop ? '' : (d.isActive ? 'url(#arrow-active)' : 'url(#arrow)'));

  }, [currentStep, testResult]);

  return (
    <div className="space-y-6">
      {/* Input Form */}
      <Card>
        <CardHeader> <CardTitle>Test String Input</CardTitle> </CardHeader>
        <CardContent>
          <form onSubmit={handleTest} className="space-y-4">
            <div>
              <Input
                value={inputString} onChange={(e) => setInputString(e.target.value)}
                placeholder="Enter a string to test" className="font-mono"
              />
              <p className="mt-2 text-sm text-slate-600">
                <strong>Alphabet:</strong> {minimizedDFA.alphabet.join(', ')}
              </p>
            </div>

            <div className="flex gap-3">
              <Button type="submit" variant="primary">Test String</Button>
              {testResult && (
                <Button type="button" variant="outline" onClick={handleReset}>Reset</Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Test Result */}
      <AnimatePresence>
        {testResult && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Test Result</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Result Status */}
                <div className={`p-6 rounded-lg mb-6 ${
                  testResult.error 
                    ? 'bg-red-50 border-2 border-red-200' 
                    : testResult.accepted 
                    ? 'bg-green-50 border-2 border-green-200'
                    : 'bg-red-50 border-2 border-red-200'
                }`}>
                  <div className="flex items-center gap-4">
                    {testResult.error ? (
                      <AlertCircle className="w-12 h-12 text-red-600" />
                    ) : testResult.accepted ? (
                      <CheckCircle className="w-12 h-12 text-green-600" />
                    ) : (
                      <XCircle className="w-12 h-12 text-red-600" />
                    )}
                    
                    <div className="flex-1">
                      <h3 className={`text-2xl font-bold mb-1 ${
                        testResult.error 
                          ? 'text-red-900' 
                          : testResult.accepted 
                          ? 'text-green-900'
                          : 'text-red-900'
                      }`}>
                        {testResult.error 
                          ? 'Invalid Input' 
                          : testResult.accepted 
                          ? 'String Accepted'
                          : 'String Rejected'
                        }
                      </h3>
                      <p className={`text-lg ${
                        testResult.error 
                          ? 'text-red-700' 
                          : testResult.accepted 
                          ? 'text-green-700'
                          : 'text-red-700'
                      }`}>
                        {testResult.error || (testResult.accepted 
                          ? `The string "${inputString || 'ε'}" is accepted`
                          : `The string "${inputString || 'ε'}" is rejected`
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {testResult.steps && testResult.steps.length > 0 && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-slate-900">Step-by-Step Simulation:</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-600 ml-2">
                          Step {currentStep + 1} / {testResult.steps.length}
                        </span>
                        <Button
                          variant="outline" size="sm"
                          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                          disabled={currentStep === 0}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline" size="sm"
                          onClick={() => setCurrentStep(Math.min(testResult.steps.length - 1, currentStep + 1))}
                          disabled={currentStep === testResult.steps.length - 1}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Graph */}
                    <div 
                      ref={containerRef}
                      className="w-full bg-slate-50 rounded-lg border-2 border-slate-200 mb-4"
                    >
                      <svg 
                        ref={svgRef} 
                        style={{ width: '100%', height: '400px', cursor: 'grab' }}
                      ></svg>
                    </div>

                    <div className="bg-indigo-50 rounded-lg p-4 mb-4">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-xs text-indigo-600 font-semibold mb-1">READING</div>
                          <div className="text-2xl font-bold text-indigo-900">
                            {testResult.steps[currentStep].symbol === 'Start' ? '—' : testResult.steps[currentStep].symbol}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-indigo-600 font-semibold mb-1">CURRENT STATE</div>
                          <div className="text-2xl font-bold text-indigo-900">
                            {testResult.steps[currentStep].state}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-indigo-600 font-semibold mb-1">POSITION</div>
                          <div className="text-2xl font-bold text-indigo-900">
                            {testResult.steps[currentStep].position}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="overflow-x-auto pb-4">
                      <div className="flex items-center gap-2 min-w-max">
                        {testResult.steps.map((step, index) => (
                          <React.Fragment key={index}>
                            <button
                              onClick={() => setCurrentStep(index)}
                              className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                                index === currentStep
                                  ? 'bg-indigo-600 text-white shadow-lg scale-110'
                                  : 'bg-white text-slate-700 border-2 border-slate-200 hover:border-indigo-400'
                              }`}
                            >
                              <div className="text-xs mb-1">
                                {step.symbol === 'Start' ? 'Start' : step.symbol}
                              </div>
                              <div className="text-lg">{step.state}</div>
                            </button>
                            {index < testResult.steps.length - 1 && (
                              <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Card>
        <CardHeader>
          <CardTitle>Try Examples</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {['npn', 'npoo', 'oop', 'np', 'ooppp', 'pppp', ''].map((ex) => (
              <button
                key={ex || 'empty'} onClick={() => setInputString(ex)}
                className="px-4 py-2 bg-slate-100 rounded-lg text-sm font-mono text-slate-700 hover:bg-indigo-100 hover:text-indigo-700 transition-colors"
              >
                {ex || 'ε'}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};