(function () {
  const CHECKOUT_HOST = "pay.kiwify.com.br";
  const LEAD_ID_SESSION_KEY = "longHairFueLeadId";
  const LEAD_TRACKED_SESSION_KEY = "longHairFueTrackedLeadId";
  const trackedLeadIds = new Set();

  function getSessionStorage() {
    try { return window.sessionStorage; } catch { return null; }
  }

  function getOrCreateLeadId() {
    const storage = getSessionStorage();
    try {
      const existing = storage?.getItem(LEAD_ID_SESSION_KEY);
      if (existing) return existing;
    } catch { /* segue para a memória */ }
    const id = window.crypto?.randomUUID?.() || "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
      const random = Math.floor(Math.random() * 16);
      return (char === "x" ? random : (random & 0x3) | 0x8).toString(16);
    });
    try { storage?.setItem(LEAD_ID_SESSION_KEY, id); } catch { /* segue sem persistência */ }
    return id;
  }

  function trackLead(leadId, source) {
    if (!leadId || trackedLeadIds.has(leadId)) return false;
    const storage = getSessionStorage();
    try {
      if (storage?.getItem(LEAD_TRACKED_SESSION_KEY) === leadId) return false;
    } catch { /* segue sem persistência */ }
    trackedLeadIds.add(leadId);
    try { storage?.setItem(LEAD_TRACKED_SESSION_KEY, leadId); } catch { /* opcional */ }

    try {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: "lead", lead_id: leadId, mode: "payment", source });
    } catch { /* tracking não pode interromper o checkout */ }
    try {
      if (typeof window.fbq === "function") {
        window.fbq("track", "Lead", { content_name: "Workshop Long Hair FUE", content_category: "workshop", source }, { eventID: leadId });
      }
    } catch { /* tracking não pode interromper o checkout */ }
    try {
      if (typeof window.clarity === "function") {
        window.clarity("event", "lead_click");
      }
    } catch { /* tracking não pode interromper o checkout */ }
    return true;
  }

  function isCheckoutLink(link) {
    try {
      const url = new URL(link.getAttribute("href"), window.location.href);
      return url.hostname === CHECKOUT_HOST;
    } catch { return false; }
  }

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const link = target.closest("a[href]");
    if (!link || !isCheckoutLink(link)) return;
    trackLead(getOrCreateLeadId(), link.dataset.leadSource || "cta_checkout");
  }, true);
})();
