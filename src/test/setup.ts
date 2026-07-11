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
Element.prototype.scrollTo = vi.fn() as unknown as Element["scrollTo"];
(Element.prototype as unknown as { hasPointerCapture: () => boolean }).hasPointerCapture = vi.fn(() => false);
(Element.prototype as unknown as { releasePointerCapture: () => void }).releasePointerCapture = vi.fn();
(Element.prototype as unknown as { setPointerCapture: () => void }).setPointerCapture = vi.fn();

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as unknown as { ResizeObserver: typeof ResizeObserverStub }).ResizeObserver = ResizeObserverStub;

// crypto.randomUUID for happy-dom/jsdom stability
if (!globalThis.crypto?.randomUUID) {
  Object.defineProperty(globalThis, "crypto", {
    value: { ...(globalThis.crypto ?? {}), randomUUID: () => Math.random().toString(36).slice(2) },
  });
}
