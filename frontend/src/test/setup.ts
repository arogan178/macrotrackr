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

// jsdom has no IntersectionObserver, which motion's whileInView needs. Report
// everything as visible so scroll-revealed content renders in tests.
if (typeof globalThis.IntersectionObserver !== "function") {
  class IntersectionObserverStub implements IntersectionObserver {
    readonly root = null;
    readonly rootMargin = "";
    readonly thresholds: readonly number[] = [];

    constructor(private readonly callback: IntersectionObserverCallback) {}

    observe(target: Element) {
      this.callback(
        [{ isIntersecting: true, target } as IntersectionObserverEntry],
        this,
      );
    }
    unobserve() {}
    disconnect() {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }

  Object.defineProperty(globalThis, "IntersectionObserver", {
    writable: true,
    value: IntersectionObserverStub,
  });
}
