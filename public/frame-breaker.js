/* Clickjacking protection: break out of iframe. No inline JS in HTML. */
(function () {
  if (window.top !== window.self) {
    window.top.location = window.self.location;
  }
})();
