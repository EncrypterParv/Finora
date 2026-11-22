"""Ephemeral, user-confirmed statement extraction helpers."""

import csv
import io
import json
import tempfile
from dataclasses import dataclass
from html.parser import HTMLParser
from pathlib import Path
from typing import Any

from app.schemas.canonical_transaction import CanonicalTransactionCreate
from app.domain.statement_import.parser import StatementParser

MAX_FILE_BYTES = 15 * 1024 * 1024
MAX_PDF_PAGES = 20
MAX_TRANSACTIONS = 500
SUPPORTED_EXTENSIONS = {".csv", ".pdf", ".png", ".jpg", ".jpeg"}


class StatementReadError(ValueError):
    """A safe, user-displayable statement validation or extraction error."""


class OCRUnavailableError(RuntimeError):
    """The optional local OCR runtime is not installed or configured."""


class DocumentReaderUnavailableError(RuntimeError):
    """A format-specific document reader dependency is not installed."""


@dataclass
class StatementReadResult:
    records: list[CanonicalTransactionCreate]
    format: str
    needs_review: bool
    warnings: list[str]


class _TableHTMLParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.tables: list[list[list[str]]] = []
        self._table: list[list[str]] | None = None
        self._row: list[str] | None = None
        self._cell: list[str] | None = None

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag == "table":
            self._table = []
        elif tag == "tr" and self._table is not None:
            self._row = []
        elif tag in {"td", "th"} and self._row is not None:
            self._cell = []

    def handle_data(self, data: str) -> None:
        if self._cell is not None:
            self._cell.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag in {"td", "th"} and self._cell is not None and self._row is not None:
            self._row.append(" ".join("".join(self._cell).split()))
            self._cell = None
        elif tag == "tr" and self._row is not None and self._table is not None:
            self._table.append(self._row)
            self._row = None
        elif tag == "table" and self._table is not None:
            self.tables.append(self._table)
            self._table = None


def validate_statement_file(filename: str, content: bytes) -> str:
    """Validate filename, size, and basic file signature without storing it."""
    suffix = Path(filename).suffix.lower()
    if suffix not in SUPPORTED_EXTENSIONS:
        raise StatementReadError("Choose a CSV, PDF, PNG, or JPG statement.")
    if not content:
        raise StatementReadError("The selected file is empty.")
    if len(content) > MAX_FILE_BYTES:
        raise StatementReadError("Choose a statement smaller than 15 MB.")

    signatures = {
        ".pdf": content.startswith(b"%PDF-"),
        ".png": content.startswith(b"\x89PNG\r\n\x1a\n"),
        ".jpg": content.startswith(b"\xff\xd8\xff"),
        ".jpeg": content.startswith(b"\xff\xd8\xff"),
    }
    if suffix in signatures and not signatures[suffix]:
        raise StatementReadError("The file contents do not match the selected format.")
    return suffix


def read_statement(content: bytes, filename: str, account_id: str) -> StatementReadResult:
    """Extract candidate transactions. This function never writes to the DB."""
    suffix = validate_statement_file(filename, content)
    if suffix == ".csv":
        try:
            records = StatementParser.parse_csv(content, account_id)
        except (UnicodeError, csv.Error, ValueError) as exc:
            raise StatementReadError(str(exc)) from exc
        if len(records) > MAX_TRANSACTIONS:
            raise StatementReadError(
                "This statement contains more than 500 readable transactions. Split it into smaller files."
            )
        return StatementReadResult(
            records=records,
            format="csv",
            needs_review=True,
            warnings=(
                ["No transaction rows were found in this statement."]
                if not records
                else [
                    "Check dates, debit or credit direction, and amounts before saving. CSV column mapping depends on the bank's export format."
                ]
            ),
        )

    if suffix == ".pdf":
        try:
            from pypdf import PdfReader

            reader = PdfReader(io.BytesIO(content), strict=True)
            if reader.is_encrypted:
                raise StatementReadError("Remove the PDF password before importing it.")
            if len(reader.pages) > MAX_PDF_PAGES:
                raise StatementReadError("Choose a PDF with 20 pages or fewer.")
        except StatementReadError:
            raise
        except ImportError as exc:
            raise DocumentReaderUnavailableError(
                "PDF reading is not installed on this server yet."
            ) from exc
        except Exception as exc:
            raise StatementReadError("We could not open this PDF. Try exporting it again.") from exc
        format_name = "pdf"
    else:
        try:
            from PIL import Image, UnidentifiedImageError

            with Image.open(io.BytesIO(content)) as image:
                if image.width * image.height > 30_000_000:
                    raise StatementReadError("Choose an image with 30 megapixels or fewer.")
                image.verify()
        except StatementReadError:
            raise
        except ImportError as exc:
            raise DocumentReaderUnavailableError(
                "Image reading is not installed on this server yet."
            ) from exc
        except (UnidentifiedImageError, OSError) as exc:
            raise StatementReadError("We could not open this image. Try a clear PNG or JPG.") from exc
        format_name = "image"

    records = _read_with_local_ocr(content, suffix, account_id)
    if len(records) > MAX_TRANSACTIONS:
        raise StatementReadError(
            "This statement contains more than 500 readable transactions. Split it into smaller files."
        )
    return StatementReadResult(
        records=records,
        format=format_name,
        needs_review=True,
        warnings=(
            ["No transaction table was recognized. Try a clearer scan or CSV export."]
            if not records
            else ["Scanned rows can contain OCR mistakes. Check every date and amount before saving."]
        ),
    )


def _read_with_local_ocr(
    content: bytes, suffix: str, account_id: str
) -> list[CanonicalTransactionCreate]:
    try:
        from paddlex import create_pipeline
    except ImportError as exc:
        raise OCRUnavailableError(
            "Scanned statement reading is not installed on this server yet."
        ) from exc

    pipeline = _get_ocr_pipeline(create_pipeline)
    temporary_path: str | None = None
    try:
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as temporary_file:
            temporary_file.write(content)
            temporary_path = temporary_file.name

        predictions = pipeline.predict(
            input=temporary_path,
            use_doc_orientation_classify=True,
            use_doc_unwarping=True,
            use_textline_orientation=True,
        )
        records: list[CanonicalTransactionCreate] = []
        for page in predictions:
            result = page.json
            if callable(result):
                result = result()
            if isinstance(result, str):
                result = json.loads(result)
            for table in result.get("table_res_list", []):
                table_html = table.get("pred_html", "")
                parser = _TableHTMLParser()
                parser.feed(table_html)
                for rows in parser.tables:
                    if len(rows) < 2:
                        continue
                    csv_buffer = io.StringIO()
                    csv.writer(csv_buffer).writerows(rows)
                    records.extend(
                        StatementParser.parse_csv(
                            csv_buffer.getvalue().encode("utf-8"), account_id
                        )
                    )
        return records
    except StatementReadError:
        raise
    except Exception as exc:
        # Avoid propagating vendor/model internals, which may contain file paths.
        raise StatementReadError(
            "We could not read a transaction table from this file. Try another scan or a CSV export."
        ) from exc
    finally:
        if temporary_path:
            Path(temporary_path).unlink(missing_ok=True)


_OCR_PIPELINE: Any = None


def _get_ocr_pipeline(create_pipeline: Any) -> Any:
    global _OCR_PIPELINE
    if _OCR_PIPELINE is None:
        _OCR_PIPELINE = create_pipeline(pipeline="PP-StructureV3", device="cpu")
    return _OCR_PIPELINE
