# PSLE Oral Buddy — Invitation System (separate TEST site)

**This package does not update the live PSLE Oral Buddy site.** It is an early-stage test build, not production-hardened public registration. It requires configuration and real end-to-end testing before inviting other families.

## 1. Create the first administrator (manual, no public bootstrap endpoint)

1. In Supabase **Authentication → Users**, use **Add user** to create your own administrator email/password and **mark the email confirmed only after verifying it is yours**. Do not use a child's email. (If the dashboard allows a confirmation email instead, use that.)
2. Copy your new user's UUID from Authentication → Users (NOT the email/password).
3. In Supabase SQL Editor run `sql/02_admin.sql` to create the protected `platform_admins` table.
4. Run the commented `INSERT` statement in that SQL file after replacing the placeholder UUID with **your** Auth user UUID. Do not run it with the placeholder UUID.
5. Confirm `select user_id from public.platform_admins;` returns only your UUID.

## 2. Create a separate Netlify test site

- Upload/deploy this folder to a **new Netlify site** or a separate GitHub repo. **Do not replace the live site's files.**
- Node 20+ required. Netlify installs `@supabase/supabase-js` from `package.json`.
- In `public/index.html`, replace `REPLACE_WITH_SB_PUBLISHABLE_KEY` with your **publishable** key (safe in browser). Project URL is already configured.
- Set the following environment variables **on the test site only** (Site configuration → Environment variables):

| Name | Value |
| --- | --- |
| `SUPABASE_URL` | `https://xcapehampnagfdnlnxqv.supabase.co` |
| `SUPABASE_PUBLISHABLE_KEY` | your `sb_publishable_...` value |
| `SUPABASE_SECRET_KEY` | your `sb_secret_...` key; **never** put this in HTML or GitHub |
| `PUBLIC_SITE_URL` | the new test site origin, e.g. `https://your-test-site.netlify.app` |
| `ALLOWED_ORIGIN` | exactly the same origin as `PUBLIC_SITE_URL` |

If your dashboard shows a legacy `service_role` key instead of `sb_secret_`, this code may use it as `SUPABASE_SECRET_KEY` on the server only. Treat both as highly sensitive.

After setting variables, redeploy the test site.

## 3. Authentication configuration

- Keep public signups **disabled**.
- Email provider enabled. Configure **Authentication → URL Configuration**: Site URL = your **test site URL**; add test site URL to redirect allow list.
- Ensure Supabase email confirmation can send emails. Built-in email service is rate-limited; for wider use, configure custom SMTP.
- Parent passwords must be at least 12 characters in this test interface. Configure a corresponding minimum password length in Supabase Auth if available.

## 4. Test

1. Sign in with the manually created administrator account on the **test** site.
2. Generate a link for a DIFFERENT email address you control (do not use the admin email).
3. Open the link in a private window; enter the **exact invited email**, family name and password.
4. Confirm the verification email arrives and verify the address.
5. Sign in as that parent; check Supabase `families` and `family_members` show one family and its parent.
6. Confirm the invited parent **cannot** create new invitations; only the admin can.
7. Confirm a reused/expired link fails. Do not share test invitation links publicly.

## Important limitations and security follow-ups

- This is a **test prototype**. No rate limiting or bot protection is implemented yet; Netlify and Supabase usage/cost monitoring are recommended. Add durable server-side per-IP and per-email throttling before external trials.
- The redemption handler uses an atomic invitation claim, but its multi-step Auth/database writes are not one database transaction. Error rollback is best-effort; if activation fails, inspect records before retrying.
- The invitation URL includes a bearer token; keep it private. Avoid forwarding links and screenshots.
- The client loads Supabase JS from esm.sh; for production, bundle dependencies locally and adopt a Content Security Policy.
- A parent sees an invitation-generation form after signing in, but server permissions reject non-admin accounts. Hiding the form client-side is not a security boundary.
- Student logins, progress syncing, AI quotas, email deliverability, administrator UI for revoking invites, and a production security audit are **not included**.
- The Supabase schema installed earlier has parent RLS for family data. Validate it with two test families before importing children's data.
