# Varsha Hollow — Alpha release checklist

## What this branch changes
- Fixes Arc Two illustration paths under the GitHub Pages Vite base path.
- Hardens persisted save migration against corrupted/untrusted browser data.
- Prevents localStorage errors from crashing the narrative engine.
- Shows players immediate numerical consequences while retaining delayed narrative consequences.
- Adds an explicitly optional, on-device playtest questionnaire at the end of each arc.
- Enforces automated verification before the GitHub Pages release job.

## Release commands
```sh
corepack enable
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm build
pnpm preview
```

## QA before publishing (human validation required)
1. Start a fresh browser profile and play Chapters 1–10 on desktop and mobile.
2. Test one save across refresh, one migrated v1 save, and intentionally blocked localStorage.
3. Confirm Arc Two illustrations render at `/varsha-hollow-game/` with no 404s.
4. Complete the tactile marker interaction using mouse, keyboard and mobile touch.
5. Verify choice impact disclosures against actual changes in the ledger.
6. Complete both arc feedback surveys and manually export JSON. Confirm nothing is transmitted automatically.
7. Verify keyboard focus visibility and the reduced-motion preference.
8. Audit all graphics, sounds, fonts, text and contributor agreements for commercial usage rights.
9. Confirm live copy promises **only** the content actually hosted at the public URL.
10. Review privacy/age disclosures and terms before recruiting minors or collecting online analytics.

## Feedback transport
The in-game questionnaire does not collect personal identifiers or automatically transmit data.
Players can copy or download a structured JSON file and voluntarily share it.
Set `VITE_FEEDBACK_URL` to an externally configured HTTPS feedback page to show a link.
It will **not** submit data to that external form: players need to enter feedback on that page.
A secure hosted collection pipeline, consent language and abuse controls are required before automated submissions.

## Not yet completed
- External beta playtesting, usability/retention measurement, commercial conversion.
- Live Cloudflare or GitHub Pages deployment / screenshots / human mobile QA.
- Asset IP provenance verification and final age rating.
- Game catalogue integration; commercial publishing pages and approved pricing.
- Automated analytics platform and hosted feedback storage.

Do not present this PR as investment-ready or production certified until those gates pass.
