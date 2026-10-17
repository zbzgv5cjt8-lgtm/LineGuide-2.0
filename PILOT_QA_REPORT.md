# LineGuide v2.8 — Reference SOP Quality Review

## Source and approach

The baseline for this build is the user's six-page Palletiser Operators SOP. Its five distinct activities were mapped into guided sections, and a local-only **redacted, fictional-status reference import** was prepared separately with 16 steps and six photos. This source material is **not committed** to public GitHub.

## Findings and changes

- Replaced the first-run unrelated demo with an empty library and a prominent palletiser pilot entry point.
- Added five guided activities from the source; **Other** remains available.
- Added optional source-page references and photo captions to instruction steps.
- Collapsed existing instruction cards so photo-heavy procedures are more usable on mobile.
- Added a five-activity completeness checklist in Review and detail pages; partial drafts may still be saved.
- Grouped step instructions in both browser preview and downloadable A4 PDFs.
- Avoided repeated 'Visual check' text in the printed document and prevented orphan activity headings.
- Existing procedures and historic revisions retain compatibility. Added source fields to backup/import validation.

## Verification

- Legacy browser suite: **34 tests** (one existing intentionally skipped test).
- New reference pilot suite: **4 tests** (pilot entry, guided section progression, Other section, group preservation across PDF and revision).
- Private source-based end-to-end trial: a 16-step, 6-photo draft imported locally, searched, reopened, previewed, exported to a real PDF and edited.
- Private test PDF: **9 A4 pages, six embedded photos**, text selectable/searchable, all five activities present, no password, no page text overflow detected.
- Static app JavaScript checked with `node --check`.

**Verification limitation:** Browsers in automated tests are Chromium-based, not native iPhone Safari. Document typography and exact pagination can differ across devices. These are **software tests**, not a review or validation of the operational safety content.

## Still to do with user

1. Compare generated sections, photos and wording directly against the source PDF for accuracy and usability.
2. Validate cell-entry, cycle and reset methods with approved machine-specific safety information.
3. Confirm the desired page density, photo size, header colours, company branding and revision table before making this the final corporate SOP design.
4. Test import/revision/PDF on the user's physical iPhone and record defects.
5. Decide whether operator content remains one SOP with five activity sections, or whether later site review determines specific activities require separate controlled instructions.