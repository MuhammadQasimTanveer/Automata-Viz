export function minimizeDFA(dfa) {
  const { states, startState, finalStates, alphabet, transitions, deadState } = dfa;

  // Step 1: Initialize table of distinguishable pairs
  const table = {};
  states.forEach((state1) => {
    table[state1] = {};
    states.forEach((state2) => {
      if (state1 !== state2) {
        table[state1][state2] = false;
      }
    });
  });

  // Step 2: Mark pairs where one is final and one is not
  states.forEach((state1) => {
    states.forEach((state2) => {
      if (state1 !== state2) {
        const isFinal1 = finalStates.includes(state1);
        const isFinal2 = finalStates.includes(state2);
        if (isFinal1 !== isFinal2) {
          table[state1][state2] = true;
          table[state2][state1] = true;
        }
      }
    });
  });

  // Step 3: Iteratively mark distinguishable pairs
  let changed = true;
  // loop continue until new pair marked remains
  while (changed) {
    changed = false;

    states.forEach((state1) => {
      states.forEach((state2) => {
        if (state1 !== state2 && !table[state1][state2]) {
          for (const symbol of alphabet) {
            const next1 = transitions[state1]?.[symbol];
            const next2 = transitions[state2]?.[symbol];

            // Case 1: One state has a transition(marked), the other does not
            if ((next1 && !next2) || (!next1 && next2)) 
            {
              // Mark current pair
              table[state1][state2] = true;
              table[state2][state1] = true;
              changed = true;
              break;
            }

            // Case 2: Both have transitions(marked)
            if (next1 && next2 && next1 !== next2) 
            {
              if (table[next1]?.[next2]) {
                // Mark current pair
                table[state1][state2] = true;
                table[state2][state1] = true;
                changed = true;
                break;
              }
            }
          }
        }
      });
    });
  }

  // Step 4: Group equivalent states
  const equivalenceClasses = [];        //for states that are equivalent (make group)
  const processed = new Set();          //for state which are alone

  states.forEach((state) => {
    if (!processed.has(state)) {
      const equivalentStates = [state];
      processed.add(state);

      states.forEach((otherState) => {
        if (
          state !== otherState &&
          !processed.has(otherState) &&
          !table[state][otherState]
        ) {
          equivalentStates.push(otherState);
          processed.add(otherState);
        }
      });
      equivalenceClasses.push(equivalentStates);
    }
  });

  // Step 5: Build minimized DFA
  const stateToClass = {};       //maps each original state to its new minimized state
  const minimizationMapping = {}; //stores which original states belong to each new state

  equivalenceClasses.forEach((eqClass, index) => {
    const newStateName = `M${index}`;
    minimizationMapping[newStateName] = eqClass;      // group info
    eqClass.forEach((state) => {
      stateToClass[state] = newStateName;            // map original states to new state
    });
  });


  // { q0: 'M0', q1: 'M0', q2: 'M1' } ----> [ 'M0', 'M0', 'M1' ]  ---> [ 'M0', 'M1' ]
  //remove duplicates
  const minimizedStates = Object.values(stateToClass).filter(
    (v, i, a) => a.indexOf(v) === i
  );

  const minimizedTransitions = {};
  minimizedStates.forEach((minState) => {
    minimizedTransitions[minState] = {};
    
    //pick any old state from the equivalence class to copy transitions
    const representative = minimizationMapping[minState][0];  
    
    alphabet.forEach((symbol) => {
      //get the old transition for that symbol
      const next = transitions[representative]?.[symbol];
      if (next) 
        {
          //map the old next state to its new minimized state
        minimizedTransitions[minState][symbol] = stateToClass[next];
      }
    });
  });

  const minimizedStartState = stateToClass[startState];   //assign old start state to minmized start state
  
  ////assign old final state to minmized final state(map is used because there may be many final states)
  const minimizedFinalStates = [...new Set(finalStates.map((s) => stateToClass[s]))];
  
  // Determine minimized dead state
  const minimizedDeadState = deadState ? stateToClass[deadState] : null;

  return {
    minimizedDFA: {
      states: minimizedStates,
      startState: minimizedStartState,
      finalStates: minimizedFinalStates,
      alphabet,
      transitions: minimizedTransitions,
      deadState: minimizedDeadState,
      type: 'Minimized DFA'
    },
    minimizationMapping
  };
}