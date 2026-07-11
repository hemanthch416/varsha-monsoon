import "@testing-library/jest-dom";
import { vi } from "vitest";

// jsdom lacks matchMedia; components (theme, mobile hook) call it during render.
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Radix Select / DropdownMenu rely on these primitives.
if (!("PointerEvent" in window)) {
  // @ts-expect-error - polyfill for jsdom
  window.PointerEvent = class extends Event {};
}
Element.prototype.scrollIntoView = vi.fn();
// @ts-expect-error - jsdom stub
Element.prototype.hasPointerCapture = vi.fn(() => false);
// @ts-expect-error - jsdom stub
Element.prototype.releasePointerCapture = vi.fn();
// @ts-expect-error - jsdom stub
Element.prototype.setPointerCapture = vi.fn();

// crypto.randomUUID for happy-dom/jsdom stability
if (!globalThis.crypto?.randomUUID) {
  Object.defineProperty(globalThis, "crypto", {
    value: { ...(globalThis.crypto ?? {}), randomUUID: () => Math.random().toString(36).slice(2) },
  });
}
