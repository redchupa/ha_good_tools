import { md5, sha1 } from '@noble/hashes/legacy.js';
import { sha256, sha512 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import { updateCrc32 } from './helpers';

self.onmessage = async ({ data: file }: MessageEvent<Blob>) => {
  try {
    const hashes = { md5: md5.create(), sha1: sha1.create(), sha256: sha256.create(), sha512: sha512.create() };
    let crc = 0xffffffff;
    const size = 1024 * 1024;
    for (let offset = 0; offset < file.size; offset += size) {
      const bytes = new Uint8Array(await file.slice(offset, offset + size).arrayBuffer());
      for (const hash of Object.values(hashes)) hash.update(bytes);
      crc = updateCrc32(crc, bytes);
      self.postMessage({ progress: Math.floor(100 * Math.min(offset + size, file.size) / file.size) });
    }
    const result = Object.fromEntries(Object.entries(hashes).map(([name, h]) => [name, bytesToHex(h.digest())]));
    self.postMessage({ result: { ...result, crc32: ((crc ^ 0xffffffff) >>> 0).toString(16).padStart(8, '0') } });
  } catch { self.postMessage({ error: true }); }
};
