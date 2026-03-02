import argparse
import csv
import json
from pathlib import Path
from collections import Counter

import sys
sys.path.append(str(Path(__file__).resolve().parents[1]))

from scoring.heuristics import evaluate_response
from runner.report_builder import write_csv, build_html

ROOT = Path(__file__).resolve().parents[1]


def load_rubric():
    return json.loads((ROOT / "scoring" / "rubric.json").read_text(encoding="utf-8"))


def load_scenarios(nicho: str, suite: str):
    file = ROOT / "tests" / nicho / "scenarios.json"
    data = json.loads(file.read_text(encoding="utf-8"))
    if suite == "full":
        return data
    return [s for s in data if s.get("suite") == "smoke"]


def load_batch_answers(path: Path):
    answers = {}
    with path.open(encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            answers[row["id_cenario"]] = row["resposta_agente"]
    return answers


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--nicho", required=True, choices=["dentista", "fisio", "nutri", "clinica_medica", "cross_nicho"])
    p.add_argument("--suite", required=True, choices=["smoke", "full"])
    p.add_argument("--mode", default="manual", choices=["manual", "batch"])
    p.add_argument("--batch_file", help="CSV com colunas id_cenario,resposta_agente")
    args = p.parse_args()

    rubric = load_rubric()
    scenarios = load_scenarios(args.nicho, args.suite)
    batch_answers = load_batch_answers(Path(args.batch_file)) if args.mode == "batch" and args.batch_file else {}

    results = []
    for sc in scenarios:
        if args.mode == "manual":
            print("\n---")
            print(f"Cenário: {sc['id']}")
            print(f"Lead: {sc['mensagem_do_lead']}")
            resp = input("Cole a resposta do agente: ").strip()
        else:
            resp = batch_answers.get(sc["id"], "")

        ev = evaluate_response(sc, resp, rubric)
        result = {
            "id": sc["id"],
            "nicho": sc["nicho"],
            "suite": sc["suite"],
            "score_total": ev["score_total"],
            "flags": ev["flags"],
            "expected_summary": "coleta_dados+cta+compliance",
            "observed_summary": f"nome={ev['observed']['asked_nome']}, procedimento={ev['observed']['asked_procedimento']}, urgencia={ev['observed']['asked_urgencia']}, convenio={ev['observed']['asked_convenio']}, horario={ev['observed']['asked_horario']}, cta={ev['observed']['has_cta']}",
            "recommendations": ev["recommendations"],
            "resposta_agente": resp,
        }
        results.append(result)

    csv_rows = []
    for r in results:
        csv_rows.append({
            "id": r["id"],
            "nicho": r["nicho"],
            "suite": r["suite"],
            "score_total": r["score_total"],
            "flags": "|".join(r["flags"]),
            "expected": r["expected_summary"],
            "observed": r["observed_summary"],
            "recommendations": "|".join(r["recommendations"]),
        })

    out_csv = ROOT / "reports" / "last_run.csv"
    out_html = ROOT / "reports" / "last_run.html"
    write_csv(out_csv, csv_rows)
    build_html(out_html, results)

    avg = sum(r["score_total"] for r in results) / max(1, len(results))
    worst = sorted(results, key=lambda x: x["score_total"])[:10]
    flag_counter = Counter(flag for r in results for flag in r["flags"])

    print("\n=== RESUMO ===")
    print(f"Média: {avg:.1f}")
    print("Piores 10:")
    for w in worst:
        print(f"- {w['id']}: {w['score_total']} ({', '.join(w['flags']) or 'sem flags'})")
    print("Top flags:")
    for k, v in flag_counter.most_common(10):
        print(f"- {k}: {v}")
    print(f"\nArquivos gerados: {out_html} | {out_csv}")


if __name__ == "__main__":
    main()
