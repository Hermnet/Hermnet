/**
 * Jest setup file for mocking native modules and global objects.
 * This ensures that tests run smoothly in the Node.js environment provided by Jest.
 */

// Mock for react-native-nitro-modules to prevent native module errors in tests
jest.mock('react-native-nitro-modules', () => ({
  NitroModules: {
    createHybridObject: jest.fn(() => ({})),
  },
}));

// Mock for react-native-quick-crypto, delegating to node's crypto where possible
jest.mock('react-native-quick-crypto', () => {
  const crypto = require('crypto');
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  return {
    createHash: (algo) => crypto.createHash(algo),
    createSign: (algo) => crypto.createSign(algo),
    publicEncrypt: (options, data) => crypto.publicEncrypt(options, data),
    privateDecrypt: (options, data) => crypto.privateDecrypt(options, data),
    constants: crypto.constants,
    generateKeyPairSync: jest.fn(() => ({ publicKey, privateKey })),
  };
});

// Polyfill for window.dispatchEvent if undefined
if (typeof window !== 'undefined' && !window.dispatchEvent) {
  window.dispatchEvent = () => { };
}

// Mock for expo-sqlite to simulate database operations
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(() => ({
    execAsync: jest.fn(),
    getFirstAsync: jest.fn(),
    getAllAsync: jest.fn(),
    runAsync: jest.fn(),
  })),
}));

// Mock for expo-secure-store to support auth session tests
jest.mock('expo-secure-store', () => {
  const storage = new Map();

  return {
    getItemAsync: jest.fn(async (key) => storage.get(key) ?? null),
    setItemAsync: jest.fn(async (key, value) => {
      storage.set(key, value);
    }),
    deleteItemAsync: jest.fn(async (key) => {
      storage.delete(key);
    }),
  };
});