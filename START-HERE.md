# SG Oral Buddy Theme 1 pilot deployment

Prepared 15 October 2026. This is a release candidate for your existing Netlify site, not a completed deployment.

## What you are deploying

A separate Theme 1 page at `/theme1-pilot/`, on the same website. It contains nine questions (three per format), the MRT, library and hawker-centre pictures, short right-column hints, a concise phrase bank, a quick refresher, reference answers, student sign-in, typed-answer practice, AI marking and saved pilot attempts.

It also has two separate buttons: **Generate hints** and **Generate model answer**. AI results are labelled unapproved drafts and never replace the reference answer. Six reference answers preserve the approved Word wording; the three picture answers and supporting material remain labelled parent-preview drafts. Publishing this pilot is not a statement that those drafts are approved.

The original home page, other themes, original answer builder, microphone tools, history and parent dashboard remain available. This pilot uses a simpler typed-answer page; it does not include the original microphone/recording controls or guided section-by-section builder. Use the original website for those features during this trial.

**Not included yet:** AI generation of new pictures or questions; parent approval/publishing controls; changes to Themes 2 onward. See `AI-EXPANSION-PLAN.md`.

## Before uploading

1. Open your existing Netlify project for `https://sg-oral-buddy.netlify.app`.
2. Check which GitHub repository and production branch that project actually deploys. The supplied handover names `genaeleen/psle-oral-buddy-family-test`, but the live connection has not been verified here. Use the repository Netlify shows. Do not create a replacement site or change the connection merely to match the handover.
3. Record the current successful production deploy and commit so you can return to them.
4. Download a backup of the current repository and export important student practice history through the existing website.
5. Confirm the repository contains `netlify/functions/_shared.mjs` and `_family.mjs`. They must expose the existing helpers `json`, `parse`, `admin`, `reject`, `actor` and `studentForUser`. The pilot relies on those existing files and does not overwrite them.
6. Keep current secrets in Netlify. Do not copy API keys into GitHub, HTML, JavaScript or the ZIP.

## Step 1 — Create a preview branch

1. Open the connected repository on GitHub.
2. Create a branch named `theme-1-pilot` from the current production branch.
3. Unzip this package on your computer.
4. On the new branch, use **Add file → Upload files**. Drag the `public` and `netlify` folders from the extracted package into the repository root. Keep their folder paths. Upload the folders' contents in place; do not upload the ZIP as a single website file.
5. Commit the additions to `theme-1-pilot`.
6. Review the changed files. The website additions should be exactly:

```
public/theme1-pilot/index.html
public/theme1-pilot/app.js
public/theme1-pilot/content.json
public/theme1-pilot/assets/mrt.jpg
public/theme1-pilot/assets/library.png
public/theme1-pilot/assets/hawker.png
netlify/functions/theme1-pilot-ai.mjs
netlify/functions/theme1-pilot-mark.mjs
```

No existing application or database file needs replacing. In particular, do not upload the old full project ZIP over your current repository.

7. Open a pull request from `theme-1-pilot` to the production branch. Wait for Netlify to create a Deploy Preview.

## Step 2 — Configure the preview origin

The supplied backend rejects requests unless the browser's exact origin matches `ALLOWED_ORIGIN`. This is a concrete reason a Codespaces or preview URL can produce **Origin not allowed**. It is not proof that every previous authentication problem has the same cause.

Netlify supports environment variables scoped to deploy contexts. Keep production and preview origins separate.

| Variable | Production | Deploy Preview |
| --- | --- | --- |
| `ALLOWED_ORIGIN` | `https://sg-oral-buddy.netlify.app` (or your actual production origin) | Your exact preview origin, for example `https://deploy-preview-12--sg-oral-buddy.netlify.app` |
| `SUPABASE_URL` | Keep existing value | Available to Functions in this context |
| `SUPABASE_PUBLISHABLE_KEY` | Keep existing value | Available to Functions in this context |
| `SUPABASE_SECRET_KEY` | Keep existing value | Available to Functions in this context |
| `OPENAI_API_KEY` | Keep existing value | Available to Functions in this context |
| `PILOT_TEXT_MODEL` | Optional; defaults to `gpt-4o-mini` | Optional; same default |

1. In the Netlify project's environment variable settings, set the Deploy Preview value of `ALLOWED_ORIGIN` to the actual preview origin from the pull request. Include `https://`; omit any path and trailing slash.
2. Confirm required variables are available to Netlify Functions for Deploy Previews. Do not accidentally replace their production values.
3. Trigger a fresh deploy of the preview after changing variables. Reopen that deploy's URL.
4. Browse to `https://YOUR-PREVIEW-ORIGIN/theme1-pilot/` (replace the placeholder with the real preview hostname).

Preview and production are different origins, so you must sign in separately. A login stored on the production site will not automatically appear on the preview.

This pilot uses the existing database tables and the existing `reserve_ai_marking` function from the supplied final-release migration. **No new SQL is included.** If the existing final-release migration is missing, fix that on the test setup first; do not blindly rerun old SQL against your live database.

A preview using the production Supabase project will save real records and consume real AI credits. Use a Test Student account. Prefer a separate test Supabase project if you already maintain one; it must have matching schema, user accounts and secrets.

## Step 3 — Test before merging

Test on a computer and a phone or narrow browser window.

- Open the original home page and one theme other than Theme 1. Confirm normal operation.
- Open `/theme1-pilot/`. Check all nine questions, three formats and correct pictures.
- Open the refresher and phrase bank. Check that hints are short and match the selected question.
- Sign in with Test Student. Refresh: the session should restore. Sign out: reference answers should hide. Sign back in and check the original site still works.
- Switch between questions and return. Typed drafts should remain attached to the correct question and student on that browser.
- Open one of the six approved reference answers and compare it with the approved Word master. Open the three picture answers and confirm their draft labels.
- Generate hints for one picture question and one experience question. Check three relevant, short prompts and an explicit AI-draft label.
- Generate a model answer for an experience question. It should have Point, Example / Experience, Reflection and Summarise, without forcing three reasons.
- Generate a model answer for a picture or discussion question. Check three developed explanations plus apply-to-self, a sample experience and reflection.
- Mark one short answer from each format. For both the library and hawker-centre questions, verify feedback uses the correct displayed picture. Scores are unofficial text-only practice scores.
- Refresh and open saved pilot attempts. Verify original answer, score and AI response. Check the existing parent history and original website history still load. The original site's legacy progress badges may not count new picture IDs; the pilot history is the reference for those new questions during the trial.
- Give Test Student a small finite daily allowance through the existing parent/admin controls. Confirm AI requests stop at the limit. Pilot hint generation, model generation and marking share the existing daily allowance. Its counter resets on UTC dates, as in the supplied SQL. A reserved request may remain charged to the allowance if generation fails.

**Do not merge if:** sign-in fails, an origin error remains, a wrong picture is sent, an approved reference answer changes, cloud saving fails, or another theme stops working. Keep the last working production deploy while investigating.

## Step 4 — Take the Theme 1 pilot live

1. Once preview tests pass, merge the pull request into the connected production branch.
2. Wait for Netlify to finish the production build successfully.
3. Confirm the production `ALLOWED_ORIGIN` still equals the exact live origin, not the preview URL.
4. Open `https://sg-oral-buddy.netlify.app/theme1-pilot/` (use your actual site hostname if different).
5. Repeat a short production check: picture selection, Test Student sign-in, one AI hint request, one marking request and saved history. Confirm an unrelated theme still works.
6. Use the direct pilot link for your first family trial. Nothing in this package silently replaces the original Theme 1 tile.

### Optional — Make the Theme 1 tile open the pilot

After the direct page works, make this small edit in a new preview branch first:

1. Open `public/index.html` in GitHub's editor.
2. Find the existing text `function choose(i){` (the uploaded baseline contains one such function).
3. Replace only that text with:

```javascript
function choose(i){if(i===0){window.location.assign('/theme1-pilot/');return;}
```

Keep the remainder of the existing function unchanged. If the current repository no longer contains this function, do not force the edit; its navigation code needs checking first.

4. Preview and confirm the Theme 1 tile opens the new page while all other theme tiles still open their original pages.
5. Merge after testing. The original Theme 1 data remains in the original page as a reserve; this navigation change does not erase it.

## Rollback

If production misbehaves, restore the last successful production deploy in Netlify. Then revert the relevant GitHub commit or pull-request merge before the next build, so a future build does not reintroduce the problem. If only the optional tile link is problematic, revert that small change and keep using the direct pilot page for diagnosis.

Do not delete practice records or rerun SQL as a rollback step. The package adds no database migration.

## How to take later theme updates live

1. Review and approve content in Word.
2. Export the approved text exactly; retain stable question IDs for existing questions.
3. Put draft AI results in a separate field or draft record. Do not overwrite approved answers or hints on regeneration.
4. Make the change in a branch and inspect which theme's content files changed.
5. Use a Netlify Deploy Preview with its exact allowed origin. Check sign-in, pictures, hints, reference answers, generation, marking and history.
6. Merge one reviewed batch, verify production and retain a known working deploy.

For Themes 2 onward, prepare theme-specific pilot content before adding navigation. This package is intentionally only Theme 1.

## Verification completed here

- JavaScript syntax checks passed for the browser code and both added functions.
- Fifteen mocked checks passed for sign-in/origin rejection, AI allowance enforcement, required picture input, both AI generation modes, three marking formats, stable IDs and all nine question assets.
- Six approved reference-answer bodies were copied directly from the approved Word master.
- **Not tested here:** the current live repository revision, browser rendering on actual devices, live Supabase sessions, live OpenAI responses, Netlify builds or real saved attempts. The preview checks above are still required.

## Official references

- Netlify Deploy Previews: https://docs.netlify.com/deploy/deploy-types/deploy-previews/
- Netlify environment variable scopes and contexts: https://docs.netlify.com/build/environment-variables/overview/
- OpenAI image generation: https://developers.openai.com/api/docs/guides/tools-image-generation
