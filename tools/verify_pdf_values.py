"""Cek setiap angka di dataset muncul di halaman PDF yang dirujuk.

Pemakaian:
  node scripts/build-data.mjs                      # menulis data/observations-all-versions.json
  python -I tools/verify_pdf_values.py <folder-pdf> data/observations-all-versions.json

Folder PDF berisi 2020.pdf ... 2025.pdf yang diunduh dari indeks laporan resmi.
Skrip juga mencocokkan SHA-256 file dengan nilai di dataset.
Butuh PyMuPDF (pip install pymupdf).
"""
import hashlib
import json
import pathlib
import re
import sys

import pymupdf


def id_format(value):
    """Format angka gaya Indonesia: 29343.58 -> '29.343,58'; integer -> '2.843.661'."""
    text = f"{round(value, 4):.4f}".rstrip("0").rstrip(".")
    whole, _, frac = text.partition(".")
    whole = f"{int(whole):,}".replace(",", ".")
    return whole + ("," + frac if frac else "")


def candidates(value, unit):
    base = id_format(value)
    out = {base}
    if "," in base:
        # 0.83 vs 0,83 ; 1100.31 vs 1.100,31 ; also padded decimals (20,59 vs 20,590)
        out.add(base + "0")
    else:
        out.add(base + ",00")
    if unit == "%":
        out = {c + "%" for c in out} | {c + " %" for c in out}
    return out


def normalise(text):
    return re.sub(r"[   ]+", " ", text)


def main(pdf_dir, obs_path):
    pdf_dir = pathlib.Path(pdf_dir)
    data = json.loads(pathlib.Path(obs_path).read_text(encoding="utf-8"))
    docs, failures, checked = {}, [], 0

    for year, meta in data["reports"].items():
        path = pdf_dir / f"{year}.pdf"
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        if digest != meta["sha256"]:
            failures.append(f"{year}: SHA-256 berbeda ({digest})")
        docs[int(year)] = pymupdf.open(path)

    for row in data["observations"]:
        if row["value"] is None or row["report"] is None:
            continue
        if row["value"] == 0 and row["use"] == "conflicting":
            # Nol pada tabel pengurangan emisi; cek keberadaan halaman saja.
            continue
        doc = docs[row["report"]]
        text = normalise(doc[row["pdfPage"] - 1].get_text())
        found = any(c in text for c in candidates(row["value"], row["unit"]))
        checked += 1
        if not found:
            failures.append(f"{row['indicator']} {row['year']} = {id_format(row['value'])} tidak ditemukan di laporan {row['report']} PDF hlm. {row['pdfPage']}")
        # Pastikan halaman cetak = PDF - 2 (nomor halaman tercetak muncul di teks halaman).
        if not re.search(rf"(^|\n)\s*{row['page']}\s*(\n|$)", text):
            failures.append(f"{row['indicator']} {row['year']}: nomor halaman cetak {row['page']} tidak terlihat di PDF hlm. {row['pdfPage']}")

    print(f"Diperiksa: {checked} angka, {len(failures)} masalah")
    for f in failures:
        print(" -", f)
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1], sys.argv[2]))
