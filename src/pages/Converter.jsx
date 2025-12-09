import React from 'react';
import { RegexInput } from '../components/converter/RegexInput';
import { StepNavigation } from '../components/converter/StepNavigation';
import useAutomataStore from '../store/useAutomataStore';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/Button';

export const Converter = () => {
  const { nfa, reset } = useAutomataStore();

  return (
    <div className="min-h-screen py-12">
      <div className="container-custom">
        <div className="space-y-12">
          <RegexInput />
          
          {nfa && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold">Results</h2>
                {/* <Button variant="outline" onClick={reset}> Start Over </Button> */}
              </div>
              <StepNavigation />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};