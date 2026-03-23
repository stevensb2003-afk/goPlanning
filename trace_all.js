const fs = require('fs');
const content = fs.readFileSync('c:/Users/Lenovo Flex i7/Documents/Apps/Go Planning/src/components/ProjectDetailModal.tsx', 'utf8');

let parens = 0;
let curlies = 0;
let curliesStack = [];
let parensStack = [];

for (let i = 0; i < content.length; i++) {
  const char = content[i];
  const line = content.substring(0, i).split('\n').length;
  if (char === '(') {
    parens++;
    parensStack.push(line);
  } else if (char === ')') {
    parens--;
    if (parens < 0) console.log(`Extra ) at line ${line}`);
    parensStack.pop();
  } else if (char === '{') {
    curlies++;
    curliesStack.push(line);
  } else if (char === '}') {
    curlies--;
    if (curlies < 0) console.log(`Extra } at line ${line}`);
    curliesStack.pop();
  }
}

console.log(`Final counts: ( ${parens}, { ${curlies} )`);
if (parens > 0) console.log(`Unclosed ( from lines: ${parensStack.join(', ')}`);
if (curlies > 0) console.log(`Unclosed { from lines: ${curliesStack.join(', ')}`);
