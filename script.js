const WHATSAPP_URL =
  "https://wa.me/553884213318?text=Ol%C3%A1%2C%20tenho%20interesse%20no%20Workshop%20Long%20Hair%20FUE%20da%20Dra.%20Patricia%20Veloso%20em%2013%20de%20novembro%20de%202026%20no%20Rio%20de%20Janeiro.%20Gostaria%20de%20receber%20informa%C3%A7%C3%B5es%20sobre%20inscri%C3%A7%C3%A3o.";

document.querySelectorAll("[data-whatsapp]").forEach((link) => {
  link.setAttribute("href", WHATSAPP_URL);
  link.setAttribute("target", "_blank");
  link.setAttribute("rel", "noopener");
});

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

const QUIZ_WHATSAPP_MESSAGE =
  "Olá, tenho interesse no Workshop Long Hair FUE da Dra. Patricia Veloso. Respondi ao quiz da página e gostaria de receber informações sobre inscrição, programação e disponibilidade de vagas.";

const QUIZ_QUESTIONS = [
  {
    id: "perfil",
    kicker: "Pergunta 1 de 4",
    question: "Você é médico(a)?",
    text: "O workshop presencial é exclusivo para médicos. Esta etapa ajuda a indicar o melhor canal de conversa.",
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
    text: "A equipe pode orientar sobre inscrição, programação e disponibilidade de vagas.",
    options: [
      { label: "Sim, quero receber informações", value: "Quer informações" },
      { label: "Talvez, quero valores e detalhes", value: "Quer valores e detalhes" },
      { label: "Ainda estou avaliando", value: "Avaliando participação" },
    ],
  },
];

function buildQuizWhatsappUrl(answers, message = QUIZ_WHATSAPP_MESSAGE) {
  const summary = Object.entries(answers)
    .map(([key, value]) => `${key}: ${value}`)
    .join(" | ");
  const text = summary ? `${message}\n\nResumo do quiz: ${summary}` : message;

  return `https://wa.me/553884213318?text=${encodeURIComponent(text)}`;
}

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

  const invitation = intention === "Quer informações"
    ? "O próximo passo é direto: fale com a equipe para receber informações de inscrição, programação e disponibilidade."
    : intention === "Quer valores e detalhes"
      ? "Se você ainda está comparando valores e detalhes, a equipe pode orientar sem pressão e esclarecer o que faz sentido para o seu momento."
      : "Se ainda está avaliando, vale enviar suas dúvidas para a equipe e entender o formato antes de decidir.";

  return {
    title: headlines[interest] || "Seu resultado indica um bom ponto de partida para conversar com a equipe.",
    paragraphs: [primary, interestCopy, invitation],
  };
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
      <p class="quiz-card__kicker">Workshop Long Hair FUE</p>
      <h3>Descubra se este workshop faz sentido para o seu momento profissional</h3>
      <p class="quiz-card__text">Responda algumas perguntas objetivas e receba uma mensagem pronta para falar com a equipe pelo WhatsApp.</p>
      <div class="quiz-options">
        <button class="quiz-option" type="button" data-quiz-start>Começar</button>
      </div>
      <p class="quiz-card__note">Exclusivo para médicos. Este quiz não solicita dados pessoais nem substitui validação da equipe.</p>
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
    const url = buildQuizWhatsappUrl(
      { Perfil: answers["Perfil"] || "Não médico(a)" },
      "Olá, encontrei a página do Workshop Long Hair FUE da Dra. Patricia Veloso e gostaria de falar com a equipe pelo WhatsApp.",
    );
    card.innerHTML = `
      <p class="quiz-card__kicker">Orientação institucional</p>
      <h3>Obrigado pelo interesse no Workshop Long Hair FUE.</h3>
      <p class="quiz-card__text">Este encontro presencial é exclusivo para médicos. Se quiser falar com a equipe sobre informações institucionais, use o botão abaixo.</p>
      <a class="btn quiz-whatsapp" href="${url}" target="_blank" rel="noopener">Falar com a equipe no WhatsApp</a>
      <button class="quiz-restart" type="button" data-quiz-restart>Refazer quiz</button>
      <p class="quiz-card__note">Não há diagnóstico, promessa médica ou coleta de dados pessoais neste fluxo.</p>
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
    const url = buildQuizWhatsappUrl(labelledAnswers);
    const resultCopy = buildQuizResultCopy(labelledAnswers);
    card.innerHTML = `
      <p class="quiz-card__kicker">Próximo passo</p>
      <h3>${resultCopy.title}</h3>
      <div class="quiz-result" aria-label="Orientação personalizada a partir das respostas">
        ${resultCopy.paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join("")}
      </div>
      <a class="btn quiz-whatsapp" href="${url}" target="_blank" rel="noopener">Enviar mensagem pelo WhatsApp</a>
      <button class="quiz-restart" type="button" data-quiz-restart>Refazer quiz</button>
      <p class="quiz-card__note">A inscrição será conduzida pela equipe oficial. O workshop é educacional e exclusivo para médicos.</p>
    `;
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

    if (startButton) {
      showLoadingThen(() => renderQuestion(0));
      return;
    }

    if (restartButton) {
      showLoadingThen(renderIntro);
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

initQuiz();
initCarousels();
