# LineGuide v2.7 — Procedure generator, storage and revision control

LineGuide is a **local-first, iPhone-friendly prototype** for creating and storing two types of engineering documents: Standard Operating Procedures (**SOP**) and Safe Working Procedures (**SWP**). It aims to be guided, minimal, clear and consistent.

## Getting started

1. Publish `index.html`, `app.js`, `pdf-export.js`, `sw.js`, and `manifest.json` at the **root** of a GitHub Pages repository (Settings → Pages → deploy from `main` → `/(root)`).
2. Open the GitHub Pages address in Safari and use **Share → Add to Home Screen**.
3. Start with fictional test procedures. Tap **Create**, choose an SOP or SWP, and work through four stages.
4. On the Library screen, use **Export backup** to download a JSON copy. Keep backups somewhere safe and test importing one before relying on local records.

**Security:** GitHub Pages in a public repository publicly exposes the app's source code. Procedure records are stored in the **individual device's browser** and are not sent to GitHub. Do not use sensitive workplace data in this public-hosted prototype; local browser storage is not a secure, authenticated document management system.

## Procedure journey

1. **Identify:** SOP or SWP; site → production line → asset; title, task and purpose. Dropdown choices are short; **Other** accepts a custom answer.
2. **Prepare:** prerequisites, selected hazards, PPE and applicable isolation/safe-state arrangements. An **SWP** must either reference an approved assessment and summarise its relevant controls, or record a guided task-specific assessment for competent review. SOPs can reference relevant assessments.
3. **Instructions:** numbered actions, expected results, verification, warnings and optional automatically compressed photographs. Completion criteria are required.
4. **Control:** author, reviewer, approver, document status and revision type. Save and preview the resulting document; use **Save / Share PDF** to create a genuine, searchable A4 PDF directly, with or without internet. On iPhone, choose **Save to Files** or **Print** from the share sheet. When using Safari in a browser tab, **Print in Safari** is also available.

The Library supports searching titles, sites, lines, assets, document references, hazards, and instruction text. Documents have stable references such as `LG-SOP-0001`, revisions `1.0`, `1.1`, `2.0`, and previous version snapshots. Deletion is available directly from the Library but is permanent and requires confirmation.

## Draft and data behaviour

- An unfinished wizard session is temporarily saved in browser storage and can be resumed from Home after an interruption. The definitive procedure record is only saved after completing the wizard.
- Photos are resized/compressed to help avoid browser storage limits, but repeated photographs, long histories and exports can still exhaust limited local device storage.
- JSON exports include revision snapshots and the document number counter. Previous v2.5-format backups are supported.
- The service worker stores the app shell for offline use after the first online visit; offline behaviour is **not yet verified on a physical iPhone**. Do not assume you hold the latest approved workplace revision when offline.

## Safety and approval limitations

- The app **does not determine technical safety**, generate approved isolation steps, or automatically select safe controls/PPE.
- A template being complete does **not** certify that a procedure or risk assessment is suitable or compliant.
- Approver names in this prototype are **not authenticated signatures**. A competent person must review procedures and risk assessments using site-approved controls before operational use.
- This is not a shared, team-ready, controlled-document service: no user roles, server-side permissions, audit trail, immutable approval release or centrally backed-up database yet.
- It is not appropriate to rely on this prototype as the sole approved safety system at work.

## Automated quality tests

The repository includes 34 Chromium browser tests and a GitHub Actions workflow that runs whenever the `main` branch is changed and on pull requests.

Local run (Python + Playwright):

```sh
python -m pip install -r requirements-test.txt
python -m playwright install chromium
node --check app.js
node --check pdf-export.js
python -m pytest -q -m group1 tests/test_lineguide_e2e.py
python -m pytest -q -m group2 tests/test_lineguide_e2e.py
python -m pytest -q -m group3 tests/test_lineguide_e2e.py
python -m pytest -q -m group4 tests/test_lineguide_e2e.py
```

See `QA_REPORT.md` for the last local test results and the remaining test gaps. The checks run in isolated Chromium; they are **not** a substitute for iOS Safari testing, human review of actual documents, penetration testing or testing against live workplace procedures.

## iPhone PDF export troubleshooting

- LineGuide v2.7 no longer relies on `window.print()` for PDF generation. The preview has a **Save / Share PDF** button that creates a PDF entirely on-device; records and photos are not uploaded.
- On iPhone, the native Share sheet normally appears. Choose **Save to Files** for an independent copy, or **Print** to select AirPrint. If sharing is unavailable, the app starts a regular PDF download instead; check Safari Downloads or Files.
- **Print in Safari** is offered in ordinary browser tabs. It is deliberately omitted from a Home Screen web app, where recent iOS versions may silently ignore printing.
- If the old button still appears, reload the app while online to install the latest offline cache. Do not delete Safari website data; that may delete your locally stored procedure library. Export a JSON backup first.
- Important: real-device iPhone testing is still required. The automated tests exercise browser behaviour and generated PDF content but cannot directly validate Apple's native Share sheet.

**Technical notation:** Common electrical and engineering symbols are preserved or rewritten unambiguously in the PDF (for example, Ω becomes “Ohm” and ≤ becomes “<=”). The export refuses unsupported characters rather than silently replacing them with potentially misleading symbols; edit the instruction and retry.