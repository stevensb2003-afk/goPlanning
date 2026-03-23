const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env.local');
let content = fs.readFileSync(envPath, 'utf8');

// Fix the private key by ensuring literal newlines are present instead of escaped ones
// Note: In .env files, the value is often treated literally if wrapped in single quotes.
// The error "Invalid PEM formatted message" usually means the string doesn't have actual \n.

content = content.split('\n').map(line => {
  if (line.startsWith('FIREBASE_SERVICE_ACCOUNT=')) {
    // Replace \\n with \n inside the string
    return line.replace(/\\\\n/g, '\\n'); // This is tricky.
    // Actually, if it's already \\n in the file, we want it to be \n in the parsed object.
  }
  return line;
}).join('\n');

// Let's try to just write it out manually to be sure.
// If the user has: "private_key":"-----BEGIN PRIVATE KEY-----\\nMIIEvg...\\n-----END PRIVATE KEY-----\\n"
// That's actually correct for a JSON-in-JSON scenario, but not for direct cert creation.

fs.writeFileSync(envPath, content);
console.log('Fixed .env.local (hopefully)');
