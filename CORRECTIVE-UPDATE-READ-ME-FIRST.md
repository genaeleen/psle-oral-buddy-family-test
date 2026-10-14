# PSLE Oral Buddy — Combined corrective update

## What's changed
- Q1 AI marking receives the displayed photo (vision input) and scene description and must explicitly relate its model answer to visible photo details.
- Q2 AI marking follows **Response → Story → Ending** with one detailed sample experience and no compulsory Bright Ideas.
- Q3 follows **Response → Bright Ideas 1–3 → Apply to Self → Sample Story → Ending**.
- AI marking validates presence of required section headings; missing sections trigger an error rather than presenting an incomplete model answer.
- **Tracked changes** now appear in saved-attempt history for students and parents, including older marked attempts where both texts are stored.
- All other existing features are retained.

## Upload instructions (one GitHub commit)
1. Keep your original PSLE Oral Buddy website untouched. Do not upload this package to the original repository.
2. Your existing final-release Supabase migration has already succeeded; **no new SQL step is required** for this correction.
3. Open the **Family Edition** GitHub repository (`genaeleen/psle-oral-buddy-family-test`) and use **Add file → Upload files**.
4. Unzip this archive and drag the **contents** of the extracted folder (not the outer folder) onto the repository root; commit once.
5. Wait for Netlify to show Published. Test Q1 photograph, Q2 story, Q3 full structure, and history tracked changes from student and parent accounts with Test Student.
6. Do not import your son's backup until testing succeeds.

## Important notes
- Photograph recognition and generated examples are AI outputs and can make mistakes; verify visually.
- Marking uses your paid OpenAI API credits. Image input may increase costs compared with text-only marking.
- Previously generated model answers are not retroactively rewritten; tracked comparisons are generated from stored original/model texts.
- Live OpenAI/Supabase/Netlify integration has not been tested here. This is a tested-for-syntax release candidate, not a guarantee of flawless live operation.
