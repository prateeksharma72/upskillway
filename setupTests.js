import '@testing-library/jest-dom';

// Global test setup
beforeEach(() => {
  // Reset any mocks
  jest.clearAllMocks();
  
  // Mock localStorage
  const localStorageMock = (() => {
    let store = {};
    return {
      getItem: (key) => store[key] || null,
      setItem: (key, value) => { store[key] = value.toString(); },
      removeItem: (key) => { delete store[key]; },
      clear: () => { store = {}; },
    };
  })();
  
  Object.defineProperty(window, 'localStorage', { value: localStorageMock });
});

// Mock window.matchMedia
window.matchMedia = window.matchMedia || function() {
  return {
    matches: false,
    addListener: function() {},
    removeListener: function() {}
  };
};