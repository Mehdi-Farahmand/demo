# LEVA landing page

Single-page experience: cinematic hero → introduction → 11-question financial
questionnaire → personalised PDF report. React + Vite, no backend; the report is
generated in the browser with jsPDF.

## Running it here

```bash
docker compose -f docker-compose.base44.yml up -d --build
```

- Vite dev server runs from the bind-mounted source on host port **3000**
  (container port 5173), so edits hot-reload.
- `npm install` runs on container start; `node_modules` lives in a Docker volume,
  so it survives source edits. Delete the `app_node_modules` volume only if a
  dependency change misbehaves.
- No secrets or external services are required.

## Quirks worth knowing

- **Persian in the PDF** — jsPDF ≥ 2 already reshapes Persian letters and applies
  bidi reordering inside `text()`. Pass **logical** (unreversed) strings and use
  `{ align: 'right' }`; manually reversing produces mirrored text. See
  `src/lib/rtl.js`.
- **PDF fonts** are fetched at generation time from `/public/fonts`
  (Vazirmatn for Persian, Clash Display for the Latin wordmark) and embedded in
  the document. A missing font file surfaces as the app's own retry error.
- `src/lib/reportPdf.js` draws all 7 pages with vector text, so the PDF is
  selectable and small (~70 KB).
- Vite's `allowedHosts` is widened for `.${BASE44_SANDBOX_HOST_DOMAIN}` only when
  `BASE44_PREVIEW_MODE === "1"`; unset behaviour is the default localhost-only
  allowlist.

## Verifying a change

```bash
# quick smoke test that the dev server answers
curl -o /dev/null -w "%{http_code}\n" http://localhost:3000/

# generate the report outside the browser (real module, real fonts)
docker compose -f docker-compose.base44.yml exec -T web node /tmp/gen.mjs
```

In the browser: hero CTA scrolls to the intro, the intro CTA scrolls to question 1,
the header exists only on the hero, answers survive back/forward navigation, and
the completion screen downloads a 7-page PDF built from those answers.
