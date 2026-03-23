const fs = require('fs');
const content = fs.readFileSync('src/components/ProjectDetailModal.tsx', 'utf8');

function traceParen(content) {
  let stack = [];
  let line = 1;
  let col = 1;
  
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (char === '\n') {
      line++; col = 1; continue;
    }
    
    if (char === '(') {
      stack.push({ char, line, col });
    } else if (char === ')') {
      if (stack.length === 0) {
        console.log(`EXTRA ) at line ${line}, col ${col}`);
      } else {
        const last = stack.pop();
        if (last.line === 362 || last.line === 364 || last.line === 579 || last.line === 1002 || line > 1490) {
           console.log(`MATCH: ( from ${last.line}:${last.col} matched by ) at ${line}:${col}`);
        }
      }
    }
    col++;
  }
}

traceParen(content);
