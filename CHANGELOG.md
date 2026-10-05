# Changelog

Todas as mudanças relevantes deste projeto são documentadas aqui.

O formato segue o [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) de forma simplificada.

## [Unreleased]

### Removed

- Pasta `pdf` removida do projeto (arquivos PDF não referenciados; a seção que os usava foi removida). Cópias locais arquivadas fora do versionamento (`_archive/pdf-removed/`, ignorado pelo Git).

### Security / Notes

- Documentos com conteúdo de nome pessoal foram retirados do repositório e mantidos apenas em cópia local não versionada.

## [1.0.0] — 2026-10-05

Redesign da landing page do Workshop Long Hair FUE: quiz interativo tipo app, carrosséis acessíveis e limpeza de seções/artefatos.

### Added

- Quiz interativo em JavaScript puro (`index.html` + `script.js`): 4 perguntas, barra de progresso, resultado personalizado por combinação de respostas, ramificação para não médicos e ação "Refazer quiz".
- Carrosséis acessíveis para o programa e para os registros visuais: autoplay, botão **Pausar/Retomar** com `aria-pressed`, controles Anterior/Próximo e pausa automática em hover/focus.
- Respeito a `prefers-reduced-motion` em carrosséis e animações (autoplay desativado, transições removidas).
- Testes E2E com Playwright cobrindo quiz e carrosséis (`tests/quiz.spec.js`, `tests/carousel.spec.js`, `playwright.config.js`) — 10 testes.
- `package.json` com scripts `test:e2e` e `test:e2e:ui`.
- `README.md` com estrutura, execução local, testes e deploy.

### Changed

- Seções reorganizadas e mescladas para reduzir repetição (público, mega sessão e registros).
- Cor/tema da seção "Quem conduzirá o workshop" ajustados para contraste adequado.
- Espaçamentos e ritmo vertical das seções revisados.
- Headline do hero encurtada e focada no raciocínio técnico.
- CTA de WhatsApp padronizado e centralizado via `[data-whatsapp]` no `script.js`.

### Removed

- Mockup/moldura de celular em volta do quiz (agora bloco limpo, sem `::before`).
- Bloco visível "Resumo das respostas" (o resumo passou a ir apenas na mensagem do WhatsApp).
- Eyebrows redundantes em seções que não os utilizavam.
- Bloco "hero facts".
- Links para os PDFs que então viviam na pasta `pdf` (não referenciados pela página).
- Seções e assets não usados (movidos/arquivados em `_archive/`, ignorado pelo Git).
- Regra CSS morta `.quiz-phone::before { content: none; }` e override sem elemento `.quiz-section__intro p`.

### Fixed

- Duplicação da headline no resultado do quiz (título e parágrafos agora complementares).
- Contraste de textos sobre fundos navy/gold.
- Foco e rótulos de acessibilidade em quiz, carrosséis e acordeão.

### Security / Notes

- Nenhum segredo/token em texto no repositório.
