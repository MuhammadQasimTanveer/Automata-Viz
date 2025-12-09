import React from 'react';
import { TransitionTable } from './TransitionTable';
import { StateGraph } from './StateGraph';
import useAutomataStore from '../../store/useAutomataStore';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { ArrowRight } from 'lucide-react';

export const MinimizedDFAVisualizer = () => {
  const { minimizedDFA, minimizationMapping, preMinimizedDFA } = useAutomataStore();

  return (
    <div className="space-y-8">
      {preMinimizedDFA && (
        <Card>
          <CardHeader>
            <CardTitle>{"Minimization Results (Table Filling)"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center gap-8 py-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-slate-700 mb-2"> {preMinimizedDFA.states.length}</div>
                <div className="text-sm text-slate-600">States Before</div>
              </div>
              
              <ArrowRight className="w-8 h-8 text-indigo-600" />
              
              <div className="text-center">
                <div className="text-4xl font-bold text-indigo-600 mb-2">{minimizedDFA.states.length} </div>
                <div className="text-sm text-slate-600">States After</div>
              </div>
              
              <div className="text-center ml-8">
                <div className="text-3xl font-bold text-green-600 mb-2">
                 {/* {(((preMinimizedDFA.states.length - minimizedDFA.states.length) /preMinimizedDFA.states.length) * 100).toFixed(1)}% */}
                 {((1 - minimizedDFA.states.length / preMinimizedDFA.states.length) * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-slate-600">Reduction</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <TransitionTable automaton={minimizedDFA} title="Minimized DFA Transition Table" stateMapping={minimizationMapping}/>
      <StateGraph automaton={minimizedDFA} title="Minimized DFA State Diagram" />
    </div>
  );
};