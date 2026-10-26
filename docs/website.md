# Website (privacy policy and account deletion)

Static pages in `site/`, needed for the Play Store listing:

| Page | Path | Use |
|---|---|---|
| Home | `/` | App summary and links |
| Privacy Policy | `/privacy` | Play Console → Policy → Privacy policy URL |
| Delete account | `/delete-account` | Play Console → Data safety → "Delete account URL" |

No build step: plain HTML and CSS. `site/vercel.json` turns on clean URLs (`/privacy` serves `privacy.html`).

The home page is a landing page with its own stylesheet (`landing.css`, app colours and Plus Jakarta Sans from Google Fonts); the legal pages use `style.css`. Screenshots in `site/shots/` are the Play Store screenshots from `store/screenshots/`, resized to 540px wide:

```bash
for f in store/screenshots/*.jpg; do sips -s format jpeg -s formatOptions 78 --resampleWidth 540 "$f" --out "site/shots/$(basename "$f")"; done
```

## Hosting on Vercel

1. In Vercel, choose **Add New → Project** and import `meghrajgiri/letter-chain-app` (private repos work on the free Hobby plan).
2. Set **Root Directory** to `site`.
3. Framework preset: **Other**. Leave the build and output settings empty.
4. Deploy. Optionally add a custom domain under Settings → Domains.

Vercel redeploys whenever `site/` changes on `main`. To stop app-only commits from triggering deploys, set **Settings → Git → Ignored Build Step** to `git diff --quiet HEAD^ HEAD -- .`.

Preview locally: `npx serve site`.

## Handling email deletion requests

The delete page promises deletion within 7 days for requests from the account's own email address:

1. In the Supabase dashboard, go to **Authentication → Users**, search for the email and delete the user. This cascades to their profile and game results.
2. Reply to confirm.

## Keep the policy accurate

Update `site/privacy.html` (and its effective date) whenever the app starts collecting something new, for example crash reporting (Sentry), analytics or ads. The Play data-safety form must match it.
