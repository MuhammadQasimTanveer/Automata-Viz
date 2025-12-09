import React from 'react';
import { TransitionTable } from './TransitionTable';
import { StateGraph } from './StateGraph';
import useAutomataStore from '../../store/useAutomataStore';

export const DFAVisualizer = () => {
  const { dfa, dfaStateMapping } = useAutomataStore();
  return (
    <div className="space-y-8">
      <TransitionTable automaton={dfa} title="DFA Transition Table (Subset Construction)" stateMapping={dfaStateMapping}/>
      <StateGraph automaton={dfa} title="DFA State Diagram" />
    </div>
  );
};