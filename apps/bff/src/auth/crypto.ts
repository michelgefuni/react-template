import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';

import { randomId } from '../core/random-id.ts';

export { randomId };

const ivLength = 12;
const tagLength = 16;

export function encryptJson(value: unknown, key: Buffer): string {
  const iv = randomBytes(ivLength);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(value), 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64url');
}

export function decryptJson(payload: string, key: Buffer): unknown {
  const buffer = Buffer.from(payload, 'base64url');
  const iv = buffer.subarray(0, ivLength);
  const tag = buffer.subarray(ivLength, ivLength + tagLength);
  const encrypted = buffer.subarray(ivLength + tagLength);
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);
  return JSON.parse(plaintext.toString('utf8')) as unknown;
}

export function signValue(value: string, secret: string): string {
  const mac = createHmac('sha256', secret).update(value).digest('base64url');
  return `${value}.${mac}`;
}

export function verifyValue(signed: string, secret: string): string | null {
  const separator = signed.lastIndexOf('.');
  if (separator <= 0) return null;
  const value = signed.slice(0, separator);
  const expected = signValue(value, secret);
  const left = Buffer.from(signed);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right))
    return null;
  return value;
}
