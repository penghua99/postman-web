import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

const KEY_LEN = 64;
const SCRYPT_OPTS = { N: 16384, r: 8, p: 1 } as const;

/**
 * 使用 scrypt 派生密钥并哈希密码，返回 "salt:hash" 格式的字符串。
 * @param password 明文密码
 * @param salt 可选盐（十六进制）。未提供时自动生成随机盐。
 */
export function hashPassword(password: string, salt?: string): string {
  const s = salt ?? randomBytes(16).toString('hex');
  const hash = scryptSync(password, s, KEY_LEN, SCRYPT_OPTS);
  return `${s}:${hash.toString('hex')}`;
}

/**
 * 校验明文密码与存储的 "salt:hash" 是否匹配（恒定时间比较，防时序攻击）。
 */
export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split(':');
  if (parts.length !== 2) return false;
  const [salt, hashHex] = parts;
  if (!salt || !hashHex) return false;
  const hash = scryptSync(password, salt, KEY_LEN, SCRYPT_OPTS);
  const expected = Buffer.from(hashHex, 'hex');
  return hash.length === expected.length && timingSafeEqual(hash, expected);
}
