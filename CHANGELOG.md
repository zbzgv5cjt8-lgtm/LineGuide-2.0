# LineGuide v2.5 — SOP / SWP proof of concept

- Template choices are now **Standard operating procedure (SOP)** and **Safe working procedure (SWP)** only. Older procedures remain readable; editing an older template requires choosing SOP or SWP.
- Hot surfaces and sharp edges / surfaces are independent hazard selections. The old combined label is preselected as both when editing, so users can refine it. Historical documents are not silently rewritten.
- Delete is available directly on procedure cards in the Home and Library views, in addition to the detail view. Confirmation describes permanent loss of all revision history. Save errors do not remove records.
- Offline application cache bumped to v2.5.
- Includes independent proof-of-concept browser test scenarios and four clearly fictional, unapproved example procedures in a **separate opt-in import JSON**. These are not automatically added to your live library.

## Known limits

Local browser storage, no authenticated approvals, major/minor numbering planned but not yet implemented (current code increments integer revisions), and printer-driven Save as PDF. Deleting an approved record is permanent and should be reserved for a personal prototype; production document control should use archive/withdrawal with an audit log instead.