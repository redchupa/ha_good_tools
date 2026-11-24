import { describe, it, expect } from 'vitest';
import { decrypt, encrypt, textHashes } from './secureCrypto';
import CryptoJS from 'crypto-js';

describe('versioned crypto', () => {
  it('authenticates ciphertext and preserves Unicode', async () => {
    const encoded = await encrypt('안녕하세요', 'sample passphrase');
    expect(encoded).toMatch(/^GT1\./);
    expect(await decrypt(encoded,'sample passphrase')).toBe('안녕하세요');
    await expect(decrypt(encoded,'wrong')).rejects.toThrow();
  });
  it('reads a previous CryptoJS ciphertext', async () => {
    expect(await decrypt(CryptoJS.AES.encrypt('old format','key').toString(),'key')).toBe('old format');
  });
  it('matches SHA and HMAC vectors', async () => {
    const results = Object.fromEntries(await textHashes('Hi There','\x0b'.repeat(20)));
    expect(results['HMAC-SHA-256']).toBe('b0344c61d8db38535ca8afceaf0bf12b881dc200c9833da726e9376c2e32cff7');
    expect(Object.fromEntries(await textHashes('abc',''))['SHA-256']).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });
});
