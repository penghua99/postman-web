import { createHmac, timingSafeEqual } from 'crypto';

/**
 * 轻量 JWT 实现（HS256），使用 Node 内置 crypto，零外部依赖。
 * 签名密钥来自环境变量 JWT_SECRET，未设置时使用开发默认值。
 */

const DEFAULT_SECRET = 'postman-dev-secret-change-me';

export interface JwtPayload {
  /** 用户 ID */
  sub: string;
  /** 用户名 */
  username: string;
  iat: number;
  exp: number;
}

function getSecret(): string {
  return process.env.JWT_SECRET || DEFAULT_SECRET;
}

function base64UrlEncode(input: Buffer | string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(input: string): Buffer {
  let b64 = input.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';
  return Buffer.from(b64, 'base64');
}

/**
 * 签发 JWT。
 * @param payload 载荷（sub=用户ID, username=用户名）
 * @param expiresInSeconds 有效期（秒），默认 7 天
 */
export function signToken(
  payload: { sub: string; username: string },
  expiresInSeconds = 60 * 60 * 24 * 7,
): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const body: JwtPayload = {
    sub: payload.sub,
    username: payload.username,
    iat: now,
    exp: now + expiresInSeconds,
  };
  const headerPart = base64UrlEncode(JSON.stringify(header));
  const payloadPart = base64UrlEncode(JSON.stringify(body));
  const signingInput = `${headerPart}.${payloadPart}`;
  const signature = createHmac('sha256', getSecret()).update(signingInput).digest();
  return `${signingInput}.${base64UrlEncode(signature)}`;
}

/**
 * 校验并解析 JWT。签名无效或已过期返回 null。
 */
export function verifyToken(token: string): JwtPayload | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [headerPart, payloadPart, signaturePart] = parts;
  if (!headerPart || !payloadPart || !signaturePart) return null;

  const signingInput = `${headerPart}.${payloadPart}`;
  const expected = createHmac('sha256', getSecret()).update(signingInput).digest();
  let actual: Buffer;
  try {
    actual = base64UrlDecode(signaturePart);
  } catch {
    return null;
  }
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return null;
  }

  try {
    const payload = JSON.parse(
      base64UrlDecode(payloadPart).toString('utf8'),
    ) as JwtPayload;
    if (
      typeof payload.exp !== 'number' ||
      typeof payload.sub !== 'string' ||
      payload.exp < Math.floor(Date.now() / 1000)
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
