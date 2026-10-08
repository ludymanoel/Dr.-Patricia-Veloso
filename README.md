# Workshop Long Hair FUE — Dra. Patricia Veloso

Landing page estática (HTML, CSS e JavaScript puro) para o Workshop Long Hair FUE, evento presencial no Rio de Janeiro em 13 de novembro de 2026, exclusivo para médicos.

Sem framework, sem etapa de build: o site é servido diretamente pelos arquivos da raiz e publicado como site estático na Vercel.

## Seções da página

1. **Hero** (`#topo`) — headline, proposta do encontro e CTAs (captação de lead + "Ver programa").
2. **Quiz interativo** (`#quiz`) — fluxo de 4 perguntas que personaliza a orientação e direciona ao pagamento ou à captação de lead.
3. **Quem conduzirá o workshop** (`#docente`) — bio e credenciais da Dra. Patricia Veloso.
4. **Técnica** (`#tecnica`) — o que muda quando o fio permanece longo, com imagem de apoio.
5. **Público que recusa a raspagem** (`#pacientes`) — faixa editorial sobre a demanda atendida.
6. **Programa** (`#programa`) — tópicos do dia em carrossel com autoplay.
7. **Densidade** (`#density`) — bloco "RIGHT DENSITY".
8. **Mega sessão** (`#mega-sessao`) — raciocínio operacional em casos extensos.
9. **Para quem é** (`#publico`) — grid de perfis médicos + disclaimer educacional.
10. **O que está incluído** (`#incluido`) — itens inclusos na inscrição do workshop.
11. **Inscrição** (`#inscricao`) — dados logísticos e CTA de captação de lead.
12. **Registros** (`#registros`) — carrossel de imagens acadêmicas com autoplay.
13. **FAQ** (`#faq`) — acordeão com perguntas frequentes.
14. **CTA final** — fechamento com chamada para captação de lead.

## Funcionalidades

- **Quiz personalizado por respostas**: 4 etapas, barra de progresso, ramificação para não médicos e resultado com copy adaptada. O resultado positivo leva ao checkout direto (Mercado Pago); os demais fluxos abrem um formulário de captação de lead (nenhum dado é persistido no site).
- **Carrosséis acessíveis** (programa e registros): autoplay com botão **Pausar/Retomar** (`aria-pressed`), pausa em hover/focus, atualização de estado dos botões Anterior/Próximo e respeito a `prefers-reduced-motion`.
- **Captação de lead**: o formulário nome/e-mail/telefone é compartilhado pelo quiz e pelo modal dos CTAs. Ao enviar, exibe a confirmação de que a equipe entrará em contato; com `LEAD_ENDPOINT` configurado em `script.js`, os dados são enviados por POST (ex.: Formspree/Google Apps Script).
- **FAQ em acordeão**: `<details>` nativos com abertura exclusiva (abrir um fecha os demais).
- **Navegação âncora** entre as seções.

## Estrutura de pastas

```
.
├── index.html            # Página única (todas as seções)
├── styles.css            # Design tokens (CSS variables) e estilos responsivos
├── script.js             # Quiz, carrosséis, captação de lead e acordeão
├── img/                  # Imagens usadas pela página
├── tests/                # Testes E2E (Playwright)
├── playwright.config.js  # Configuração do Playwright (servidor estático local)
├── package.json          # Apenas devDependency @playwright/test (sem build/start)
├── _archive/             # Materiais internos e assets não usados (ignorado pelo Git)
└── README.md / CHANGELOG.md
```

`node_modules/`, `playwright-report/`, `test-results/`, `_archive/`, `.opencode_harness/`, `.persistent-memory.md`, `dist/`, `build/` e `.vercel/` são ignorados pelo Git.

## Rodar localmente

Na raiz do projeto:

```bash
python3 -m http.server
```

Depois acesse `http://localhost:8000`. Qualquer servidor estático funciona (não requer Node para visualizar).

## Testes E2E

Smoke tests de ponta a ponta com Playwright + Chromium cobrindo o quiz interativo e os carrosséis (autoplay, controles e `prefers-reduced-motion`).

Requisitos: Node.js 22+ e Chromium instalado.

```bash
npm install                    # instala @playwright/test
npx playwright install chromium
npm run test:e2e               # roda a suíte (18 testes)
```

Opcional: `npm run test:e2e:ui` abre o modo interativo.

O Playwright sobe automaticamente um servidor estático (`python3 -m http.server 8123`) e acessa `http://127.0.0.1:8123`. Os artefatos gerados (`playwright-report/`, `test-results/`) são ignorados pelo Git.

## Deploy na Vercel

`package.json` não define `build` nem `start`, então o deploy é **estático**:

1. Suba o repositório para o GitHub e importe-o na Vercel.
2. Framework preset: `Other`.
3. Build command: vazio.
4. Output directory: vazio (ou `.`).
5. Publique.

Sem root directory adicional, a Vercel serve `index.html` da raiz.

## Requisitos e observações

- **Acessibilidade**: foco visível, `aria-live` no quiz, `aria-roledescription="carousel"` e rótulos nos controles, `aria-pressed` no Pausar/Retomar. As animações e o autoplay respeitam `prefers-reduced-motion`.
- **Contraste**: paleta centralizada em CSS variables (navy `#1F2A44`, beige `#E8DCC8`, gold `#C6A75E`, texto dourado `#76570f`). Textos sobre fundo navy usam branco/beige para contraste AA.
- **Navegadores**: requer navegadores modernos (CSS custom properties, `scroll-snap`, `details`, `aspect-ratio`, `dvh`).
- **`_archive/`**: materiais internos e imagens órfãs; ignorado pelo Git.
- Confirme antes de publicar que nenhum documento interno ou sem liberação está sendo versionado.
