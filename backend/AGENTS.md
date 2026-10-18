# Backend agent instructions

- Keep HTTP concerns in `app/api`, validation types in `app/schemas`, database
  models in `app/db/models`, and reusable business logic in `app/domain`.
- Preserve async SQLAlchemy usage and dependency injection through `get_db`.
- Add or update focused tests under `backend/tests` for every behavior change.
- Use isolated test databases and deterministic demo data; never use real
  account numbers, credentials, or personal financial data.
- Schema changes require an explicit migration plan. Do not silently change
  persisted models only to make a test pass.
- API changes must consider tenant isolation, validation, error responses, and
  backward compatibility.

Run the suite with:

```bash
DEBUG=false python -m pytest -q
```
