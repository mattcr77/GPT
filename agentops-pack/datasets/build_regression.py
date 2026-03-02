import argparse
import csv
import json
import re
from datetime import date
from pathlib import Path

PHONE_RE = re.compile(r"(\+?\d{2,3}\s?)?(\(?\d{2}\)?\s?)?\d{4,5}-?\d{4}")
NAME_TAG_RE = re.compile(r"\[nome:[^\]]+\]", re.IGNORECASE)


def anonymize(text: str) -> str:
    text = PHONE_RE.sub("[telefone_removido]", text or "")
    text = NAME_TAG_RE.sub("[nome_removido]", text)
    return text


def from_csv(path: Path):
    rows = []
    with path.open(encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for r in reader:
            rows.append({k: anonymize(v) for k, v in r.items()})
    return rows


def from_json(path: Path):
    data = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(data, dict):
        data = [data]
    out = []
    for item in data:
        out.append({k: anonymize(str(v)) for k, v in item.items()})
    return out


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--input", required=True)
    args = p.parse_args()

    path = Path(args.input)
    rows = from_csv(path) if path.suffix.lower() == ".csv" else from_json(path)

    out = Path(__file__).resolve().parent / f"regression_{date.today().isoformat()}.json"
    out.write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8")
    print(out)


if __name__ == "__main__":
    main()
