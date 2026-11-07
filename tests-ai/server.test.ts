import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { Readable } from 'node:stream';
import { createAiHandler } from '../server/groq.ts';

const secret = 'gsk_TEST_PRIVATE_SENTINEL_123456789';
const env = { GROQ_API_KEY: secret, AI_ACCESS_PASSWORD: 'test-app-password', AI_ALLOWED_ORIGINS: 'http://localhost:5173' };
const valid = { kind: 'summary', context: 'Engineer at Acme', input: 'Engineer' };

async function request(body: unknown, options: { password?: string; origin?: string; env?: Record<string, string>; upstream?: typeof fetch } = {}) {
  const handler = createAiHandler({ env: options.env ?? env, fetchImpl: options.upstream ?? (async () => Response.json({ choices: [{ message: { content: 'Grounded summary' } }] })) as typeof fetch });
  const server = createServer(handler);
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address() as { port: number };
  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/api/ai`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Origin: options.origin ?? 'http://localhost:5173', Authorization: `Bearer ${options.password ?? env.AI_ACCESS_PASSWORD}` }, body: JSON.stringify(body),
    });
    return { status: response.status, data: await response.json(), cache: response.headers.get('cache-control') };
  } finally { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
}

test('requires separate authentication and configured server credentials', async () => {
  assert.equal((await request(valid, { password: 'wrong' })).status, 401);
  assert.equal((await request(valid, { env: {} })).status, 503);
});
test('rejects foreign origins, unsupported tasks and oversized inputs', async () => {
  assert.equal((await request(valid, { origin: 'https://evil.example' })).status, 403);
  assert.equal((await request({ kind: 'arbitrary-proxy' })).status, 400);
  assert.equal((await request({ ...valid, input: 'x'.repeat(13000) })).status, 400);
});
test('only the upstream request receives Groq credentials; replies are not cached', async () => {
  const result = await request(valid, { upstream: (async (url, init) => {
    assert.equal(url, 'https://api.groq.com/openai/v1/chat/completions');
    assert.equal((init?.headers as Record<string, string>).Authorization, `Bearer ${secret}`);
    const payload = JSON.parse(init?.body as string);
    assert.equal(payload.model, 'openai/gpt-oss-20b');
    assert.match(payload.messages.at(-1).content, /Engineer at Acme/);
    return Response.json({ choices: [{ message: { content: 'Grounded summary' } }] });
  }) as typeof fetch });
  assert.equal(result.status, 200);
  assert.equal(result.data.text, 'Grounded summary');
  assert.equal(result.cache, 'no-store');
  assert.ok(!JSON.stringify(result.data).includes(secret));
});
test('redacts upstream errors and echoed secrets', async () => {
  for (const status of [401, 429, 500]) {
    const result = await request(valid, { upstream: (async () => new Response(secret, { status })) as typeof fetch });
    assert.ok(!JSON.stringify(result.data).includes(secret));
    assert.equal(result.status, status === 429 ? 429 : 502);
  }
  const result = await request(valid, { upstream: (async () => Response.json({ choices: [{ message: { content: secret } }] })) as typeof fetch });
  assert.ok(!JSON.stringify(result.data).includes(secret));
});
test('rejects empty, truncated and malformed upstream replies', async () => {
  for (const data of [{}, { choices: [{ message: { content: '' } }] }, { choices: [{ finish_reason: 'length', message: { content: 'partial' } }] }]) {
    assert.equal((await request(valid, { upstream: (async () => Response.json(data)) as typeof fetch })).status, 502);
  }
});
test('connection test discovers available models without returning credentials', async () => {
  const result = await request({ kind: 'test' }, { upstream: (async url => {
    assert.equal(url, 'https://api.groq.com/openai/v1/models');
    return Response.json({ data: [{ id: 'openai/gpt-oss-20b' }, { id: 'whisper-large-v3' }] });
  }) as typeof fetch });
  assert.equal(result.status, 200);
  assert.deepEqual(result.data.models, ['openai/gpt-oss-20b']);
});
test('maps timeout to a safe actionable error', async () => {
  const result = await request(valid, { upstream: (async () => { throw new DOMException(secret, 'TimeoutError'); }) as typeof fetch });
  assert.equal(result.status, 504);
  assert.ok(!JSON.stringify(result.data).includes(secret));
});

test('preserves names when UTF-8 characters span incoming chunks', async () => {
  const raw = Buffer.from(JSON.stringify({ ...valid, context: 'José, Manila' }));
  const split = raw.indexOf(Buffer.from('é')) + 1;
  const req = Readable.from([raw.subarray(0, split), raw.subarray(split)]) as unknown as IncomingMessage;
  req.method = 'POST'; req.headers = { origin: 'http://localhost:5173', authorization: `Bearer ${env.AI_ACCESS_PASSWORD}`, 'content-type': 'application/json' };
  let reply = '';
  const res = { writeHead() {}, end(text: string) { reply = text; } } as unknown as ServerResponse;
  const handler = createAiHandler({ env, fetchImpl: (async (_url, init) => {
    const body = JSON.parse(init?.body as string);
    assert.match(body.messages.at(-1).content, /José, Manila/);
    return Response.json({ choices: [{ message: { content: 'Summary for José' } }] });
  }) as typeof fetch });
  await handler(req, res);
  assert.equal(JSON.parse(reply).text, 'Summary for José');
});
