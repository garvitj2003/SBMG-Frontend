/* Clickjacking protection: break out of iframe. No inline JS in HTML. */
(function () {
  if (window.top !== window.self) {
    window.top.location = window.self.location;
  }
})();

/* Prevent React Router from leaking version to Wappalyzer / fingerprinting */
(function () {
  try {
    delete window.__reactRouterVersion;
    Object.defineProperty(window, '__reactRouterVersion', {
      configurable: false,
      enumerable: false,
      get: function () { return undefined; },
      set: function () {}
    });
  } catch (_) {
    try { window.__reactRouterVersion = undefined; } catch (_) {}
  }
  /* Re-lock after scripts run (in case of timing or overwrite) */
  setTimeout(function () {
    try {
      if (window.__reactRouterVersion !== undefined) {
        delete window.__reactRouterVersion;
        Object.defineProperty(window, '__reactRouterVersion', {
          configurable: false,
          enumerable: false,
          get: function () { return undefined; },
          set: function () {}
        });
      }
    } catch (_) {}
  }, 0);
})();
