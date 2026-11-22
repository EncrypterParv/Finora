# First-user financial data workflow

Status: first implementation is in place. CSV preview and confirmed import are
covered by backend tests. PDF and image extraction require the optional OCR
runtime and have not yet been installed or benchmarked in this workspace. The
Vercel Hobby deployment caps uploads at 4 MB and does not include OCR.

## Product decision

A newly registered user must not see invented balances, transactions, or
personalized insights in the authenticated workspace. The public landing page
may use clearly labeled examples. The signed-in workspace reflects only that
user's actual records.

Use a persistent, non-blocking first-use screen rather than an unexpected
modal. Explain what is needed, what Finora will do with the file, what is not
requested (bank password or full account number), and when records are saved.

## First-use journey

1. **Welcome / no account:** explain that no financial records have been added.
   Primary action: **Add a bank statement**. Link to privacy and supported
   formats beside the action.
2. **Choose or add account:** reuse an account owned by the signed-in user or
   create a label using institution, account type, and optional last four
   digits. Never ask for online banking credentials or the full account number.
3. **Select statement:** accept CSV, PDF, PNG, and JPG/JPEG, with size/page
   limits and clear privacy copy. The current Vercel deployment accepts files
   up to 4 MB; the default Vercel backend only supports CSV because its optional
   OCR runtime is not installed. The selected original is transient and is
   discarded after processing; it is not stored in Supabase Storage.
4. **Extract and review:** show the source document next to normalized rows.
   Allow edits to date, description, debit/credit, amount, and category. Flag
   uncertain extraction and require the user to resolve or exclude it.
5. **Confirm import:** make no database writes during preview. On explicit
   confirmation, save validated canonical transactions under the authenticated
   user and selected account. Deduplicate within that account and report counts.
6. **After import:** show real transaction history. Do not show a balance unless
   it came from a statement balance. Do not show insights until sufficient real
   history exists and the insight calculation is connected to that history.

## Format handling

| Format | Extraction approach | Trust boundary |
|---|---|---|
| CSV | Header/column mapping for date, description, and debit/credit columns or an explicit transaction type; amount-only files are rejected | Review all rows because bank layouts and debit/credit conventions vary |
| PDF | Validate structure and run local PaddleX PP-StructureV3 layout and table recognition | OCR is a draft; compare with the original and require confirmation |
| PNG/JPG | Validate dimensions and run local PaddleX PP-StructureV3 layout and table recognition with orientation handling | OCR is a draft; compare with the original and require confirmation |

Do not use plain OCR text as if it were a table. Tesseract documentation
specifically warns that table segmentation needs additional layout handling.
The candidate self-hosted route is PaddleX PP-Structure table recognition,
which combines document layout analysis, OCR, and table recognition. Its own
documentation describes failure modes in table layout and text recognition;
human review remains mandatory. See [PaddleX PP-StructureV3](https://paddlepaddle.github.io/PaddleX/latest/en/pipeline_usage/tutorials/ocr_pipelines/PP-StructureV3.html)
and [Tesseract's quality notes](https://tesseract-ocr.github.io/tessdoc/ImproveQuality.html).

OCR decision: use self-hosted PaddleX PP-StructureV3 for PDFs and images. It
performs layout detection, text recognition, and table structure
recognition without sending statement contents to a managed OCR vendor. Pin the
backend OCR runtime to Python 3.13 because current PaddleX documentation lists
support through Python 3.13, while this workspace currently runs Python 3.14.
Do not claim high accuracy from the model name: its default models are not
trained specifically on Indian bank statements, and PaddleX documents layout
and recognition failure cases. Benchmark every supported bank/layout with
synthetic or explicitly consented and anonymized documents before broadening
support. Use an English/numeric-oriented recognition configuration where
appropriate, then require user review regardless of confidence.

## Data and security requirements

- Uploads are authenticated and scoped to the signed-in user. Preview endpoints
  never persist accounts, transactions, or source files.
- Enforce file type by content as well as extension; reject malformed files,
  oversized uploads, too many pages, encrypted PDFs, and unsupported variants
  with specific but safe messages.
- Do not log filenames, file contents, account numbers, descriptions, OCR text,
  or transaction values. Keep source files in memory or isolated temporary
  storage and remove them on success, failure, and timeout.
- Validate positive amounts, dates, debit/credit direction, currency, required
  descriptions, row limits, and account ownership on the server. Do not trust
  client-edited preview values without server-side validation.
- Persist only after an explicit user confirmation. Use transaction-scoped
  ownership, idempotent deduplication, and rollback on partial failures.
- Provide a clear empty result when a valid statement contains no transactions.
  Never inject sample rows to make the workspace look populated.

## Implementation slices

1. Replace the authenticated sample dashboard with user-scoped account and
   transaction loading plus honest loading, error, no-account, and no-activity
   states.
2. Add account list/create APIs that accept only institution label, type, and
   optional last four digits.
3. Separate statement preview from import confirmation. Keep preview
   non-persistent and reuse canonical transaction validation and deduplication
   during confirmed import.
4. The first implementation now supports editable CSV preview rows and explicit
   confirmation. It enforces account ownership, duplicate checks, file limits,
   and no persistence during preview. Manual review is required for CSV too.
5. PDF/PNG/JPG extraction uses an optional self-hosted PaddleX adapter. The OCR
   runtime is not in the default dependency set, and its behavior has not been
   validated in this workspace. Install it only on Python 3.13, then benchmark
   representative layouts with synthetic fixtures.
6. The authenticated workspace reads persisted accounts and transactions and
   has first-use/no-transactions states. Calendar, insights, profile, and roles
   remain outside this real-data workflow.

## Acceptance criteria

- A new user sees no generated transactions, balance, or personal score.
- A valid zero-row statement creates no transaction and shows a useful empty
  state; it does not report success with fabricated records.
- A user can inspect and correct every extracted record before saving.
- Cancel, parse error, OCR failure, and timeout leave no financial rows behind.
- A confirmed import persists only to the authenticated user's selected
  account, and re-importing the same statement does not duplicate transactions.
- CSV parsing and review/import API behavior have synthetic test coverage.
  PDF, PNG, and JPG extraction still need installed-runtime tests and OCR
  accuracy benchmarking before production claims or user onboarding.
