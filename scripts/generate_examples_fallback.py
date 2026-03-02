import json, os, re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def slugify(v):
    v = v.lower().strip()
    v = re.sub(r"[^a-z0-9\s-]", "", v)
    return re.sub(r"\s+", "-", v)


def loss(minutes):
    if minutes <= 5: return (0.02,0.04)
    if minutes <= 15: return (0.05,0.10)
    if minutes <= 60: return (0.10,0.18)
    if minutes <= 240: return (0.14,0.25)
    return (0.18,0.30)

for name in ["dentista","fisio","nutri"]:
    data = json.loads((ROOT / "scripts" / "examples" / f"{name}.json").read_text())
    leads = data.get("numeros",{}).get("leads_mes",80)
    conv = data.get("numeros",{}).get("conversao_atual_pct",8)
    ticket = data.get("numeros",{}).get("ticket_medio",280)
    no_show = data.get("numeros",{}).get("no_show_pct",18)
    mn, cs = loss(data["operacao_atual"]["tempo_medio_resposta_min"])
    base = leads * (conv/100)
    min_ag = base * (mn+0.04) * (1-no_show/100)
    con_ag = base * (cs+0.07) * (1-no_show/100)

    folder = ROOT / "outputs" / slugify(data["lead"]["nome_clinica"])
    folder.mkdir(parents=True, exist_ok=True)
    diag = f"<html><body><h1>Diagnóstico {data['lead']['nome_clinica']}</h1><h2>Diagnóstico</h2><ul><li>Tempo de resposta: {data['operacao_atual']['tempo_medio_resposta_min']} min</li><li>Perda por falta de follow-up</li><li>Falta de trilha de qualificação</li></ul></body></html>"
    prop = f"<html><body><h1>Proposta</h1><h2>Estratégia</h2><p>Velocidade + processo + operação.</p><h2>Plano executável</h2><ul><li>Agente WhatsApp 24/7</li><li>Handoff humano</li><li>Rotina semanal de melhorias</li><li>Relatório simples e decisões</li></ul><h2>Próximos passos</h2><p>Validar suposições e iniciar piloto.</p><h2>ROI</h2><p>Mínimo plausível: +{min_ag:.1f} (~R$ {min_ag*ticket:.0f})</p><p>Conservador: +{con_ag:.1f} (~R$ {con_ag*ticket:.0f})</p></body></html>"
    scripts = "# Scripts\n\n## WhatsApp\nOlá! Posso te fazer 2 perguntas rápidas para reduzir tempo de resposta e perda de lead?\n\n## Ligação\nQueremos acelerar resposta e follow-up com controle humano.\n\n## Follow-up\nPosso te mostrar cenário mínimo plausível em 15 minutos?\n"
    assumptions = {
        "assumptions": [
            {"campo":"leads_mes","valor_assumido":80,"faixa":"60-120","como_validar":"Somar conversas no WhatsApp/Instagram/site"} if "leads_mes" not in data.get("numeros",{}) else None,
            {"campo":"conversao_atual_pct","valor_assumido":8,"faixa":"5-12","como_validar":"Leads qualificados / agendamentos"} if "conversao_atual_pct" not in data.get("numeros",{}) else None,
        ]
    }
    assumptions["assumptions"] = [x for x in assumptions["assumptions"] if x]
    one = f"{data['lead']['nome_clinica']}: foco em resposta rápida e follow-up. ROI mínimo +{min_ag:.1f}; conservador +{con_ag:.1f}."

    (folder / "diagnostico.html").write_text(diag)
    (folder / "proposta.html").write_text(prop)
    (folder / "sales-kit.pdf").write_bytes(b"PDF fallback placeholder: gerar com Playwright localmente.")
    (folder / "scripts.md").write_text(scripts)
    (folder / "assumptions.json").write_text(json.dumps(assumptions, indent=2, ensure_ascii=False))
    (folder / "onepager.txt").write_text(one)
    print("gerado", folder)
