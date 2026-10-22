/**
 * AUTOMAÇÃO DE E-MAIL — WORKSHOP LONG HAIR FUE (Dra. Patricia Veloso)
 * ---------------------------------------------------------------------
 * Roda dentro de uma Planilha Google (Extensões > Apps Script). Faz 4 coisas:
 *   1. Recebe os leads do site (doPost) e salva na aba "Leads".
 *   2. Para quem vai ao pagamento, direciona para o checkout fixo Kiwify.
 *   3. A cada 30 min: envia o próximo e-mail da sequência de cada lead.
 *
 * SEGMENTOS
 *   C = iniciou o checkout e NÃO pagou
 *   PAGO = sai de tudo · NAO_MEDICO = não recebe sequência de venda
 *
 * INSTALAÇÃO: veja LEIA-ME.md
 */

const CONFIG = {
  SHEET_LEADS: 'Leads',
  SHEET_LOG: 'Envios',
  TIMEZONE: 'America/Sao_Paulo',

  SITE_URL: 'https://www.drapatriciaveloso.com.br/',
  PAYMENT_URL_FALLBACK: 'https://pay.kiwify.com.br/Kxl16ye',

  // Remetente
  SENDER: 'gmail', // 'gmail' (MailApp, até 100/dia em conta comum ou 1.500/dia no Workspace) ou 'brevo'
  FROM_NAME: 'Equipe Dra. Patricia Veloso',
  REPLY_TO: 'COLOQUE_AQUI_O_EMAIL_DE_ATENDIMENTO',
  BREVO_FROM_EMAIL: 'COLOQUE_AQUI_O_REMETENTE_VALIDADO_NO_BREVO',

  // Janela de envio (horário de Brasília) e data-limite
  SEND_HOUR_START: 8,
  SEND_HOUR_END: 20,
  STOP_SENDING_AT: '2026-11-12T20:00:00-03:00', // véspera do evento
  MAX_PER_RUN: 80,

};

/** Atraso de cada e-mail em horas, contado a partir do envio anterior (o 1º conta da entrada do lead). */
const SEQUENCES = {
  C: [{ id: 'C1', delayHours: 2 }, { id: 'C2', delayHours: 22 }, { id: 'C3', delayHours: 48 }],
};
const C_EMAIL_IDS = ['C1', 'C2', 'C3'];

const HEADERS = [
  'lead_id', 'created_at', 'updated_at', 'name', 'email', 'phone',
  'source', 'mode', 'perfil', 'relacao', 'interesse', 'intencao',
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
  'checkout_url', 'segment', 'status', 'step', 'next_send_at',
  'last_sent_at', 'last_email_id', 'paid_at', 'payment_id', 'unsubscribed_at', 'notes', 'aviso_lote',
];
const LOG_HEADERS = ['data', 'lead_id', 'email', 'email_id', 'segmento', 'ok', 'erro'];

/* =====================================================================
   1. RECEBER LEADS DO SITE
   ===================================================================== */

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    const data = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (data.action !== 'lead') return json_({ ok: false, error: 'acao_invalida' });

    const email = String(data.email || '').trim().toLowerCase();
    const name = String(data.name || '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || name.length < 2) {
      return json_({ ok: false, error: 'dados_invalidos' });
    }

    const lead = upsertLead_(Object.assign({}, data, { email: email, name: name }));

    const checkoutUrl = data.mode === 'payment' && lead.status !== 'pago'
      ? CONFIG.PAYMENT_URL_FALLBACK
      : null;
    return json_({ ok: true, lead_id: lead.lead_id, checkout_url: checkoutUrl });
  } catch (err) {
    console.error('doPost', err);
    return json_({ ok: false, error: 'erro_interno' });
  } finally {
    lock.releaseLock();
  }
}

function upsertLead_(data) {
  const sheet = getSheet_(CONFIG.SHEET_LEADS);
  const rows = readRows_(sheet);
  const now = new Date();
  const quiz = data.quiz || {};
  const utm = data.utm || {};
  const incomingSource = data.source === 'quiz' ? 'quiz' : 'modal';
  const incomingMode = data.mode === 'payment' ? 'payment' : 'lead';

  let lead = rows.find(function (r) { return r.email === data.email; });
  const isNew = !lead;
  if (isNew) {
    lead = { _row: null, lead_id: data.lead_id || Utilities.getUuid(), created_at: now, status: 'ativo', step: 0 };
  }

  lead.updated_at = now;
  lead.name = data.name;
  lead.email = data.email;
  if (data.phone) lead.phone = "'" + String(data.phone).replace(/\D/g, '');

  // Quiz vale mais que modal; "payment" nunca volta para "lead".
  if (incomingSource === 'quiz' || !lead.source) lead.source = incomingSource;
  if (incomingMode === 'payment' || !lead.mode) lead.mode = incomingMode;
  if (quiz.Perfil) lead.perfil = quiz.Perfil;
  if (quiz['Relação com transplante capilar']) lead.relacao = quiz['Relação com transplante capilar'];
  if (quiz['Interesse principal']) lead.interesse = quiz['Interesse principal'];
  if (quiz['Intenção de participação']) lead.intencao = quiz['Intenção de participação'];
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(function (k) {
    if (utm[k] && !lead[k]) lead[k] = utm[k];
  });

  if (incomingMode === 'payment' && lead.status !== 'pago') {
    lead.checkout_url = CONFIG.PAYMENT_URL_FALLBACK;
  } else if (isLegacyCheckoutUrl_(lead.checkout_url)) {
    lead.checkout_url = '';
  }

  // Recalcula o segmento. Apenas leads que chegaram ao pagamento entram em C.
  const newSegment = segmentFor_(lead);
  const oldSegment = lead.segment;
  const canMove = lead.status !== 'pago' && lead.status !== 'descadastrado'
    && (lead.status === 'ativo' || lead.status === 'concluido'
      || (incomingMode === 'payment' && newSegment === 'C'));
  if (canMove && newSegment !== oldSegment) {
    const upgraded = isNew || newSegment === 'C' || oldSegment !== 'C';
    if (upgraded && (newSegment === 'C' || oldSegment !== 'C')) {
      lead.segment = newSegment;
      lead.status = 'ativo';
      lead.step = 0;
      lead.next_send_at = SEQUENCES[newSegment] ? addHours_(now, SEQUENCES[newSegment][0].delayHours) : '';
      if (!SEQUENCES[newSegment]) lead.status = 'excluido';
    }
  }

  writeRow_(sheet, lead);
  return lead;
}

function segmentFor_(lead) {
  if (lead.status === 'pago') return 'PAGO';
  // O checkout é a única porta de entrada; checkout_url pode ser nulo no fallback.
  if (lead.mode === 'payment') return 'C';
  if (/^n[aã]o m[eé]dic/i.test(lead.perfil || '')) return 'NAO_MEDICO';
  return 'INELIGIVEL';
}

function isLegacyCheckoutUrl_(url) {
  return /mercadopago\.com|mercadolivre\.com|pag\.ae|pref_id=/i.test(String(url || ''));
}

/** Rode UMA vez para substituir links antigos de Mercado Pago/PagBank na aba Leads. */
function limparCheckoutAntigo() {
  const sheet = getSheet_(CONFIG.SHEET_LEADS);
  const rows = readRows_(sheet);
  const alterados = [];
  rows.forEach(function (lead) {
    if (!isLegacyCheckoutUrl_(lead.checkout_url)) return;
    lead.checkout_url = lead.mode === 'payment' && lead.status !== 'pago'
      ? CONFIG.PAYMENT_URL_FALLBACK
      : '';
    lead.updated_at = new Date();
    lead.notes = (lead.notes ? lead.notes + ' | ' : '') + 'checkout_url antigo substituído';
    writeRow_(sheet, lead);
    alterados.push(lead.email);
  });
  console.log('Leads corrigidos: ' + alterados.length + (alterados.length ? ' — ' + alterados.join(', ') : ''));
  return alterados.length;
}

/* =====================================================================
   3. FILA DE ENVIO
   ===================================================================== */

function processQueue() {
  const now = new Date();
  if (now > new Date(CONFIG.STOP_SENDING_AT)) return;
  const hour = Number(Utilities.formatDate(now, CONFIG.TIMEZONE, 'H'));
  if (hour < CONFIG.SEND_HOUR_START || hour >= CONFIG.SEND_HOUR_END) return;

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) return;
  try {
    const sheet = getSheet_(CONFIG.SHEET_LEADS);
    const rows = readRows_(sheet);
    quarantineLegacySegments_(sheet, rows);
    let budget = CONFIG.MAX_PER_RUN;
    if (CONFIG.SENDER === 'gmail') budget = Math.min(budget, MailApp.getRemainingDailyQuota());

    for (let i = 0; i < rows.length && budget > 0; i++) {
      const lead = rows[i];
      const seq = lead.segment === 'C' ? SEQUENCES.C : null;
      // Somente leads que efetivamente iniciaram o checkout entram na régua C.
      if (lead.status !== 'ativo' || lead.mode !== 'payment' || !seq) continue;
      const due = toDate_(lead.next_send_at);
      if (!due || due > now) continue;

      const step = Number(lead.step) || 0;
      if (step >= seq.length) { lead.status = 'concluido'; writeRow_(sheet, lead); continue; }

      const emailId = seq[step].id;
      if (C_EMAIL_IDS.indexOf(emailId) < 0) continue;
      let ok = true;
      let error = '';
      try {
        sendEmail_(lead, emailId);
      } catch (err) {
        ok = false;
        error = String(err && err.message || err);
      }
      log_([new Date(), lead.lead_id, lead.email, emailId, lead.segment, ok, error]);
      if (!ok) { lead.notes = 'Falha ' + emailId + ': ' + error; writeRow_(sheet, lead); continue; }

      lead.step = step + 1;
      lead.last_sent_at = new Date();
      lead.last_email_id = emailId;
      if (lead.step < seq.length) {
        lead.next_send_at = addHours_(new Date(), seq[lead.step].delayHours);
      } else {
        lead.next_send_at = '';
        lead.status = 'concluido';
      }
      lead.updated_at = new Date();
      writeRow_(sheet, lead);
      budget--;
    }

  } finally {
    lock.releaseLock();
  }
}

/** Desativa registros antigos das réguas removidas sem apagar dados históricos. */
function quarantineLegacySegments_(sheet, rows) {
  rows.forEach(function (lead) {
    if (lead.segment !== 'A' && lead.segment !== 'B') return;
    lead.status = 'excluido';
    lead.next_send_at = '';
    lead.updated_at = new Date();
    lead.notes = 'Sequências A/B desativadas após remoção do quiz.';
    writeRow_(sheet, lead);
  });
}

function sendEmail_(lead, emailId) {
  if (C_EMAIL_IDS.indexOf(emailId) < 0) throw new Error('E-mail desativado: ' + emailId);
  const msg = renderEmail(emailId, buildContext_(lead, emailId));
  if (CONFIG.SENDER === 'brevo') return sendViaBrevo_(lead, msg);
  MailApp.sendEmail({
    to: lead.email,
    subject: msg.subject,
    htmlBody: msg.html,
    body: msg.text,
    name: CONFIG.FROM_NAME,
    replyTo: CONFIG.REPLY_TO,
  });
}

function sendViaBrevo_(lead, msg) {
  const res = UrlFetchApp.fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'post',
    contentType: 'application/json',
    headers: { 'api-key': prop_('BREVO_API_KEY'), accept: 'application/json' },
    payload: JSON.stringify({
      sender: { name: CONFIG.FROM_NAME, email: CONFIG.BREVO_FROM_EMAIL },
      to: [{ email: lead.email, name: lead.name }],
      replyTo: { email: CONFIG.REPLY_TO },
      subject: msg.subject,
      htmlContent: msg.html,
      textContent: msg.text,
      headers: { 'List-Unsubscribe': '<' + unsubUrl_(lead) + '>' },
      tags: ['long-hair-fue', lead.segment],
    }),
    muteHttpExceptions: true,
  });
  if (res.getResponseCode() >= 300) throw new Error('Brevo ' + res.getResponseCode() + ': ' + res.getContentText());
}

function buildContext_(lead, emailId) {
  const tag = function (url, hash) {
    const q = 'utm_source=email&utm_medium=automacao&utm_campaign=lhf_' + emailId.toLowerCase();
    return url + (url.indexOf('?') >= 0 ? '&' : '?') + q + (hash || '');
  };
  const linkPagamento = CONFIG.PAYMENT_URL_FALLBACK;
  const linkInscricao = tag(CONFIG.SITE_URL, '#inscricao');
  return {
    agora: new Date(),
    segmento: lead.segment,
    link_cta: lead.segment === 'C' ? linkPagamento : linkInscricao,
    nome: lead.name,
    perfil: lead.perfil || '',
    relacao: lead.relacao || '',
    interesse: lead.interesse || '',
    intencao: lead.intencao || '',
    link_quiz: tag(CONFIG.SITE_URL, '#quiz'),
    link_programa: tag(CONFIG.SITE_URL, '#programa'),
    link_inscricao: tag(CONFIG.SITE_URL, '#inscricao'),
    link_pagamento: CONFIG.PAYMENT_URL_FALLBACK,
    link_sair: unsubUrl_(lead),
  };
}

/* =====================================================================
   4. DESCADASTRO (link no rodapé de todo e-mail)
   ===================================================================== */

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.a === 'sair' && p.id && p.t && p.t === unsubToken_(p.id)) {
    const sheet = getSheet_(CONFIG.SHEET_LEADS);
    const lead = readRows_(sheet).find(function (r) { return r.lead_id === p.id; });
    if (lead && lead.status !== 'pago') {
      lead.status = 'descadastrado';
      lead.unsubscribed_at = new Date();
      lead.next_send_at = '';
      writeRow_(sheet, lead);
    }
    return HtmlService.createHtmlOutput(
      '<div style="font-family:Arial,sans-serif;max-width:480px;margin:60px auto;color:#1F2A44;text-align:center">'
      + '<h2>Pronto.</h2><p>Você não receberá mais e-mails sobre o Workshop Long Hair FUE.</p></div>'
    ).setTitle('Descadastro confirmado');
  }
  return ContentService.createTextOutput('ok');
}

function unsubToken_(id) {
  const sig = Utilities.computeHmacSha256Signature(String(id), prop_('UNSUB_SECRET'));
  return Utilities.base64EncodeWebSafe(sig).replace(/=+$/, '').slice(0, 22);
}

function unsubUrl_(lead) {
  const base = prop_('WEBAPP_URL') || ScriptApp.getService().getUrl();
  return base + '?a=sair&id=' + encodeURIComponent(lead.lead_id) + '&t=' + unsubToken_(lead.lead_id);
}

/* =====================================================================
   INSTALAÇÃO E TESTE
   ===================================================================== */

/** Rode UMA vez: cria as abas, o segredo do descadastro e o gatilho de 30 em 30 min. */
function setup() {
  getSheet_(CONFIG.SHEET_LEADS);
  getSheet_(CONFIG.SHEET_LOG);
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('UNSUB_SECRET')) props.setProperty('UNSUB_SECRET', Utilities.getUuid() + Utilities.getUuid());

  ScriptApp.getProjectTriggers().forEach(function (t) {
    ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('processQueue').timeBased().everyMinutes(30).create();
}

/** Envia somente C1, C2 e C3 para um endereço de teste (troque abaixo). */
function testarTodosOsEmails() {
  const destino = 'SEU_EMAIL_DE_TESTE@exemplo.com';
  const fake = {
    lead_id: 'teste', name: 'Ana Souza', email: destino, perfil: 'Médico(a)',
    relacao: 'Já realiza transplante capilar', interesse: 'Planejamento técnico',
    intencao: 'Quer valores e detalhes', segment: 'C',
  };
  C_EMAIL_IDS.forEach(function (id) {
    const msg = renderEmail(id, buildContext_(fake, id));
    MailApp.sendEmail({ to: destino, subject: '[TESTE ' + id + '] ' + msg.subject, htmlBody: msg.html, body: msg.text, name: CONFIG.FROM_NAME });
  });
}

/* =====================================================================
   PLANILHA (helpers)
   ===================================================================== */

function getSheet_(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    const headers = name === CONFIG.SHEET_LOG ? LOG_HEADERS : HEADERS;
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function readRows_(sheet) {
  const last = sheet.getLastRow();
  if (last < 2) return [];
  const values = sheet.getRange(2, 1, last - 1, HEADERS.length).getValues();
  return values.map(function (row, i) {
    const obj = { _row: i + 2 };
    HEADERS.forEach(function (h, j) { obj[h] = row[j]; });
    obj.email = String(obj.email || '').toLowerCase();
    return obj;
  });
}

function writeRow_(sheet, obj) {
  const values = [HEADERS.map(function (h) { return obj[h] === undefined || obj[h] === null ? '' : obj[h]; })];
  if (obj._row) {
    sheet.getRange(obj._row, 1, 1, HEADERS.length).setValues(values);
  } else {
    sheet.appendRow(values[0]);
    obj._row = sheet.getLastRow();
  }
}

function log_(row) { getSheet_(CONFIG.SHEET_LOG).appendRow(row); }
function prop_(k) { return PropertiesService.getScriptProperties().getProperty(k) || ''; }
function addHours_(d, h) { return new Date(d.getTime() + h * 3600 * 1000); }
function toDate_(v) { if (!v) return null; const d = v instanceof Date ? v : new Date(v); return isNaN(d) ? null : d; }
function json_(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
