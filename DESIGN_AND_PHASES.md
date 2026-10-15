# LineGuide — agreed design and phased delivery

## Agreed product

A straightforward procedure **generator, library and revision-controlled document repository**, designed first for a single user on iPhone, eventually a team. Not a CMMS, breakdown logger, or PPM execution system.

### 1. Document templates

- **Standard Operating Procedure (SOP)**: purpose/scope, audience/competence, safety and referenced safe-state requirements, resources, sequential operations, verification, completion and records, document control.
- **Work Instruction (WI)**: focused machine/task identification, task prerequisites and safety references, steps with photos, expected result and checks, completion criteria, document control.
- **Inspection Procedure**: scope/asset, inspection prerequisites and safety references, inspection criteria and acceptance thresholds specified by competent source, inspection steps, required records, response to defects, document control.

Each template has a consistent fixed structure and template-specific required fields; no user-removable mandatory safety or document-control sections. Templates structure information, but do not certify any procedure as safe.

### 2. Revision identification

Agreed public revision notation: **1.0, 1.1, 2.0**. Proposed controlled rules for Phase 6:

- New approved document starts at **1.0**; draft changes before approval do not repeatedly increment the issued revision.
- Minor revision (e.g. **1.0 → 1.1**) for editorial clarifications without materially changing the approved method, subject to the organisation's review rules.
- Major revision (e.g. **1.1 → 2.0**) for changes to methods, hazards, controls, prerequisites, equipment or acceptance criteria.
- Classification is proposed by the author, explicitly checked by the reviewer and approved according to site policy. The app does not decide whether an engineering change is minor.
- Immutable approved snapshots; a separate mutable working draft; approval timestamp, approving person and change note; exactly one current approved revision per document.
- Legacy numeric revisions must be migrated carefully, not relabelled automatically as equivalent controlled issues.

### 3. Data architecture

**Phase 1–9 personal build:** local-only records with stable document IDs, snapshot history, manual JSON backups and a browser print/PDF output. JSON data remains the editable master; exported PDFs are copies.

**Later team build:** access-controlled service, database and image/document storage, identity-bound actions, concurrent editing protection, approval enforcement, audit log and backups. Keep documents structured and serialisable so migration is possible.

### 4. Approval model

Author → Review → Approve → Issue → Supersede. An issued revision is read-only. A revision draft is not an approved replacement until authorised. A name typed in today's local app is **not an authenticated approval**.

## Work sequence

1. **Foundation stability**: repair navigation, saving and import/recovery, tests and mobile usability (this release).
2. **Library and landing page**: statuses, organisation, duplicate/archival safeguards.
3. **Three strict procedure templates**: differentiated required sections and guided creation.
4. **Document preview/quality validation**: layout, photos, checks and missing-field reporting.
5. **Approval workflow**: state transitions, review feedback and release controls.
6. **Major/minor revision control**: working drafts, immutable issued snapshots and migration from old numbering.
7. **PDF export**: consistent standalone A4 documents and page breaks.
8. **Backup and recovery**: stronger recovery and restoration tests for photos and history.
9. **Search and retrieval**: search content, current revision visibility and practical access.
10. **Team-ready security and deployment**: secure backend, users, permissions, authoritative audit trail.

**Rule:** Test and accept a phase on iPhone before starting the next phase.