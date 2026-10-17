# LineGuide v2.9 — Engineering Procedure Generator

LineGuide is a general-purpose, local-first SOP / SWP creator and document library. There are **no machine-specific authoring modes**, built-in palletiser forms, site-specific question lists or preloaded operational procedures.

## Two ways to use LineGuide

**Review an already-created document (no authoring required):**
1. Open LineGuide in Safari on your iPhone.
2. On Home, tap **Import a prepared procedure**.
3. Choose a privately provided LineGuide `.json` document from Files.
4. Confirm the import; a one-document import opens immediately in the full-document preview. Review its steps, photos, section headings, document status and PDF export.

**Create a new document:**
1. Home → **Create procedure**.
2. Follow Identify → Requirements → Instructions → Review.
3. Use short dropdowns with Other entries, conditional isolation and risk-assessment questions, and numbered steps.
4. Optional **Activity / section** helps group any longer SOP/SWP, with re-usable choices from that document. Optional source-page and photo fields work with any source reference.
5. Save and access through Home → Library or Browse (site → line → asset → task); export professional PDF, retain revisions and take JSON backups.

The Library also offers **Import procedures** for merging multiple backed-up records. Import and export act on device-local data; the repository does not contain procedures.

## Private source-document recreation

A privately supplied reference document can be re-created as an ordinary LineGuide procedure **outside** the GitHub repository, using the identical record format as any user-created SOP/SWP. Its JSON can be imported in a single step. The app itself must not require an author to re-enter that document, or include hard-coded document-specific controls.

Never publish equipment images, company instructions, access credentials or other sensitive operational materials in this public repo. Prepared private test data and source PDFs are **not** checked into GitHub.

## Safety / compliance

The procedure generator does not automatically certify technical suitability. Any reconstructed document is a **Draft / Unapproved — Not for operational use** until competent site review. Machine-specific guarding, robot-cell access, isolation, permits and safe-state methods require the actual OEM and site-approved assessments. Do not insert access passwords in procedure records.

Approval fields in this prototype are named records, **not authenticated signatures**. Procedural data lives only in the browser, so back up regularly. Do not use this prototype as the sole authoritative storage for workplace procedures.

## Run/test

Static files to host at GitHub Pages root: `index.html`, `app.js`, `pdf-export.js`, `sw.js`, `manifest.json`. Nothing needs a backend for personal prototype testing.

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

GitHub Actions runs regression tests on every push or pull request. A separate **private** integration test can validate source-document import and photos without committing private content.