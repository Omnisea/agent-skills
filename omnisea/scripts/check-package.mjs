import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const files = [];
function walk(dir) {
  for (const ent of readdirSync(dir, {withFileTypes:true})) {
    if (ent.name === 'node_modules' || ent.name === '.git' || ent.name.startsWith('.env') || ent.name.endsWith('.local.json')) continue;
    const path = resolve(dir, ent.name);
    if (ent.isDirectory()) walk(path); else files.push(path);
  }
}
walk(root);
let total = 0;
for (const file of files) {
  const rel = relative(root, file).replaceAll('\\','/');
  const size = statSync(file).size;
  total += size;
  const cap = rel === 'SKILL.md' ? 1024 * 1024 : rel.startsWith('references/') ? 100 * 1024 : 2 * 1024 * 1024;
  if (size > cap) throw new Error('Bankr file cap exceeded: ' + rel);
  if (file.endsWith('.md')) {
    const content = readFileSync(file,'utf8');
    for (const [,target] of content.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
      if (/^https?:\/\//.test(target) || target.startsWith('#')) continue;
      const path = resolve(dirname(file), target.split('#')[0]);
      if (!existsSync(path)) throw new Error('Broken link: ' + rel + ' -> ' + target);
    }
  }
}
if (total > 5 * 1024 * 1024) throw new Error('Bankr skill cap exceeded');
// Optional source audit. Never required for consumers of the self-contained package.
if (process.argv[2]) {
  const provenance = JSON.parse(readFileSync(resolve(root,'data/provenance.json')));
  for (const [path,hash] of Object.entries(provenance.files)) {
    const actual = createHash('sha256').update(readFileSync(resolve(process.argv[2],path))).digest('hex');
    if (actual !== hash) throw new Error('Source drift: ' + path);
  }
  for (const name of ['Omnisea','OmniseaLens','OFT','OFTAdapter','OmniseaNFT','OmniseaNFTLens','ONFT721','ONFT721Adapter']) {
    const sourcePath = ['OmniseaNFT','OmniseaNFTLens','ONFT721','ONFT721Adapter'].includes(name) ? 'onft/' + name : name;
    const original = JSON.parse(readFileSync(resolve(process.argv[2],'solidity-v2/abi/' + sourcePath + '.json')));
    const exported = JSON.parse(readFileSync(resolve(root,'abi/' + name + '.json')));
    for (const entry of exported) if (!original.some(x => JSON.stringify(x) === JSON.stringify(entry))) throw new Error('ABI drift: ' + name + '.' + entry.name);
  }
}
console.log(`Package OK: ${files.length} files, ${total} bytes; links and import size limits passed${process.argv[2] ? '; source hashes and ABI subsets match' : ''}.`);
