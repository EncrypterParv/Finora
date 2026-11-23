# Deploy Finora to Vercel

Finora is a monorepo with a Next.js frontend in `frontend/` and a FastAPI API
in `backend/`. The root [`vercel.json`](../../vercel.json) configures both as
Vercel Services and sends `/api/v1/*` and `/health` to FastAPI. Other paths go
to Next.js.

Vercel Services are currently a beta feature. If the Vercel import screen does
not offer Services for this account, create two Vercel projects from the same
repository instead: set one project's Root Directory to `frontend`, the
other's to `backend`, and configure a public backend URL for the frontend.
That alternative needs separate deployment wiring and is not configured here.

## Import the repository

1. Push the Vercel configuration to the branch you want to deploy. Select the
   branch that contains this configuration; use the fork's `main` branch for
   the judge demo once the changes are on `main`.
2. In Vercel, import `TarunyaProgrammer/FinSOL2` and select **Import
   multi-service project**. Do not import only the `frontend` or `backend`
   service.
3. Keep the repository root directory as `./` and the application preset as
   **Services**. The checked-in `vercel.json` should be detected automatically.
4. Leave the build, install, and output settings at their auto-detected values.
   The frontend uses `npm run build`; the backend uses dependencies declared in
   `backend/pyproject.toml` and the Python 3.13 pin in
   `backend/.python-version`.

## Configure environment variables

Add these in the Vercel project's **Settings → Environment Variables**. For
the first judge deployment, select **Production** only. The app writes account
and transaction data to Supabase; do not point Preview deployments at the same
database unless you are comfortable with preview signups and imports appearing
in that project. Add separate Preview values when a staging Supabase project
is available.

Set each key and value as its own entry. Do not import the local `.env` files:
they are for localhost, and `backend/.env` contains a database password.

| Key | Value | Sensitive? |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `/api/v1` | No |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase **Project URL** | No |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key (`sb_publishable_...`) | No |
| `AUTH_PROVIDER` | `supabase` | No |
| `ENVIRONMENT` | `production` | No |
| `DEBUG` | `false` | No |
| `SUPABASE_URL` | Same Supabase **Project URL** | No |
| `SUPABASE_PUBLISHABLE_KEY` | Same Supabase publishable key | No |
| `DATABASE_URL` | Session Pooler URL in SQLAlchemy asyncpg form; template below | **Yes** |
| `SECRET_KEY` | A unique random value; generate with `openssl rand -hex 32` | **Yes** |

Use the **Session pooler** details from Supabase → Connect. Keep its host,
username, port, and database exactly as Supabase provides them. Encode reserved
characters in the database password. The format expected by this backend is:

```text
postgresql+asyncpg://<pooler-username>:<URL-encoded-password>@<pooler-host>:5432/postgres?ssl=require
```

Do not use a Supabase `service_role` or secret key: this app does not require
one. The frontend only gets the URL and publishable key. The database URL and
`SECRET_KEY` must not use a `NEXT_PUBLIC_` name.

Vercel applies environment-variable changes only to new deployments. After
saving the variables, redeploy the project.

## Finish Supabase Auth setup

After Vercel assigns the production domain, open Supabase → **Authentication →
URL Configuration**:

1. Set **Site URL** to the deployed origin, for example
   `https://finsol2.vercel.app`.
2. Add `https://finsol2.vercel.app/auth/callback` to **Redirect URLs**.
3. If Vercel gives the project a different domain, use that exact domain. Add
   each preview domain explicitly before testing Auth on a preview deployment.

The callback route is `/auth/callback` for password recovery. Email
confirmation is intended to be off for the current demo; signup should establish
a session directly. Password reset still depends on working email delivery.

## Verify the judge deployment

- `/` renders the public Finora landing page.
- `/health` returns the FastAPI health response.
- `/api/v1/docs` opens the API docs.
- Create a test account, sign in, create an account label, and preview a small
  CSV. Confirm that importing saves only the rows explicitly reviewed.
- Check Vercel Function logs and Supabase Auth/database logs if a request fails.

## Deployment limits to state accurately

- The standard Vercel Function request-body limit is 4.5 MB. Vercel has a
  separate 20 MiB public beta that requires 4 GB Performance memory; this repo
  does not opt into it. Finora caps uploads at 4 MB so multipart overhead stays
  under the standard limit. Larger uploads need a direct-to-storage flow.
- The default backend requirements do not install PaddleX/PaddlePaddle. The
  current Vercel deployment can parse CSV; scanned PDF, PNG, and JPG extraction
  returns an unavailable message until a separately benchmarked OCR runtime is
  deployed. Do not present scanned import as working in this Vercel build.
- Vercel Services are beta. The Python runtime is generally available. A
  successful build does not prove the hosted Supabase email, database, or
  import flow; verify those on the deployed domain.
