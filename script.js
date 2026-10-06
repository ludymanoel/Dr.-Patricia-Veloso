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

const SIGNUP_TARGET = "#inscricao";
const SIGNUP_LABEL = "Garanta a sua vaga agora";
const PAYMENT_URL = "https://mpago.la/244hsWi";
const WHATSAPP_PHONE = "553884213318";
const WHATSAPP_MESSAGE = "Olá, estou interessado em mais informações sobre o Workshop Long Hair Fue \nministrado pela Dra. Patricia Veloso";
const WHATSAPP_UNAVAILABLE_MESSAGE = "Atendimento por WhatsApp indisponível no momento. O número de contato ainda não foi configurado.";

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
  return isPositive ? "payment" : "whatsapp";
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
    setProgress(isPayment ? "Pagamento" : "Atendimento", 100);
    card.innerHTML = `
      <p class="quiz-card__kicker">${isPayment ? "Inscrição" : "Atendimento"}</p>
      <h3>${isPayment ? "Complete seus dados para garantir sua vaga" : "Complete seus dados para falar com a equipe"}</h3>
      <form class="lead-form" data-lead-form novalidate>
        <p class="quiz-card__text">${isPayment ? "Após o envio, você será direcionado para a página segura de pagamento." : "Após o envio, abriremos o WhatsApp com uma mensagem pronta para solicitar mais informações."}</p>
        <div class="lead-form__field">
          <label for="lead-name">Nome</label>
          <input id="lead-name" name="name" type="text" autocomplete="name" required aria-invalid="false" aria-describedby="lead-name-error" />
          <p class="lead-form__error" id="lead-name-error" data-lead-error="name"></p>
        </div>
        <div class="lead-form__field">
          <label for="lead-email">E-mail</label>
          <input id="lead-email" name="email" type="email" autocomplete="email" required aria-invalid="false" aria-describedby="lead-email-error" />
          <p class="lead-form__error" id="lead-email-error" data-lead-error="email"></p>
        </div>
        <div class="lead-form__field">
          <label for="lead-phone">Telefone</label>
          <input id="lead-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" required aria-invalid="false" aria-describedby="lead-phone-error" />
          <p class="lead-form__error" id="lead-phone-error" data-lead-error="phone"></p>
        </div>
        <p class="lead-form__privacy">Seus dados serão usados apenas para dar continuidade ao seu interesse no workshop. Esta página não armazena essas informações; após o envio, você será redirecionado para pagamento ou WhatsApp.</p>
        <p class="lead-form__status" data-lead-status role="status" aria-live="polite"></p>
        <button class="btn lead-form__submit" type="submit">${isPayment ? "Ir para pagamento" : "Conversar com a Equipe"}</button>
      </form>
      <button class="quiz-restart" type="button" data-quiz-back-result>Voltar ao resultado</button>
      <button class="quiz-restart" type="button" data-quiz-restart>Refazer quiz</button>
    `;
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

  function handleLeadSubmit(form) {
    if (!validateLeadForm(form)) return;

    const outcome = getQuizOutcome(getCurrentLabelledAnswers());
    if (outcome === "payment") {
      window.location.href = PAYMENT_URL;
      return;
    }

    const status = form.querySelector("[data-lead-status]");
    if (!WHATSAPP_PHONE) {
      if (status) status.textContent = WHATSAPP_UNAVAILABLE_MESSAGE;
      return;
    }

    window.location.href = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
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

  app.addEventListener("submit", (event) => {
    const form = event.target.closest("[data-lead-form]");
    if (!form) return;

    event.preventDefault();
    handleLeadSubmit(form);
  });
}

initQuiz();
initCarousels();
