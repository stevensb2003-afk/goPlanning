const fs = require('fs');
const content = fs.readFileSync('c:/Users/Lenovo Flex i7/Documents/Apps/Go Planning/src/components/ProjectDetailModal.tsx', 'utf8');

const opens = (content.match(/<div(\s|>)/g) || []).length;
const selfClosers = (content.match(/<div[^>]*\/>/g) || []).length;
const closes = (content.match(/<\/div>/g) || []).length;

console.log(`Opens: ${opens}, Self-Closers: ${selfClosers}, Closes: ${closes}`);
console.log(`Net Open: ${opens - selfClosers}`);
console.log(`Balance: ${(opens - selfClosers) - closes}`);
