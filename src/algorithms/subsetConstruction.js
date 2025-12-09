// Compute epsilon closure
function epsilonClosure(states, transitions) {
  const closure = new Set(states);        //initially contains given states
  const stack = [...states];             // stack to process states


  while (stack.length > 0) 
    {
    const state = stack.pop();            // take one state 
    const epsilonTransitions = transitions[state]?.['ε'] || [];       // get ε transitions
    epsilonTransitions.forEach((nextState) => {
      if (!closure.has(nextState))         // if next state not yet in closure
     {
        closure.add(nextState);    // add to closure
        stack.push(nextState);     // push to stack to process its ε transitions too
      } 
    });
  }
  return Array.from(closure).sort();     // return all states in sorted array
}

// Move function
function move(states, symbol, transitions) {
  const result = new Set();

  states.forEach((state) => {
    const symbolTransitions = transitions[state]?.[symbol] || [];
    symbolTransitions.forEach((nextState) => result.add(nextState));
  });
  return Array.from(result);
}

// Convert array of states to string key
function statesToKey(states) {
  return states.sort().join(',');
}

export function nfaToDfa(nfa) {
  const { startState, finalStates, alphabet, transitions: nfaTransitions } = nfa;

  // DFA construction
  const dfaStates = [];
  const dfaTransitions = {};
  const dfaFinalStates = [];
  const stateMapping = {};
  const DEAD_STATE_KEY = '__DEAD__'; // Internal key

  // Start with epsilon closure of NFA start state
  const startClosure = epsilonClosure([startState], nfaTransitions);
  const startKey = statesToKey(startClosure);

  const unmarkedStates = [{ key: startKey, states: startClosure }];
  const markedStates = new Map();  // Map to store which NFA state sets have already been converted to DFA states
  let stateCounter = 0;

  // Assign name to start state
  const startStateName = `D${stateCounter++}`;
  markedStates.set(startKey, startStateName);       // Mark start state as created
  dfaStates.push(startStateName);                   // Add DFA start state to DFA states array
  stateMapping[startStateName] = startClosure;

  // Check if start state is final, if then marked as final too
  if (startClosure.some((s) => finalStates.includes(s))) {
    dfaFinalStates.push(startStateName);
  }

  while (unmarkedStates.length > 0) {
    const current = unmarkedStates.shift();
    const currentStateName = markedStates.get(current.key);

    dfaTransitions[currentStateName] = {};    //Create an object to store transitions

    // For each symbol in alphabet
    alphabet.forEach((symbol) => {
      // Compute move and epsilon closure
      const moveStates = move(current.states, symbol, nfaTransitions);
      const closure = epsilonClosure(moveStates, nfaTransitions);

      if (closure.length === 0) {
        // No transition,go to DEAD state
        dfaTransitions[currentStateName][symbol] = DEAD_STATE_KEY;
        return;
      }

      const closureKey = statesToKey(closure);

      // Check if this state already exists
      if (!markedStates.has(closureKey)) {
        const newStateName = `D${stateCounter++}`;
        markedStates.set(closureKey, newStateName);
        dfaStates.push(newStateName);
        stateMapping[newStateName] = closure;
        unmarkedStates.push({ key: closureKey, states: closure });

        // Check if this is a final state
        if (closure.some((s) => finalStates.includes(s))) {
          dfaFinalStates.push(newStateName);
        }
      }

      dfaTransitions[currentStateName][symbol] = markedStates.get(closureKey);
    });
  }

  // Check if dead state is needed
  let hasDeadState = false;
  Object.values(dfaTransitions).forEach((trans) => {
    Object.values(trans).forEach((target) => {
      if (target === DEAD_STATE_KEY) {
        hasDeadState = true;
      }
    });
  });

  let deadStateName = null;
  
  if (hasDeadState) {
    // Assign name to dead state
    deadStateName = `D${stateCounter++}`;
    dfaStates.push(deadStateName);
    stateMapping[deadStateName] = ['∅']; // Empty set
    dfaTransitions[deadStateName] = {};
    
    // Replace DEADSTATE with actual name
    Object.keys(dfaTransitions).forEach((state) => {
      Object.keys(dfaTransitions[state]).forEach((symbol) => {
        if (dfaTransitions[state][symbol] === DEAD_STATE_KEY) {
          dfaTransitions[state][symbol] = deadStateName;
        }
      });
    });
    
    // Dead state loops to itself for all symbols
    alphabet.forEach((symbol) => {
      dfaTransitions[deadStateName][symbol] = deadStateName;
    });
  }

  return {
    dfa: {
      states: dfaStates,
      startState: markedStates.get(startKey),
      finalStates: dfaFinalStates,
      alphabet,
      transitions: dfaTransitions,
      deadState: deadStateName,
      type: 'DFA'
    },
    stateMapping
  };
}