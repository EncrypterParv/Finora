"""Statement parsers for CSV, XLSX, and text payloads."""

import csv
import io
import re
from datetime import timezone
from decimal import Decimal
from typing import List
from dateutil import parser as date_parser
from app.domain.statement_import.normalizer import resolve_merchant_and_category
from app.schemas.canonical_transaction import (
    CanonicalTransactionCreate,
    TransactionSource,
    TransactionType,
)


class StatementParser:
    """Parses varied bank statement files into CanonicalTransactionCreate streams."""

    @classmethod
    def parse_csv(cls, file_content: bytes, account_id: str) -> List[CanonicalTransactionCreate]:
        """Parse raw CSV byte stream into canonical transactions."""
        text = file_content.decode("utf-8-sig")
        csv_file = io.StringIO(text)
        
        # Detect delimiter
        sample = text[:2048]
        try:
            dialect = csv.Sniffer().sniff(sample)
            delimiter = dialect.delimiter
        except Exception:
            delimiter = ","

        reader = csv.reader(csv_file, delimiter=delimiter)
        rows = list(reader)
        if not rows:
            return []

        header_idx = -1
        col_map = {}

        # Scan for header row
        for i, row in enumerate(rows[:10]):
            lower_row = [c.strip().lower() for c in row]
            if any("date" in c for c in lower_row) and (
                any("desc" in c or "narration" in c or "particulars" in c or "remarks" in c for c in lower_row)
            ):
                header_idx = i
                for j, col in enumerate(lower_row):
                    if "date" in col and "val" not in col:
                        col_map["date"] = j
                    elif any(k in col for k in ("desc", "narration", "particulars", "remarks")):
                        col_map["desc"] = j
                    elif any(k in col for k in ("dr/cr", "cr/dr", "debit/credit")):
                        col_map["type"] = j
                    elif col in {"dr", "debit", "withdrawal", "withdrawals"} or any(
                        k in col for k in ("debit", "withdrawal")
                    ):
                        col_map["debit"] = j
                    elif col in {"cr", "credit", "deposit", "deposits"} or any(
                        k in col for k in ("credit", "deposit")
                    ):
                        col_map["credit"] = j
                    elif "amount" in col:
                        col_map["amount"] = j
                    elif any(k in col for k in ("type", "dr/cr", "cr/dr", "debit/credit")):
                        col_map["type"] = j
                    elif "ref" in col or "chq" in col or "txn" in col:
                        col_map["ref"] = j
                    elif "balance" in col:
                        col_map["balance"] = j
                break

        if header_idx == -1 or "date" not in col_map or "desc" not in col_map:
            raise ValueError(
                "We could not identify date and description columns. Try a bank CSV export."
            )
        if not ({"amount", "debit", "credit"} & col_map.keys()):
            raise ValueError(
                "We could not identify an amount column in this statement."
            )
        if "amount" in col_map and not ({"debit", "credit", "type"} & col_map.keys()):
            raise ValueError(
                "This CSV has an amount column but no debit/credit direction. Export separate debit and credit columns or include a transaction type column."
            )

        canonical_records: List[CanonicalTransactionCreate] = []
        for row_num, row in enumerate(rows[header_idx + 1:], start=header_idx + 1):
            if not row or len(row) <= max(col_map.values()):
                continue

            try:
                date_str = row[col_map["date"]].strip()
                if not date_str:
                    continue
                occurred_at = date_parser.parse(date_str)
                if occurred_at.tzinfo is None:
                    occurred_at = occurred_at.replace(tzinfo=timezone.utc)

                desc = row[col_map["desc"]].strip()
                if not desc:
                    continue
                
                # Determine amount and type
                amount = Decimal("0.00")
                tx_type = TransactionType.DEBIT

                if "debit" in col_map and "credit" in col_map:
                    dr_str = cls._clean_num(row[col_map["debit"]])
                    cr_str = cls._clean_num(row[col_map["credit"]])
                    debit_value = Decimal(dr_str)
                    credit_value = Decimal(cr_str)
                    if debit_value > 0 and credit_value > 0:
                        raise ValueError("Both debit and credit columns contain an amount")
                    if debit_value > 0:
                        amount = debit_value
                        tx_type = TransactionType.DEBIT
                    elif credit_value > 0:
                        amount = credit_value
                        tx_type = TransactionType.CREDIT
                elif "amount" in col_map:
                    if not row[col_map["amount"]].strip():
                        raise ValueError("Transaction amount is missing")
                    raw_amt_str = cls._clean_num(row[col_map["amount"]])
                    if raw_amt_str:
                        raw_val = Decimal(raw_amt_str)
                        amount = abs(raw_val)
                        if "type" not in col_map:
                            tx_type = TransactionType.DEBIT
                        else:
                            raw_type = row[col_map["type"]].strip().lower()
                            if any(word in raw_type for word in ("credit", "cr", "deposit", "refund")):
                                tx_type = TransactionType.CREDIT
                            elif any(word in raw_type for word in ("debit", "dr", "withdraw", "payment")):
                                tx_type = TransactionType.DEBIT
                            elif "transfer" in raw_type:
                                tx_type = TransactionType.TRANSFER
                            else:
                                raise ValueError("Transaction direction is missing or unclear")

                if amount <= 0:
                    raise ValueError("Transaction amount must be positive")

                ref_id = row[col_map["ref"]].strip() if "ref" in col_map else f"CSV-R{row_num}"
                balance = Decimal(cls._clean_num(row[col_map["balance"]])) if "balance" in col_map and cls._clean_num(row[col_map["balance"]]) else None

                merchant, category = resolve_merchant_and_category(desc)
                if tx_type == TransactionType.CREDIT and ("SALARY" in desc.upper() or "REFUND" not in desc.upper()):
                    category = "Income"

                canonical_records.append(
                    CanonicalTransactionCreate(
                        account_id=account_id,
                        occurred_at=occurred_at,
                        amount=amount,
                        currency="INR",
                        transaction_type=tx_type,
                        raw_description=desc,
                        merchant_name=merchant,
                        category_name=category,
                        balance_after=balance,
                        reference_id=ref_id or f"CSV-{row_num}",
                        source=TransactionSource.CSV,
                    )
                )
            except Exception as exc:
                raise ValueError(
                    f"We could not interpret a transaction row near CSV line {row_num + 1}. Check the file or export it again."
                ) from exc

        return canonical_records

    @staticmethod
    def _clean_num(val_str: str) -> str:
        """Strip currency symbols, commas, and spaces."""
        cleaned = re.sub(r"[^\d.-]", "", val_str)
        return cleaned if cleaned else "0.00"
