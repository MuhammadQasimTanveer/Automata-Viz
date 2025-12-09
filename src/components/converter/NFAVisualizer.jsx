import React from 'react';
import { TransitionTable } from './TransitionTable';
import { StateGraph } from './StateGraph';
import useAutomataStore from '../../store/useAutomataStore';

export const NFAVisualizer = () => {
  const { nfa } = useAutomataStore();
  return (
    <div className="space-y-8">
      <TransitionTable automaton={nfa} title="ε-NFA Transition Table (Thompson's Construction)" />
      <StateGraph automaton={nfa} title="NFA State Diagram" />
    </div>
  );
};