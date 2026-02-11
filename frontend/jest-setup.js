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
  return {
    createHash: (algo) => crypto.createHash(algo),
    generateKeyPairSync: jest.fn(() => ({
      publicKey: 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890', // 64 chars hex
      privateKey: 'privatekey_simulated_for_testing',
    })),
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