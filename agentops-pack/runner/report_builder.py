import csv
from collections import Counter
from pathlib import Path
from typing import List, Dict, Any


def write_csv(path: Path, rows: List[Dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if not rows:
        return
    keys = list(rows[0].keys())
    with path.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=keys)
        w.writeheader()
        w.writerows(rows)


def build_html(path: Path, results: List[Dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    scores = [r["score_total"] for r in results] or [0]
    avg = sum(scores) / len(scores) if scores else 0
    flag_counter = Counter(flag for r in results for flag in r.get("flags", []))
    top5 = flag_counter.most_common(5)

    recommended = []
    for r in results:
        recommended.extend(r.get("recommendations", []))
    rec_counter = Counter(recommended).most_common(5)

    rows_html = ""
    for r in results:
        rows_html += f"""
        <tr>
          <td>{r['id']}</td>
          <td>{r['nicho']}</td>
          <td>{r['suite']}</td>
          <td><b>{r['score_total']}</b></td>
          <td>{', '.join(r['flags']) or '-'}</td>
          <td><small>{r['expected_summary']}</small></td>
          <td><small>{r['observed_summary']}</small></td>
        </tr>
        """

    top5_html = "".join([f"<li>{k}: {v}</li>" for k, v in top5]) or "<li>Sem flags</li>"
    rec_html = "".join([f"<li>{k}</li>" for k, _ in rec_counter]) or "<li>Sem recomendações</li>"

    html = f"""
    <html><head><meta charset='utf-8'><title>AgentOps Pack Report</title>
    <style>
    body {{ font-family: Arial, sans-serif; margin: 24px; }}
    table {{ border-collapse: collapse; width: 100%; }}
    th, td {{ border: 1px solid #ddd; padding: 8px; vertical-align: top; }}
    th {{ background: #f3f3f3; }}
    </style></head><body>
    <h1>Relatório AgentOps</h1>
    <p><b>Média:</b> {avg:.1f} | <b>Cenários:</b> {len(results)}</p>
    <h2>Top 5 problemas recorrentes</h2><ol>{top5_html}</ol>
    <h2>Ações recomendadas</h2><ol>{rec_html}</ol>
    <h2>Detalhamento por cenário</h2>
    <table>
    <tr><th>ID</th><th>Nicho</th><th>Suite</th><th>Score</th><th>Flags</th><th>Expected</th><th>Observed</th></tr>
    {rows_html}
    </table>
    </body></html>
    """
    path.write_text(html, encoding="utf-8")
