# Procedimento: integrar uma landing page como segunda página em um projeto Vercel

**Versão:** 1.0
**Caso de referência:** projeto `bbj-flow` (LP LR Jiu Jitsu publicada em `/lpteste`)
**Aplicação prevista:** projeto Dr. Patricia Veloso e outros projetos estáticos ou com build na Vercel
**Pré-requisito de leitura:** acesso ao repositório do projeto pai e permissão para editar `vercel.json`

---

## Índice

1. [Visão geral do modelo](#1-visão-geral-do-modelo)
2. [Placeholders usados neste documento](#2-placeholders-usados-neste-documento)
3. [Pré-requisitos e diagnóstico do projeto pai](#3-pré-requisitos-e-diagnóstico-do-projeto-pai)
4. [Passo a passo](#4-passo-a-passo)
5. [Modelo de `vercel.json`](#5-modelo-de-verceljson)
6. [Checklist de validação local](#6-checklist-de-validação-local)
7. [Checklist pós-deploy](#7-checklist-pós-deploy)
8. [Armadilhas comuns](#8-armadilhas-comuns)
9. [Prompt para reaplicar em outro projeto](#9-prompt-para-reaplicar-em-outro-projeto)
10. [Caso real: o que foi feito no bbj-flow](#10-caso-real-o-que-foi-feito-no-bbj-flow)
11. [Adaptação para projeto estático sem build (Dr. Patricia Veloso)](#11-adaptação-para-projeto-estático-sem-build-dr-patricia-veloso)
12. [Definition of Done](#12-definition-of-done)

---

## 1. Visão geral do modelo

O objetivo é publicar uma landing page independente **dentro do mesmo projeto Vercel** do site principal, acessível por uma rota curta, sem criar um segundo projeto e sem quebrar as rotas existentes.

O modelo é sempre o mesmo:

```
UMA rota curta  ->  UM arquivo HTML extra dentro do outputDirectory
                     + uma pasta de assets exclusiva
                     + dois rewrites (com e sem barra final)
```

Antes:

```
projeto-pai/
├── vercel.json
├── build.js
├── <ORIGEM-DA-LP>/
│   ├── index.html
│   ├── styles.css
│   ├── script.js
│   └── vercel.json        <- configuração standalone, deixa de ser usada
└── <OUTPUT_DIR>/
    ├── index.html         <- site principal
    └── cadastro.html
```

Depois:

```
projeto-pai/
├── vercel.json            <- ganha os rewrites da nova rota
├── build.js               <- inalterado (ou ajustado, se apagar o output)
└── <OUTPUT_DIR>/
    ├── index.html
    ├── cadastro.html
    ├── <ARQUIVO>.html     <- a LP renomeada
    └── <PASTA-ASSETS>/    <- CSS, JS e imagens da LP, isolados
        ├── styles.css
        ├── script.js
        └── img/
```

Resultado esperado:

- `https://<DOMINIO>/<ROTA>` e `https://<DOMINIO>/<ROTA>/` servem a LP.
- `https://<DOMINIO>/` continua servindo o site principal.
- Demais rotas existentes (`/cadastro`, `/api/...`) continuam funcionando.
- Nenhum asset da LP colide com assets da raiz.

**Princípio central:** a Vercel publica apenas o conteúdo de `outputDirectory` (ou a raiz, quando não configurado). Arquivo fora do output **não é publicado**, mesmo estando no repositório. Por isso a LP precisa ser movida para dentro do output, e não apenas referenciada.

---

## 2. Placeholders usados neste documento

| Placeholder | Significado | Exemplo real (bbj-flow) |
|---|---|---|
| `<ROTA>` | Slug curto da URL, sem barras | `lpteste` |
| `<ARQUIVO>.html` | Nome do HTML publicado dentro do output | `lpteste.html` |
| `<PASTA-ASSETS>` | Pasta exclusiva de CSS/JS/imagens da LP | `lpteste-assets` |
| `<OUTPUT_DIR>` | Pasta publicada pela Vercel | `Desenvolvimento` |
| `<DOMINIO>` | Domínio de produção, sem `https://` | `bbjflow.com.br` |
| `<ORIGEM-DA-LP>` | Pasta onde a LP standalone vivia | `LP_LR_JIUJITSU` |
| `<ENV_VAR_1>`, `<ENV_VAR_2>` | Variáveis exigidas pelo build, se houver | `SUPABASE_URL`, `SUPABASE_ANON_KEY` |

Regras para escolher os nomes:

- `<ROTA>`: minúscula, sem acento, sem espaço, com hífen se necessário (`workshop`, `long-hair-fue`). Evite `api`, `assets`, `static`, `_next`, `index` e nomes de rotas já existentes.
- `<ARQUIVO>.html`: pode ser igual a `<ROTA>.html` ou um nome descritivo. O importante é o rewrite apontar para ele.
- `<PASTA-ASSETS>`: prefixe com a rota (`<ROTA>-assets`) para garantir unicidade. Nunca reutilize `assets/`, `css/`, `js/` ou `img/` da raiz.

---

## 3. Pré-requisitos e diagnóstico do projeto pai

Antes de mover qualquer arquivo, descubra **como o projeto pai é publicado**. Não assuma: leia a configuração.

### 3.1 Arquivos e comandos de diagnóstico

```bash
# 1) Configuração versionada
cat vercel.json 2>/dev/null | python3 -m json.tool

# 2) Campos que definem o comportamento do build
python3 - <<'PY'
import json, pathlib
p = pathlib.Path("vercel.json")
if not p.exists():
    print("Sem vercel.json: projeto estático ou configurado no dashboard")
else:
    c = json.loads(p.read_text())
    for k in ("framework", "buildCommand", "outputDirectory", "installCommand", "cleanUrls", "trailingSlash"):
        print(f"{k}: {c.get(k)}")
PY

# 3) Vínculo local com o projeto Vercel (não commitar)
cat .vercel/project.json 2>/dev/null

# 4) Conteúdo efetivamente publicado
ls -la "<OUTPUT_DIR>"

# 5) Script de build, se existir
cat build.js 2>/dev/null
```

### 3.2 O que cada campo significa

| Campo | O que indica | Impacto na LP |
|---|---|---|
| `buildCommand` | Comando executado no build | Pode apagar, copiar ou reescrever arquivos do output |
| `outputDirectory` | Pasta publicada | A LP precisa estar **dentro** dela |
| `framework` | `null` = estático; `nextjs`, `astro`, etc. | Muda onde colocar arquivos públicos |
| `rewrites` | Mapeamento interno de URL | A rota da LP entra aqui, antes do catch-all |
| `redirects` | Redirecionamentos HTTP | Útil para aposentar a URL antiga da LP |
| `headers` | CSP e cabeçalhos globais | Pode bloquear fontes, scripts, imagens e formulários |
| `cleanUrls` | Remove `.html` das URLs | Se ativo, o rewrite pode ser desnecessário |
| `trailingSlash` | Comportamento de barra final | Explica redirecionamentos 308 |

### 3.3 Três cenários possíveis

| Cenário | Como identificar | Onde colocar a LP |
|---|---|---|
| **A. Build + outputDirectory** | `buildCommand` e `outputDirectory` definidos | Dentro de `<OUTPUT_DIR>` |
| **B. Estático na raiz** | Sem `vercel.json`, ou sem `outputDirectory` | Na raiz, em arquivo próprio e pasta de assets própria |
| **C. Framework (Next/Astro)** | `framework: "nextjs"` / `"astro"` | Em `public/` (copiado para o output) ou na pasta gerada, conforme o caso |

> **Nunca** coloque a LP apenas na pasta de origem (`<ORIGEM-DA-LP>`) esperando que a Vercel a sirva. Fora do output, ela não existe em produção.

### 3.4 Checklist de pré-requisitos

- [ ] Sei qual é o `outputDirectory` (ou se o projeto serve a raiz).
- [ ] Sei se existe `buildCommand` e o que ele faz.
- [ ] Sei se há catch-all `/(.*)` nos rewrites.
- [ ] Sei se há CSP em `headers` e quais origens externas a LP usa.
- [ ] Sei se a LP tem formulário que envia para domínio externo.
- [ ] Tenho o slug `<ROTA>` definido e sem colisão.
- [ ] Estou em branch separada ou tenho o repositório limpo para comparar o diff.

---

## 4. Passo a passo

### Passo 1 — Escolher o slug e verificar colisões

```bash
ROTA="<ROTA>"

# Já existe rota igual?
grep -n "\"/$ROTA" vercel.json 2>/dev/null

# Já existe arquivo ou pasta com esse nome no output?
find "<OUTPUT_DIR>" -maxdepth 1 -iname "*$ROTA*" 2>/dev/null
```

Evite slugs que colidam com:

- rotas de API (`/api/...`);
- arquivos existentes (`/cadastro`, `/diagnose`);
- diretórios de assets (`/assets`, `/css`, `/js`, `/img`);
- caminhos reservados do framework (`/_next`, `/static`).

### Passo 2 — Criar a pasta de assets no output

```bash
mkdir -p "<OUTPUT_DIR>/<PASTA-ASSETS>"
```

### Passo 3 — Mover e renomear os arquivos da LP

Use `git mv` para preservar histórico (se o projeto usa Git):

```bash
git mv "<ORIGEM-DA-LP>/index.html" "<OUTPUT_DIR>/<ARQUIVO>.html"
git mv "<ORIGEM-DA-LP>/styles.css" "<OUTPUT_DIR>/<PASTA-ASSETS>/styles.css"
git mv "<ORIGEM-DA-LP>/script.js"   "<OUTPUT_DIR>/<PASTA-ASSETS>/script.js"

# Imagens e demais assets da LP, se existirem
git mv "<ORIGEM-DA-LP>/img" "<OUTPUT_DIR>/<PASTA-ASSETS>/img"
```

Sem Git, use `mv` com os mesmos destinos.

**Não renomeie o `index.html` do projeto pai.** O `index.html` da raiz continua sendo a home. A LP vira um arquivo adicional (`<ARQUIVO>.html`).

### Passo 4 — Isolar os assets em pasta própria

Coloque **todos** os assets da LP dentro de `<PASTA-ASSETS>`:

```
<OUTPUT_DIR>/<PASTA-ASSETS>/
├── styles.css
├── script.js
└── img/
```

Motivos:

- evita colisão com `styles.css`, `script.js`, `img/` e `assets/` da raiz;
- permite cache e limpeza independentes;
- deixa claro no diff o que pertence à LP.

Cuidado com caminhos dentro do CSS:

```css
/* Relativo ao próprio CSS: funciona se a imagem estiver na mesma árvore */
.hero { background-image: url("img/hero.jpg"); }

/* Ou absoluto, mais explícito */
.hero { background-image: url("/<PASTA-ASSETS>/img/hero.jpg"); }
```

`@import` de fontes externas (ex.: Google Fonts) continua funcionando, mas depende de CSP — ver Passo 9.

### Passo 5 — Ajustar os caminhos no HTML para absolutos

Troque referências relativas por caminhos absolutos a partir da raiz do domínio:

```html
<!-- Antes (standalone) -->
<link rel="stylesheet" href="styles.css">
<script src="script.js" defer></script>
<img src="img/foto.jpg" alt="...">

<!-- Depois (dentro do projeto pai) -->
<link rel="stylesheet" href="/<PASTA-ASSETS>/styles.css">
<script src="/<PASTA-ASSETS>/script.js" defer></script>
<img src="/<PASTA-ASSETS>/img/foto.jpg" alt="...">
```

Por que absoluto:

- a página é servida em `/<ROTA>`, não em uma pasta própria;
- `href="styles.css"` seria resolvido como `/styles.css` (raiz), podendo carregar o CSS do site principal **sem gerar 404** — o erro fica silencioso e visual;
- `src="img/foto.jpg"` seria resolvido como `/img/foto.jpg`, colidindo com a pasta `img/` do projeto pai.

Referências que **não** precisam mudar:

- âncoras internas: `href="#sobre"`, `href="#contato"`;
- links externos: `https://...`;
- `mailto:`, `tel:`, `data:`.

Referências que **precisam** mudar:

- links para outras páginas do projeto pai: use `/#secao` ou `/<OUTPUT_DIR-relativo>` conforme a rota pública (ex.: `/cadastro`);
- caminhos montados em JavaScript: procure por `styles.css`, `img/`, `assets/` no `script.js`.

Se a LP tiver imagens de referência de design não usadas pela página, **não as mova para o output**. Elas não precisam ser publicadas.

### Passo 6 — Adicionar os rewrites, antes do catch-all

No `vercel.json` da raiz, adicione as duas variantes:

```json
[
  {
    "source": "/<ROTA>",
    "destination": "/<ARQUIVO>.html"
  },
  {
    "source": "/<ROTA>/",
    "destination": "/<ARQUIVO>.html"
  }
]
```

Ao editar o `vercel.json`, copie os dois objetos para dentro do array `rewrites` já existente (sem os colchetes externos deste exemplo).

Regras de ordem:

1. rewrites de API e rotas específicas existentes;
2. rewrites das páginas (`/cadastro`, `/<ROTA>`, `/<ROTA>/`);
3. **por último**, o catch-all `/(.*) -> /index.html`, se ele já existir.

Se o catch-all vier antes, ele captura `/<ROTA>` e entrega a home. O sintoma é uma resposta **200 com a página errada**, não um 404.

> Se o projeto **não** tem catch-all, não adicione um só para publicar a LP. Basta o par de rewrites da rota. Um catch-all novo muda o comportamento de todas as URLs inexistentes.

### Passo 7 — Remover a configuração Vercel standalone da LP

A Vercel lê o `vercel.json` da **raiz do projeto**. Um `vercel.json` dentro de `<ORIGEM-DA-LP>` não é aplicado ao projeto pai e só gera confusão.

```bash
git rm "<ORIGEM-DA-LP>/vercel.json"
```

Se a pasta de origem ficar vazia (ou só com referências de design), mantenha-a fora do output. Ela não será publicada. Opcionalmente, remova-a do repositório se não tiver mais utilidade.

Se a LP já esteve publicada em outra URL e você quer preservar links, use `redirects` (não `rewrites`):

```json
{
  "source": "/<ROTA-ANTIGA>",
  "destination": "/<ROTA>",
  "permanent": true
}
```

### Passo 8 — Verificar se o build script não sobrescreve a página

Leia o `build.js` (ou equivalente) e responda:

- Ele apaga o output? (`rm -rf`, `rimraf`, `fs.rmSync`, `clean`)
- Ele recria o output do zero?
- Ele copia apenas alguns arquivos?
- Ele exige variáveis de ambiente?
- Ele reescreve somente HTML específicos (ex.: `index.html` e `cadastro.html`)?

No caso do bbj-flow, o build:

- injeta `SUPABASE_URL` e `SUPABASE_ANON_KEY` em `Desenvolvimento/index.html` e `Desenvolvimento/cadastro.html`;
- **não apaga** nem **copia** outros arquivos;
- falha com `exit 1` se as variáveis não existirem.

Consequências práticas:

- a LP em `Desenvolvimento/<ARQUIVO>.html` sobrevive ao build;
- validar o build localmente exige **cópia temporária** e valores dummy;
- nunca use valores dummy em produção; as variáveis reais ficam no dashboard da Vercel.

Se o build **limpar** o output, adicione uma etapa de cópia da LP para o output ou gere a página dentro do próprio build. Sem isso, a LP desaparece no deploy.

### Passo 9 — Checar CSP e headers

CSP é global (`source: "/(.*)"`), então vale também para a nova rota. Levante o que a LP carrega:

| Recurso | Diretiva CSP | Exemplo |
|---|---|---|
| CSS externo / `@import` | `style-src` | `fonts.googleapis.com` |
| Arquivos de fonte | `font-src` | `fonts.gstatic.com` |
| JavaScript de CDN | `script-src` | `cdn.jsdelivr.net` |
| Imagens externas | `img-src` | `https:` já cobre muitos casos |
| `fetch`/XHR | `connect-src` | API própria ou Supabase |
| `<form action="...">` externo | `form-action` | checkout, CRM, planilha |
| `<iframe>` | `frame-src` | player, mapa, formulário embedado |

Pontos de atenção:

- `form-action 'self'` **bloqueia** envio de formulário para domínio externo.
- `frame-ancestors 'none'` impede que a página seja incorporada em iframe; `X-Frame-Options: DENY` tem efeito semelhante.
- `script-src` sem `'unsafe-inline'` bloqueia handlers inline (`onclick=`) e scripts embutidos.
- Se a LP usa apenas arquivos próprios e Google Fonts, normalmente basta garantir `fonts.googleapis.com` em `style-src` e `fonts.gstatic.com` em `font-src`.
- Prefira self-host de fontes quando quiser evitar alterações de CSP.

Valide no navegador com o Console aberto: violações de CSP aparecem como erros explícitos, com a diretiva bloqueada.

### Passo 10 — Cache

Se o projeto aplica `Cache-Control: no-cache, no-store, must-revalidate` globalmente, a LP também receberá esse header. Isso é bom para lançamento e ajustes rápidos, mas ruim para performance.

Opções:

- manter global (simples, previsível, adequado a LP em validação);
- criar regra específica para a rota com cache curto;
- usar nomes de assets com hash e cache longo apenas para eles.

Não altere o cache global sem necessidade: a mudança afeta todo o site.

### Passo 11 — Revisar o diff antes de commitar

```bash
git status
git diff --stat
git diff -- vercel.json
git diff --check
```

Confirme:

- `vercel.json` recebeu **apenas** os rewrites da LP (e redirects, se houver);
- o `vercel.json` standalone foi removido;
- o HTML da LP está no output e com caminhos absolutos;
- nenhum segredo, `.env` ou credencial entrou no diff;
- nenhum arquivo do site principal foi alterado sem necessidade.

---

## 5. Modelo de `vercel.json`

Exemplo mínimo com build, output e catch-all. Substitua os placeholders.

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "version": 2,
  "framework": null,
  "buildCommand": "node build.js",
  "outputDirectory": "<OUTPUT_DIR>",
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/$1"
    },
    {
      "source": "/cadastro",
      "destination": "/cadastro.html"
    },
    {
      "source": "/<ROTA>",
      "destination": "/<ARQUIVO>.html"
    },
    {
      "source": "/<ROTA>/",
      "destination": "/<ARQUIVO>.html"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self'; form-action 'self'; frame-ancestors 'none'"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Cache-Control",
          "value": "no-cache, no-store, must-revalidate"
        }
      ]
    }
  ]
}
```

Observações:

- `rewrites` é avaliado **na ordem declarada**. O catch-all fica por último.
- `destination` é um caminho interno do output, não uma URL externa.
- `headers` é global; não é necessário criar regra específica para a LP, a menos que você queira cache diferente.
- Se o projeto não tiver catch-all, remova a última entrada de `rewrites`.
- Se o projeto não tiver `buildCommand`, remova a linha.
- Se o projeto for estático na raiz, remova `outputDirectory`.

---

## 6. Checklist de validação local

Execute na raiz do projeto pai. Ajuste as variáveis antes.

```bash
ROTA="<ROTA>"
ARQUIVO="<ARQUIVO>.html"
PASTA_ASSETS="<PASTA-ASSETS>"
OUTPUT_DIR="<OUTPUT_DIR>"
```

### 6.1 Validar o JSON

```bash
python3 -m json.tool vercel.json > /dev/null && echo "vercel.json valido"
```

### 6.2 Validar ordem dos rewrites, destino e assets

```bash
ROTA="$ROTA" ARQUIVO="$ARQUIVO" PASTA_ASSETS="$PASTA_ASSETS" OUTPUT_DIR="$OUTPUT_DIR" \
python3 - <<'PY'
import json, os, pathlib, re, sys

rota = os.environ["ROTA"].strip("/")
arquivo = os.environ["ARQUIVO"]
pasta = os.environ["PASTA_ASSETS"].strip("/")
out = pathlib.Path(os.environ["OUTPUT_DIR"] or ".")
alvo = f"/{arquivo}"

erros, avisos = [], []

cfg_path = pathlib.Path("vercel.json")
if not cfg_path.is_file():
    erros.append("vercel.json nao encontrado na raiz")
    cfg = {}
else:
    try:
        cfg = json.loads(cfg_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        erros.append(f"vercel.json invalido: {exc}")
        cfg = {}

rewrites = cfg.get("rewrites", [])
sources = [r.get("source", "") for r in rewrites]

for variante in (f"/{rota}", f"/{rota}/"):
    if variante not in sources:
        erros.append(f"rewrite ausente: {variante}")
        continue
    dest = rewrites[sources.index(variante)].get("destination")
    if dest != alvo:
        erros.append(f"{variante} aponta para {dest}; esperado {alvo}")

catch = next((i for i, s in enumerate(sources) if s == "/(.*)"), None)
if catch is not None:
    for variante in (f"/{rota}", f"/{rota}/"):
        if variante in sources and sources.index(variante) > catch:
            erros.append(f"{variante} esta DEPOIS do catch-all /(.*)")

html_path = out / arquivo
assets_path = out / pasta

if not html_path.is_file():
    erros.append(f"HTML ausente no output: {html_path}")
if not assets_path.is_dir():
    erros.append(f"pasta de assets ausente: {assets_path}")
elif not any(p.is_file() for p in assets_path.rglob("*")):
    erros.append(f"pasta de assets vazia: {assets_path}")

if html_path.is_file():
    html = html_path.read_text(encoding="utf-8")
    for ref in re.findall(r'(?:src|href)="([^"]+)"', html):
        if ref.startswith(("#", "http://", "https://", "//", "mailto:", "tel:", "data:")):
            continue
        if ref.startswith("/"):
            if not (out / ref.lstrip("/")).exists():
                erros.append(f"referencia absoluta quebrada: {ref}")
        else:
            avisos.append(f"referencia relativa (pode colidir com a raiz): {ref}")
    if f"/{pasta}/" not in html:
        avisos.append(f"HTML nao referencia /{pasta}/")

for item in erros:
    print(f"ERRO: {item}")
for item in avisos:
    print(f"AVISO: {item}")

print("OK" if not erros else "FALHOU")
sys.exit(1 if erros else 0)
PY
```

### 6.3 Verificar sintaxe do JavaScript

```bash
for js in "$OUTPUT_DIR/$PASTA_ASSETS"/*.js; do
  [ -f "$js" ] && node --check "$js" && echo "OK: $js"
done
```

### 6.4 Auditar referências relativas no HTML

```bash
grep -nE '(src|href)="[^/#h][^"]*"' "$OUTPUT_DIR/$ARQUIVO" || echo "Nenhuma referencia relativa suspeita"
```

### 6.5 Verificar o diff

```bash
git diff --check
git status --short
```

`git diff --check` acusa espaços em branco no fim de linha e conflitos de merge. O `git status` confirma que só os arquivos esperados mudaram.

### 6.6 Validar o build em cópia temporária

O build do bbj-flow **reescreve HTML no lugar** e **falha sem credenciais**. Por isso, valide em uma cópia, nunca no repositório de trabalho, e use valores dummy compatíveis com as validações do script.

```bash
TMP="$(mktemp -d)"

rsync -a --exclude '.git' --exclude 'node_modules' --exclude '.vercel' ./ "$TMP"/

(
  cd "$TMP"
  <ENV_VAR_1>='https://dummy.supabase.co' \
  <ENV_VAR_2>='eyJdummy' \
  node build.js

  test -f "<OUTPUT_DIR>/<ARQUIVO>.html" || { echo "LP sumiu no build"; exit 1; }
  test -f "<OUTPUT_DIR>/<PASTA-ASSETS>/styles.css" || { echo "CSS sumiu no build"; exit 1; }
  test -f "<OUTPUT_DIR>/<PASTA-ASSETS>/script.js" || { echo "JS sumiu no build"; exit 1; }
  echo "Build preservou a LP"
)

rm -rf "$TMP"
```

Notas:

- Os valores dummy servem **apenas** para validar o build localmente.
- Se o build valida formato (ex.: URL começando com `https://` e chave começando com `eyJ`), o dummy precisa respeitar esse formato.
- Nunca use esses valores no dashboard da Vercel.
- Se o projeto não tem build, pule esta etapa.

### 6.7 Pré-visualizar localmente

Com `python3 -m http.server` os rewrites **não** são aplicados. Acesse o arquivo direto:

```bash
cd "$OUTPUT_DIR" && python3 -m http.server 8080
# http://localhost:8080/<ARQUIVO>
```

Para testar a rota como em produção, use `vercel dev` na raiz (aplica rewrites e headers, mas exige projeto linkado e variáveis de ambiente):

```bash
vercel dev
# http://localhost:3000/<ROTA>
```

---

## 7. Checklist pós-deploy

Após o deploy de produção (ou preview), valide:

### 7.1 Status HTTP das rotas

```bash
DOMINIO="https://<DOMINIO>"

for p in "/<ROTA>" "/<ROTA>/" "/" "/cadastro" "/api/<ENDPOINT>"; do
  printf '%-22s ' "$p"
  curl -s -o /dev/null -w '%{http_code} %{content_type}\n' "$DOMINIO$p"
done
```

Esperado:

- `/<ROTA>` e `/<ROTA>/`: `200` com `text/html`.
- `/`: `200` com a home.
- `/cadastro`: `200` (se existir).
- `/api/<ENDPOINT>`: `200`, `401` ou `405` conforme o contrato (não `404`).

### 7.2 Conteúdo correto, não apenas status 200

```bash
curl -s "$DOMINIO/<ROTA>" | grep -E "<title>|/<PASTA-ASSETS>/"
```

Confirme que o HTML retornado é o da LP e que os caminhos dos assets estão corretos. Um `200` com o HTML da home indica catch-all engolindo a rota.

### 7.3 Assets

```bash
curl -s -o /dev/null -w '%{http_code} %{content_type}\n' "$DOMINIO/<PASTA-ASSETS>/styles.css"
curl -s -o /dev/null -w '%{http_code} %{content_type}\n' "$DOMINIO/<PASTA-ASSETS>/script.js"
```

Esperado: `200` com `text/css` e `application/javascript` (ou `text/javascript`).

### 7.4 Navegador

- [ ] Console sem erros de CSP e sem `404` de CSS/JS.
- [ ] Aba Network: CSS e JS com `200`.
- [ ] Layout correto em desktop e mobile (360 px, 390 px, 768 px).
- [ ] Menu, âncoras e formulário (se houver) funcionando.
- [ ] Fontes carregando (sem fallback forçado por CSP).
- [ ] Imagens carregando.
- [ ] Nenhum conteúdo misto (`http://` em página `https://`).
- [ ] Lighthouse mobile sem regressão grave de acessibilidade/performance.

### 7.5 Regressão no site principal

- [ ] Home abre e mantém estilo.
- [ ] `/cadastro` (ou outra rota existente) abre.
- [ ] Uma chamada de API real continua respondendo.
- [ ] Nenhum asset do site principal mudou de caminho.

---

## 8. Armadilhas comuns

| Sintoma | Causa provável | Correção |
|---|---|---|
| `/<ROTA>` retorna a home com status 200 | Catch-all `/(.*)` declarado antes da rota | Mover os rewrites da LP para antes do catch-all |
| `/<ROTA>/` dá 404 ou redireciona | Falta a variante com barra final | Declarar os dois rewrites |
| CSS não aplica, mas não há 404 | `href="styles.css"` resolveu para `/styles.css` da raiz | Usar `/<PASTA-ASSETS>/styles.css` |
| `404` em CSS/JS | Caminho relativo apontando para pasta errada ou asset fora do output | Caminho absoluto + asset dentro de `<OUTPUT_DIR>` |
| Estilo do site principal “vaza” na LP | Colisão de nomes (`styles.css`, `img/`, `assets/`) | Pasta de assets exclusiva com prefixo da rota |
| LP some após o deploy | Build limpa o output e não copia a LP | Ajustar build para copiar/gerar a LP |
| Build falha localmente | Variáveis de ambiente ausentes | Cópia temporária + dummy válido; produção usa o dashboard |
| Fontes não carregam | CSP sem `fonts.googleapis.com`/`fonts.gstatic.com` | Ajustar `style-src` e `font-src` |
| Script inline bloqueado | CSP sem `'unsafe-inline'` | Mover para arquivo externo ou ajustar CSP |
| Formulário não envia | `form-action 'self'` bloqueando domínio externo | Adicionar domínio ao `form-action` ou usar `fetch` + `connect-src` |
| Iframe da LP não abre | `X-Frame-Options: DENY` / `frame-ancestors 'none'` | Ajustar headers se o embed for intencional |
| Mudança não aparece | Cache agressivo ou build não publicado | Hard reload; conferir header `Cache-Control` e deployment ativo |
| URL antiga da LP quebrou | Config standalone removida sem redirect | Adicionar `redirects` 301 da URL antiga para a nova |
| Funciona em `/rota.html` mas não em `/rota` | Rewrite ausente | Adicionar o par de rewrites |
| Funciona em preview e falha em produção | Variáveis ou domínio diferentes por ambiente | Conferir Environment Variables do ambiente Production |

### Distinções que evitam erro de diagnóstico

- **`index.html` não é o problema.** A home continua sendo `index.html`; a LP é um arquivo separado. Não renomeie a home.
- **Domínio vs subpath.** O modelo usa `https://<DOMINIO>/<ROTA>` (raiz do domínio). Se a LP for publicada em subpath (`/campanha/<ROTA>`), todos os caminhos absolutos precisam incluir o prefixo, ou o projeto precisa de `basePath`. Prefira a rota na raiz.
- **Rewrites não mudam a URL.** O visitante vê `/<ROTA>`; o servidor entrega `<ARQUIVO>.html` internamente.
- **Config aninhada não vale.** Só o `vercel.json` da raiz do projeto é considerado.
- **Case sensitivity.** Linux/Vercel diferenciam maiúsculas de minúsculas; `Styles.css` não encontra `styles.css`.
- **Espaços e acentos em nomes.** Evite em arquivos publicados; se inevitável, use URL encoding e teste.

---

## 9. Prompt para reaplicar em outro projeto

Copie o bloco abaixo e substitua os placeholders.

```text
Tarefa: publicar a landing page standalone em <ORIGEM-DA-LP> como segunda página
do projeto principal na Vercel, acessível em https://<DOMINIO>/<ROTA>.

Contexto:
- Projeto pai: <CAMINHO-DO-PROJETO>
- A LP standalone tem: index.html, styles.css, script.js (e <OUTROS-ASSETS>).
- A LP tinha um vercel.json próprio, que deve ser removido.
- O projeto pai publica a Vercel a partir de <OUTPUT_DIR> (ou da raiz, se não houver outputDirectory).
- O projeto pai tem buildCommand "<BUILD_COMMAND>" (ou não tem build).
- Existe catch-all "/(.*) -> /index.html" nos rewrites (ou não existe).
- Existem headers CSP globais que precisam ser respeitados.

O que fazer:
1. Ler vercel.json, build.js (se existir), .vercel/project.json e listar o output.
2. Escolher o slug <ROTA> sem colidir com rotas/assets existentes.
3. Mover o HTML para <OUTPUT_DIR>/<ARQUIVO>.html e os assets para
   <OUTPUT_DIR>/<PASTA-ASSETS>/ (CSS, JS e imagens).
4. Ajustar TODAS as referências do HTML para caminhos absolutos:
   /<PASTA-ASSETS>/styles.css, /<PASTA-ASSETS>/script.js, /<PASTA-ASSETS>/img/...
5. Adicionar ao vercel.json da raiz os rewrites /<ROTA> e /<ROTA>/ apontando para
   /<ARQUIVO>.html, ANTES do catch-all.
6. Remover o vercel.json standalone da LP.
7. Verificar se o build apaga ou sobrescreve o output; se apagar, ajustar para
   preservar/copiar a LP. Não alterar o comportamento do site principal sem necessidade.
8. Verificar CSP: Google Fonts, scripts de CDN, imagens externas, connect-src e
   form-action. Ajustar somente o necessário.
9. Validar localmente: JSON, ordem dos rewrites, existência dos assets, node --check,
   referências absolutas, git diff --check e build em cópia temporária com env dummy.
10. NÃO fazer deploy sem autorização explícita.

Restrições:
- Não alterar o index.html do site principal.
- Não publicar a pasta de referências de design.
- Não commitar segredos nem valores dummy.
- Manter o design system e o comportamento existentes.

Entrega esperada:
- Lista de arquivos movidos/criados/removidos.
- Diff do vercel.json.
- Resultado dos comandos de validação.
- URL final esperada e riscos/pendências.
```

---

## 10. Caso real: o que foi feito no bbj-flow

Registro fiel da integração usada como base deste documento.

### Configuração do projeto pai

`vercel.json` da raiz:

- `buildCommand: "node build.js"`
- `outputDirectory: "Desenvolvimento"`
- `framework: null`
- rewrites de API primeiro;
- `/cadastro -> /cadastro.html`;
- `/lpteste -> /lpteste.html` e `/lpteste/ -> /lpteste.html`;
- catch-all `/(.*) -> /index.html` por último;
- headers globais com CSP, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` e `Cache-Control: no-cache, no-store, must-revalidate`.

### O que foi movido

| Antes | Depois |
|---|---|
| `LP_LR_JIUJITSU/index.html` | `Desenvolvimento/lpteste.html` |
| `LP_LR_JIUJITSU/styles.css` | `Desenvolvimento/lpteste-assets/styles.css` |
| `LP_LR_JIUJITSU/script.js` | `Desenvolvimento/lpteste-assets/script.js` |
| `LP_LR_JIUJITSU/vercel.json` | removido |

O HTML passou a referenciar:

```html
<link rel="stylesheet" href="/lpteste-assets/styles.css">
<script src="/lpteste-assets/script.js" defer></script>
```

### Build

`build.js` injeta `SUPABASE_URL` e `SUPABASE_ANON_KEY` apenas em:

- `Desenvolvimento/index.html`;
- `Desenvolvimento/cadastro.html`.

Ele não apaga nem copia outros arquivos, então a LP permanece no output. Como falha sem as variáveis, a validação local foi feita em cópia temporária com valores dummy.

### Validações executadas

- parse do `vercel.json`;
- ordem dos rewrites (específicos antes do catch-all);
- existência do HTML e dos assets no output;
- `node --check` no `script.js`;
- `git diff --check`;
- build em cópia temporária com env dummy.

### Resultado

- URL esperada: `https://bbjflow.com.br/lpteste`.
- A pasta `modelo_lp` (referências de design) não foi publicada porque a página usa placeholders.
- Sem deploy real não há confirmação da URL em produção; a validação cobre configuração, assets e build.

### CSP observada

A política do projeto permite Google Fonts (`style-src fonts.googleapis.com`, `font-src fonts.gstatic.com`), scripts de CDN específicos e imagens `https:`. A LP usou apenas CSS/JS próprios e um `@import` de Google Fonts, compatível com a política existente.

---

## 11. Adaptação para projeto estático sem build (Dr. Patricia Veloso)

O projeto Dr. Patricia Veloso, na data deste documento, é uma landing estática na raiz:

```
index.html
styles.css
script.js
img/
favicon.ico
```

Não há `vercel.json` nem `outputDirectory`, e o build não existe. A adaptação muda três pontos:

### 11.1 Onde colocar a LP

Duas opções:

**Opção A (recomendada): manter a raiz como output e publicar a LP na raiz**

```
<ARQUIVO>.html
<PASTA-ASSETS>/
├── styles.css
├── script.js
└── img/
```

- A home continua em `/`.
- A LP fica em `/<ROTA>` via rewrite.
- Não é necessário mover o site inteiro.

**Opção B: introduzir `outputDirectory`**

Só faça isso se quiser separar fontes de publicação. Exige mover `index.html`, `styles.css`, `script.js`, `img/` e `favicon.ico` para a pasta publicada, com risco maior de regressão. Para uma segunda página, a Opção A é suficiente.

### 11.2 `vercel.json` mínimo

Como não existe catch-all, **não crie um**. Adicione apenas o necessário:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "version": 2,
  "framework": null,
  "rewrites": [
    {
      "source": "/<ROTA>",
      "destination": "/<ARQUIVO>.html"
    },
    {
      "source": "/<ROTA>/",
      "destination": "/<ARQUIVO>.html"
    }
  ]
}
```

Se o projeto já tiver `headers`, `redirects` ou `cleanUrls`, preserve-os e apenas acrescente os rewrites.

### 11.3 Cuidados específicos

- O site pai usa caminhos relativos (`styles.css`, `img/...`) na raiz. A LP **não pode** repetir esses nomes: use `/<PASTA-ASSETS>/...`.
- A pasta `img/` do projeto pai é parcialmente ignorada pelo Git. Não coloque imagens da LP nela; crie `<PASTA-ASSETS>/img/`.
- Sem build, não há injeção de variáveis nem cópia temporária obrigatória. A validação local se resume a JSON, assets, referências absolutas, `node --check` e `git diff --check`.
- O deploy pode ser feito pela integração Git da Vercel. Se for usar CLI, rode `vercel link` antes; não commite `.vercel/`.
- Se a LP usar Meta Pixel, Clarity ou formulário externo, revise CSP/`connect-src`/`form-action` **antes** do deploy. O projeto pai atual não tem CSP; se você adicionar uma, faça com inventário das origens usadas.

---

## 12. Definition of Done

A integração está concluída quando todos os itens abaixo forem verdadeiros:

- [ ] A LP está dentro do output publicado.
- [ ] Os assets estão em pasta exclusiva, sem colisão com a raiz.
- [ ] O HTML usa caminhos absolutos para CSS, JS e imagens.
- [ ] `/<ROTA>` e `/<ROTA>/` estão nos rewrites, antes do catch-all.
- [ ] O `vercel.json` standalone da LP foi removido.
- [ ] O build não apaga a LP (ou foi ajustado para preservá-la).
- [ ] CSP e headers foram revisados para as origens usadas.
- [ ] `vercel.json` faz parse sem erro.
- [ ] `node --check` passa nos JS publicados.
- [ ] Build em cópia temporária preserva a LP (quando há build).
- [ ] `git diff --check` está limpo.
- [ ] Home, `/cadastro` e uma API existente continuam funcionando.
- [ ] Console do navegador sem 404 de CSS/JS e sem violação de CSP.
- [ ] Layout validado em mobile.
- [ ] URL final documentada: `https://<DOMINIO>/<ROTA>`.
