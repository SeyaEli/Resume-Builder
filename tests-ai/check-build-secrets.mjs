import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';

// Fake sentinels only: prove private server variables do not enter browser assets.
const key = 'gsk_BUILD_SECURITY_SENTINEL_7c51e9';
const password = 'BUILD_PASSWORD_SECURITY_SENTINEL_d891ac';
const build = spawnSync(process.execPath, ['node_modules/vite/bin/vite.js', 'build'], {
  env: { ...process.env, GROQ_API_KEY: key, AI_ACCESS_PASSWORD: password }, encoding: 'utf8',
});
assert.equal(build.status, 0, build.stderr);
let scanned = 0;
function scan(folder) {
  for (const entry of readdirSync(folder, { withFileTypes: true })) {
    const path = join(folder, entry.name);
    if (entry.isDirectory()) scan(path);
    else {
      const content = readFileSync(path);
      assert.ok(!content.includes(key), `Private Groq key leaked in ${path}`);
      assert.ok(!content.includes(password), `Private server password leaked in ${path}`);
      scanned++;
    }
  }
}
scan('dist');
console.log(`PASS: scanned ${scanned} built files; no private server sentinels exposed.`);
