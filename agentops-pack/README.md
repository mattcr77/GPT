# AgentOps Pack para WhatsApp de Clínicas

Kit operacional para testar, medir e monitorar agentes WhatsApp em produção (sem depender de API).

## Estrutura

- `tests/` cenários por nicho em JSON padronizado.
- `scoring/rubric.json` pesos oficiais (100 pontos).
- `scoring/scorecard.md` checklist humano.
- `scoring/heuristics.py` avaliação automática por regex/padrões.
- `runner/run_tests.py` CLI de execução (manual e batch).
- `runner/report_builder.py` geração de `reports/last_run.html` e `reports/last_run.csv`.
- `monitoring/rules.yaml` SLOs e regras.
- `monitoring/alert_templates/` mensagens prontas.
- `datasets/build_regression.py` (opcional) cria dataset de regressão anonimizado.

## Schema dos cenários (JSON)

Cada cenário contém:
- `id`, `suite` (`smoke`/`full`), `nicho`, `objetivo`, `contexto`, `historico`, `mensagem_do_lead`
- `expected`:
  - `coleta_dados`: `[nome, procedimento, urgencia, convenio, horario]`
  - `acao`: `[perguntar, oferecer_agenda, handoff, followup]`
  - `tom`: `[premium, claro, curto]`
  - `compliance`: `[sem_promessa_medica, sem_sensacionalismo]`
- `red_flags`
- `severidade_erro` (`low|med|high`)

## Cobertura

- 30 cenários por nicho: `dentista`, `fisio`, `nutri`, `clinica_medica`.
- 20 cenários `cross_nicho` (spam, injection, coleta indevida, conteúdo sensível).
- Suite `smoke`: 12 cenários por nicho (inclui núcleo obrigatório).

## Como rodar smoke

### Modo batch (recomendado)
```bash
python agentops-pack/runner/run_tests.py --nicho dentista --suite smoke --mode batch --batch_file agentops-pack/datasets/samples/dentista_smoke_respostas.csv
```

### Modo manual
```bash
python agentops-pack/runner/run_tests.py --nicho dentista --suite smoke --mode manual
```
Você cola a resposta do agente cenário a cenário no terminal.

## Como rodar full
```bash
python agentops-pack/runner/run_tests.py --nicho dentista --suite full --mode batch --batch_file agentops-pack/datasets/samples/dentista_smoke_respostas.csv
```

## Como adicionar cenários
1. Abra `tests/<nicho>/scenarios.json`.
2. Copie um bloco existente e ajuste `id`, `objetivo`, `mensagem_do_lead` e severidade.
3. Marque `suite: smoke` se deve entrar na bateria curta.
4. Reexecute smoke para validar regressão.

## Como ajustar pesos do score
- Edite `scoring/rubric.json`.
- Preserve total 100.
- A CLI usa os máximos definidos no arquivo em cada execução.

## Como interpretar o relatório
- `last_run.html`: visão executiva com tabela por cenário, top 5 problemas e ações recomendadas.
- `last_run.csv`: ideal para BI/planilha.
- No terminal: média, piores 10 e flags mais frequentes.

## Guardrails de segurança avaliados
- Promessas médicas proibidas (`cura garantida`, `diagnóstico definitivo` etc).
- Ignorar pedido de humano/urgência.
- Resistência básica a prompt injection.
- Controle de verbosidade excessiva.

## Dataset de regressão (opcional)
```bash
python agentops-pack/datasets/build_regression.py --input conversas.csv
```
Saída: `datasets/regression_YYYY-MM-DD.json` com anonimização básica de telefone e `[nome:...]`.

## Checklist de go-live AgentOps
- [ ] Smoke de todos nichos executado sem erro e média >= 80.
- [ ] Nenhuma flag crítica de compliance em casos sensíveis.
- [ ] Handoff em urgência e pedido explícito validado.
- [ ] SLOs publicados (`monitoring/rules.yaml`) e alertas conectados.
- [ ] Dono operacional definido para triagem diária dos piores casos.
