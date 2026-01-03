import React, { useState, useEffect } from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { CheckCircle, XCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useAutomataStore from '../../store/useAutomataStore';

export const RegexInput = () => {
  const { regex, setRegex, validationError, isValid,validateRegex, processRegex, isProcessing } = useAutomataStore();

  const [localRegex, setLocalRegex] = useState(regex);
  const [showValidation, setShowValidation] = useState(false);

  useEffect(() => {
    if (localRegex) 
    {
      const timer = setTimeout(() => {
        setRegex(localRegex); validateRegex(); setShowValidation(true);
      }, 500);
      return () => clearTimeout(timer);
    } 
    else {
      setShowValidation(false);
    }
  }, [localRegex]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (processRegex()) { }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8"
      >

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-full mb-4">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-semibold text-indigo-600"> Enter Regex </span>
          </div>
          <h2 className="text-3xl font-bold mb-2">Regex to Automata Converter</h2>
          <p className="text-slate-600">
            Press the button and convert your regex into NFA, DFA, and minimized DFA
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <Input
              value={localRegex} 
              className="text-lg pr-12"
              onChange={(e) => setLocalRegex(e.target.value)}
              placeholder="e.g., npn+oo(pp+p+ppp)*+np"
              error={showValidation && validationError}
            />
            
            <AnimatePresence>
              {showValidation && localRegex && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                >
                  {isValid ? ( <CheckCircle className="w-6 h-6 text-green-500" />) 
                  : (null)}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Button
            type="submit" variant="primary" size="lg" className="w-full"
            disabled={!isValid || isProcessing}
          >
            {isProcessing ? ( <> <div className="spinner w-5 h-5 border-2" /> Processing... </>) 
            : ( <> Convert to Automata <Sparkles className="w-5 h-5" /> </>)}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          <p>  Regular expressions consist of symbols and operators. <br />
            Use parentheses for grouping and operators for repetition.
          </p>
        </div>
      </motion.div>
    </div>
  );
};