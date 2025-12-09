import { nanoid } from 'nanoid';

let stateCounter = 0;

function newState() {
  return `q${stateCounter++}`;
}

// Tokenize regex
function tokenize(regex) {
  const tokens = [];
  let i = 0;

  while (i < regex.length) {
    const char = regex[i];
    if (char === '(' || char === ')' || char === '|' || char === '+' || char === '*' || char === '?') {
      if (char === '+' || char === '|') {
        tokens.push({ type: 'operator', value: '|' });
      } else {
        tokens.push({ type: 'operator', value: char });
      }
    } else if (char === ' ') {
      // Skip spaces
    } else {
      tokens.push({ type: 'symbol', value: char });
    }
    i++;
  }
  return tokens;
}

// Add explicit concatenation operator
function addConcatenation(tokens) {
  const result = [];

  for (let i = 0; i < tokens.length; i++) {
    result.push(tokens[i]);
    if (i < tokens.length - 1) {
      const current = tokens[i];
      const next = tokens[i + 1];

      const shouldConcatenate =
        (current.type === 'symbol' && next.type === 'symbol') ||     //a b
        (current.type === 'symbol' && next.value === '(') ||         //a (b|c)
        (current.value === ')' && next.type === 'symbol') ||        //(a|b)
        (current.value === ')' && next.value === '(') ||            //(a|b) (c|d)
        (current.value === '*' && next.type === 'symbol') ||        //a* b
        (current.value === '?' && next.type === 'symbol') ||        //a? b
        (current.value === '*' && next.value === '(') ||            //a* (bc)
        (current.value === '?' && next.value === '(');              //a? (bc)

      if (shouldConcatenate) {
        result.push({ type: 'operator', value: '.' });
      }
    }
  }
  return result;
}

// Convert infix to postfix
function infixToPostfix(tokens) {
  const precedence =  { '|': 1, '.': 2, '*': 3, '?': 3 };
  const output = [];     //final postfix
  const stack = [];   //temporarily  oparators array

  for (const token of tokens) {
    if (token.type === 'symbol') {
      output.push(token);
    } else if (token.value === '(') {
      stack.push(token);
    } else if (token.value === ')') {
      while (stack.length > 0 && stack[stack.length - 1].value !== '(') {
        output.push(stack.pop());
      }
      stack.pop();
    } else {
      while (
        stack.length > 0 &&
        stack[stack.length - 1].value !== '(' &&
        precedence[stack[stack.length - 1].value] >= precedence[token.value]
      ) {
        output.push(stack.pop());
      }
      stack.push(token);
    }
  }

  while (stack.length > 0) {
    output.push(stack.pop());
  }
  return output;
}

// Build NFA from postfix
function buildNFAFromPostfix(postfix) {
  const stack = [];

  for (const token of postfix) {
    if (token.type === 'symbol') {
      // LITERAL
      const start = newState();
      const end = newState();
      const transitions = [{ from: start, symbol: token.value, to: end }];
      const nfa = {
        states: [start, end],
        transitions,
        startState: start,
        finalStates: [end]
      };
      stack.push(nfa);
      
    } else if (token.value === '.') {
      // CONCATENATION
      const rightNFA = stack.pop();
      const leftNFA = stack.pop();
      
      leftNFA.finalStates.forEach(s => {
        leftNFA.transitions.push({ from: s, symbol: 'ε', to: rightNFA.startState });
      });
      
      const states = [...new Set([...leftNFA.states, ...rightNFA.states])];
      const transitions = [...leftNFA.transitions, ...rightNFA.transitions];
      
      stack.push({
        states,
        transitions,
        startState: leftNFA.startState,
        finalStates: rightNFA.finalStates
      });
      
    } else if (token.value === '|') {
      // UNION (OR)
      const rightNFA = stack.pop();
      const leftNFA = stack.pop();
      
      const start = newState();
      const end = newState();
      
      const transitions = [
        { from: start, symbol: 'ε', to: leftNFA.startState },
        { from: start, symbol: 'ε', to: rightNFA.startState },
        ...leftNFA.transitions,
        ...rightNFA.transitions,
      ];
      
      leftNFA.finalStates.forEach(s => {
        transitions.push({ from: s, symbol: 'ε', to: end });
      });
      rightNFA.finalStates.forEach(s => {
        transitions.push({ from: s, symbol: 'ε', to: end });
      });
      
      const states = [start, ...leftNFA.states, ...rightNFA.states, end];
      
      stack.push({
        states,
        transitions,
        startState: start,
        finalStates: [end]
      });
      
    } else if (token.value === '*') {
      // KLEENE STAR
      const insideNFA = stack.pop();
      
      const start = newState();
      const end = newState();
      
      const transitions = [
        { from: start, symbol: 'ε', to: insideNFA.startState },
        { from: start, symbol: 'ε', to: end },
        ...insideNFA.transitions,
      ];
      
      insideNFA.finalStates.forEach(s => {
        transitions.push({ from: s, symbol: 'ε', to: insideNFA.startState });
        transitions.push({ from: s, symbol: 'ε', to: end });
      });
      
      const states = [start, ...insideNFA.states, end];
      
      stack.push({
        states,
        transitions,
        startState: start,
        finalStates: [end]
      });
    }
  }
  
  return stack[0];
}

// Renumber states to ensure start state is always q0
function renumberStates(nfa) {
  const oldToNew = new Map();
  let newCounter = 0;
  
  // First, map start state to q0
  oldToNew.set(nfa.startState, `q${newCounter++}`);
  
  // Then map all other states in order
  nfa.states.forEach(state => {
    if (state !== nfa.startState && !oldToNew.has(state)) {
      oldToNew.set(state, `q${newCounter++}`);
    }
  });
  
  // Renumber states
  const newStates = nfa.states.map(s => oldToNew.get(s));
  const newStartState = oldToNew.get(nfa.startState);
  const newFinalStates = nfa.finalStates.map(s => oldToNew.get(s));
  
  // Renumber transitions
  const newTransitions = nfa.transitions.map(trans => ({
    from: oldToNew.get(trans.from),
    symbol: trans.symbol,
    to: oldToNew.get(trans.to)
  }));
  
  return {
    states: newStates,
    transitions: newTransitions,
    startState: newStartState,
    finalStates: newFinalStates
  };
}

// Main function to build NFA from regex
export function buildNFAFromRegex(regex) {
  // Reset counter
  stateCounter = 0;
  
  const tokens = tokenize(regex);
  const withConcat = addConcatenation(tokens);
  const postfix = infixToPostfix(withConcat);
  const nfa = buildNFAFromPostfix(postfix);
  
  //start state is always q0 ***
  const renumberedNFA = renumberStates(nfa);

  const transitionsObj = {};
  const alphabet = new Set();
  
  renumberedNFA.states.forEach(state => {
    transitionsObj[state] = {};
  });
  
  renumberedNFA.transitions.forEach(trans => {
    const { from, symbol, to } = trans;
    
    if (symbol === 'ε') {
      if (!transitionsObj[from]['ε']) {
        transitionsObj[from]['ε'] = [];
      }
      transitionsObj[from]['ε'].push(to);
    } else {
      alphabet.add(symbol);
      if (!transitionsObj[from][symbol]) {
        transitionsObj[from][symbol] = [];
      }
      transitionsObj[from][symbol].push(to);
    }
  });

  return {
    states: renumberedNFA.states,
    startState: renumberedNFA.startState,
    finalStates: renumberedNFA.finalStates,
    alphabet: Array.from(alphabet).sort(),
    transitions: transitionsObj,
    type: 'NFA'
  };
}