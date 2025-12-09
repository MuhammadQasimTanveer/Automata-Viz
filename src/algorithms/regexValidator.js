export const validateRegex = (regex) => {
  if (!regex || regex.trim() === '') {
    return {
      isValid: false,
      error: 'Please enter a regular expression'
    };
  }

  // Check for balanced parentheses
  let parenCount = 0;
  let parenPositions = [];
  
  for (let i = 0; i < regex.length; i++) {
    if (regex[i] === '(') {
      parenCount++;
      parenPositions.push(i);
    } else if (regex[i] === ')') {
      parenCount--;
      if (parenCount < 0) {
        return {
          isValid: false,
          error: `Error: Extra closing parenthesis ')' at position ${i + 1}`
        };
      }
    }
  }
  
  if (parenCount > 0) {
    return {
      isValid: false,
      error: `Error: Missing closing parenthesis ')' (opened at position ${parenPositions[parenPositions.length - 1] + 1})`
    };
  }

  // Check for invalid repetition operators
  const repetitionOps = ['*', '+', '?'];
  
  for (let i = 0; i < regex.length; i++) {
    const char = regex[i];
    const nextChar = regex[i + 1];
    // Check for operator at start
    if (i === 0 && repetitionOps.includes(char)) {
      return {
        isValid: false,
        error: `Error: Operator '${char}' cannot appear at the beginning`
      };
    }
    
    // Check for consecutive operators (except after closing paren)
    if (repetitionOps.includes(char) && repetitionOps.includes(nextChar)) {
      return {
        isValid: false,
        error: `Error: Invalid consecutive operators '${char}${nextChar}' at position ${i + 1}`
      };
    }
    
    // Check for operator after opening paren
    if (char === '(' && repetitionOps.includes(nextChar)) {
      return {
        isValid: false,
        error: `Error: Operator '${nextChar}' cannot follow opening parenthesis at position ${i + 2}`
      };
    }
    
    // Check for | at start or end
    if ((i === 0 || i === regex.length - 1) && char === '|') {
      return {
        isValid: false,
        error: `Error: Union operator '|' cannot be at ${i === 0 ? 'beginning' : 'end'}`
      };
    }
    
    // Check for consecutive |
    if (char === '|' && nextChar === '|') {
      return {
        isValid: false,
        error: `Error: Consecutive union operators '||' at position ${i + 1}`
      };
    }
  }

  // Check for valid characters (alphanumeric, operators, parentheses)
  const validChars = /^[a-zA-Z0-9()|*+? ]+$/;
  if (!validChars.test(regex)) {
    for (let i = 0; i < regex.length; i++) {
      if (!validChars.test(regex[i])) {
        return {
          isValid: false,
          error: `Error: Invalid character '${regex[i]}' at position ${i + 1}`
        };
      }
    }
  }

  return { isValid: true, error: null };
};

//Extract alphabet from regex
export const extractAlphabet = (regex) => {
  const alphabet = new Set();
  const validSymbols = /^[a-zA-Z0-9]$/;
  
  for (const char of regex) {
    if (validSymbols.test(char)) {
      alphabet.add(char);
    }
  }

  return Array.from(alphabet).sort();
};