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
    const previousButton = carousel.querySelector("[data-carousel-prev]");
    const nextButton = carousel.querySelector("[data-carousel-next]");
    const autoplayButton = carousel.querySelector("[data-carousel-toggle]");
    let autoplayTimer;
    let userPaused = false;
    let hoverPaused = false;
    let focusPaused = false;

    if (!viewport || !previousButton || !nextButton) return;

    function getCarouselName() {
      return carousel.getAttribute("aria-label") || "carrossel";
    }

    function hasScrollableContent() {
      return viewport.scrollWidth > viewport.clientWidth + 8;
    }

    function isAutoplayPaused() {
      return userPaused || hoverPaused || focusPaused || prefersReducedMotion.matches || !hasScrollableContent();
    }

    function updateAutoplayButton() {
      if (!autoplayButton) return;

      const carouselName = getCarouselName().toLowerCase();

      if (prefersReducedMotion.matches) {
        autoplayButton.textContent = "Autoplay desativado";
        autoplayButton.setAttribute("aria-label", `Autoplay desativado por preferência de movimento reduzido em ${carouselName}`);
        autoplayButton.setAttribute("aria-pressed", "true");
        autoplayButton.disabled = true;
        return;
      }

      if (!hasScrollableContent()) {
        autoplayButton.textContent = "Autoplay indisponível";
        autoplayButton.setAttribute("aria-label", `Autoplay indisponível em ${carouselName}`);
        autoplayButton.setAttribute("aria-pressed", "true");
        autoplayButton.disabled = true;
        return;
      }

      autoplayButton.disabled = false;
      autoplayButton.textContent = userPaused ? "Retomar" : "Pausar";
      autoplayButton.setAttribute("aria-pressed", String(userPaused));
      autoplayButton.setAttribute(
        "aria-label",
        `${userPaused ? "Retomar" : "Pausar"} autoplay de ${carouselName}`,
      );
    }

    function updateButtons() {
      const maxScroll = viewport.scrollWidth - viewport.clientWidth;
      const currentScroll = viewport.scrollLeft;

      previousButton.disabled = currentScroll <= 4;
      nextButton.disabled = currentScroll >= maxScroll - 4;
    }

    function scrollCarousel(direction) {
      viewport.scrollBy({
        left: direction * viewport.clientWidth * 0.9,
        behavior: prefersReducedMotion.matches ? "auto" : "smooth",
      });
    }

    function getAutoplayStep() {
      const firstSlide = viewport.querySelector("li, figure, article, [data-carousel-item]");
      if (!firstSlide) return viewport.clientWidth * 0.9;

      const slideStyle = window.getComputedStyle(firstSlide);
      const viewportStyle = window.getComputedStyle(firstSlide.parentElement || viewport);
      const slideWidth = firstSlide.getBoundingClientRect().width;
      const gap = parseFloat(viewportStyle.columnGap || viewportStyle.gap || "0") || 0;
      const margin = parseFloat(slideStyle.marginRight || "0") || 0;

      return slideWidth + gap + margin;
    }

    function autoplayNext() {
      if (isAutoplayPaused()) return;

      const maxScroll = viewport.scrollWidth - viewport.clientWidth;
      const shouldLoop = viewport.scrollLeft >= maxScroll - 8;

      viewport.scrollTo({
        left: shouldLoop ? 0 : viewport.scrollLeft + getAutoplayStep(),
        behavior: "smooth",
      });
    }

    function startAutoplay() {
      window.clearInterval(autoplayTimer);
      updateAutoplayButton();
      if (prefersReducedMotion.matches || !hasScrollableContent()) return;

      autoplayTimer = window.setInterval(autoplayNext, 4200);
    }

    function toggleAutoplay() {
      if (prefersReducedMotion.matches || !hasScrollableContent()) return;

      userPaused = !userPaused;
      updateAutoplayButton();
    }

    if (autoplayButton) autoplayButton.addEventListener("click", toggleAutoplay);
    previousButton.addEventListener("click", () => scrollCarousel(-1));
    nextButton.addEventListener("click", () => scrollCarousel(1));
    viewport.addEventListener("scroll", updateButtons, { passive: true });
    carousel.addEventListener("mouseenter", () => {
      hoverPaused = true;
    });
    carousel.addEventListener("mouseleave", () => {
      hoverPaused = false;
    });
    carousel.addEventListener("focusin", () => {
      focusPaused = true;
    });
    carousel.addEventListener("focusout", () => {
      focusPaused = false;
    });
    window.addEventListener("resize", () => {
      updateButtons();
      startAutoplay();
    });
    if (typeof prefersReducedMotion.addEventListener === "function") {
      prefersReducedMotion.addEventListener("change", () => {
        updateAutoplayButton();
        startAutoplay();
      });
    } else if (typeof prefersReducedMotion.addListener === "function") {
      prefersReducedMotion.addListener(() => {
        updateAutoplayButton();
        startAutoplay();
      });
    }
    updateButtons();
    startAutoplay();
  });
}

const PAYMENT_URL = "https://mpago.la/244hsWi";
// Endpoint opcional para receber o lead (ex.: Formspree/Google Apps Script).
// Se vazio, apenas exibe a confirmação local e registra um aviso no console.
const LEAD_ENDPOINT = "";
const LEAD_FORM_PRIVACY_TEXT =
  "Seus dados serão usados apenas para dar continuidade ao seu interesse no workshop e para que a equipe possa entrar em contato.";
const LEAD_FORM_PAYMENT_DESCRIPTION = "Após o envio, você será direcionado para a página segura de pagamento.";
const LEAD_FORM_LEAD_DESCRIPTION =
  "Após o envio, a nossa equipe entrará em contato com você para dar continuidade ao seu interesse no workshop.";
const LEAD_SUCCESS_MESSAGE = "Recebemos seus dados! A equipe entrará em contato em breve.";

const LEAD_FORM_FIELDS = [
  { name: "name", label: "Nome", type: "text", autocomplete: "name" },
  { name: "email", label: "E-mail", type: "email", autocomplete: "email" },
  { name: "phone", label: "Telefone", type: "tel", autocomplete: "tel", inputmode: "tel" },
];

/**
 * Monta os campos nome/e-mail/telefone do formulário de lead.
 * O `idPrefix` evita IDs duplicados quando há mais de um formulário na página
 * (quiz + modal).
 */
function buildLeadFormFields(idPrefix) {
  return LEAD_FORM_FIELDS.map((field) => {
    const errorId = `${idPrefix}-${field.name}-error`;
    const inputmode = field.inputmode ? ` inputmode="${field.inputmode}"` : "";
    return `
        <div class="lead-form__field">
          <label for="${idPrefix}-${field.name}">${field.label}</label>
          <input id="${idPrefix}-${field.name}" name="${field.name}" type="${field.type}"${inputmode} autocomplete="${field.autocomplete}" required aria-invalid="false" aria-describedby="${errorId}" />
          <p class="lead-form__error" id="${errorId}" data-lead-error="${field.name}"></p>
        </div>`;
  }).join("");
}

/**
 * Bloco completo do formulário de lead compartilhado entre o quiz e o modal.
 * `mode` decide o destino: "payment" (Mercado Pago) ou "lead" (captação de lead
 * com contato posterior da equipe).
 */
function buildLeadFormMarkup({ idPrefix, mode, title, description, submitLabel }) {
  // O kicker "Inscrição" permanece apenas no fluxo de pagamento; no fluxo de
  // captação de lead o formulário não exibe kicker.
  const kicker = mode === "payment" ? '<p class="quiz-card__kicker">Inscrição</p>' : "";
  return `
      ${kicker}
      <h3 id="${idPrefix}-title">${title}</h3>
      <form class="lead-form" data-lead-form data-lead-mode="${mode}" novalidate aria-labelledby="${idPrefix}-title">
        <p class="quiz-card__text">${description}</p>
        ${buildLeadFormFields(idPrefix)}
        <p class="lead-form__privacy">${LEAD_FORM_PRIVACY_TEXT}</p>
        <p class="lead-form__status" data-lead-status role="status" aria-live="polite"></p>
        <button class="btn lead-form__submit" type="submit">${submitLabel}</button>
      </form>`;
}

function validateLeadForm(form) {
  const fields = {
    name: {
      input: form.elements.name,
      message: "Informe seu nome.",
      isValid: (value) => value.trim().length >= 2,
    },
    email: {
      input: form.elements.email,
      message: "Informe um e-mail válido.",
      isValid: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()),
    },
    phone: {
      input: form.elements.phone,
      message: "Informe um telefone válido com DDD.",
      isValid: (value) => value.replace(/\D/g, "").length >= 10,
    },
  };
  let firstInvalid = null;

  Object.entries(fields).forEach(([name, field]) => {
    const error = form.querySelector(`[data-lead-error="${name}"]`);
    const valid = field.isValid(field.input.value || "");
    field.input.setAttribute("aria-invalid", String(!valid));
    if (error) error.textContent = valid ? "" : field.message;
    if (!valid && !firstInvalid) firstInvalid = field.input;
  });

  if (firstInvalid) {
    firstInvalid.focus();
    return false;
  }

  return true;
}

/**
 * Envia o lead para `LEAD_ENDPOINT`. Fluxo unificado entre os modos "payment" e
 * "lead": se o endpoint não estiver configurado, apenas registra um aviso no
 * console (a validação de entrega fica a cargo de quem configurar o endpoint).
 * Não verifica `response.ok`.
 */
async function sendLead(form) {
  const payload = {
    name: form.elements.name.value.trim(),
    email: form.elements.email.value.trim(),
    phone: form.elements.phone.value.trim(),
  };

  if (!LEAD_ENDPOINT) {
    console.warn("LEAD_ENDPOINT não configurado: o lead não foi enviado ao endpoint.");
    return;
  }

  await fetch(LEAD_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

async function handleLeadSubmit(form) {
  if (!validateLeadForm(form)) return;

  const mode = form.dataset.leadMode === "payment" ? "payment" : "lead";

  // Ambos os modos passam pelo mesmo fluxo de captação do lead.
  try {
    await sendLead(form);
  } catch (error) {
    console.warn("Não foi possível enviar o lead para o endpoint configurado.", error);
  }

  if (mode === "payment") {
    window.location.href = PAYMENT_URL;
    return;
  }

  const status = form.querySelector("[data-lead-status]");
  if (status) {
    status.textContent = LEAD_SUCCESS_MESSAGE;
    status.classList.add("is-success");
  }
}

const QUIZ_QUESTIONS = [
  {
    id: "perfil",
    kicker: "Pergunta 1 de 4",
    question: "Você é médico(a)?",
    text: "O workshop presencial é exclusivo para médicos. Esta etapa ajuda a indicar a melhor orientação.",
    options: [
      { label: "Sim, sou médico(a)", value: "Médico(a)" },
      { label: "Ainda estou em formação médica", value: "Em formação médica" },
      { label: "Não sou médico(a)", value: "Não médico(a)", end: "notDoctor" },
    ],
  },
  {
    id: "relacao",
    kicker: "Pergunta 2 de 4",
    question: "Qual é sua relação atual com transplante capilar?",
    text: "Selecione a alternativa que mais se aproxima do seu momento profissional.",
    options: [
      { label: "Já realizo transplante capilar", value: "Já realiza transplante capilar" },
      { label: "Estou estudando a área", value: "Estuda transplante capilar" },
      { label: "Tenho interesse em entender a técnica", value: "Quer entender a técnica" },
      { label: "Atuo em área médica relacionada", value: "Área médica relacionada" },
    ],
  },
  {
    id: "interesse",
    kicker: "Pergunta 3 de 4",
    question: "O que mais desperta seu interesse no Long Hair FUE?",
    text: "O conteúdo abordará critérios técnicos, operação e limites sem promessas de resultado.",
    options: [
      { label: "Indicação e seleção de pacientes", value: "Indicação e seleção" },
      { label: "Planejamento técnico", value: "Planejamento técnico" },
      { label: "Extração e manipulação dos fios", value: "Extração e manipulação" },
      { label: "Equipe, tempo e logística", value: "Equipe e tempo" },
      { label: "Casos, limites e dificuldades", value: "Casos e limites" },
    ],
  },
  {
    id: "participacao",
    kicker: "Pergunta 4 de 4",
    question: "Você pretende participar de um workshop presencial no Rio de Janeiro em 13 de novembro de 2026?",
    text: "A equipe pode orientar sobre inscrição, programação e disponibilidade.",
    options: [
      { label: "Sim, quero avançar para a inscrição", value: "Quer avançar" },
      { label: "Talvez, quero valores e detalhes", value: "Quer valores e detalhes" },
      { label: "Ainda estou avaliando", value: "Avaliando participação" },
    ],
  },
];

function buildQuizResultCopy(answers) {
  const relation = answers["Relação com transplante capilar"] || "";
  const interest = answers["Interesse principal"] || "";
  const intention = answers["Intenção de participação"] || "";

  const isExperienced = relation === "Já realiza transplante capilar";
  const isStudying = relation === "Estuda transplante capilar" || relation === "Quer entender a técnica";
  const isAdjacent = relation === "Área médica relacionada";

  const headlines = {
    "Planejamento técnico": "Seu foco aponta para decisões de planejamento — exatamente onde o Long Hair FUE muda o raciocínio.",
    "Extração e manipulação": "Seu interesse está no manejo técnico dos fios longos, um dos pontos centrais do workshop.",
    "Equipe e tempo": "Seu foco operacional combina com a discussão sobre equipe, fluxo e tempo em sessões mais complexas.",
    "Casos e limites": "Seu interesse por casos e limites combina com um workshop que não trata a técnica como receita pronta.",
    "Indicação e seleção": "Seu foco em indicação combina com a proposta de discutir critérios antes de falar em técnica.",
  };

  const interestParagraphs = {
    "Planejamento técnico":
      "A discussão parte de critérios como indicação, densidade e desenho da linha frontal, tratados antes da execução e sem receita pronta.",
    "Extração e manipulação":
      "O conteúdo explora cuidados com a integridade dos fios na extração e na manipulação, sempre dentro dos limites de cada caso.",
    "Equipe e tempo":
      "A proposta é tratar organização da equipe, ritmo de sessão e logística como parte do resultado técnico, não como detalhe secundário.",
    "Casos e limites":
      "Há espaço para discutir quando a técnica faz sentido, quando não faz e o que a experiência clínica ainda não resolve.",
    "Indicação e seleção":
      "Esse olhar conversa com a proposta de definir critérios de indicação antes de qualquer decisão sobre a execução.",
  };

  const primary = isExperienced
    ? "Como você já realiza transplante capilar, a conversa pode ir além da introdução: refinamento de critérios, decisões intraoperatórias e comparação com a FUE tradicional."
    : isStudying
      ? "Para quem está estudando ou quer entender melhor a área, o valor está em organizar fundamentos, limites e responsabilidades antes de qualquer decisão técnica."
      : isAdjacent
        ? "Sua atuação em uma área médica relacionada pode tornar a discussão útil para entender indicações, linguagem técnica e limites com mais clareza."
        : "Pelas suas respostas, o workshop pode ajudar a contextualizar a técnica de forma educacional e criteriosa.";

  const interestCopy =
    interestParagraphs[interest] ||
    "Cada etapa do conteúdo reforça a leitura de indicação, planejamento, operação e limites com responsabilidade educacional.";

  const invitation = intention === "Quer avançar"
    ? "O próximo passo é direto: avance para a seção de inscrição e confira as orientações oficiais do workshop."
    : intention === "Quer valores e detalhes"
      ? "Se você ainda está comparando valores e detalhes, avance para conferir as orientações oficiais antes de decidir."
      : "Se ainda está avaliando, use a seção de inscrição para entender o formato antes de decidir.";

  return {
    title: headlines[interest] || "Seu resultado indica um bom ponto de partida para conversar com a equipe.",
    paragraphs: [primary, interestCopy, invitation],
  };
}

function getQuizOutcome(answers) {
  const isPositive = answers.Perfil === "Médico(a)" && answers["Intenção de participação"] === "Quer avançar";
  return isPositive ? "payment" : "lead";
}

function initQuiz() {
  const app = document.querySelector("[data-quiz-app]");
  if (!app) return;

  const card = app.querySelector("[data-quiz-card]");
  const progressLabel = app.querySelector("[data-quiz-progress-label]");
  const progressBar = app.querySelector("[data-quiz-progress-bar]");
  const loading = app.querySelector("[data-quiz-loading]");
  const answers = {};
  let currentQuestion = -1;

  function setProgress(label, percent) {
    progressLabel.textContent = label;
    progressBar.style.width = `${percent}%`;
  }

  function renderIntro() {
    currentQuestion = -1;
    Object.keys(answers).forEach((key) => delete answers[key]);
    setProgress("Início", 0);
    card.innerHTML = `
      <div class="quiz-card__kicker" data-quiz-kicker>Workshop Long Hair FUE</div>
      <p class="quiz-card__text">Em menos de 1 minuto, responda perguntas objetivas sobre sua experiência e seus objetivos na técnica Long Hair FUE. O quiz ajuda você a entender se este workshop pode acelerar sua evolução — seja para começar com mais segurança ou para refinar planejamento, implantação e condução de casos avançados.</p>
      <div class="quiz-options">
        <button class="quiz-option" type="button" data-quiz-start>Responder o quiz</button>
      </div>
    `;
  }

  function renderQuestion(index) {
    const item = QUIZ_QUESTIONS[index];
    currentQuestion = index;
    setProgress(`Etapa ${index + 1} de ${QUIZ_QUESTIONS.length}`, Math.round(((index + 1) / QUIZ_QUESTIONS.length) * 100));
    card.innerHTML = `
      <p class="quiz-card__kicker">${item.kicker}</p>
      <h3>${item.question}</h3>
      <p class="quiz-card__text">${item.text}</p>
      <div class="quiz-options">
        ${item.options
          .map(
            (option, optionIndex) =>
              `<button class="quiz-option" type="button" data-quiz-answer="${optionIndex}">${option.label}</button>`,
          )
          .join("")}
      </div>
      <p class="quiz-card__note">As respostas servem apenas para contextualizar seu interesse no workshop.</p>
    `;
  }

  function renderNotDoctor() {
    setProgress("Orientação", 100);
    card.innerHTML = `
      <p class="quiz-card__kicker">Orientação institucional</p>
      <h3>Obrigado pelo interesse no Workshop Long Hair FUE.</h3>
      <p class="quiz-card__text">Este encontro presencial é exclusivo para médicos. A equipe pode orientar sobre informações gerais e próximos passos.</p>
      <button class="btn quiz-cta" type="button" data-quiz-open-form>Falar com a equipe</button>
      <button class="quiz-restart" type="button" data-quiz-restart>Refazer quiz</button>
      <p class="quiz-card__note">Não há diagnóstico ou promessa médica neste fluxo.</p>
    `;
  }

  function renderFinal() {
    setProgress("Resultado", 100);
    const labelledAnswers = {
      Perfil: answers["Perfil"],
      "Relação com transplante capilar": answers["Relação com transplante capilar"],
      "Interesse principal": answers["Interesse principal"],
      "Intenção de participação": answers["Intenção de participação"],
    };
    const resultCopy = buildQuizResultCopy(labelledAnswers);
    card.innerHTML = `
      <p class="quiz-card__kicker">Próximo passo</p>
      <h3>${resultCopy.title}</h3>
      <div class="quiz-result" aria-label="Orientação personalizada a partir das respostas">
        ${resultCopy.paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join("")}
      </div>
      <button class="btn quiz-cta" type="button" data-quiz-open-form>${getQuizOutcome(labelledAnswers) === "payment" ? "Garantir minha vaga agora" : "Falar com a equipe"}</button>
      <button class="quiz-restart" type="button" data-quiz-restart>Refazer quiz</button>
      <p class="quiz-card__note">A inscrição será conduzida pela equipe oficial. O workshop é educacional e exclusivo para médicos.</p>
    `;
  }

  function getCurrentLabelledAnswers() {
    return {
      Perfil: answers["Perfil"],
      "Relação com transplante capilar": answers["Relação com transplante capilar"],
      "Interesse principal": answers["Interesse principal"],
      "Intenção de participação": answers["Intenção de participação"],
    };
  }

  function renderLeadForm() {
    const outcome = getQuizOutcome(getCurrentLabelledAnswers());
    const isPayment = outcome === "payment";
    setProgress(isPayment ? "Pagamento" : "Contato", 100);
    card.innerHTML = `
      ${buildLeadFormMarkup({
        idPrefix: "lead",
        mode: outcome,
        title: isPayment ? "Complete seus dados para garantir sua vaga" : "Complete seus dados para falar com a equipe",
        description: isPayment ? LEAD_FORM_PAYMENT_DESCRIPTION : LEAD_FORM_LEAD_DESCRIPTION,
        submitLabel: isPayment ? "Ir para pagamento" : "Falar com a equipe",
      })}
      <button class="quiz-restart" type="button" data-quiz-back-result>Voltar ao resultado</button>
      <button class="quiz-restart" type="button" data-quiz-restart>Refazer quiz</button>
    `;
  }

  function renderPreviousResult() {
    if (answers.Perfil === "Não médico(a)") {
      renderNotDoctor();
      return;
    }
    renderFinal();
  }

  function showLoadingThen(callback) {
    card.classList.add("is-leaving");
    loading.hidden = false;
    window.setTimeout(() => {
      callback();
      loading.hidden = true;
      card.classList.remove("is-leaving");
      card.focus({ preventScroll: true });
    }, 460);
  }

  app.addEventListener("click", (event) => {
    const startButton = event.target.closest("[data-quiz-start]");
    const answerButton = event.target.closest("[data-quiz-answer]");
    const restartButton = event.target.closest("[data-quiz-restart]");
    const openFormButton = event.target.closest("[data-quiz-open-form]");
    const backResultButton = event.target.closest("[data-quiz-back-result]");

    if (startButton) {
      showLoadingThen(() => renderQuestion(0));
      return;
    }

    if (restartButton) {
      showLoadingThen(renderIntro);
      return;
    }

    if (openFormButton) {
      showLoadingThen(renderLeadForm);
      return;
    }

    if (backResultButton) {
      showLoadingThen(renderPreviousResult);
      return;
    }

    if (!answerButton) return;

    const question = QUIZ_QUESTIONS[currentQuestion];
    const option = question.options[Number(answerButton.dataset.quizAnswer)];
    const answerKeys = ["Perfil", "Relação com transplante capilar", "Interesse principal", "Intenção de participação"];
    answers[answerKeys[currentQuestion]] = option.value;

    showLoadingThen(() => {
      if (option.end === "notDoctor") {
        renderNotDoctor();
        return;
      }

      const nextQuestion = currentQuestion + 1;
      if (nextQuestion < QUIZ_QUESTIONS.length) {
        renderQuestion(nextQuestion);
        return;
      }

      renderFinal();
    });
  });

}

// Todos os formulários de lead (quiz e modal) usam a mesma validação e submit.
document.addEventListener("submit", (event) => {
  const form = event.target.closest("[data-lead-form]");
  if (!form) return;

  event.preventDefault();
  handleLeadSubmit(form);
});

/**
 * Modal acessível com o formulário de lead para os CTAs "Garanta a sua vaga agora".
 * O formulário é renderizado sob demanda (ao abrir) e removido ao fechar, evitando
 * IDs duplicados com o formulário do quiz e resetando a validação.
 */
function initLeadModal() {
  const modal = document.querySelector("[data-lead-modal]");
  const triggers = document.querySelectorAll("[data-lead-modal-trigger]");
  if (!modal || triggers.length === 0) return;

  const dialog = modal.querySelector("[data-lead-modal-dialog]");
  const body = modal.querySelector("[data-lead-modal-body]");
  const closeButton = modal.querySelector("[data-lead-modal-close]");
  if (!dialog || !body || !closeButton) return;

  let lastFocused = null;

  function renderForm() {
    body.innerHTML = buildLeadFormMarkup({
      idPrefix: "modal-lead",
      mode: "lead",
      title: "Complete seus dados para falar com a equipe",
      description: LEAD_FORM_LEAD_DESCRIPTION,
      submitLabel: "Falar com a equipe",
    });
  }

  function getFocusable() {
    return Array.from(
      dialog.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    );
  }

  function openModal(trigger) {
    lastFocused = trigger || document.activeElement;
    renderForm();
    modal.hidden = false;
    document.body.classList.add("is-modal-open");
    // Prioriza o primeiro campo do formulário; o botão de fechar é o fallback.
    const firstFocusable = dialog.querySelector("input") || dialog.querySelector("button");
    if (firstFocusable) firstFocusable.focus();
  }

  function closeModal() {
    if (modal.hidden) return;
    modal.hidden = true;
    body.innerHTML = "";
    document.body.classList.remove("is-modal-open");
    if (lastFocused && typeof lastFocused.focus === "function") lastFocused.focus();
  }

  triggers.forEach((trigger) => {
    trigger.setAttribute("aria-haspopup", "dialog");
    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      openModal(trigger);
    });
  });

  closeButton.addEventListener("click", closeModal);

  modal.addEventListener("click", (event) => {
    if (event.target === modal || event.target.hasAttribute("data-lead-modal-backdrop")) closeModal();
  });

  document.addEventListener("keydown", (event) => {
    if (modal.hidden) return;

    if (event.key === "Escape") {
      event.preventDefault();
      closeModal();
      return;
    }

    if (event.key !== "Tab") return;

    const focusable = getFocusable();
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
}

initQuiz();
initCarousels();
initLeadModal();
