# LineGuide v3.2 — Simpler SOP Guided Creator

The guided SOP creator has been streamlined following engineering feedback:

- **Identify:** Added **PPM** (planned preventative maintenance) to Task type.
- **Safety and preparation:** Removed the stand-alone **Guards and protective devices** input. Safety-critical guard handling, isolations and reinstatement checks should still be documented in task-specific instructions, precautions and approved references.
- **Instructions:** Removed the **Activity / section**, **Verification approach** and **Verification details** inputs. Each step now focuses on the action, expected result, optional warning and photograph.
- **Completion:** Added a quick-select dropdown for common acceptance and sign-off requirements (operator, line leader, maintenance supervisor, PPM recorded, functional test, equipment handback, work order closed and work area safe). Each chosen item is added to an editable completion-criteria box without erasing existing text; users can add multiple selections or their own wording.
- **Existing documents:** Historical section headings, guard references and verification notes are retained in saved records, older revisions, backup exports and existing document previews. Hidden fields are not silently destroyed by SOP revisions. The simplified inputs apply to new SOP authoring.
- **Security and safety:** Selecting a sign-off requirement is not evidence that a person actually approved or signed the work. Existing site approvals and controlled safe systems are still required.

LineGuide creates **Standard Operating Procedures (SOPs) only**. The single guided flow covers identification, task-specific safety and preparation, numbered instructions with photographs, and document review. It does not offer SWP creation or a risk-assessment authoring wizard.

Older SWP records already saved or imported remain **read-only** for reference and PDF export. The app does not delete them or silently change their document type. Existing photo references, historical revisions and backups are preserved.

LineGuide remains a **general-purpose, local-first SOP creator**. It has no equipment-specific forms or hard-coded palletiser content.

## Photo storage and document revisions

- The first visit after upgrading scans existing records and unfinished drafts. If legacy documents contain inline JPEG, PNG, GIF or WebP photographs, the app writes immutable, SHA-256-addressed copies into an **IndexedDB image store**, then replaces each inline copy in localStorage document metadata with a small photo reference. A failed photo write leaves existing procedure metadata unchanged.
- Duplicate pictures in current and historical revisions use a single stored image. Changing a picture creates a new image reference; the historical version retains its own photograph. Reopening an archived revision loads its images from IndexedDB.
- PDF export uses cached photographs prepared while the procedure preview is visible. This keeps the Share PDF operation synchronous after the tap, which is important on iPhone.
- New backups are **JSON version 2**: procedures contain image references and the backup includes an images collection with one copy per unique photograph. Imports continue to support version 1 legacy JSON. A missing or checksum-mismatched image cancels import.
- Photo storage and procedures remain *on this device and browser*, not on GitHub. They do not automatically sync between Safari and an installed Home Screen app on every iOS configuration. Export a backup before upgrading, and regularly thereafter.
- IndexedDB is more appropriate for binary/image data than localStorage but is not a substitute for off-device backups; browsers may evict local website data. No automatic deletion of unreferenced photographs is performed until a safe audited cleanup flow exists.

## First-upgrade checklist

1. **Before upgrading, export an existing JSON backup** using the old app if you have procedures stored locally.
2. Open v3.2 and allow the photo-storage check to complete. Do not clear Safari data or uninstall the app during migration.
3. Open a procedure with images and check the photo count, preview, and Save / Share PDF.
4. Open an archived revision and verify its images.
5. Export a **new full v2 backup**, which can restore the images and revision history on another supported browser.

In-browser approval names are still prototype records, not authenticated electronic signatures. A reconstructed procedure is not site-approved until reviewed through the organisation's controlled document system. Do not use this prototype as the only source of workplace safety instructions.

---

LineGuide is a general-purpose, local-first SOP creator and document library. There are **no machine-specific authoring modes**, built-in palletiser forms, site-specific question lists or preloaded operational procedures.

## Two ways to use LineGuide

**Review an already-created document (no authoring required):**
1. Open LineGuide in Safari on your iPhone.
2. On Home, tap **Import a prepared procedure**.
3. Choose a privately provided LineGuide `.json` document from Files.
4. Confirm the import; a one-document import opens immediately in the full-document preview. Review its steps, photos, section headings, document status and PDF export.

**Create a new SOP:**
1. Home → **Create SOP**.
2. Follow Identify → Safety & preparation → Instructions → Review.
3. Use short dropdowns (including PPM), task-dependent isolation, an optional approved risk assessment reference, numbered instructions and quick-select completion checks.
4. Individual instructions consist of an action, expected result and optional warning or photograph. Existing imported documents may retain historical section headings.
5. Save and access through Home → Library or Browse (site → line → asset → task); export professional PDF, retain revisions and take JSON backups.

The Library also offers **Import procedures** for merging multiple backed-up records. Import and export act on device-local data; the repository does not contain procedures.

## Private source-document recreation

A privately supplied reference document can be re-created as an ordinary LineGuide procedure **outside** the GitHub repository, using the identical record format as any user-created SOP. Its JSON can be imported in a single step. The app itself must not require an author to re-enter that document, or include hard-coded document-specific controls.

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