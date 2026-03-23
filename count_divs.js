const fs = require('fs');
const content = fs.readFileSync('c:/Users/Lenovo Flex i7/Documents/Apps/Go Planning/src/components/ProjectDetailModal.tsx', 'utf8');

const divOpen = (content.match(/<div(\s|>)/g) || []).length;
const divClose = (content.match(/<\/div>/g) || []).length;

console.log(`<div>: ${divOpen}, </div>: ${divClose}`);

// Optional: Trace line by line to find where it breaks
let depth = 0;
const lines = content.split('\n');
lines.forEach((line, i) => {
  const opens = (line.match(/<div(\s|>)/g) || []).length;
  const closes = (line.match(/<\/div>/g) || []).length;
  depth += opens - closes;
  if (depth < 0) {
    console.log(`Error: Negative div depth at line ${i + 1}`);
    depth = 0; // Reset to continue
  }
});
console.log(`Final depth: ${depth}`);
