const fs = require('fs');
const content = fs.readFileSync('src/components/ProjectDetailModal.tsx', 'utf8');

function traceBalance(content) {
  let stack = [];
  let line = 1;
  let col = 1;
  
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (char === '\n') {
      line++;
      col = 1;
      continue;
    }
    
    if (char === '(' || char === '{' || char === '[') {
      stack.push({ char, line, col });
    } else if (char === ')' || char === '}' || char === ']') {
      if (stack.length === 0) {
        console.log(`EXTRA: Found ${char} at line ${line}, col ${col} with NO opening match.`);
      } else {
        const last = stack.pop();
        const pairs = { ')': '(', '}': '{', ']': '[' };
        if (last.char !== pairs[char]) {
          console.log(`MISMATCH: Found ${char} at line ${line}, col ${col} but expected closure for ${last.char} from line ${last.line}, col ${last.col}.`);
          // Put it back to keep tracking or decide how to handle
          // For now, let's treat the closer as the ground truth
        }
      }
    }
    col++;
  }
  
  if (stack.length > 0) {
    console.log('UNCLOSED items left on stack:');
    stack.forEach(s => console.log(`${s.char} at line ${s.line}, col ${s.col}`));
  } else {
    console.log('Final stack is empty.');
  }
}

traceBalance(content);
