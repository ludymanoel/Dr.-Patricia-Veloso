document.querySelectorAll("details").forEach((detail) => {
  detail.addEventListener("toggle", () => {
    if (!detail.open) return;
    document.querySelectorAll("details[open]").forEach((openDetail) => {
      if (openDetail !== detail) openDetail.removeAttribute("open");
    });
  });
});

function initCarousels() {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  document.querySelectorAll("[data-carousel]").forEach((carousel) => {
    const viewport = carousel.querySelector("[data-carousel-viewport]");
    if (!viewport) return;
    let timer;
    let paused = false;

    const hasScrollableContent = () => viewport.scrollWidth > viewport.clientWidth + 8;
    const step = () => {
      const first = viewport.querySelector("li, figure, article, [data-carousel-item]");
      if (!first) return viewport.clientWidth * 0.9;
      const style = window.getComputedStyle(first);
      const parentStyle = window.getComputedStyle(first.parentElement || viewport);
      return first.getBoundingClientRect().width + (parseFloat(parentStyle.columnGap || parentStyle.gap) || 0) + (parseFloat(style.marginRight) || 0);
    };
    const advance = () => {
      if (paused || prefersReducedMotion.matches || !hasScrollableContent()) return;
      const max = viewport.scrollWidth - viewport.clientWidth;
      viewport.scrollTo({ left: viewport.scrollLeft >= max - 8 ? 0 : viewport.scrollLeft + step(), behavior: "smooth" });
    };
    const start = () => {
      window.clearInterval(timer);
      if (!prefersReducedMotion.matches && hasScrollableContent()) timer = window.setInterval(advance, 4200);
    };
    carousel.addEventListener("mouseenter", () => { paused = true; });
    carousel.addEventListener("mouseleave", () => { paused = false; });
    carousel.addEventListener("focusin", () => { paused = true; });
    carousel.addEventListener("focusout", () => { paused = false; });
    window.addEventListener("resize", start);
    prefersReducedMotion.addEventListener?.("change", start);
    start();
  });
}

const PAYMENT_URL = "https://pay.kiwify.com.br/Kxl16ye";
const WHATSAPP_URL = "https://wa.me/5538984213318?text=Ol%C3%A1%2C%20acabei%20de%20me%20inscrever%20para%20o%20Hands-on%20Long%20Hair%20FUE%20(14%20e%2015%2F11)%20e%20quero%20falar%20com%20a%20equipe.";
const LEAD_ENDPOINTS = {
  primary: "https://script.google.com/macros/s/AKfycbxocr7uTtsN_hZ4h6WnlCO2RzyHM6DMvTayc3s1PXOxYBunNonLBuBxXkqAUZ1KjLg/exec",
  mirrors: ["https://script.google.com/macros/s/AKfycbxo-Agl8ovuXKgdZpwnKL9af8jOBe7dcgkeeB6r1EPT2MVAuVrR4IJfPRNu1SlfafxYnw/exec"],
};
const LEAD_SUBMIT_TIMEOUT_MS = 8000;
const LEAD_ID_SESSION_KEY = "longHairFueLeadId";
const LEAD_TRACKED_SESSION_KEY = "longHairFueTrackedLeadId";
const UTM_SESSION_KEY = "longHairFueUtms";
const LEAD_FORM_PRIVACY_TEXT = "Seus dados serão usados apenas para dar continuidade ao seu interesse no workshop";
const LEAD_FORM_PAYMENT_DESCRIPTION = "Após o envio, você será direcionado para a página segura de pagamento.";
const LEAD_FORM_FIELDS = [
  { name: "name", label: "Nome", type: "text", autocomplete: "name" },
  { name: "email", label: "E-mail", type: "email", autocomplete: "email" },
  { name: "phone", label: "Telefone + DDD", type: "tel", autocomplete: "tel", inputmode: "tel" },
];
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

function trackLead(leadId, mode = "payment") {
  if (!leadId || trackedLeadIds.has(leadId)) return false;
  const storage = getSessionStorage();
  try {
    if (storage?.getItem(LEAD_TRACKED_SESSION_KEY) === leadId) return false;
  } catch { /* segue sem persistência */ }
  trackedLeadIds.add(leadId);
  try { storage?.setItem(LEAD_TRACKED_SESSION_KEY, leadId); } catch { /* opcional */ }

  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: "lead", lead_id: leadId, mode, source: "inscricao" });
  } catch { /* tracking não pode interromper o checkout */ }
  try {
    if (typeof window.fbq === "function") {
      const eventData = { content_name: "Workshop Long Hair FUE", content_category: "workshop", source: "inscricao" };
      if (mode !== "payment") eventData.mode = mode;
      window.fbq("track", "Lead", eventData, { eventID: leadId });
    }
  } catch { /* tracking não pode interromper o checkout */ }
  return true;
}

function getStoredUtms() {
  try { return JSON.parse(getSessionStorage()?.getItem(UTM_SESSION_KEY) || "{}") || {}; } catch { return {}; }
}

function captureUtms() {
  const params = new URLSearchParams(window.location.search);
  const utm = {};
  ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"].forEach((key) => {
    if (params.get(key)) utm[key] = params.get(key);
  });
  if (!Object.keys(utm).length) return;
  try { getSessionStorage()?.setItem(UTM_SESSION_KEY, JSON.stringify(utm)); } catch { /* opcional */ }
}

function buildLeadFormFields(prefix) {
  return LEAD_FORM_FIELDS.map((field) => {
    const errorId = `${prefix}-${field.name}-error`;
    const inputmode = field.inputmode ? ` inputmode="${field.inputmode}"` : "";
    return `<div class="lead-form__field"><label for="${prefix}-${field.name}">${field.label}</label><input id="${prefix}-${field.name}" name="${field.name}" type="${field.type}"${inputmode} autocomplete="${field.autocomplete}" required aria-invalid="false" aria-describedby="${errorId}" /><p class="lead-form__error" id="${errorId}" data-lead-error="${field.name}"></p></div>`;
  }).join("");
}

function buildLeadFormMarkup(prefix, mode = "payment") {
  const isWhatsApp = mode === "whatsapp";
  const description = isWhatsApp
    ? "Informe seus dados para registrar seu interesse. Após o envio, você seguirá para o WhatsApp da equipe."
    : LEAD_FORM_PAYMENT_DESCRIPTION;
  return `<p class="lead-form__kicker">Inscrição</p><h3 id="${prefix}-title">Complete os seus dados para garantir sua vaga</h3><form class="lead-form" data-lead-form data-lead-mode="${isWhatsApp ? "whatsapp" : "payment"}" novalidate aria-labelledby="${prefix}-title"><p class="lead-form__text">${description}</p>${buildLeadFormFields(prefix)}<p class="lead-form__privacy">${LEAD_FORM_PRIVACY_TEXT}</p><p class="lead-form__status" data-lead-status role="status" aria-live="polite"></p><button class="btn lead-form__submit" type="submit">Garantir minha vaga</button></form>`;
}

function validateLeadForm(form) {
  const rules = {
    name: ["Informe seu nome.", (value) => value.trim().length >= 2],
    email: ["Informe um e-mail válido.", (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())],
    phone: ["Informe um telefone válido com DDD.", (value) => value.replace(/\D/g, "").length >= 10],
  };
  let firstInvalid = null;
  Object.entries(rules).forEach(([name, [message, isValid]]) => {
    const input = form.elements[name];
    const valid = isValid(input.value || "");
    input.setAttribute("aria-invalid", String(!valid));
    form.querySelector(`[data-lead-error="${name}"]`).textContent = valid ? "" : message;
    if (!valid && !firstInvalid) firstInvalid = input;
  });
  if (firstInvalid) firstInvalid.focus();
  return !firstInvalid;
}

async function postLead(endpoint, payload, signal) {
  const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload), signal, keepalive: true });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error("Resposta inválida");
  }
  if (!result || result.ok !== true) throw new Error("Resposta inválida");
  return result;
}

async function submitLeadEndpoint(endpoint, payload) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), LEAD_SUBMIT_TIMEOUT_MS);
  try {
    return await postLead(endpoint, payload, controller.signal);
  } finally {
    window.clearTimeout(timeout);
  }
}

async function sendLead(form) {
  const now = new Date();
  const payload = {
    action: "lead",
    mode: form.dataset.leadMode === "whatsapp" ? "lead" : "payment",
    lead_id: getOrCreateLeadId(),
    name: form.elements.name.value.trim(),
    email: form.elements.email.value.trim().toLowerCase(),
    phone: form.elements.phone.value.replace(/\D/g, ""),
    source: "inscricao",
    utm: getStoredUtms(),
    page: window.location.href,
    user_agent: navigator.userAgent,
    created_at: now.toISOString(),
  };
  try {
    await submitLeadEndpoint(LEAD_ENDPOINTS.primary, payload);
    LEAD_ENDPOINTS.mirrors.forEach((endpoint) => {
      submitLeadEndpoint(endpoint, payload).catch((error) => console.warn("Falha no endpoint espelho", error));
    });
    return true;
  } catch (error) {
    console.warn("Falha no endpoint principal", error);
    for (const endpoint of LEAD_ENDPOINTS.mirrors) {
      try {
        await submitLeadEndpoint(endpoint, payload);
        return true;
      } catch (mirrorError) {
        console.warn("Falha no endpoint espelho", mirrorError);
      }
    }
    return false;
  }
}

function showCheckoutConfirmation(form, button) {
  const status = form.querySelector("[data-lead-status]");
  status.textContent = "Inscrição confirmada! Você será redirecionado para o pagamento.";
  status.classList.add("is-success");
  button.textContent = "Redirecionando…";
  window.setTimeout(() => {
    status.textContent = "";
    status.classList.remove("is-success");
    button.disabled = false;
    button.textContent = "Garantir minha vaga";
    form.closest("[data-lead-modal]")?.querySelector("[data-lead-modal-close]")?.click();
    window.location.href = PAYMENT_URL;
  }, 3000);
}

function showCheckoutError(form, button) {
  const status = form.querySelector("[data-lead-status]");
  status.textContent = "Não foi possível enviar seus dados. Tente novamente.";
  status.classList.remove("is-success");
  button.disabled = false;
  button.textContent = "Garantir minha vaga";
}

function showWhatsAppConfirmation(form, button) {
  const status = form.querySelector("[data-lead-status]");
  status.textContent = "Dados enviados! Você será direcionado para o WhatsApp da equipe.";
  status.classList.add("is-success");
  button.textContent = "Abrindo WhatsApp…";
  window.setTimeout(() => { window.location.href = WHATSAPP_URL; }, 700);
}

function createModalController(modal, dialog, closeButton) {
  let lastFocused;
  const close = () => {
    if (modal.hidden) return;
    modal.hidden = true;
    if (!document.querySelector(".lead-modal:not([hidden])")) document.body.classList.remove("is-modal-open");
    if (lastFocused?.focus) lastFocused.focus();
  };
  const open = (origin) => {
    lastFocused = origin || document.activeElement;
    modal.hidden = false;
    document.body.classList.add("is-modal-open");
    dialog.querySelector("input")?.focus();
  };
  closeButton.addEventListener("click", close);
  modal.addEventListener("click", (event) => { if (event.target === modal || event.target.classList.contains("lead-modal__backdrop")) close(); });
  document.addEventListener("keydown", (event) => {
    if (modal.hidden) return;
    if (event.key === "Escape") { event.preventDefault(); close(); return; }
    if (event.key !== "Tab") return;
    const focusable = Array.from(dialog.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  return { open, close };
}

function initLeadModal() {
  const modal = document.querySelector("[data-lead-modal]");
  const triggers = document.querySelectorAll("[data-lead-modal-trigger]");
  if (!modal || !triggers.length) return;
  const dialog = modal.querySelector("[data-lead-modal-dialog]");
  const body = modal.querySelector("[data-lead-modal-body]");
  const controller = createModalController(modal, dialog, modal.querySelector("[data-lead-modal-close]"));
  triggers.forEach((trigger) => {
    trigger.setAttribute("aria-haspopup", "dialog");
    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      body.innerHTML = buildLeadFormMarkup("modal-lead", trigger.dataset.leadMode || "payment");
      controller.open(trigger);
    });
  });
}

document.addEventListener("submit", async (event) => {
  const form = event.target.closest("[data-lead-form]");
  if (!form) return;
  event.preventDefault();
  if (!validateLeadForm(form)) return;
  const button = form.querySelector("button[type=submit]");
  button.disabled = true;
  const isWhatsApp = form.dataset.leadMode === "whatsapp";
  button.textContent = isWhatsApp ? "Enviando seus dados…" : "Abrindo pagamento…";
  const sent = await sendLead(form);
  if (!sent) console.warn("Não foi possível confirmar a captação nos endpoints");
  if (!sent) { showCheckoutError(form, button); return; }
  trackLead(getOrCreateLeadId(), isWhatsApp ? "lead" : "payment");
  if (isWhatsApp) { showWhatsAppConfirmation(form, button); return; }
  showCheckoutConfirmation(form, button);
});

captureUtms();
initCarousels();
initLeadModal();
