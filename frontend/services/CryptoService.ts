import { Buffer } from 'buffer';

type QuickCryptoLike = any;

const RSA_OAEP_PADDING = 4;

let quickCrypto: QuickCryptoLike | null | undefined;
let forgeModule: any | null = null;

function getQuickCrypto(): QuickCryptoLike | null {
  if (quickCrypto !== undefined) return quickCrypto;
  try {
    const required = require('react-native-quick-crypto');
    quickCrypto = required?.default ?? required;
  } catch {
    quickCrypto = null;
  }
  return quickCrypto;
}

function forge(): any {
  if (!forgeModule) {
    forgeModule = require('node-forge');
  }
  return forgeModule;
}

function toBinary(data: Buffer | Uint8Array | string): string {
  return Buffer.from(data as any).toString('binary');
}

function fromBinary(binary: string): Buffer {
  return Buffer.from(binary, 'binary');
}

function randomBytesFallback(length: number): Buffer {
  const out = new Uint8Array(length);
  const cryptoApi = (globalThis as any).crypto;
  if (cryptoApi?.getRandomValues) {
    cryptoApi.getRandomValues(out);
    return Buffer.from(out);
  }
  return fromBinary(forge().random.getBytesSync(length));
}

function mdForName(name: string): any {
  const normalized = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (normalized === 'sha256' || normalized === 'rsasha256') {
    return forge().md.sha256.create();
  }
  throw new Error(`CryptoService: algoritmo no soportado: ${name}`);
}

function createHashFallback(algo: string) {
  const md = mdForName(algo);
  return {
    update(data: Buffer | Uint8Array | string) {
      md.update(typeof data === 'string' ? data : toBinary(data), 'raw');
      return this;
    },
    digest(encoding?: BufferEncoding | 'hex' | 'base64') {
      const bytes = fromBinary(md.digest().getBytes());
      return encoding ? bytes.toString(encoding as BufferEncoding) : bytes;
    },
  };
}

function createSignFallback(algo: string) {
  const md = mdForName(algo);
  return {
    update(data: Buffer | Uint8Array | string) {
      md.update(typeof data === 'string' ? data : toBinary(data), 'raw');
      return this;
    },
    sign(privateKeyPem: string, encoding?: BufferEncoding | 'base64') {
      const privateKey = forge().pki.privateKeyFromPem(privateKeyPem);
      const signature = fromBinary(privateKey.sign(md));
      return encoding ? signature.toString(encoding as BufferEncoding) : signature;
    },
  };
}

function createVerifyFallback(algo: string) {
  const md = mdForName(algo);
  return {
    update(data: Buffer | Uint8Array | string) {
      md.update(typeof data === 'string' ? data : toBinary(data), 'raw');
      return this;
    },
    verify(publicKeyPem: string, signature: Buffer | string, encoding?: BufferEncoding | 'base64') {
      const publicKey = forge().pki.publicKeyFromPem(publicKeyPem);
      const sig = typeof signature === 'string'
        ? Buffer.from(signature, encoding as BufferEncoding)
        : Buffer.from(signature);
      return publicKey.verify(md.digest().getBytes(), toBinary(sig));
    },
  };
}

function createCipherivFallback(algorithm: string, key: Buffer | Uint8Array, iv: Buffer | Uint8Array) {
  if (algorithm !== 'aes-256-gcm') {
    throw new Error(`CryptoService: cipher no soportado: ${algorithm}`);
  }
  const cipher = forge().cipher.createCipher('AES-GCM', toBinary(Buffer.from(key)));
  cipher.start({ iv: toBinary(Buffer.from(iv)), tagLength: 128 });
  let finished = false;
  return {
    update(data: Buffer | Uint8Array) {
      cipher.update(forge().util.createBuffer(toBinary(Buffer.from(data)), 'raw'));
      return Buffer.alloc(0);
    },
    final() {
      if (!finished) {
        const ok = cipher.finish();
        finished = true;
        if (!ok) throw new Error('CryptoService: fallo al cifrar');
      }
      return fromBinary(cipher.output.getBytes());
    },
    getAuthTag() {
      if (!finished) this.final();
      return fromBinary(cipher.mode.tag.getBytes());
    },
  };
}

function createDecipherivFallback(algorithm: string, key: Buffer | Uint8Array, iv: Buffer | Uint8Array) {
  if (algorithm !== 'aes-256-gcm') {
    throw new Error(`CryptoService: decipher no soportado: ${algorithm}`);
  }
  let tag: Buffer | null = null;
  const chunks: Buffer[] = [];
  return {
    setAuthTag(authTag: Buffer | Uint8Array) {
      tag = Buffer.from(authTag);
    },
    update(data: Buffer | Uint8Array) {
      chunks.push(Buffer.from(data));
      return Buffer.alloc(0);
    },
    final() {
      if (!tag) throw new Error('CryptoService: falta auth tag');
      const decipher = forge().cipher.createDecipher('AES-GCM', toBinary(Buffer.from(key)));
      decipher.start({ iv: toBinary(Buffer.from(iv)), tag: toBinary(tag), tagLength: 128 });
      decipher.update(forge().util.createBuffer(toBinary(Buffer.concat(chunks)), 'raw'));
      const ok = decipher.finish();
      if (!ok) throw new Error('CryptoService: autenticación GCM fallida');
      return fromBinary(decipher.output.getBytes());
    },
  };
}

function normalizeOaepHash(options: any): any {
  return mdForName(options?.oaepHash ?? 'sha1');
}

export const CryptoService = {
  constants: {
    RSA_PKCS1_OAEP_PADDING: getQuickCrypto()?.constants?.RSA_PKCS1_OAEP_PADDING ?? RSA_OAEP_PADDING,
  },

  randomBytes(length: number): Buffer {
    const native = getQuickCrypto();
    if (native?.randomBytes) return Buffer.from(native.randomBytes(length));
    return randomBytesFallback(length);
  },

  createHash(algo: string) {
    const native = getQuickCrypto();
    if (native?.createHash) return native.createHash(algo);
    return createHashFallback(algo);
  },

  generateKeyPairSync(type: string, options: any) {
    const native = getQuickCrypto();
    if (native?.generateKeyPairSync) return native.generateKeyPairSync(type, options);
    if (type !== 'rsa') throw new Error(`CryptoService: keypair no soportado: ${type}`);
    const pair = forge().pki.rsa.generateKeyPair({
      bits: options?.modulusLength ?? 2048,
      e: 0x10001,
    });
    return {
      publicKey: forge().pki.publicKeyToPem(pair.publicKey),
      privateKey: forge().pki.privateKeyToPem(pair.privateKey),
    };
  },

  createSign(algo: string) {
    const native = getQuickCrypto();
    if (native?.createSign) return native.createSign(algo);
    return createSignFallback(algo);
  },

  createVerify(algo: string) {
    const native = getQuickCrypto();
    if (native?.createVerify) return native.createVerify(algo);
    return createVerifyFallback(algo);
  },

  publicEncrypt(options: any, data: Buffer | Uint8Array): Buffer {
    const native = getQuickCrypto();
    if (native?.publicEncrypt) return Buffer.from(native.publicEncrypt(options, data));
    if (options?.padding !== RSA_OAEP_PADDING) {
      throw new Error('CryptoService: solo RSA-OAEP está soportado en fallback');
    }
    const publicKey = forge().pki.publicKeyFromPem(options.key);
    return fromBinary(publicKey.encrypt(toBinary(Buffer.from(data)), 'RSA-OAEP', {
      md: normalizeOaepHash(options),
      mgf1: { md: normalizeOaepHash(options) },
    }));
  },

  privateDecrypt(options: any, data: Buffer | Uint8Array): Buffer {
    const native = getQuickCrypto();
    if (native?.privateDecrypt) return Buffer.from(native.privateDecrypt(options, data));
    if (options?.padding !== RSA_OAEP_PADDING) {
      throw new Error('CryptoService: solo RSA-OAEP está soportado en fallback');
    }
    const privateKey = forge().pki.privateKeyFromPem(options.key);
    return fromBinary(privateKey.decrypt(toBinary(Buffer.from(data)), 'RSA-OAEP', {
      md: normalizeOaepHash(options),
      mgf1: { md: normalizeOaepHash(options) },
    }));
  },

  pbkdf2Sync(password: string, salt: Buffer | Uint8Array, iterations: number, keyLength: number, digest: string): Buffer {
    const native = getQuickCrypto();
    if (native?.pbkdf2Sync) return Buffer.from(native.pbkdf2Sync(password, salt, iterations, keyLength, digest));
    return fromBinary(forge().pkcs5.pbkdf2(password, toBinary(Buffer.from(salt)), iterations, keyLength, mdForName(digest)));
  },

  createCipheriv(algorithm: string, key: Buffer | Uint8Array, iv: Buffer | Uint8Array) {
    const native = getQuickCrypto();
    if (native?.createCipheriv) return native.createCipheriv(algorithm, key, iv);
    return createCipherivFallback(algorithm, key, iv);
  },

  createDecipheriv(algorithm: string, key: Buffer | Uint8Array, iv: Buffer | Uint8Array) {
    const native = getQuickCrypto();
    if (native?.createDecipheriv) return native.createDecipheriv(algorithm, key, iv);
    return createDecipherivFallback(algorithm, key, iv);
  },
};

export default CryptoService;
