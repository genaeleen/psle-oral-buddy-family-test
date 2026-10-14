# PSLE Oral Buddy Family Edition — Practice Integration Phase 1

This is a complete replacement of the **Family Edition test repository**, not the original live practice repository.

## Installation
1. In the **psle-oral-buddy-family-test** GitHub repository, upload the contents of the inner folder from this ZIP, preserving `public/`, `netlify/functions/`, `netlify.toml`, `package.json`, and `sql/`.
2. Keep existing Netlify environment variables. No SQL changes are needed.
3. Wait for the Family Edition Netlify deploy to show Published.
4. Sign in as Test Student on the Family Edition test URL. Select a theme and question, type an answer, and select **Save answer to cloud**.
5. Sign in as the parent and select **Refresh family progress** to confirm the new answer appears.

## What is included
- All 27 original practice scenarios, their photos, questions, Bright Ideas, vocabulary and model-answer text extracted from the uploaded original index.html.
- The existing Family Edition account system and Netlify functions unchanged.
- Cloud draft saving with theme, question number, stimulus identifier, and student identity determined by the backend.

## Limitations
- This is Phase 1. AI marking, microphone transcription, and reading-aloud exercises are **not yet integrated**.
- Cloud history lists recent attempts; it does not automatically refill an answer into its editing field.
- Original site's browser-local practice history has **not been imported**.
- Existing draft-test form remains in HTML but is hidden for backward compatibility.
- No end-to-end live deployment test was performed; use fictional test data.
- The old Netlify project and original live website remain untouched.
