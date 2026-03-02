# Sales Kit Master (WaveBrainBot)

Gerador de kit comercial com posicionamento premium e ético: foco em **velocidade de resposta, processo e operação**. A automação acelera a cadência e o time humano decide.

## Stack final
- Next.js (App Router) + TypeScript
- Tailwind CSS
- Zod para schema de entrada
- Motor de ROI ultraconservador
- Exportação HTML + tentativa de PDF com Playwright (fallback para HTML quando indisponível)

## Instalação
```bash
npm install
npm run dev
```
Acesse `http://localhost:3000` para enviar JSON no formulário e gerar outputs.

## Uso por script (gerar 3 exemplos)
```bash
npm run generate:examples
```
Isso gera pastas em `outputs/` com:
- `diagnostico.html`
- `proposta.html`
- `sales-kit.pdf` (quando possível)
- `scripts.md`
- `assumptions.json`
- `onepager.txt`

## Estrutura
- `src/core/schema.ts`: validação de entrada (lead, operação, números, objetivo).
- `src/core/roi/calculate.ts`: ROI ultraconservador com suposições explícitas e validação.
- `src/core/generators/generateSalesKit.ts`: motor de geração de arquivos.
- `src/core/templating/render.ts`: templates consistentes em HTML + scripts + onepager.
- `src/content/nichos/*.json`: biblioteca por nicho (dores, objeções, perguntas, CTA).
- `src/content/objeções.json`: respostas éticas padrão.
- `src/content/estrutura.md`: macro-estrutura fixa.

## Editar templates e nichos
- Atualize copy e estrutura em `src/core/templating/render.ts`.
- Atualize repertório por nicho em `src/content/nichos/*.json`.
- Atualize objeções globais em `src/content/objeções.json`.

## Checklist de validação com cliente
1. Confirmar `leads_mes` por canal (WhatsApp/Instagram/site).
2. Confirmar `conversao_atual_pct` (leads qualificados -> agendamentos).
3. Confirmar `ticket_medio` real por atendimento.
4. Medir `no_show_pct` dos últimos 30 dias.
5. Revisar tempo médio de primeira resposta por faixa horária.
6. Validar rota para decisor quando contato inicial não for dono/gestor.

## Qualidade
```bash
npm run test
npm run lint
```
