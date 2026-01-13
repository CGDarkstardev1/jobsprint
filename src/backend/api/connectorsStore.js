import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const STORE_PATH = path.resolve(process.cwd(), 'connectors_store.json');
const KEY = process.env.CONNECTORS_SECRET_KEY || null; // 32 bytes recommended

function encrypt(json) {
  if (!KEY)
    return {
      ciphertext: Buffer.from(JSON.stringify(json)).toString('base64'),
      iv: null,
      tag: null,
      alg: 'none',
    };

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(KEY, 'hex'), iv);
  const data = Buffer.from(JSON.stringify(json));
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    ciphertext: encrypted.toString('base64'),
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
    alg: 'aes-256-gcm',
  };
}

function decrypt(payload) {
  if (!payload) return null;
  if (!KEY || payload.alg === 'none') {
    try {
      return JSON.parse(Buffer.from(payload.ciphertext, 'base64').toString('utf8'));
    } catch (e) {
      return null;
    }
  }

  const iv = Buffer.from(payload.iv, 'hex');
  const tag = Buffer.from(payload.tag, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(KEY, 'hex'), iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(payload.ciphertext, 'base64')),
    decipher.final(),
  ]);
  return JSON.parse(decrypted.toString('utf8'));
}

function readStore() {
  try {
    if (!fs.existsSync(STORE_PATH)) return {};
    const raw = fs.readFileSync(STORE_PATH, 'utf8');
    return JSON.parse(raw || '{}');
  } catch (e) {
    console.warn('[connectorsStore] read error', e.message);
    return {};
  }
}

function writeStore(obj) {
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(obj, null, 2), 'utf8');
  } catch (e) {
    console.error('[connectorsStore] write error', e.message);
  }
}

export function saveProviderToken(provider, tokenObj) {
  const store = readStore();
  store[provider] = encrypt(tokenObj);
  writeStore(store);
}

export function getProviderToken(provider) {
  const store = readStore();
  if (!store[provider]) return null;
  return decrypt(store[provider]);
}

export function hasProviderToken(provider) {
  const store = readStore();
  return !!store[provider];
}

export function clearProviderToken(provider) {
  const store = readStore();
  if (store[provider]) delete store[provider];
  writeStore(store);
}
