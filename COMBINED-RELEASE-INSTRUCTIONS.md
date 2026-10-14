# PSLE Oral Buddy Family Edition — combined Phase 2 release

This is the complete Family Edition repository, based on the working Phase 1 + Phase 2A microphone version. **Do not upload to the original live-site repository.**

## Before deployment
- Family Edition Netlify environment variables must include `OPENAI_API_KEY`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `PUBLIC_SITE_URL`, `ALLOWED_ORIGIN`. Keep all secret values out of GitHub.
- No SQL migration is needed for this release; it uses the existing `practice_attempts` fields.
- **IMPORTANT**: AI marking is capped at 5 attempts per student per UTC day by a server-side count. This is a basic limit, **not an atomic quota** under concurrent requests. Before inviting other families, implement transactional quota reservations, per-family budgets, abuse controls and a firm provider-side spending limit.
- Set an OpenAI project-level budget/alerts to reduce surprise bills; budget alerts are not guaranteed hard caps.

## Upload once
1. Extract ZIP.
2. Upload the *contents* of the `psle-family-combined-release` folder to `genaeleen/psle-oral-buddy-family-test`, preserving `public/` and `netlify/functions/` structure. Commit once.
3. Wait for Netlify Published; hard refresh the Family Edition test site.

## Test with fictional student only
1. Sign in as Test Student, select theme/question, dictate with Start speaking (Chrome/Edge), Stop, edit answer.
2. Save draft; verify in Parent Review.
3. Press Mark my answer with AI **once** (this incurs an OpenAI API charge). Confirm score, strengths, improvements and red/green suggested wording.
4. Refresh Parent Review and confirm marked record appears with score, corrected text and feedback.
5. Do not migrate real child history or invite external families until security and quota review.

## Limitations
- Speech recognition is browser-based and may be processed by the browser provider. No audio recordings are saved by this app.
- Scores are unofficial and evaluate written text only, not actual spoken delivery.
- Word-level red/green comparison is approximate.
- Student login token is kept in page memory; sign-in again after refresh.
- The combined release has been syntax-checked locally, not tested with your Netlify/Supabase/OpenAI accounts.
