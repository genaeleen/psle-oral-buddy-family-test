# PSLE Oral Buddy — final family release candidate

**Target:** The existing Family Edition Netlify site and its connected GitHub repository. Do NOT upload this ZIP to the original PSLE Oral Buddy repo: its original site has a different account/database setup. After verification you may point your preferred domain to the Family Edition site or migrate the original domain, but do not overwrite the original first.

## Exactly one code deployment
1. Keep your existing original website and your son’s backup JSON unchanged.
2. Run `sql/04_final_release.sql` in the SAME Supabase project used by Family Edition. This migration does not delete practice records. If it errors, stop.
3. Verify the Family Edition Netlify environment variables are already configured: SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, SUPABASE_SECRET_KEY, ALLOWED_ORIGIN, PUBLIC_SITE_URL, OPENAI_API_KEY. Never put their values into GitHub.
4. Back up the current Family Edition GitHub repo. Extract this ZIP, upload its contents to **psle-oral-buddy-family-test** (repository root, not a nested folder), and commit once. Netlify should deploy once.
5. Test parent/student login, reset password, AI marking, unlimited quota, per-student limit, Parent Review, theme and question badges, retry history, cloud save, and import with test data before importing your son's backup.

## Included
- Full question library and browser speech recognition.
- Parent-controlled password reset and history import from prior release.
- Theme/question attempted and AI-marked indicators; student can view all attempts and retry blank.
- Parent theme/question coverage and full original answer, AI feedback and improved answer history.
- Expanded AI model answer guided by all 3 Bright Ideas, application to self, hypothetical personal story and conclusion. Scores still evaluate the original answer.
- Parent-controlled unlimited or capped per-student AI marking; all calls still incur OpenAI API charges.

## Important limitations
This is a **release candidate**, not independently certified launch-ready. Live Supabase permissions, migrations, multi-family isolation and OpenAI API calls cannot be tested without your private services. Parent Review retrieves up to 2,000 recent records and student history up to 1,000; older history needs pagination. Browser speech recognition may use a browser vendor service but does not call your OpenAI API. Unlimited AI marking is NOT an unlimited credit balance or spending cap. Set an OpenAI project budget/alerts separately. Avoid publishing to other families until security tests pass.
