import { create } from 'zustand';
import { validateRegex } from '../algorithms/regexValidator';
import { buildNFAFromRegex } from '../algorithms/thompson';
import { nfaToDfa } from '../algorithms/subsetConstruction';
import { minimizeDFA } from '../algorithms/minimization';

const useAutomataStore = create((set, get) => ({
  regex: '',
  setRegex: (regex) => set({ regex }),
  
  // Validation
  validationError: null,
  isValid: false,
  nfa: null,
  
  dfa: null,
  dfaStateMapping: {},
  
  minimizedDFA: null,
  minimizationMapping: {},
  preMinimizedDFA: null,
  
  // UI state
  currentStep: 'input',
  isProcessing: false,
  
  validateRegex: () => {
    const { regex } = get();
    const validation = validateRegex(regex);
    set({ 
      validationError: validation.error,
      isValid: validation.isValid 
    });
    return validation.isValid;
  },
  
  processRegex: () => {
    const { regex, validateRegex } = get();
    
    if (!validateRegex()) {
      return false;
    }
    
    set({ isProcessing: true });
    
    try {
      // Step 1: Build NFA
      const nfa = buildNFAFromRegex(regex);
      
      // Step 2: Convert to DFA
      const { dfa, stateMapping } = nfaToDfa(nfa);
      
      // Step 3: Minimize DFA
      const { minimizedDFA, minimizationMapping } = minimizeDFA(dfa);
      
      set({
        nfa,
        dfa,
        dfaStateMapping: stateMapping,
        minimizedDFA,
        minimizationMapping,
        preMinimizedDFA: dfa,
        currentStep: 'nfa',
        isProcessing: false
      });
      
      return true;
    } 
    catch (error) {
      console.error('Error processing regex:', error);
      set({ 
        validationError: 'An error occurred while processing the regex',
        isProcessing: false 
      });
      return false;
    }
  },
  
  setCurrentStep: (step) => set({ currentStep: step }),
  
  testString: (input) => {
    const { minimizedDFA } = get();
    if (!minimizedDFA) return null;
    
    const alphabet = new Set(minimizedDFA.alphabet);
    const steps = [];
    let currentState = minimizedDFA.startState;
    
    // Validate input characters
    for (let i = 0; i < input.length; i++) {
      const char = input[i];
      if (!alphabet.has(char)) {
        return {
          accepted: false,
          error: `Invalid character '${char}' at position ${i + 1}`,
          steps: []
        };
      }
    }
    
    // Process string
    steps.push({ state: currentState, symbol: 'Start', position: 0 });
    
    for (let i = 0; i < input.length; i++) {
      const symbol = input[i];
      const nextState = minimizedDFA.transitions[currentState]?.[symbol];
      
      if (!nextState) {
        return {
          accepted: false,
          error: `No transition from state ${currentState} on symbol '${symbol}'`,
          steps
        };
      }
      
      currentState = nextState;
      steps.push({ 
        state: currentState, 
        symbol, 
        position: i + 1 
      });
    }
    
    const accepted = minimizedDFA.finalStates.includes(currentState);
    
    return {
      accepted,
      error: null,
      steps,
      finalState: currentState
    };
  },
  
  reset: () => set({
    regex: '',
    validationError: null,
    isValid: false,
    nfa: null,
    dfa: null,
    dfaStateMapping: {},
    minimizedDFA: null,
    minimizationMapping: {},
    preMinimizedDFA: null,
    currentStep: 'input',
    isProcessing: false
  })
}));

export default useAutomataStore;