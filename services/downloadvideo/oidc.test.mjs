import assert from 'node:assert/strict';
import { generateKeyPairSync, sign } from 'node:crypto';
import test from 'node:test';
import { createOidcVerifier } from './oidc.mjs';

const pair = generateKeyPairSync('rsa', { modulusLength: 2048 });
const rotated = generateKeyPairSync('rsa', { modulusLength: 2048 });
const now = 1794823200000;
const seconds = now / 1000;
const issuer = 'https://oidc.vercel.com/jelle-wijmas-projects';
const claims = {
  iss: issuer, aud: 'https://vercel.com/jelle-wijmas-projects',
  sub: 'owner:jelle-wijmas-projects:project:portfolio:environment:production',
  owner: 'jelle-wijmas-projects', owner_id: 'team_RvP8bAVZGBIFN533poCALKMv',
  project: 'portfolio', project_id: 'prj_zvVapcFUHY9MKWZGjyXrzkHotSf1', environment: 'production',
  iat: seconds, nbf: seconds, exp: seconds + 7200,
};
const jwk = (key = pair.publicKey, kid = 'initial') => ({
  ...key.export({ format: 'jwk' }), kid, alg: 'RS256', use: 'sig',
});
function token(overrides = {}, key = pair.privateKey, headerOverrides = {}) {
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT', kid: 'initial', ...headerOverrides })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ ...claims, ...overrides })).toString('base64url');
  return `${header}.${payload}.${sign('RSA-SHA256', Buffer.from(`${header}.${payload}`), key).toString('base64url')}`;
}
function verifier(custom = {}) {
  const urls = [];
  const verify = createOidcVerifier({ now: () => now, fetch: async url => {
    urls.push(url);
    return Response.json({ keys: [jwk()] });
  }, ...custom });
  return { verify, urls };
}

test('valid portfolio function token uses the fixed JWKS URL and cached key', async () => {
  const { verify, urls } = verifier();
  assert.equal(await verify(token()), true);
  assert.equal(await verify(token()), true);
  assert.deepEqual(urls, [`${issuer}/.well-known/jwks`]);
});

test('preview and global issuer tokens verify with the same exact project policy', async () => {
  const { verify, urls } = verifier();
  assert.equal(await verify(token({
    environment: 'preview', sub: 'owner:jelle-wijmas-projects:project:portfolio:environment:preview',
  })), true);
  assert.equal(await verify(token({ iss: 'https://oidc.vercel.com' })), true);
  assert.equal(urls[1], 'https://oidc.vercel.com/.well-known/jwks');
  assert.equal(await verifier({ allowGlobal: false }).verify(token({ iss: 'https://oidc.vercel.com' })), false);
});

test('wrong identity, audience, issuer and invalid times reject before network access', async () => {
  const { verify, urls } = verifier();
  for (const override of [
    { project_id: 'prj_other' }, { project: 'other' }, { owner_id: 'team_other' }, { owner: 'other' },
    { iss: 'https://attacker.invalid' }, { aud: 'https://attacker.invalid' },
    { environment: 'development' }, { sub: 'owner:other:project:portfolio:environment:production' },
    { exp: seconds - 31 }, { nbf: seconds + 31 }, { iat: seconds + 31 },
    { iat: seconds - 7300 }, { exp: seconds + 7300 }, { exp: '1794830400' },
  ]) assert.equal(await verify(token(override)), false, JSON.stringify(override));
  assert.deepEqual(urls, []);
});

test('rejects altered signatures and algorithm confusion', async () => {
  const { verify } = verifier();
  assert.equal(await verify(token({}, rotated.privateKey)), false);
  assert.equal(await verify(token({}, pair.privateKey, { alg: 'HS256' })), false);
  assert.equal(await verify(token({}, pair.privateKey, { crit: ['x'] })), false);
  for (const malformed of ['', 'one.two', 'one.two.three.four', 'a'.repeat(17000), 'e30.e30.a']) {
    assert.equal(await verify(malformed), false);
  }
});

test('unknown key refreshes after cooldown and never causes per-request fetching', async () => {
  let time = now;
  let requests = 0;
  let keys = [jwk()];
  const { verify } = verifier({ now: () => time, fetch: async () => {
    requests++;
    return Response.json({ keys });
  } });
  assert.equal(await verify(token()), true);
  keys = [jwk(rotated.publicKey, 'rotated')];
  const next = token({}, rotated.privateKey, { kid: 'rotated' });
  assert.equal(await verify(next), false);
  assert.equal(await verify(next), false);
  assert.equal(requests, 1);
  time += 60001;
  assert.equal(await verify(next), true);
  assert.equal(requests, 2);
});

test('network errors, oversized documents and unsuitable keys fail closed', async () => {
  assert.equal(await verifier({ fetch: async () => { throw new Error('offline'); } }).verify(token()), false);
  assert.equal(await verifier({ fetch: async () => new Response('x'.repeat(65537)) }).verify(token()), false);
  for (const key of [jwk(pair.publicKey, 'wrong'), { ...jwk(), use: 'enc' }, { ...jwk(), alg: 'RS512' }, { ...jwk(), key_ops: ['encrypt'] }]) {
    assert.equal(await verifier({ fetch: async () => Response.json({ keys: [key] }) }).verify(token()), false);
  }
  assert.equal(await verifier({ fetch: async () => Response.json({ keys: [jwk(), jwk()] }) }).verify(token()), false);
});

test('parallel requests share one JWKS fetch and failed refreshes are throttled', async () => {
  let requests = 0;
  const { verify } = verifier({ fetch: async () => {
    requests++;
    await new Promise(resolve => setTimeout(resolve, 10));
    return Response.json({ keys: [jwk()] });
  } });
  assert.deepEqual(await Promise.all([verify(token()), verify(token()), verify(token())]), [true, true, true]);
  assert.equal(requests, 1);
  let failures = 0;
  const unavailable = verifier({ fetch: async () => { failures++; throw new Error('offline'); } });
  assert.equal(await unavailable.verify(token()), false);
  assert.equal(await unavailable.verify(token()), false);
  assert.equal(failures, 1);
});
