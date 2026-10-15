# LineGuide change log

## v2.2 — Quick-select authoring

- Introduced a document-type dropdown (SOP, work instruction, inspection procedure). Specific template differences remain a later development phase.
- Added reusable dropdowns for site, production line, asset, task category, intended audience, author, reviewer and approver. Previously used values appear again, and new choices can be entered.
- Added expandable multi-choice checklists for prerequisites, hazards and PPE, with no safety options preselected.
- Added instruction-step category and verification-approach selections.
- Printed procedure now shows selected prerequisite categories, PPE and step classification.
- Preserved local browser storage and compatibility with existing backups.
- Updated offline caching to prefer current application code while online.

**Important:** Site-specific safe methods, isolations, PPE requirements and acceptance criteria remain user-authored and subject to competent approval. Dropdown choices must never be treated as a risk assessment or authorisation.

## v2.1 — Phase 1 stability

- Stabilised procedure creation, storage transactions, data recovery and revision snapshots.

## v2.3 — Relevant choices + Other

- Shortened task-type, audience, prerequisite, PPE, hazard, instruction-category and verification menus to the most commonly relevant choices.
- Every configurable selection now includes **Other — enter your own**. This reveals a text field only when needed.
- Prerequisite, PPE and hazard checklists accept multiple custom answers, one per line; answers are stored and printed as selected items.
- Existing procedures containing older option names remain readable and editable, including prior custom hazard or PPE entries.
- Returning to earlier wizard pages preserves selections and custom answers.
- A selected Other choice without an actual answer blocks proceeding, preventing a vague placeholder appearing in saved documents.
- Custom values for task type and intended audience can be reused without crowding the menu with every historical value (at most three additional suggestions).
- Unique task instructions, safe-state references, acceptance criteria and actual warning text remain editable and must be verified against approved sources.

**No change to the stored-data key or backup format.** This is still a local-only prototype with named-but-unauthenticated approvals. Separate procedure templates and major/minor revision numbers remain future phases.