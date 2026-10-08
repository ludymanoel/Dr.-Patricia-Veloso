/* =====================================================================
   PATCH PARA O script.js DO SITE drapatriciaveloso.com.br
   ---------------------------------------------------------------------
   PROBLEMA ENCONTRADO NO SITE ATUAL:
   1. LEAD_ENDPOINT está vazio ("") -> NENHUM lead está sendo salvo hoje.
      Nome, e-mail e telefone digitados no quiz e no modal se perdem.
   2. O payload só manda name/email/phone -> não dá pra saber se a pessoa
      fez o quiz, o que respondeu, nem se foi para o pagamento.
   3. O pagamento é um link fixo (mpago.la) -> não dá pra ligar o
      pagamento ao lead com segurança.

   O QUE ESTE PATCH FAZ:
   - Aponta o envio para o backend (Google Apps Script, pasta /apps-script).
   - Envia origem (quiz x modal), respostas do quiz, modo, UTMs e um lead_id.
   - No modo "payment", o backend devolve um link de checkout do Mercado
     Pago amarrado ao lead (external_reference = lead_id). Se algo falhar,
     cai no link fixo antigo — a pessoa NUNCA fica sem conseguir pagar.

   COMO APLICAR (dev):
   1. Troque as duas constantes LEAD_ENDPOINT e PAYMENT_URL pelas abaixo.
   2. Cole captureUtms() + getUtms() + newLeadId() e chame captureUtms()
      uma vez no carregamento da página.
   3. Substitua a função sendLead() inteira pela versão abaixo.
   4. Em handleLeadSubmit(), troque o bloco do redirect de pagamento pelo
      trecho marcado "REDIRECT DE PAGAMENTO".
   A variável `answers` é a mesma que o quiz já usa (answers.Perfil etc.).
   ===================================================================== */

const LEAD_ENDPOINT = "https://script.google.com/macros/s/COLE_AQUI_O_ID_DA_IMPLANTACAO/exec";
const PAYMENT_URL = "https://mpago.la/244hsWi"; // fallback, se o backend não responder

/* ---------- UTMs: guarda a origem do clique (anúncio, Instagram...) ---------- */
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];

function captureUtms() {
  try {
    const params = new URLSearchParams(window.location.search);
    const found = {};
    UTM_KEYS.forEach((k) => { if (params.get(k)) found[k] = params.get(k); });
    if (Object.keys(found).length) sessionStorage.setItem("lhf_utms", JSON.stringify(found));
  } catch (_) { /* navegação privada etc.: segue sem UTM */ }
}

function getUtms() {
  try { return JSON.parse(sessionStorage.getItem("lhf_utms") || "{}"); }
  catch (_) { return {}; }
}

function newLeadId() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return "l-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
}

captureUtms();

/* ---------- Envio do lead (substitui a sendLead atual) ---------- */
async function sendLead(form) {
  const isModal = Boolean(form.closest("[data-lead-modal]"));
  const mode = form.dataset.leadMode || "lead"; // "payment" | "lead"

  const payload = {
    action: "lead",
    lead_id: newLeadId(),
    name: form.elements.name.value.trim(),
    email: form.elements.email.value.trim().toLowerCase(),
    phone: form.elements.phone.value.replace(/\D/g, ""),
    source: isModal ? "modal" : "quiz",        // modal = deixou dados SEM fazer o quiz
    mode: isModal ? "lead" : mode,
    quiz: isModal ? null : { ...answers },      // respostas do quiz
    utm: getUtms(),
    page: window.location.href,
    user_agent: navigator.userAgent,
    created_at: new Date().toISOString(),
  };

  // Content-Type text/plain evita o preflight CORS do Apps Script.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(LEAD_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error("HTTP " + response.status);
    return await response.json(); // { ok: true, checkout_url?: "..." }
  } finally {
    clearTimeout(timer);
  }
}

/* ---------- REDIRECT DE PAGAMENTO (dentro de handleLeadSubmit) ----------
   Troque o trecho atual:

      await sendLead(form);
      if (mode === "payment") { window.location.href = PAYMENT_URL; ... }

   por:
*/
async function exemploHandleLeadSubmit(form, mode) {
  let result = null;
  try {
    result = await sendLead(form);
  } catch (err) {
    console.warn("Lead não enviado:", err); // a pessoa segue o fluxo mesmo assim
  }

  if (mode === "payment") {
    window.location.href = (result && result.checkout_url) || PAYMENT_URL;
    return;
  }
  // ...segue o fluxo atual (fecha modal / abre "Obrigado!")
}

/* ---------- LGPD: texto para colocar logo abaixo do botão do formulário ----------
   <p class="lead-consent">Ao enviar, você concorda em receber comunicações sobre
   o Workshop Long Hair FUE por e-mail e WhatsApp. Você pode cancelar a qualquer
   momento pelo link no rodapé dos e-mails.</p>
*/
