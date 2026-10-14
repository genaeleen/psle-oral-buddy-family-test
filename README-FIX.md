# Family Edition login fix

This corrects the original static HTML login bug: the page now retrieves the public Supabase URL and publishable key from a Netlify Function. You do not need to paste any key into HTML.

## Deployment

**Important:** Netlify manual drag-and-drop deployment may publish static files without building Netlify Functions. For reliable functions, deploy this project from a GitHub repository connected to a **new test Netlify site**, with Netlify detecting `netlify.toml`, installing dependencies, and bundling functions. Never push secrets to GitHub.

1. Keep the existing five environment variables on the test site.
2. Deploy the entire project folder (with `package.json`, `netlify.toml`, `public/`, `netlify/functions/`) using Git-based deployment.
3. In Netlify, open **Functions** and confirm `public-config`, `invite-parent`, `redeem-invite` exist.
4. Visit `https://YOUR-TEST-SITE.netlify.app/.netlify/functions/public-config`. It should return JSON with `url` and `publishableKey` (public information). If you see 404, functions were not deployed. If you see 503, check Netlify environment variables and redeploy. Never share the secret key.
5. Open test site, check **Testing status**, then sign in. Errors are now shown on the page.

The live practice site is not part of this package.
