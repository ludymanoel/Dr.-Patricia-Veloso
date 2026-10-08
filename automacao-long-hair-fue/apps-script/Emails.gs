/**
 * COPYS DOS E-MAILS — WORKSHOP LONG HAIR FUE
 * ---------------------------------------------------------------------
 * renderEmail(id, ctx) -> { subject, preheader, html, text }
 *
 * ctx: nome, perfil, relacao, interesse, intencao,
 *      link_quiz, link_programa, link_inscricao, link_pagamento, link_sair
 *
 * Sequência A — deixou dados e NÃO fez o quiz ........ A1, A2, A3
 * Sequência B — fez o quiz e NÃO foi ao pagamento ..... B1, B2, B3
 * Sequência C — foi ao pagamento e NÃO pagou .......... C1, C2, C3
 *
 * Regras de copy: tom de colega para colega (público médico), sem promessa
 * de resultado, sem escassez inventada. Toda informação vem da página oficial.
 */

const EMAIL_IDS = ['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3', 'V1'];

/**
 * LOTE E VAGAS — preencha SÓ com informação real. É isto que liga a urgência.
 *  - fim: data/hora em que o lote atual vira. Com ela preenchida, os e-mails
 *    mostram "encerra hoje / amanhã / em 20 de outubro" e o e-mail V1 é
 *    disparado sozinho para quem não pagou, entre 36 h e 1 h antes da virada.
 *  - proximo_preco: valor do próximo lote. Os e-mails mostram a diferença em R$.
 *  - vagas_restantes: número real de vagas. Vazio = fala só "vagas limitadas".
 * Na virada: atualize atual/preco/fim/proximo/proximo_preco (e PRICE no Code.gs).
 */
const LOTE = {
  atual: '1º lote',
  preco: 'R$ 496,00',
  fim: '',            // ex.: '2026-10-20T23:59:00-03:00'
  proximo: '2º lote',
  proximo_preco: '',  // ex.: 'R$ 596,00'
  vagas_restantes: '', // ex.: '18'
  fim_texto: '',       // deixe vazio (usado só na exportação de HTML para outras plataformas)
};

const BRAND = {
  navy: '#1F2A44',
  gold: '#B08D57',
  sand: '#F4F1EC',
  ink: '#2B2F38',
  muted: '#6B7280',
  line: '#E6E1D8',
  alert: '#9B2C2C',
  alertBg: '#FBF3EE',
  img: 'https://www.drapatriciaveloso.com.br/img/',
  logo: 'https://www.drapatriciaveloso.com.br/img/Logo%20Dra.%20Patr%C3%ADcia%20(Horizontal).png',
};

const EVENTO = {
  data: '13 de novembro de 2026',
  horario: 'Das 08h às 18h',
  local: 'Centro de Convenções Vogue Square',
  endereco: 'Av. das Américas, 8585 — Barra da Tijuca, Rio de Janeiro/RJ',
  preco: LOTE.preco,
};

const INTERESSES = {
  indicacao: {
    label: 'indicação e seleção de pacientes',
    assunto: 'foco em indicação',
    linha: 'Antes de falar em técnica, o workshop discute critério: quem é — e quem não é — candidato ao Long Hair FUE.',
    topicos: ['Indicação e seleção de pacientes', 'Leitura e preservação da área doadora', 'Casos femininos e masculinos'],
  },
  planejamento: {
    label: 'planejamento técnico',
    assunto: 'foco em planejamento',
    linha: 'É no planejamento que o fio longo mais muda o raciocínio: ele continua visível como referência durante toda a cirurgia.',
    topicos: ['Planejamento da área receptora', 'Direção, angulação, distribuição e cobertura visual', 'O conceito Right Density, apresentado pela Dra. Patricia no 32º Congresso Mundial da ISHRS (Denver, 2024)'],
  },
  extracao: {
    label: 'extração e manipulação dos fios longos',
    assunto: 'foco no manejo dos fios longos',
    linha: 'Extrair e implantar unidades foliculares sem raspar exige ajustes de manipulação, instrumental e implantação que não existem no FUE tradicional.',
    topicos: ['Extração e manipulação de unidades foliculares com fios longos', 'Instrumentais e configurações', 'Estratégias de implantação'],
  },
  equipe: {
    label: 'equipe, tempo e logística',
    assunto: 'foco em equipe e tempo',
    linha: 'Em sessões extensas com fios longos, a organização da equipe e o controle do tempo deixam de ser detalhe e passam a fazer parte do planejamento cirúrgico.',
    topicos: ['Organização da equipe e otimização do tempo', 'Áreas extensas e desafios de mega sessões', 'Instrumentais e configurações'],
  },
  casos: {
    label: 'casos, limites e dificuldades',
    assunto: 'foco em casos e limites',
    linha: 'O workshop não trata a técnica como receita pronta: há um bloco inteiro dedicado a casos clínicos, erros, limites e dificuldades.',
    topicos: ['Casos clínicos, erros, limites e dificuldades', 'Casos femininos e masculinos', 'Áreas extensas e desafios de mega sessões'],
  },
  geral: {
    label: 'Long Hair FUE',
    assunto: 'próximos passos',
    linha: 'O workshop organiza o raciocínio por trás da técnica — da seleção do paciente ao planejamento de grandes sessões.',
    topicos: ['Diferenças entre Shaved FUE, No-Shave FUE e Long Hair FUE', 'Indicação e seleção de pacientes', 'Casos clínicos, erros, limites e dificuldades'],
  },
};

/* =====================================================================
   PERSONALIZAÇÃO
   ===================================================================== */

function interesseDe_(v) {
  const s = norm_(v);
  if (s.indexOf('indica') >= 0) return INTERESSES.indicacao;
  if (s.indexOf('planej') >= 0) return INTERESSES.planejamento;
  if (s.indexOf('extra') >= 0) return INTERESSES.extracao;
  if (s.indexOf('equipe') >= 0) return INTERESSES.equipe;
  if (s.indexOf('caso') >= 0) return INTERESSES.casos;
  return INTERESSES.geral;
}

function linhaRelacao_(v) {
  const s = norm_(v);
  if (s.indexOf('ja realiza') >= 0) return 'Como você já realiza transplante capilar, o encontro vai direto às diferenças operacionais de trabalhar com fios longos — extração, implantação, equipe e tempo.';
  if (s.indexOf('estuda') >= 0 || s.indexOf('entender') >= 0) return 'Para quem está estudando a área, o encontro ajuda a entender fundamentos, requisitos e a curva técnica antes de investir nela.';
  if (s.indexOf('relacionada') >= 0) return 'Para quem atua em área médica relacionada, o encontro deixa claros os requisitos, as responsabilidades e os limites da técnica.';
  return '';
}

function primeiroNome_(nome) {
  const p = String(nome || '').trim().split(/\s+/)[0] || '';
  return p ? p.charAt(0).toUpperCase() + p.slice(1).toLowerCase() : '';
}

function norm_(v) {
  return String(v || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function esc_(v) {
  return String(v == null ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* =====================================================================
   URGÊNCIA (lote) E ESCASSEZ (vagas) — sempre a partir de dados reais
   ===================================================================== */

const MESES_ = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const SEMANA_ = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];

/** Data no horário de Brasília (UTC-3), sem depender do fuso do servidor. */
function br_(dataOuIso) {
  const ms = new Date(dataOuIso).getTime() - 3 * 3600 * 1000;
  const d = new Date(ms);
  const hh = d.getUTCHours();
  const mm = d.getUTCMinutes();
  return {
    dia: d.getUTCDate(), mes: MESES_[d.getUTCMonth()], semana: SEMANA_[d.getUTCDay()],
    hora: hh + 'h' + (mm ? String(mm).padStart(2, '0') : ''), diaN: Math.floor(ms / 86400000),
  };
}

function dataCurta_(iso) { const f = br_(iso); return f.dia + ' de ' + f.mes; }

/** "hoje, às 23h59" · "amanhã (terça-feira), às 23h59" · "em 20 de outubro (terça-feira)" */
function quandoFim_(agora) {
  if (LOTE.fim_texto) return LOTE.fim_texto;
  if (!LOTE.fim) return '';
  const f = br_(LOTE.fim);
  const dias = f.diaN - br_(agora || new Date()).diaN;
  if (dias <= 0) return 'hoje, às ' + f.hora;
  if (dias === 1) return 'amanhã (' + f.semana + '), às ' + f.hora;
  return 'em ' + f.dia + ' de ' + f.mes + ' (' + f.semana + ')';
}

function reais_(txt) { const n = Number(String(txt).replace(/[^\d,]/g, '').replace(',', '.')); return isNaN(n) ? 0 : n; }

function diferenca_() {
  const d = reais_(LOTE.proximo_preco) - reais_(LOTE.preco);
  return d > 0 ? 'R$ ' + d.toFixed(2).replace('.', ',').replace(',00', '') : '';
}

/** Frase da virada de lote, usada no corpo e no aviso. */
function fraseLote_(c) {
  const quando = quandoFim_(c.agora);
  const dif = diferenca_();
  if (quando) {
    return 'O ' + LOTE.atual + ' encerra <strong>' + quando + '</strong>. Depois disso, a inscrição passa para o ' + LOTE.proximo
      + (LOTE.proximo_preco ? ', por ' + LOTE.proximo_preco + (dif ? ' — ' + dif + ' a mais pela mesma vaga' : '') : ', com novo valor') + '.';
  }
  return 'O valor de ' + LOTE.preco + ' vale só enquanto o ' + LOTE.atual + ' estiver aberto. Na virada, o valor da inscrição muda.';
}

function fraseVagas_() {
  if (LOTE.vagas_restantes) return 'Restam <strong>' + LOTE.vagas_restantes + ' vagas</strong> — o evento é presencial e a sala tem capacidade limitada.';
  return 'O workshop é presencial e as vagas são limitadas à capacidade da sala.';
}

/** Caixa de destaque. tipo: 'lote' (urgência de prazo) ou 'vagas' (escassez + prazo). */
function alerta_(c, tipo) {
  const titulo = tipo === 'vagas'
    ? (LOTE.vagas_restantes ? 'Restam ' + LOTE.vagas_restantes + ' vagas' : 'Vagas limitadas')
    : (quandoFim_(c.agora) ? 'O ' + LOTE.atual + ' está acabando' : 'Valor do ' + LOTE.atual);
  const texto = tipo === 'vagas' ? fraseVagas_() + ' ' + fraseLote_(c) : fraseLote_(c);
  return '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:4px 0 24px;background:' + BRAND.alertBg + ';border:1px solid ' + BRAND.alert + ';">'
    + '<tr><td style="padding:16px 20px;">'
    + '<p style="margin:0 0 6px;font-family:' + F_SANS + ';font-size:12px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;color:' + BRAND.alert + ';">' + titulo + '</p>'
    + '<p style="margin:0;font-family:' + F_SANS + ';font-size:16px;line-height:1.55;color:' + BRAND.ink + ';">' + texto + '</p>'
    + '</td></tr></table>';
}

/* =====================================================================
   BLOCOS DE LAYOUT (HTML de e-mail: tabelas + estilos inline)
   ===================================================================== */

const F_SERIF = "Georgia,'Times New Roman',serif";
const F_SANS = 'Arial,Helvetica,sans-serif';

function p_(html) {
  return '<p style="margin:0 0 16px;font-family:' + F_SANS + ';font-size:16px;line-height:1.6;color:' + BRAND.ink + ';">' + html + '</p>';
}

function h_(text) {
  return '<h2 style="margin:28px 0 12px;font-family:' + F_SERIF + ';font-size:21px;line-height:1.3;font-weight:normal;color:' + BRAND.navy + ';">' + text + '</h2>';
}

function list_(items) {
  return '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 18px;">'
    + items.map(function (it) {
      return '<tr><td valign="top" width="22" style="padding:4px 0;font-family:' + F_SANS + ';font-size:16px;line-height:1.5;color:' + BRAND.gold + ';">&#8212;</td>'
        + '<td style="padding:4px 0;font-family:' + F_SANS + ';font-size:16px;line-height:1.5;color:' + BRAND.ink + ';">' + it + '</td></tr>';
    }).join('') + '</table>';
}

function faq_(pairs) {
  return pairs.map(function (q) {
    return '<p style="margin:0 0 4px;font-family:' + F_SANS + ';font-size:16px;line-height:1.5;font-weight:bold;color:' + BRAND.navy + ';">' + q[0] + '</p>'
      + '<p style="margin:0 0 18px;font-family:' + F_SANS + ';font-size:16px;line-height:1.6;color:' + BRAND.ink + ';">' + q[1] + '</p>';
  }).join('');
}

function cta_(text, url) {
  return '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px;"><tr>'
    + '<td align="center" bgcolor="' + BRAND.navy + '" style="border-radius:4px;">'
    + '<a href="' + esc_(url) + '" target="_blank" style="display:inline-block;padding:15px 28px;font-family:' + F_SANS + ';font-size:16px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:4px;">' + text + '</a>'
    + '</td></tr></table>';
}

function link_(text, url) {
  return '<a href="' + esc_(url) + '" target="_blank" style="color:' + BRAND.navy + ';text-decoration:underline;">' + text + '</a>';
}

function caixaEvento_(comPreco) {
  const linhas = [
    ['Data', EVENTO.data],
    ['Horário', EVENTO.horario],
    ['Local', EVENTO.local + '<br>' + EVENTO.endereco],
    ['Formato', 'Presencial · exclusivo para médicos'],
  ];
  if (comPreco) linhas.push(['Investimento', '<strong>' + LOTE.atual + ': ' + LOTE.preco + '</strong>' + (LOTE.fim ? '<br><span style="color:' + BRAND.alert + ';">até ' + dataCurta_(LOTE.fim) + '</span>' : '')]);
  return '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:8px 0 24px;background:' + BRAND.sand + ';border-left:3px solid ' + BRAND.gold + ';">'
    + linhas.map(function (l, i) {
      const pad = i === 0 ? '18px 20px 6px' : (i === linhas.length - 1 ? '6px 20px 18px' : '6px 20px');
      return '<tr><td width="110" valign="top" style="padding:' + pad + ';font-family:' + F_SANS + ';font-size:12px;letter-spacing:1px;text-transform:uppercase;color:' + BRAND.muted + ';">' + l[0] + '</td>'
        + '<td style="padding:' + pad + ';font-family:' + F_SANS + ';font-size:15px;line-height:1.5;color:' + BRAND.ink + ';">' + l[1] + '</td></tr>';
    }).join('') + '</table>';
}

function imagem_(arquivo, alt) {
  return '<img src="' + BRAND.img + encodeURIComponent(arquivo).replace(/%2F/g, '/') + '" alt="' + esc_(alt) + '" width="520" style="display:block;width:100%;max-width:520px;height:auto;border:0;margin:4px 0 24px;">';
}

function assinatura_() {
  return '<p style="margin:24px 0 0;font-family:' + F_SANS + ';font-size:16px;line-height:1.6;color:' + BRAND.ink + ';">Um abraço,<br><strong>Equipe Dra. Patricia Veloso</strong><br><span style="color:' + BRAND.muted + ';font-size:14px;">Workshop Long Hair FUE</span></p>';
}

function ultimo_() {
  return '<p style="margin:20px 0 0;font-family:' + F_SANS + ';font-size:13px;line-height:1.5;color:' + BRAND.muted + ';">Este é o último e-mail desta série.</p>';
}

function layout_(o) {
  return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">'
    + '<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="x-apple-disable-message-reformatting">'
    + '<title>' + esc_(o.subject) + '</title></head>'
    + '<body style="margin:0;padding:0;background:' + BRAND.sand + ';">'
    + '<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">' + esc_(o.preheader) + '&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;</div>'
    + '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="' + BRAND.sand + '"><tr><td align="center" style="padding:28px 12px;">'
    + '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:100%;max-width:600px;background:#ffffff;">'
    // cabeçalho
    + '<tr><td style="padding:28px 40px 20px;border-bottom:1px solid ' + BRAND.line + ';">'
    + '<img src="' + BRAND.logo + '" alt="Dra. Patricia Veloso" width="190" style="display:block;width:190px;max-width:60%;height:auto;border:0;">'
    + '<p style="margin:14px 0 0;font-family:' + F_SANS + ';font-size:11px;letter-spacing:2px;text-transform:uppercase;color:' + BRAND.gold + ';">Workshop Long Hair FUE · 13.11.2026 · Rio de Janeiro</p>'
    + '</td></tr>'
    // corpo
    + '<tr><td style="padding:32px 40px 36px;">' + o.body + '</td></tr>'
    // rodapé
    + '<tr><td style="padding:24px 40px;background:' + BRAND.navy + ';">'
    + '<p style="margin:0 0 10px;font-family:' + F_SANS + ';font-size:13px;line-height:1.5;color:#E8E4DC;">Dra. Patricia Veloso — Cirurgiã Plástica · CRM-MG 50766 · RQE 34013</p>'
    + '<p style="margin:0;font-family:' + F_SANS + ';font-size:12px;line-height:1.5;color:#A9B0C0;">Você recebeu este e-mail porque deixou seus dados na página do Workshop Long Hair FUE. '
    + '<a href="' + esc_(o.ctx.link_sair) + '" style="color:#E8E4DC;text-decoration:underline;">Não quero mais receber</a>.</p>'
    + '</td></tr>'
    + '</table></td></tr></table></body></html>';
}

/* =====================================================================
   AS COPYS
   ===================================================================== */

const TEMPLATES = {

  /* ---------- SEQUÊNCIA A — deixou dados, não fez o quiz ---------- */

  A1: function (c) {
    return {
      subject: 'Recebemos seu interesse no Workshop Long Hair FUE',
      preheader: 'Quatro perguntas, menos de 1 minuto: veja se o workshop faz sentido para o seu momento.',
      body:
        p_('Olá, ' + c.nome + ',')
        + p_('Obrigado por deixar seu contato na página do Workshop Long Hair FUE, com a Dra. Patricia Veloso.')
        + p_('Antes de qualquer decisão, sugerimos um passo rápido: um quiz de quatro perguntas sobre sua experiência e seus objetivos com a técnica. Leva menos de um minuto e mostra quais blocos do programa conversam mais com o seu momento profissional — seja para começar com mais segurança, seja para refinar casos avançados.')
        + cta_('Responder o quiz (1 minuto)', c.link_quiz)
        + caixaEvento_(false)
        + p_('Se preferir ir direto à inscrição, o 1º lote já está disponível ' + link_('nesta página', c.link_inscricao) + '.')
        + assinatura_(),
    };
  },

  A2: function (c) {
    return {
      subject: 'Long Hair FUE não é “FUE sem raspar”',
      preheader: 'O que muda quando o fio longo vira referência durante a cirurgia.',
      body:
        p_('Olá, ' + c.nome + ',')
        + p_('Para o paciente, preservar o cabelo significa discrição. Para o cirurgião, significa algo mais técnico: trabalhar com uma referência que continua visível durante todo o procedimento.')
        + p_('Direção, angulação, distribuição, relação com os fios preexistentes e cobertura visual ficam diante dos seus olhos enquanto você implanta. Ao mesmo tempo, extração, manipulação, organização da equipe e controle do tempo passam a responder a uma cirurgia mais complexa.')
        + imagem_('imagem 2.png', 'Extração e implantação de unidades foliculares com fios longos')
        + h_('Right Density: a quantidade certa, no lugar certo')
        + p_('Foi a partir dessa lógica que a Dra. Patricia Veloso elaborou o conceito <strong>Right Density</strong>, apresentado no 32º Congresso Mundial da ISHRS, em Denver (2024). A ideia central: densidade não é perseguir o maior número possível de unidades foliculares por cm², e sim combinar calibre, comprimento, direção, angulação e distribuição para construir cobertura visual.')
        + p_('No workshop, ela mostra como esse raciocínio orienta o planejamento dos seus próprios casos.')
        + h_('Uma demanda que muitas vezes fica invisível')
        + p_('Existe um grupo de pacientes que não recusa o transplante — recusa a raspagem: mulheres, executivos, profissionais expostos e pessoas que valorizam privacidade. Com indicação correta e domínio operacional, o Long Hair FUE é uma alternativa a ser avaliada para eles.')
        + cta_('Ver o programa e garantir minha vaga', c.link_inscricao)
        + assinatura_(),
    };
  },

  A3: function (c) {
    return {
      subject: 'Antes de decidir: o que o workshop é (e o que não é)',
      preheader: 'Respostas diretas às dúvidas mais comuns sobre o Workshop Long Hair FUE.',
      body:
        p_('Olá, ' + c.nome + ',')
        + p_('Preferimos que você decida com todas as informações na mesa. Estas são as perguntas que mais recebemos:')
        + faq_([
          ['É exclusivo para médicos?', 'Sim. O ingresso e o credenciamento são destinados a médicos.'],
          ['Preciso já operar transplante capilar?', 'Não necessariamente. Quem já opera FUE terá mais profundidade técnica; quem está avaliando entrar na área vai entender fundamentos, requisitos e curva técnica. Importante: o workshop, sozinho, não habilita a executar a técnica.'],
          ['Tem prática em paciente?', 'Não. São 12 horas dedicadas a conteúdo técnico, planejamento e discussão de casos. Experiências práticas têm formato, critérios e vagas próprias — fale com a equipe se tiver interesse.'],
          ['E se eu precisar cancelar?', 'Cancelamentos em até 7 dias corridos após a compra, feitos com pelo menos 48 horas de antecedência do evento, têm reembolso integral.'],
        ])
        + h_('O que está incluído')
        + list_([
          'Workshop presencial de 12 horas + certificado de participação',
          'Manual Cirúrgico Avançado de Long Hair FUE',
          'Lista de instrumentais, materiais e medicamentos para Long Hair FUE',
          'Sessão de perguntas e discussão de casos',
          'Coffee break manhã e tarde e networking com médicos de diversas especialidades',
        ])
        + caixaEvento_(true)
        + cta_('Garantir minha vaga', c.link_inscricao)
        + p_('Ficou outra dúvida? É só responder este e-mail — a equipe responde pessoalmente.')
        + assinatura_()
        + ultimo_(),
    };
  },

  /* ---------- SEQUÊNCIA B — fez o quiz, não foi ao pagamento ---------- */

  B1: function (c) {
    const it = interesseDe_(c.interesse);
    const rel = linhaRelacao_(c.relacao);
    const emFormacao = norm_(c.perfil).indexOf('formacao') >= 0;
    const intencao = norm_(c.intencao);
    let fechamento = 'Se ainda está avaliando, sem pressa: nos próximos dias vamos enviar mais detalhes sobre a técnica e o formato do encontro.';
    if (intencao.indexOf('valores') >= 0) fechamento = 'Você comentou que queria conhecer valores e detalhes — eles estão logo acima. Se precisar de qualquer informação além disso, é só responder este e-mail.';
    if (intencao.indexOf('avancar') >= 0) fechamento = 'Você indicou que quer avançar para a inscrição — o caminho está no botão acima.';

    return {
      subject: 'Seu resultado no quiz: ' + it.assunto,
      preheader: 'Os blocos do programa que mais conversam com o que você respondeu.',
      body:
        p_('Olá, ' + c.nome + ',')
        + p_('Obrigado por responder o quiz do Workshop Long Hair FUE. Pelas suas respostas, seu principal interesse está em <strong>' + it.label + '</strong>.')
        + p_(it.linha)
        + (rel ? p_(rel) : '')
        + h_('Onde isso aparece no programa')
        + list_(it.topicos)
        + (emFormacao ? p_('<em>Um ponto importante: o ingresso e o credenciamento são exclusivos para médicos. Se tiver dúvida sobre a sua situação, responda este e-mail que a equipe orienta.</em>') : '')
        + caixaEvento_(true)
        + alerta_(c, 'vagas')
        + cta_('Garantir minha vaga', c.link_inscricao)
        + p_(fechamento)
        + assinatura_(),
    };
  },

  B2: function (c) {
    return {
      subject: 'Uma mega sessão não é apenas “mais FUE”',
      preheader: 'Como planejar milhares de unidades foliculares mantendo os fios longos.',
      body:
        p_('Olá, ' + c.nome + ',')
        + p_('A Dra. Patricia Veloso é pioneira mundial em mega e giga sessões com a técnica Long Hair FUE — com casuística de pacientes operados em um único dia com 3.000 a 4.000 unidades foliculares de fios longos. Ela já foi convidada a demonstrar a técnica em cirurgias ao vivo para médicos de diversos países, como em Punta Cana (2023) e Málaga (2025).')
        + imagem_('foto1.JPG', 'Dra. Patricia Veloso apresentando caso de mega sessão em congresso')
        + p_('Grandes sessões ampliam a consequência de cada decisão. Algumas das perguntas que o workshop responde:')
        + list_([
          'Como planejar quando milhares de unidades precisam ser extraídas e implantadas mantendo fios longos?',
          'Como reduzir interferências durante a implantação?',
          'Como preservar a área doadora?',
          'Como sincronizar equipe, tempo e diferentes regiões receptoras?',
        ])
        + p_('Por isso o programa dedica um bloco inteiro ao raciocínio operacional por trás desses casos — incluindo limites, dificuldades e critérios de indicação. Não é uma sequência de etapas: é o raciocínio que a Dra. Patricia usa para planejar, executar e coordenar cada caso.')
        + p_(fraseVagas_() + ' ' + fraseLote_(c))
        + cta_('Quero garantir minha vaga', c.link_inscricao)
        + assinatura_(),
    };
  },

  B3: function (c) {
    return {
      subject: LOTE.vagas_restantes
        ? 'Restam ' + LOTE.vagas_restantes + ' vagas para 13 de novembro'
        : 'Vagas limitadas: os detalhes práticos de 13 de novembro',
      preheader: 'Data, local, o que está incluído e até quando vale o valor do ' + LOTE.atual + '.',
      body:
        p_('Olá, ' + c.nome + ',')
        + p_('Para quem está organizando a agenda, aqui estão os detalhes práticos do Workshop Long Hair FUE em um só lugar.')
        + alerta_(c, 'vagas')
        + caixaEvento_(true)
        + h_('Incluído na inscrição')
        + list_([
          '12 horas de conteúdo presencial + certificado de participação',
          'Manual Cirúrgico Avançado + lista de instrumentais, materiais e medicamentos',
          'Discussão de casos e sessão de perguntas',
          'Coffee break manhã e tarde',
        ])
        + p_('Hospedagem e deslocamento não estão incluídos. A inscrição é pessoal e intransferível.')
        + cta_('Garantir minha vaga no ' + LOTE.atual, c.link_inscricao)
        + p_('Qualquer dúvida sobre agenda, pagamento ou nota, responda este e-mail.')
        + assinatura_()
        + ultimo_(),
    };
  },

  /* ---------- SEQUÊNCIA C — foi ao pagamento e não pagou ---------- */

  C1: function (c) {
    return {
      subject: 'Sua vaga no ' + LOTE.atual + ' ainda não foi garantida',
      preheader: 'Seu link de pagamento continua ativo — e o valor do ' + LOTE.atual + ' também, por enquanto.',
      body:
        p_('Olá, ' + c.nome + ',')
        + p_('Você respondeu o quiz, indicou que quer participar e chegou à página de pagamento — mas a sua inscrição ainda não foi confirmada.')
        + alerta_(c, 'lote')
        + p_('Se foi só uma interrupção, o link continua ativo:')
        + cta_('Garantir minha vaga no ' + LOTE.atual, c.link_pagamento)
        + caixaEvento_(true)
        + p_('Teve algum problema no pagamento — cartão recusado, Pix, dados para nota? Responda este e-mail que a equipe resolve com você.')
        + p_('<span style="color:' + BRAND.muted + ';font-size:14px;">Se você já concluiu o pagamento nas últimas horas, pode desconsiderar esta mensagem.</span>')
        + assinatura_(),
    };
  },

  C2: function (c) {
    const it = interesseDe_(c.interesse);
    return {
      subject: 'Ficou alguma dúvida antes de confirmar sua vaga?',
      preheader: 'As respostas para o que mais perguntam antes da inscrição.',
      body:
        p_('Olá, ' + c.nome + ',')
        + p_('Sua vaga no Workshop Long Hair FUE ainda está em aberto. Se alguma dúvida travou a decisão, talvez ela esteja aqui:')
        + faq_([
          ['Recebo certificado?', 'Sim. São 12 horas de carga horária, com certificado de participação para todos os participantes.'],
          ['Tem prática em paciente?', 'Não. O encontro é dedicado a conteúdo técnico, planejamento e discussão de casos.'],
          ['E se eu precisar cancelar?', 'Cancelamentos em até 7 dias corridos após a compra, feitos com pelo menos 48 horas de antecedência do evento, têm reembolso integral.'],
          ['Hospedagem está incluída?', 'Não. Hospedagem e deslocamento ficam por conta do participante.'],
        ])
        + p_('No quiz, você indicou interesse em <strong>' + it.label + '</strong> — um dos temas do programa: ' + it.topicos[0].charAt(0).toLowerCase() + it.topicos[0].slice(1) + '.')
        + alerta_(c, 'vagas')
        + cta_('Concluir minha inscrição no ' + LOTE.atual, c.link_pagamento)
        + assinatura_(),
    };
  },

  C3: function (c) {
    return {
      subject: quandoFim_(c.agora)
        ? 'Último lembrete: o ' + LOTE.atual + ' encerra ' + quandoFim_(c.agora).replace(/, às .*$/, '')
        : 'Último lembrete: sua vaga no ' + LOTE.atual,
      preheader: 'Depois da virada, a mesma vaga custa mais.',
      body:
        p_('Olá, ' + c.nome + ',')
        + p_('Este é o nosso último lembrete. Sua inscrição no Workshop Long Hair FUE ainda está em aberto, pelo valor do ' + LOTE.atual + ': <strong>' + LOTE.preco + '</strong>.')
        + alerta_(c, 'lote')
        + list_([
          '13 de novembro de 2026, das 08h às 18h, na Barra da Tijuca (RJ)',
          '12 horas com a Dra. Patricia Veloso + certificado',
          'Manual Cirúrgico Avançado e lista de instrumentais',
        ])
        + cta_('Garantir minha vaga no ' + LOTE.atual, c.link_pagamento)
        + p_('Se decidiu não participar agora, tudo bem — obrigado pelo interesse.')
        + assinatura_()
        + ultimo_(),
    };
  },

  /* ---------- V1 — VIRADA DE LOTE (disparo único por data, B e C que não pagaram) ---------- */

  V1: function (c) {
    const quando = quandoFim_(c.agora) || 'em breve';
    const foiAoPagamento = c.segmento === 'C';
    return {
      subject: 'O ' + LOTE.atual + ' encerra ' + quando.replace(/ \(.*\)/, ''),
      preheader: LOTE.proximo_preco
        ? 'Depois disso, a inscrição passa para ' + LOTE.proximo_preco + '.'
        : 'Depois disso, o valor da inscrição muda.',
      body:
        p_('Olá, ' + c.nome + ',')
        + p_(foiAoPagamento
          ? 'Você chegou a abrir a página de pagamento do Workshop Long Hair FUE, mas a inscrição não foi concluída. Estamos escrevendo porque o prazo do valor atual está terminando.'
          : 'Você respondeu o quiz do Workshop Long Hair FUE e ainda não garantiu sua vaga. Estamos escrevendo porque o prazo do valor atual está terminando.')
        + alerta_(c, 'lote')
        + list_([
          LOTE.atual + ': <strong>' + LOTE.preco + '</strong>' + (LOTE.fim ? ' — até ' + dataCurta_(LOTE.fim) : ''),
          (LOTE.proximo_preco ? LOTE.proximo + ': ' + LOTE.proximo_preco : LOTE.proximo + ': novo valor'),
          fraseVagas_(),
        ])
        + cta_('Garantir minha vaga no ' + LOTE.atual, c.link_cta)
        + p_('13 de novembro de 2026 · 08h às 18h · Vogue Square, Barra da Tijuca (RJ) · 12 horas com a Dra. Patricia Veloso + certificado.')
        + p_('<span style="color:' + BRAND.muted + ';font-size:14px;">Se você já se inscreveu nas últimas horas, pode desconsiderar este aviso.</span>')
        + assinatura_(),
    };
  },
};

/* =====================================================================
   RENDER
   ===================================================================== */

function renderEmail(id, ctx) {
  const fn = TEMPLATES[id];
  if (!fn) throw new Error('Template inexistente: ' + id);
  const c = Object.assign({}, ctx, { nome: esc_(primeiroNome_(ctx.nome) || 'tudo bem') });
  // Sem nome válido, "Olá, tudo bem," vira "Olá," limpo:
  const t = fn(c);
  let body = t.body.replace('Olá, tudo bem,', 'Olá,');
  const html = layout_({ subject: t.subject, preheader: t.preheader, body: body, ctx: c });
  return { subject: t.subject, preheader: t.preheader, html: html, text: htmlParaTexto_(body, c) };
}

function htmlParaTexto_(html, c) {
  return html
    .replace(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g, function (_, url, txt) { return txt.replace(/<[^>]+>/g, '') + ': ' + url.replace(/&amp;/g, '&'); })
    .replace(/<br\s*\/?>/g, '\n')
    .replace(/<\/td>/g, ' ')
    .replace(/<\/tr>/g, '\n')
    .replace(/<\/(p|h2|table)>/g, '\n\n')
    .replace(/<img[^>]*>/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&#8212;/g, '-')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
    + '\n\n--\nDra. Patricia Veloso — Cirurgiã Plástica · CRM-MG 50766 · RQE 34013\nNão quero mais receber: ' + c.link_sair;
}

if (typeof module !== 'undefined') module.exports = { renderEmail: renderEmail, EMAIL_IDS: EMAIL_IDS, LOTE: LOTE };
