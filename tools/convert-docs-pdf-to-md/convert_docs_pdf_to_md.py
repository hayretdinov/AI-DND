from __future__ import annotations

import argparse
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Iterable

import pdfplumber


@dataclass
class ConversionResult:
    pdf_path: Path
    md_path: Path
    ok: bool
    pages: int = 0
    chars: int = 0
    error: str = ""


def normalize_text(text: str) -> str:
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    lines = [line.rstrip() for line in text.split("\n")]

    cleaned: list[str] = []
    blank_seen = False
    for line in lines:
        if line.strip():
            cleaned.append(line)
            blank_seen = False
        elif not blank_seen:
            cleaned.append("")
            blank_seen = True

    return "\n".join(cleaned).strip()


def extract_pdf_pages(pdf_path: Path) -> list[str]:
    pages_text: list[str] = []
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            text = page.extract_text(layout=True, x_tolerance=1, y_tolerance=3) or ""
            pages_text.append(normalize_text(text))
    return pages_text


def markdown_for_pdf(pdf_path: Path, pages: Iterable[str]) -> str:
    parts = [f"# {pdf_path.stem}", ""]

    for index, page_text in enumerate(pages, start=1):
        if index > 1:
            parts.extend(["", f"<!-- Page {index} -->", ""])
        if page_text:
            parts.append(page_text)
        else:
            parts.append(f"<!-- Page {index}: no extractable text -->")

    return "\n".join(parts).rstrip() + "\n"


def convert_pdf(pdf_path: Path) -> ConversionResult:
    md_path = pdf_path.with_suffix(".md")

    try:
        pages = extract_pdf_pages(pdf_path)
        content = markdown_for_pdf(pdf_path, pages)
        chars = sum(len(page) for page in pages)

        if chars == 0:
            raise ValueError("No extractable text was found in the PDF.")

        md_path.write_text(content, encoding="utf-8")
        return ConversionResult(
            pdf_path=pdf_path,
            md_path=md_path,
            ok=True,
            pages=len(pages),
            chars=chars,
        )
    except Exception as exc:
        return ConversionResult(
            pdf_path=pdf_path,
            md_path=md_path,
            ok=False,
            error=f"{type(exc).__name__}: {exc}",
        )


def write_report(docs_dir: Path, results: list[ConversionResult], command: str) -> None:
    report_path = docs_dir / "PDF_CONVERSION_REPORT.md"
    successful = [result for result in results if result.ok]
    failed = [result for result in results if not result.ok]

    lines = [
        "# PDF Conversion Report",
        "",
        f"Generated: {datetime.now().isoformat(timespec='seconds')}",
        "",
        "## Successfully converted files",
        "",
    ]

    if successful:
        for result in successful:
            pdf_rel = result.pdf_path.relative_to(docs_dir.parent).as_posix()
            md_rel = result.md_path.relative_to(docs_dir.parent).as_posix()
            lines.append(
                f"- `{pdf_rel}` -> `{md_rel}` ({result.pages} pages, {result.chars} characters)"
            )
    else:
        lines.append("- None")

    lines.extend(["", "## Files with errors", ""])

    if failed:
        for result in failed:
            pdf_rel = result.pdf_path.relative_to(docs_dir.parent).as_posix()
            lines.append(f"- `{pdf_rel}`: {result.error}")
    else:
        lines.append("- None")

    lines.extend(["", "## Repeat conversion command", "", "```powershell", command, "```", ""])

    report_path.write_text("\n".join(lines), encoding="utf-8")


def find_pdfs(docs_dir: Path) -> list[Path]:
    return sorted(docs_dir.rglob("*.pdf"), key=lambda path: path.as_posix().lower())


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Convert PDF files under docs/ to adjacent Markdown files."
    )
    parser.add_argument(
        "--docs-dir",
        default="docs",
        help="Documentation directory to scan recursively. Default: docs",
    )
    args = parser.parse_args()

    repo_root = Path.cwd()
    docs_dir = (repo_root / args.docs_dir).resolve()
    if not docs_dir.exists():
        raise SystemExit(f"Docs directory does not exist: {docs_dir}")

    results = [convert_pdf(pdf_path) for pdf_path in find_pdfs(docs_dir)]
    command = (
        "& 'C:\\Users\\hayre\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\python\\python.exe' "
        ".\\tools\\convert-docs-pdf-to-md\\convert_docs_pdf_to_md.py"
    )
    write_report(docs_dir, results, command)

    ok_count = sum(1 for result in results if result.ok)
    failed_count = len(results) - ok_count
    print(f"Converted: {ok_count}")
    print(f"Failed: {failed_count}")

    return 1 if failed_count else 0


if __name__ == "__main__":
    raise SystemExit(main())
