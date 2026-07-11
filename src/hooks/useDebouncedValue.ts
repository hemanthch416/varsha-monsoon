import { useEffect, useState } from "react";

/**
 * Return `value` after `delayMs` of stability. Cancels the pending update if
 * `value` changes again inside the window. Useful for wiring text inputs to
 * expensive derivations without firing on every keystroke.
 */
export function useDebouncedValue<T>(value: T, delayMs = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}
