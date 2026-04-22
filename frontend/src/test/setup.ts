import "@testing-library/jest-dom";

if (typeof globalThis.matchMedia !== "function") {
  const createMediaQueryList = (
    query: string,
    matches = false,
  ): MediaQueryList => {
    return {
      matches,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    };
  };

  Object.defineProperty(globalThis, "matchMedia", {
    writable: true,
    value: (query: string) => createMediaQueryList(query),
  });
}

if (
  typeof globalThis.window !== "undefined" &&
  typeof globalThis.window.matchMedia !== "function"
) {
  Object.defineProperty(globalThis.window, "matchMedia", {
    writable: true,
    value: (query: string) => globalThis.matchMedia(query),
  });
}
