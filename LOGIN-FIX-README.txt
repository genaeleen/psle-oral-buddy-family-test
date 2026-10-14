PSLE Oral Buddy Family Edition - Phase 1 login fix

This replaces the faulty Phase 1 package.
Fix: initialize the HTML escaping helper before rendering the practice library.

Upload the contents of this ZIP to the FAMILY TEST GitHub repository, replacing existing files.
Do not upload to the original live-site repository.
No Supabase SQL or Netlify environment changes required.
After Netlify says Published, hard-refresh the page (Ctrl+Shift+R), and verify Testing status changes from Checking connection to Supabase connection configured.
