# LineGuide SOP & SWP document standard
Status: **Agreed design baseline** · 15 October 2026

## Product boundary
LineGuide generates, stores, exports and revision-controls only two document types:
- **SOP** — Standard Operating Procedure, emphasising normal operation and consistent execution.
- **SWP** — Safe Working Procedure, emphasising task-specific hazards, controls, safe method and completion checks.

Both must be suitable for the actual task. These document names and headings are **LineGuide design choices**; UK law does not prescribe a universal SOP or SWP template. Competent site review is essential. Never claim form completion establishes legal compliance or operational safety.

## Four-stage workflow
1. **Procedure details:** type, title, site → production line → asset, task, purpose and scope; automatically generated document reference and metadata.
2. **Safety and preparation:** competency/authorisation, tools, applicable hazards, controls, PPE, risk assessment, safe state/isolation and relevant supporting references.
3. **Working instructions:** numbered action steps; optional photos/captions and notes; expected outcome/verification. Allow as many steps as required.
4. **Review and document control:** preview, conditional completeness validation, named author/reviewer/approver, release status, revision and PDF output.

## Fields & conditional requirements
| Section | SOP | SWP |
| --- | --- | --- |
| Document identity, purpose/scope, numbered steps and verification | Required by LineGuide | Required by LineGuide |
| Relevant hazard precautions | Required where relevant | Required, linked to task controls |
| Risk assessment | Record applicable approved reference | Choose **Existing approved assessment** (require reference) or **Create task-specific assessment** (require completed assessment and review) |
| Isolation / safe state | Conditional, never automatically required | Conditional, never automatically required |
| Competence, permit, tools, PPE, specialist regulations, photos | Only when applicable | Only when applicable |
| Author, reviewer, approver and revision metadata | LineGuide document-control standard | LineGuide document-control standard |

If no isolation is required, capture the selected safe-state classification and optionally the approved basis. Do not suggest that a “not required” answer waives other relevant controls. Any isolation method entered must be site- and equipment-specific and verified.

## Risk assessment flow
When creating an SWP, select one:
- **Reference existing approved risk assessment:** store document reference, revision/status as available, and show the applicable controls in the SWP.
- **Create task-specific risk assessment:** for each significant hazard capture potential harm, affected people, existing/proposed controls, further actions as needed, and reviewer. Use a risk-rating matrix only where a site-approved matrix is supplied; no automatic severity/likelihood values.

SOPs likewise depend on suitable risk assessment, but should normally reference the existing assessment rather than duplicate it. Specialist requirements must be conditional on the task and site.

## Minimal-input UI
- Use short, task-relevant single- or multiple-choice options (prefer approximately 3–6 core choices where practical) with **Other — specify**.
- Reuse existing site, line, asset and people values; line options depend on site and asset options on selected site+line.
- Do not overpopulate options merely to avoid typing; preserve free-text entries for unique instructions, references and acceptance criteria.
- Render only fields relevant to selected document type and responses, with helpful “not applicable” when appropriate.
- Save drafts across wizard navigation and restore data after reopening. Scroll to stage top on Next/Back.

## Minimum quality gate (pre-review)
- Confirm document identity, scope and a coherent working sequence.
- Confirm expected outcomes/verification.
- Confirm safety controls, applicable risk-assessment source or task-specific assessment, and safe-state selection where relevant.
- Confirm review metadata and that no required conditional input is missing.
- This gate checks **completeness**, not technical adequacy; competent humans must review and approve the actual safe method.

## Output and revision control
- Generate readable A4 PDF and in-app preview from structured record data, with clearly labelled status, reference, revision, named roles and dates.
- Preserve earlier approved versions without silent edits; revised copies go back through review.
- Agreed target revision format: **1.0, 1.1, 2.0** (not yet fully implemented).
- Personal phase: device-local storage with explicit JSON backups; team phase later: authenticated users and enforced permissions.
- Deletion must be accessible from the library without entering the creation wizard and must have confirmation; production release should prefer controlled archiving for approved documents.

## Out of scope
Maintenance job tracking, PPM execution, breakdown management, automatic safety certification, automatically invented isolation methods, generic automatically chosen PPE, or invented risk ratings.

## Delivery order
1. Implement the conditional SOP/SWP builder and risk-assessment branch using this spec.
2. Test multiple fictional scenarios: normal start-up, intrusive maintenance, hot-surface task, sharp-edge task, existing-RA reference, newly created RA, custom Other entry, no isolation, isolation required, edit/revise and PDF export.
3. Reconcile all failures before marking this design standard implemented.

**Implementation status:** Design agreed; this document does not mean all requirements are implemented.
