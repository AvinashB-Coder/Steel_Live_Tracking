import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=== Checking .env file ===');
console.log('Current directory:', process.cwd());
console.log('.env exists:', fs.existsSync('./.env'));
console.log('.env path:', path.resolve('./.env'));

if (fs.existsSync('./.env')) {
  console.log('\n.env contents:');
  console.log(fs.readFileSync('./.env', 'utf8'));
}
