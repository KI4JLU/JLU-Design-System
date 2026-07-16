import "@testing-library/jest-dom/vitest";

// jsdom lacks a few browser APIs that Radix popper-positioned components
// (DropdownMenu, Popover, Select) require. Minimal no-op polyfills — the
// tests assert roles/keyboard behavior, not geometry.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;

Element.prototype.scrollIntoView ??= () => {};
Element.prototype.hasPointerCapture ??= () => false;
Element.prototype.setPointerCapture ??= () => {};
Element.prototype.releasePointerCapture ??= () => {};
