# LineGuide v2.8 — Palletiser SOP Reference Pilot

LineGuide is currently being refined against a **single six-page palletiser operators' SOP**, using the information structure in the user's source document as a real-world test. The public code contains **no source photos, passwords or confidential company procedure wording**.

## Test the new app

1. Open the hosted LineGuide app in iPhone Safari. Confirm the home screen says **Palletiser pilot v2.8**.
2. Export a JSON backup of your existing records from the Library first.
3. Tap **Start palletiser SOP test** for a new guided draft, or import the **private example JSON** supplied separately in the ChatGPT conversation to review a full demonstration with the original equipment photos.
4. For manual entry, complete **Identify → Requirements → Instructions → Review**. At the Instructions stage, enter short actions and expected outcomes, assign each step to a source activity, attach a photo and optionally choose the original source page.
5. Use **Next activity** to create the next activity group. The pilot covers:
   - Recipe access and selection (source pages 1–2)
   - Cell preparation and start-up (2–4)
   - Normal operation and full pallet change (4–5)
   - Part pallet / batch changeover (5)
   - Production totals (5–6)
6. In Review, check source coverage and save as **Draft**. Open the library and verify its site → line → asset hierarchy, searchable text and revision history.
7. Open **Read full procedure → Save / Share PDF** and compare the generated A4 document with the source. Ensure the technical content and photos are accurate before any real use.

For the mapping, design decisions and QA checklist, read [REFERENCE_SOP_PILOT.md](REFERENCE_SOP_PILOT.md).

## Data and privacy

- The original uploaded company PDF and the private reference import are **not published to GitHub**. Only the app structure and generic activity headings are in this public repository.
- The local reference import includes source-derived test material and photos, with access credentials removed. Keep it private and do not import it on a shared/public device.
- The new build does not erase old documents, and new installations no longer prepopulate unrelated demo records. Existing locally stored records are preserved unless explicitly deleted.
- All records are stored in the current browser/device. Export backups regularly. The app is not yet a controlled shared repository.

## Safety

- The reference SOP contains safety-system, machine-cell access and restart descriptions that must be checked by a competent person against current OEM/site procedures. The test import and generated PDFs are **not approved operating instructions**.
- “Complete” in the app means inputs were supplied, **not** that a procedure is legally compliant, technically safe or approved.
- The production SOP must not include secrets such as access passwords.

## Tests and installation

The repository contains **38 Chromium browser tests**, including four reference-pilot scenarios. GitHub Actions runs five test batches on every push and pull request.

```sh
python -m pip install -r requirements-test.txt
python -m playwright install chromium
node --check app.js
node --check pdf-export.js
python -m pytest -q -m group1 tests/test_lineguide_e2e.py
python -m pytest -q -m group2 tests/test_lineguide_e2e.py
python -m pytest -q -m group3 tests/test_lineguide_e2e.py
python -m pytest -q -m group4 tests/test_lineguide_e2e.py
python -m pytest -q -m group5 tests/test_lineguide_e2e.py
```

To self-host, publish `index.html`, `app.js`, `pdf-export.js`, `sw.js`, `manifest.json` at a GitHub Pages root. You can add the site to your iPhone Home Screen from Safari's Share menu. Procedure records stay in that browser's storage. Direct PDF export is supported; standard browser printing remains optional.