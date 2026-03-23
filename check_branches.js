const fs = require('fs');
const content = fs.readFileSync('c:/Users/Lenovo Flex i7/Documents/Apps/Go Planning/src/components/ProjectDetailModal.tsx', 'utf8');

const lines = content.split('\n');
const ifBranch = lines.slice(570 - 1, 1001).join('\n');
const elseBranch = lines.slice(1001, 1463).join('\n');

function checkBalance(text, name) {
  const opens = (text.match(/<div(\s|>)/g) || []).length;
  const selfClosers = (text.match(/<div[^>]*\/>/g) || []).length;
  const closes = (text.match(/<\/div>/g) || []).length;
  console.log(`${name}: Opens: ${opens}, Self: ${selfClosers}, Closes: ${closes}, Balance: ${opens - selfClosers - closes}`);
}

checkBalance(ifBranch, 'IF Branch');
checkBalance(elseBranch, 'ELSE Branch');
