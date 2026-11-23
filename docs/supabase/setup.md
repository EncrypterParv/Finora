# Finora Supabase setup

This repository uses Supabase Auth for identities, Supabase Postgres for the
existing FastAPI data model, and FastAPI as the application API boundary.
Sign-in is implemented and the Postgres schema is applied. The authenticated
workspace loads user-owned account and transaction records through FastAPI.
Statement previews are transient; only rows the user confirms are persisted.

## Current project status

The Finora Supabase project is created. The Auth site URL and callback URLs are
configured, the local frontend/backend env files contain the project settings,
and the backend Session pooler connection is configured in ignored
`backend/.env`. The initial migration has been applied with the Supabase CLI;
the ten expected tables, their RLS flags, and the migration-history entry were
verified. Email confirmation is required by the app. The checked-in local
Supabase config enables confirmation and uses a six-digit OTP template; the
hosted project still needs its Confirm signup template and custom SMTP
configured, then a real sign-up and recovery flow checked.

The hosted Auth dashboard was reviewed on 2026-11-23: **Confirm sign up** is
enabled, custom SMTP is not configured, and an existing user is still awaiting
email verification. Do not create repeated test users or repeatedly request
emails until the sender is configured and the current Auth rate limit has
cleared.

The configured pooler hostname contains `ap-northeast-1` (Tokyo), while the
product context currently describes India as the primary audience. Confirm the
region in Supabase **Project Settings → General** before accepting real users.
Supabase projects are region-bound; moving later means creating a project in
the desired region and migrating it. See [available regions](https://supabase.com/docs/guides/platform/regions)
and [Supabase's region-change guidance](https://supabase.com/kb/troubleshooting/change-project-region-eWJo5Z).

## Create the project from the dashboard

1. Keep the **Postgres** option selected. Do not select the OrioleDB beta.
2. Name the project **Finora**.
3. Choose a strong, unique database password and save it in a password manager.
   This is the Postgres password, not a user's Supabase Auth password.
4. Select a specific region close to the intended users. For a primarily India
   audience, choose **South Asia (Mumbai)** if available. Supabase binds a
   project to its selected region; moving it later requires a new project and a
   data migration.
5. Keep **Enable Data API** on. Turn off **Grant API access to new tables
   automatically**. Turn on **Enable RLS on new tables automatically**.
   Migrations also explicitly enable RLS and grant the backend role only the
   permissions it needs.
6. The GitHub connection is optional. Skip automatic schema deployment for now;
   this repository's checked-in `supabase/migrations` plus the Supabase CLI are
   the schema source of truth. This avoids two independent deployment paths.
7. Create the project and wait until its database reports ready.

## Configure Auth

1. In the project dashboard, open **Authentication → URL Configuration**.
2. Set the hosted project's Site URL to `https://finora-sem3.vercel.app` for
   production. Keep localhost URLs in the redirect allowlist for local
   development; do not set the hosted project's default Site URL to localhost.
3. Add these redirect URLs:
   - `http://localhost:3000/auth/callback`
   - `http://127.0.0.1:3000/auth/callback`
4. In **Authentication → Providers → Email**, leave Email enabled and keep
   **Confirm email** on. Users must prove they control the address before they
   can sign in.
5. Open **Authentication → Email Templates → Confirm signup**. Finora supports
   both verification methods:

   - **Code entry:** use an OTP body containing `{{ .Token }}` and keep the
     signup screen's six-digit entry flow. A link-only template does not
     provide a code for that form.
   - **Confirmation link:** use `{{ .ConfirmationURL }}`. Supabase verifies
     the link, redirects to Finora's `/auth/callback`, and the server exchanges
     the returned PKCE `code` with Supabase before opening the workspace.

   The local Supabase template uses the code-entry method. For that method, a
   sample body is:

   ```html
   <h2>Confirm your Finora account</h2>
   <p>Enter this one-time code in Finora to confirm your email address:</p>
   <p style="font-size: 28px; font-weight: 700; letter-spacing: 8px;">{{ .Token }}</p>
   <p>This code expires in one hour. If you did not request an account, ignore this email.</p>
   <p>Finora will never ask you to share your bank password or this code.</p>
   ```

   The app accepts six digits.
6. Set up a transactional email provider. **Resend** is the recommended
   low-friction choice for this project; it provides SMTP credentials, so no
   mail-sending code or Nodemailer server is needed. Create a Resend account,
   add a domain you control, publish the SPF/DKIM DNS records Resend provides,
   and wait for the domain to show as verified. A personal mailbox address is
   not a substitute for verifying a sending domain.
7. In Resend, create an API key for SMTP use. In Supabase, open **Auth → SMTP
   Settings** (or **Project Settings → Authentication → SMTP Settings**),
   enable custom SMTP, and enter:

   | Supabase field | Resend value |
   | --- | --- |
   | Sender email | An address on the verified domain, e.g. `auth@your-domain` |
   | Sender name | `Finora` |
   | Host | `smtp.resend.com` |
   | Port | `465` (SSL) |
   | Username | `resend` |
   | Password | The Resend API key |

   Keep the Resend key in Supabase's SMTP password field only. Do not put it
   in `frontend/.env.local`, Vercel environment variables, chat, or Git. The
   Supabase built-in sender is restricted to project team addresses and has a
   very low, changeable sending limit; it is not suitable for normal signup.
8. Add the deployed site's exact `/auth/callback` URL to the redirect allowlist
   before testing hosted confirmation or password recovery. Keep the two local
   callback URLs above for local development.
9. Test once with an inbox you control. The login screen has **Need a
   verification email?** for an existing unconfirmed account; after requesting
   a code, enter it on that screen. Alternatively, click the confirmation link
   in the email and let Supabase complete the server callback. Do not retry
   repeatedly if a rate-limit error appears; inspect the safe code/status shown
   under **Technical details to share** and the Supabase Auth logs.

## Copy project values into local environment files

1. In **Project Settings → API Keys** (or the API section shown in **Connect**),
   copy the Project URL and the **publishable** key (`sb_publishable_...`).
2. Put them in `frontend/.env.local`:

   ```dotenv
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   ```

3. In the dashboard's **Connect** dialog, copy the **Session pooler** string
   for this local FastAPI setup (it works when the local network is IPv4-only).
   Use the exact hostname and username displayed there; pooler values cannot
   safely be guessed from the project region or ref. Replace the password with
   the database password from project creation and URL-encode reserved
   characters. Put the resulting `postgresql+asyncpg://...` URL in
   `backend/.env`, alongside:

   ```dotenv
   AUTH_PROVIDER=supabase
   SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   ```

   The backend's `.env` is local and ignored by Git. Never put the database
   password or any Supabase secret/service-role key in the frontend or commit
   them. The browser only needs the project URL and publishable key.

## Apply the schema migration

Install the Supabase CLI if needed. On macOS:

```bash
brew install supabase/tap/supabase
```

Then, from the repository root:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push --remote
```

`db push` applies the checked-in migration at
`supabase/migrations/20261121220000_initial_finora_schema.sql`. It creates the
profile mirror, categories, merchants, accounts, canonical transactions,
budgets, goals, milestones, and the existing ML profile storage shape. It does
not change or implement the insights engine. The migration creates a restricted
`finora_app` role and owner-scoped RLS policies; FastAPI switches to that role
and supplies the verified Auth user ID inside each Postgres transaction.

## Run and verify locally

Open two terminals:

```bash
cd frontend
npm run dev -- --hostname 127.0.0.1
```

```bash
cd backend
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Visit `http://127.0.0.1:3000/login`, create an account, enter the emailed
six-digit code, and confirm the app opens the workspace with an account-created
message. The login screen offers a rate-limited resend action and a way to
correct the email address. For local Supabase, run `supabase start`; Auth emails
are captured by the local Mailpit UI printed by the CLI. In the hosted dashboard,
verify the confirmed user under **Authentication → Users** and the matching
profile under **Table Editor → users**. The workspace remains empty until the
user creates an account label and imports transactions. CSV preview performs no
writes; only reviewed rows submitted through the confirm action are saved to
that user's Postgres records.

Email delivery is an external project setup item, not something the frontend
can provide. Password recovery also depends on working SMTP. Do not mark signup
end-to-end verified until both confirmation and recovery emails arrive and the
full flows have been exercised.

PDF, PNG, and JPG extraction requires the optional, self-hosted PaddleX runtime.
Use Python 3.13 and install it from the backend directory with:

```bash
pip install -r requirements-ocr.txt
```

The OCR runtime has not been installed or accuracy-tested in this workspace.
Keep the review step mandatory and test representative layouts using synthetic
statements before enabling those formats for real users. CSV mapping is also
not guaranteed error-free; users must review dates, amounts, and debit/credit
direction before confirming.

## Schema notes and boundaries

- `auth.users` is the identity and password store. `public.users` is a
  synchronized application profile row; the trigger never copies passwords.
- The `finora_app` Postgres role is deliberately separate from the Supabase
  Data API `anon` and `authenticated` roles. User-owned rows are constrained by
  RLS using the request's verified `auth.uid()`.
- Categories and merchants are shared reference data, read-only to the app
  role. They should be managed through migrations or a controlled seed process.
- The financial calendar is derived from transactions; no separate calendar
  table is needed yet.
- Persistent source-file storage, billing, teams, and trained ML are not
  included. Statement previews process files in memory or temporary local files
  that are deleted after extraction.
- The local SQLite/demo seed remains available while `AUTH_PROVIDER=local`.
  Hosted Supabase mode never runs `create_all()` or the demo seeder.
