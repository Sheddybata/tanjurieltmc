import { createCipheriv, createDecipheriv } from 'crypto';

/** AES/CBC/PKCS5Padding — matches Wema Merchant Payout spec. */
export function alatEncrypt(plainText: string, key: string, iv: string): string {
  const cipher = createCipheriv('aes-128-cbc', Buffer.from(key, 'utf8'), Buffer.from(iv, 'utf8'));
  let encrypted = cipher.update(plainText, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return encrypted;
}

export function alatDecrypt(encryptedBase64: string, key: string, iv: string): string {
  const decipher = createDecipheriv('aes-128-cbc', Buffer.from(key, 'utf8'), Buffer.from(iv, 'utf8'));
  let decrypted = decipher.update(encryptedBase64, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/** Parses decrypted ALAT pipe response e.g. `00|Salami Muritala Olayiwola`. */
export function parseAlatPipeResponse(decrypted: string): { code: string; value: string } {
  const trimmed = decrypted.trim();
  const pipe = trimmed.indexOf('|');
  if (pipe === -1) {
    return { code: trimmed, value: '' };
  }
  return {
    code: trimmed.slice(0, pipe),
    value: trimmed.slice(pipe + 1).trim(),
  };
}
