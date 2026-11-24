# Public entry and account access

## Sub-features

- Public landing page and route to sign in.
- Sign in, account creation, password recovery, and reset-link entry screens.
- Signed-out notice and readable authentication errors.

## How to get to it (user POV)

Open `/`, choose the sign-in link, and use the links below the form to switch
between sign-in, account creation, and recovery. Open `/reset-password` to inspect
the reset-link state. A valid reset action requires a dedicated Supabase test
account and a fresh email link.

## Driving it with Playwright CLI

Visit each route directly. Locate form fields by their visible labels and
buttons by accessible names. In all three themes, verify the form remains a
light, readable panel, password visibility control is discernible, and the
navigation between sign-in/create/recovery works.

## Gotchas

The demo shell does not authenticate. A successful render of `/reset-password`
does not prove that a reset token is valid or that a password changed. Do not
use a production account or capture email tokens.
