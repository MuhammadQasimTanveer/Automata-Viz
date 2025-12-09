import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/Tabs';
import { NFAVisualizer } from './NFAVisualizer';
import { DFAVisualizer } from './DFAVisualizer';
import { MinimizedDFAVisualizer } from './MinimizedDFAVisualizer';
import { StringTester } from './StringTester';
import useAutomataStore from '../../store/useAutomataStore';

export const StepNavigation = () => {
  const { nfa, dfa, minimizedDFA } = useAutomataStore();
  return (
    <div className="w-full">
      <Tabs defaultValue="nfa" className="w-full">
        <div className="flex justify-center mb-8">
          <TabsList>
            <TabsTrigger value="nfa"> NFA </TabsTrigger>
            <TabsTrigger value="dfa" disabled={!dfa}> DFA </TabsTrigger>
            <TabsTrigger value="minimized" disabled={!minimizedDFA}> Minimized DFA </TabsTrigger>
            <TabsTrigger value="test" disabled={!minimizedDFA}> Test String </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="nfa"> <NFAVisualizer /> </TabsContent>
        <TabsContent value="dfa"> <DFAVisualizer /> </TabsContent>
        <TabsContent value="minimized"> <MinimizedDFAVisualizer /> </TabsContent>
        <TabsContent value="test"> <StringTester /> </TabsContent>
      </Tabs>
    </div>
  );
};