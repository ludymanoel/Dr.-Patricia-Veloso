# Workshop Long Hair FUE — Dra. Patricia Veloso

Site estático em HTML, CSS e JavaScript para publicação na Vercel.

## Estrutura de produção

- `index.html` — página principal
- `styles.css` — estilos globais
- `script.js` — comportamento do WhatsApp e FAQ
- `img/` — imagens usadas pela página
- `pdf/` — PDFs referenciados pela página

Arquivos internos e assets não usados ficam em `_archive/` e são ignorados pelo Git.

## Preview local

Para testar o site localmente, execute na raiz do projeto:

```bash
python3 -m http.server
```

Depois acesse `http://localhost:8000` no navegador.

## Checklist antes de publicar

- Confirme autorização explícita para publicação pública dos PDFs em `pdf/` antes de subir o projeto ao GitHub/Vercel.
- Revise se nenhum documento interno, sensível ou sem liberação está sendo versionado/publicado.

## Deploy na Vercel

1. Suba este diretório para um repositório GitHub.
2. Na Vercel, importe o repositório.
3. Framework preset: `Other` ou `Static`.
4. Build command: deixe vazio.
5. Output directory: deixe vazio ou use `.`.
6. Publique.
