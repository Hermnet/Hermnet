jest.mock('react-native-nitro-modules', () => ({
  NitroModules: {
    createHybridObject: jest.fn(() => ({})),
  },
}));

jest.mock('react-native-quick-crypto', () => {
  const crypto = require('crypto');
  return {
    createHash: (algo) => crypto.createHash(algo),
  };
});

if (typeof window !== 'undefined' && !window.dispatchEvent) {
  window.dispatchEvent = () => {};
}

// Mock para expo-sqlite
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(() => ({
    execAsync: jest.fn(),
    getFirstAsync: jest.fn(),
    getAllAsync: jest.fn(),
    runAsync: jest.fn(),
  })),
}));