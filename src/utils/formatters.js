export const formatStateMapping = (mapping) => {
  return Object.entries(mapping).map(([newState, oldStates]) => ({
    newState,
    oldStates: Array.isArray(oldStates) ? oldStates.join(', ') : oldStates,
    count: Array.isArray(oldStates) ? oldStates.length : 1
  }));
};

export const formatTransitionTable = (automaton) => {
  const { states, transitions, alphabet } = automaton;
  
  const headers = ['State', ...alphabet];
  
  const rows = states.map((state) => {
    const row = { state };
    
    alphabet.forEach((symbol) => {
      const trans = transitions[state]?.[symbol];
      if (Array.isArray(trans)) {
        row[symbol] = trans.length > 0 ? trans.join(', ') : '-';
      } else {
        row[symbol] = trans || '-';
      }
    });
    
    // Add epsilon if exists
    if (transitions[state]?.['ε']) {
      row['ε'] = transitions[state]['ε'].join(', ');
    }
    
    return row;
  });
  
  // Add epsilon to headers if any state has epsilon transition
  const hasEpsilon = states.some(state => transitions[state]?.['ε']);
  if (hasEpsilon && !headers.includes('ε')) {
    headers.push('ε');
  }
  
  return { headers, rows };
};

//Truncate long text with ellipsis
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '-';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const getStateColor = (isStart, isFinal, isDead = false) => {
  if (isDead) {
    return { bg: '#fee2e2', border: '#dc2626', text: '#991b1b'  };
  }
  
  if (isStart && isFinal) {
    return { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' };
  }
  if (isStart) {
    return { bg: '#d1fae5', border: '#10b981', text: '#065f46'};
  }
  if (isFinal) {
    return { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' };
  }
  return { bg: '#ffffff', border: '#cbd5e1', text: '#475569' };
};