import { test } from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';

test('Vercel API compiles using the root TypeScript configuration', () => {
  // Vercel compiles function entrypoints with the root config, independently
  // of Vite's project references. Check that exact boundary, not just tsc -b.
  const config = ts.readConfigFile('tsconfig.json', ts.sys.readFile);
  assert.equal(config.error, undefined);
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, process.cwd());
  const program = ts.createProgram(['api/ai.ts'], { ...parsed.options, noEmit: true });
  const diagnostics = ts.getPreEmitDiagnostics(program);
  assert.equal(diagnostics.length, 0, ts.formatDiagnosticsWithColorAndContext(diagnostics, {
    getCurrentDirectory: ts.sys.getCurrentDirectory,
    getCanonicalFileName: name => name,
    getNewLine: () => '\n',
  }));
});
