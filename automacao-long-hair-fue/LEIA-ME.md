# Automação de e-mail — Workshop Long Hair FUE

## O que tem aqui
- `site/patch-script.js` — mudanças no `script.js` do site (o dev aplica em 15 min).
- `apps-script/Code.gs` — backend: recebe leads, salva na planilha, envia as réguas e faz o descadastro. O checkout é fixo na Kiwify.
- `apps-script/Emails.gs` — catálogo de copys em HTML; o `Code.gs` dispara somente C1–C3.
- `apps-script/appsscript.json` — configuração do projeto (fuso de Brasília, web app público).

## Instalação (≈ 30 min)
1. Crie uma Planilha Google nova → **Extensões > Apps Script**.
2. Cole `Code.gs` e crie o arquivo `Emails.gs` com o conteúdo daqui. Em Configurações do projeto, marque "Mostrar appsscript.json" e cole o nosso.
3. No topo do `Code.gs`, preencha `REPLY_TO` (e-mail de atendimento).
4. **Configurações do projeto > Propriedades do script**:
   - `WEBAPP_URL` = preencha depois do passo 5.
5. **Implantar > Nova implantação > App da Web** (executar como: você · acesso: qualquer pessoa). Copie a URL `/exec`.
6. Cole essa URL em `WEBAPP_URL` (passo 4) e no `LEAD_ENDPOINT` do `patch-script.js`.
7. Rode a função `setup` uma vez (autorize). Ela cria as abas e o gatilho de 30 em 30 min.
8. Troque o e-mail em `testarTodosOsEmails`, rode, confira os 3 e-mails C1–C3 na sua caixa.
9. Dev aplica o `patch-script.js` no site. Faça um teste real pelo formulário/modal, enviando diretamente ao checkout.

## Sequência de e-mails atual
- Apenas leads recebidos com `mode=payment` entram na sequência C1/C2/C3, para quem iniciou o checkout e ainda não pagou.
- As sequências A e B e o aviso V1 não são disparados pelo `Code.gs`. Os arquivos e assuntos correspondentes permanecem somente como catálogo/histórico de copys.
- O fluxo atual não usa quiz: o visitante preenche o formulário direto no modal e segue para o checkout.

## Checkout fixo Kiwify
- Não existe criação de checkout dinâmico nem integração com Mercado Pago/PagBank.
- Quando o formulário chega com `mode: "payment"`, o `Code.gs` salva/atualiza o lead com o segmento `C` e devolve `checkout_url` fixo: `https://pay.kiwify.com.br/Kxl16ye`.
- O site sempre redireciona para a constante `PAYMENT_URL` (também Kiwify), independentemente da resposta do backend.
- Para testar:
  1. Confirme `WEBAPP_URL` com a URL `/exec` da implantação atual.
  2. Abra o formulário/modal de inscrição e envie os dados diretamente ao checkout.
  3. Envie nome/e-mail/telefone. A resposta do Apps Script deve trazer `ok: true` e `checkout_url` com o link da Kiwify.
  4. Confira na planilha se o lead foi salvo com `mode = payment`, segmento `C` e `lead_id`.

## Regras que a automação segue
- Envia só entre 8h e 20h (Brasília) e para tudo em 12/11/2026, véspera do evento.
- Quem paga é removido manualmente da planilha (não há conciliação automática com gateway).
- Se a mesma pessoa envia novamente o formulário, o lead é atualizado; leads com `mode=payment` seguem somente a régua C e nunca recebem duas réguas ao mesmo tempo.
- Todo e-mail tem link de descadastro.

## Urgência de lote e escassez de vagas
No topo do `Emails.gs`, preencha o bloco `LOTE` **só com dados reais**:
- `fim`: data e hora da virada do lote (ex.: `'2026-10-20T23:59:00-03:00'`). Com isso os e-mails passam a dizer "encerra hoje / amanhã / em 20 de outubro". O aviso V1 permanece apenas no catálogo e não é disparado pelo `Code.gs`.
- `proximo_preco`: valor do próximo lote. Os e-mails mostram a diferença em reais.
- `vagas_restantes`: número real de vagas. Vazio = os e-mails dizem apenas "vagas limitadas".
Na virada do lote, atualize `atual`, `preco`, `fim`, `proximo` e `proximo_preco` no `Emails.gs`.

## Pasta emails-html (para usar em outra plataforma)
HTML pronto de cada e-mail com variáveis no formato `{{nome}}`, `{{link_inscricao}}`, `{{link_pagamento}}`, `{{link_descadastro}}`, `{{lote_encerra_em}}` (ex.: "amanhã, às 23h59") e `{{valor_proximo_lote}}`. Troque pelo formato de variável da plataforma escolhida. Os arquivos A/B/V1 e suas referências a quiz ficam preservados apenas como catálogo/histórico; não fazem parte do disparo atual. C2 tem versões por interesse do catálogo. Assuntos e pré-headers estão em `assuntos-e-previas.tsv`.

## Antes de ligar, confirme
- O preço e o nome do item em `CONFIG` batem com o link atual da Kiwify (parcelamento/taxas).
- Que haverá 2º lote (as copys históricas B3 e a atual C3 citam o valor "do 1º lote"). Quando o lote virar, troque `EVENTO.preco` e o bloco `LOTE`.
- Limite do Gmail: 100 e-mails/dia em conta comum, 1.500 no Google Workspace. Acima disso, mude `SENDER` para `'brevo'` e cadastre `BREVO_API_KEY`.
- Configure SPF/DKIM do domínio remetente para não cair no spam.
