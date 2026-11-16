import { constants, createPublicKey, verify as verifySignature } from 'node:crypto';

const DEFAULTS = {
  teamSlug: 'jelle-wijmas-projects',
  teamId: 'team_RvP8bAVZGBIFN533poCALKMv',
  projectName: 'portfolio',
  projectId: 'prj_zvVapcFUHY9MKWZGjyXrzkHotSf1',
};
const MAX_DOCUMENT_BYTES = 64 * 1024;
const CACHE_TTL = 60 * 60 * 1000;
const REFRESH_COOLDOWN = 60 * 1000;
const CLOCK_TOLERANCE = 30;

function decodePart(value) {
  if (!value || !/^[A-Za-z0-9_-]+$/.test(value)) throw new Error('Invalid JWT encoding');
  return Buffer.from(value, 'base64url');
}

function objectFromPart(value) {
  const parsed = JSON.parse(decodePart(value).toString('utf8'));
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Invalid JWT object');
  return parsed;
}

async function readDocument(response) {
  if (!response.ok || !response.body) throw new Error('JWKS unavailable');
  const length = Number(response.headers.get('content-length'));
  if (length > MAX_DOCUMENT_BYTES) throw new Error('JWKS too large');
  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.length;
      if (total > MAX_DOCUMENT_BYTES) throw new Error('JWKS too large');
      chunks.push(value);
    }
  } catch (error) {
    await reader.cancel().catch(() => {});
    throw error;
  } finally {
    reader.releaseLock();
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

/**
 * Verify only Vercel tokens for this deployment's project and team.
 * JWKS URLs are constructed from configured trust, never from token headers.
 * https://vercel.com/docs/oidc/api
 */
export function createOidcVerifier(options = {}) {
  const config = { ...DEFAULTS, ...options };
  if (!/^[a-z0-9-]+$/.test(config.teamSlug)) throw new Error('Invalid OIDC team slug');
  const request = options.fetch ?? globalThis.fetch;
  const now = options.now ?? Date.now;
  const teamIssuer = `https://oidc.vercel.com/${config.teamSlug}`;
  const issuers = new Set([teamIssuer]);
  if (options.allowGlobal !== false) issuers.add('https://oidc.vercel.com');
  const environments = new Set(['production', 'preview']);
  const caches = new Map([...issuers].map(issuer => [issuer, {
    keys: new Map(), expires: 0, attempted: -Infinity, pending: null,
  }]));

  function validClaims(claims) {
    const seconds = now() / 1000;
    if (!issuers.has(claims.iss) || claims.aud !== `https://vercel.com/${config.teamSlug}`) return false;
    if (claims.owner !== config.teamSlug || claims.owner_id !== config.teamId ||
        claims.project !== config.projectName || claims.project_id !== config.projectId ||
        !environments.has(claims.environment)) return false;
    if (claims.sub !== `owner:${config.teamSlug}:project:${config.projectName}:environment:${claims.environment}`) return false;
    if (![claims.iat, claims.nbf, claims.exp].every(Number.isSafeInteger)) return false;
    return claims.iat <= seconds + CLOCK_TOLERANCE && claims.nbf <= seconds + CLOCK_TOLERANCE &&
      claims.exp > seconds - CLOCK_TOLERANCE && claims.exp > claims.iat && claims.nbf <= claims.exp &&
      seconds - claims.iat <= 7200 + CLOCK_TOLERANCE && claims.exp - claims.iat <= 7200 + CLOCK_TOLERANCE;
  }

  async function refresh(issuer, cache) {
    if (cache.pending) return cache.pending;
    if (now() - cache.attempted < REFRESH_COOLDOWN) return;
    cache.attempted = now();
    cache.pending = (async () => {
      const response = await request(`${issuer}/.well-known/jwks`, {
        redirect: 'error', signal: AbortSignal.timeout(5000), headers: { Accept: 'application/json' },
      });
      const document = await readDocument(response);
      if (!Array.isArray(document.keys) || document.keys.length > 64) throw new Error('Invalid JWKS');
      const keys = new Map();
      for (const jwk of document.keys) {
        if (!jwk || jwk.kty !== 'RSA' || typeof jwk.kid !== 'string' || jwk.kid.length > 128 ||
            (jwk.alg && jwk.alg !== 'RS256') || (jwk.use && jwk.use !== 'sig') ||
            (jwk.key_ops && (!Array.isArray(jwk.key_ops) || !jwk.key_ops.includes('verify'))) || jwk.d) continue;
        try {
          const key = createPublicKey({ key: jwk, format: 'jwk' });
          if ((key.asymmetricKeyDetails?.modulusLength ?? 0) < 2048) continue;
          // Ambiguous duplicate key ids must never select an arbitrary key.
          if (keys.has(jwk.kid)) keys.set(jwk.kid, null);
          else keys.set(jwk.kid, key);
        } catch { /* Ignore unsupported keys in an otherwise valid JWKS. */ }
      }
      cache.keys = keys;
      cache.expires = now() + CACHE_TTL;
    })();
    try {
      await cache.pending;
    } finally {
      cache.pending = null;
    }
  }

  return async function verify(token) {
    try {
      if (typeof token !== 'string' || token.length > 16384) return false;
      const parts = token.split('.');
      if (parts.length !== 3) return false;
      const header = objectFromPart(parts[0]);
      const claims = objectFromPart(parts[1]);
      if (header.alg !== 'RS256' || header.typ !== 'JWT' || typeof header.kid !== 'string' ||
          !header.kid || header.kid.length > 128 || header.crit !== undefined || !validClaims(claims)) return false;
      const signature = decodePart(parts[2]);
      const cache = caches.get(claims.iss);
      if (now() >= cache.expires || !cache.keys.has(header.kid)) await refresh(claims.iss, cache);
      if (now() >= cache.expires) return false;
      const key = cache.keys.get(header.kid);
      if (!key) return false;
      return verifySignature('RSA-SHA256', Buffer.from(`${parts[0]}.${parts[1]}`), {
        key, padding: constants.RSA_PKCS1_PADDING,
      }, signature);
    } catch {
      // Authentication fails closed during malformed tokens, key rotation or outages.
      return false;
    }
  };
}
