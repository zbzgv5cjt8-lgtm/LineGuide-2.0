# LineGuide change log

## v2.6 — Quality and minimum-documentation release (15 Oct 2026)

- Implemented **SWP risk assessment choice**: approved existing reference plus task-specific controls, or a guided task-specific risk assessment with hazards, harm, exposed people and approved controls.
- Rebuilt SOP/SWP preview and A4 PDF presentation: consistent document identity, concise sections, numbered steps, compact printable layout, clearly labelled unapproved status, optional fields omitted if empty.
- Implemented major/minor revision numbering (1.0 → 1.1 or 2.0), stable human-readable document references and archived revision snapshots.
- Improved search to include instruction content, document references, hazards and assessment details.
- Added recoverable unfinished wizard drafts (stored locally while typing).
- Prevented document reference reuse following routine deletion by retaining a local sequence counter, including it in backup/restore.
- Improved photo upload: compress images locally for easier camera use and reduced browser storage consumption.
- Fixed preview opening at a previous page's scroll position and step-number wrapping on narrow screens.
- Added 24 repeatable browser tests and GitHub Actions checks on future updates; created QA evidence and a known-limitations log.

**Important:** These changes do not turn the prototype into a secure, authenticated controlled-document system or remove the need for competent review. The iPhone and offline behaviour remain to be verified in real use.
