# LineGuide changelog

## v3.1 — SOP-only guided authoring (26 October 2026)
- Removed the template picker; all newly created and revised documents are SOPs.
- Removed the SWP-specific risk assessment method and hazard-by-hazard editor from the guided flow.
- Kept one optional approved risk-assessment reference and existing task-specific safety and isolation fields.
- Updated Home and Library wording and clarified the four creation stages.
- Preserved imported and previously saved SWPs for read-only preview, history and PDF export; they cannot be silently converted.
- Retained IndexedDB shared photographs, portable backups and revision history.
- Updated automated regressions for SOP-only creation, optional RA references, and preservation of legacy SWP records.

## v3.0 — IndexedDB shared photo library (26 October 2026)
- Deduplicated immutable photographs across all procedure revisions using SHA-256 references.
- Lazy rendering of step photographs for current and archived revisions.
- Photo upload stores compressed JPEG data directly in IndexedDB, rather than embedding it repeatedly in each procedure record.
- Safe best-effort migration of older localStorage images; local records are only updated after image writes succeed.
- Complete deduplicated JSON v2 backup and import, with v1 import compatibility and checksum verification.
- Synchronous iPhone PDF share after photo preload; missing images prevent incomplete exports.
- Chromium and WebKit regression coverage for migration, revision image retention, export and backup restore.

## v2.9 — Generic creator and ready-to-review documents

- Removed all special palletiser authoring features, fixed five-activity list, dedicated Start Palletiser test button, source-only coverage gate, and document-specific software warnings.
- Both SOP and SWP use the **same reusable four-stage builder**; any procedure may optionally group steps into activity/section headings.
- Instruction cards collapse for readability, with a short per-document section dropdown plus **Other**, an optional source document page and photo captions.
- Home offers **Import a prepared procedure**, which imports a generic LineGuide record and immediately opens a single prepared document for review. The user does not re-enter the procedure.
- Legacy data containing pilot-only metadata is normalised as an ordinary procedure; headings and photographs survive.
- Source-specific safety review notes belong to the private Draft's own content, never as special code branches in the app.
- All equipment-specific content and original photos remain **private** and are excluded from the public repository.
- Updated generic regression scenarios, including prepared import, PDF, revision and no hard-coded equipment questions.

## v2.8 — Historical reference pilot

Earlier internal testing explored a six-page source SOP with fixed pilot sections. Those experiment-specific controls have been removed. This does **not** remove or delete any procedures previously stored on an iPhone.

## Earlier versions

v2.7 introduced direct searchable PDF export; v2.6 added draft recovery, revision history and regression checks. The SOP/SWP standards and local-only limitations continue to apply.