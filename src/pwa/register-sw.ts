// Guarded service-worker registration. Never registers in dev or Lovable preview.
export function registerAppServiceWorker() {
  if (typeof window === "undefined") return;
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  if (!import.meta.env.PROD) return;
  try {
    if (window.top !== window.self) return; // iframe
  } catch {
    return;
  }
  const h = window.location.hostname;
  if (
    h.startsWith("id-preview--") ||
    h.startsWith("preview--") ||
    h === "lovableproject.com" ||
    h.endsWith(".lovableproject.com") ||
    h === "lovableproject-dev.com" ||
    h.endsWith(".lovableproject-dev.com") ||
    h === "beta.lovable.dev" ||
    h.endsWith(".beta.lovable.dev")
  ) {
    // Also unregister any lingering worker in these contexts.
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((r) => {
        if (r.active?.scriptURL.endsWith("/sw.js")) r.unregister();
      });
    });
    return;
  }
  if (new URLSearchParams(window.location.search).get("sw") === "off") {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((r) => {
        if (r.active?.scriptURL.endsWith("/sw.js")) r.unregister();
      });
    });
    return;
  }
  navigator.serviceWorker.register("/sw.js").catch(() => {});
}
