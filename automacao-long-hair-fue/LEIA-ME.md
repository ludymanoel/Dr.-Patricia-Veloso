# Automação de e-mail — Workshop Long Hair FUE

## O que tem aqui
- `site/patch-script.js` — mudanças no `script.js` do site (o dev aplica em 15 min).
- `apps-script/Code.gs` — backend: recebe leads, cria checkout Mercado Pago por lead, confere pagamentos, envia as réguas, descadastro.
- `apps-script/Emails.gs` — as 9 copys em HTML (A1–A3, B1–B3, C1–C3).
- `apps-script/appsscript.json` — configuração do projeto (fuso de Brasília, web app público).

## Instalação (≈ 30 min)
1. Crie uma Planilha Google nova → **Extensões > Apps Script**.
2. Cole `Code.gs` e crie o arquivo `Emails.gs` com o conteúdo daqui. Em Configurações do projeto, marque "Mostrar appsscript.json" e cole o nosso.
3. No topo do `Code.gs`, preencha `REPLY_TO` (e-mail de atendimento).
4. **Configurações do projeto > Propriedades do script**:
   - `MP_ACCESS_TOKEN` = Access Token de **produção** do Mercado Pago (Seu negócio > Credenciais).
   - `WEBAPP_URL` = preencha depois do passo 5.
5. **Implantar > Nova implantação > App da Web** (executar como: você · acesso: qualquer pessoa). Copie a URL `/exec`.
6. Cole essa URL em `WEBAPP_URL` (passo 4) e no `LEAD_ENDPOINT` do `patch-script.js`.
7. Rode a função `setup` uma vez (autorize). Ela cria as abas e o gatilho de 30 em 30 min.
8. Troque o e-mail em `testarTodosOsEmails`, rode, confira os 9 e-mails na sua caixa.
9. Dev aplica o `patch-script.js` no site. Faça um teste real pelo modal, pelo quiz "talvez" e pelo quiz "quero avançar".

## Regras que a automação segue
- Envia só entre 8h e 20h (Brasília) e para tudo em 12/11/2026, véspera do evento.
- Antes de cada rodada confere o Mercado Pago: quem pagou sai na hora.
- Se a mesma pessoa avança (ex.: deixou dados no modal e depois fez o quiz), ela troca de régua; nunca recebe duas réguas ao mesmo tempo.
- "Não sou médico(a)" não recebe régua de venda.
- Todo e-mail tem link de descadastro.

## Urgência de lote e escassez de vagas
No topo do `Emails.gs`, preencha o bloco `LOTE` **só com dados reais**:
- `fim`: data e hora da virada do lote (ex.: `'2026-10-20T23:59:00-03:00'`). Com isso os e-mails passam a dizer "encerra hoje / amanhã / em 20 de outubro" e o aviso V1 dispara sozinho entre 36 h e 1 h antes da virada para quem está nas réguas B e C e não pagou.
- `proximo_preco`: valor do próximo lote. Os e-mails mostram a diferença em reais.
- `vagas_restantes`: número real de vagas. Vazio = os e-mails dizem apenas "vagas limitadas".
Na virada do lote, atualize `atual`, `preco`, `fim`, `proximo`, `proximo_preco` e também `PRICE`/`ITEM_TITLE` no `Code.gs`.

## Pasta emails-html (para usar em outra plataforma)
HTML pronto de cada e-mail com variáveis no formato `{{nome}}`, `{{link_inscricao}}`, `{{link_pagamento}}`, `{{link_quiz}}`, `{{link_descadastro}}`, `{{lote_encerra_em}}` (ex.: "amanhã, às 23h59") e `{{valor_proximo_lote}}`. Troque pelo formato de variável da plataforma escolhida. B1 e C2 têm uma versão por interesse do quiz. Assuntos e pré-headers estão em `assuntos-e-previas.tsv`.

## Antes de ligar, confirme
- O preço e o nome do item em `CONFIG` batem com o link atual do Mercado Pago (parcelamento/taxas).
- Que haverá 2º lote (o B3 e o C3 citam o valor "do 1º lote"). Quando o lote virar, troque `PRICE`, `ITEM_TITLE` e `EVENTO.preco`.
- Limite do Gmail: 100 e-mails/dia em conta comum, 1.500 no Google Workspace. Acima disso, mude `SENDER` para `'brevo'` e cadastre `BREVO_API_KEY`.
- Configure SPF/DKIM do domínio remetente para não cair no spam.
