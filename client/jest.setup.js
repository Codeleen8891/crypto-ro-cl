import "@testing-library/jest-dom";

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = () => {};

// Mock matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// ✅ Always mock fetch for tests
beforeAll(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: async () => ({ user: { id: 1, name: "John Doe" } }),
      text: async () => JSON.stringify({ user: { id: 1, name: "John Doe" } }),
    })
  );
});

// Reset between tests so you can override fetch in specific tests
beforeEach(() => {
  global.fetch.mockClear();
});
