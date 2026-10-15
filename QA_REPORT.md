# LineGuide v2.6 — Quality review and acceptance evidence

**Date:** 15 October 2026  
**Scope:** iPhone-sized layout and workflow simulated in desktop Chromium/Playwright using isolated test storage. Actual Safari, native iPhone storage and GitHub Pages hosting were **not** independently tested by these checks.

## Product goals

1. **Ease of use:** minimal choices; Other allowed, context-dependent site/line/asset choices, four guided stages and safe local recovery of interrupted work.
2. **Document clarity:** a consistent SOP and SWP, clear instructions with results, visible hazards/controls, restrained layout, A4 PDF export without mostly blank second pages on short procedures.
3. **Retrieval:** site → line → asset → task, keyword search including instructions, document number, status and revision displayed.
4. **Control:** named draft/review/approval records; major/minor revisions and historic snapshots; manual validated backups.

## Tests performed — 24 passed, run in four batches

- Initial interface and viewport width; minimal SOP authoring and preview.
- SWP with an existing risk assessment; missing-reference validation; required task controls.
- SWP with a task-specific risk assessment; hazard, harm, exposed people and controls.
- Site/production-line/asset dependent choices; custom options; back/next stage retention and scroll reset.
- Search instruction text and document number; direct Library deletion.
- Revision snapshot history and major/minor revision branching.
- JSON backup export and previous backup import.
- Interrupt an unfinished wizard and resume from saved browser state.
- Reference number uniqueness after deleting the previous final record.
- Photo capture and compression, including a large (>1.2MB) camera-style image.
- Simulated storage quota failure without an incorrect success claim.
- A4 PDF text/layout checks: minimal procedure stays on one page; long procedures produce legible multipage PDFs without missing instruction text or blocks outside page bounds.
- Escaping potentially dangerous user input before rendering.
- 320, 360, 390, 768 and 1024-pixel widths without horizontal overflow.
- Missing approval role validation, malformed import rejection and unreadable stored data preserved for recovery.

**Result:** 24 tests passed locally after the v2.6 changes, in isolated Chromium. Static JavaScript syntax also passes `node --check`. Example SOP and SWP PDFs were rendered, inspected visually and confirmed one A4 page each for short procedures.

## Known limitations / pending release gates

**High-priority before real company rollout**

- App stores data in each device's `localStorage`: no verified recoverability beyond exported backups, no server database or audit-controlled document repository.
- Named approvals are not authenticated or securely enforced. Editing and deleting approved documents must be restricted before real controlled use; use controlled archiving and permissions.
- No lock/conflict resolution or multi-user publishing controls. Draft status is labelled but is not a secure authority boundary.
- Generated risk assessments contain **user-entered** findings, not a competent professional risk validation. Specialist regulations and task-specific control requirements remain the responsibility of the duty holder.

**Device/reliability acceptance gates**

- Test on an actual iPhone/Safari: Home Screen installation, photo selection, Files backup, A4 PDF export, loss of connection, browser restart and low-storage behaviour.
- Test service worker install/update under real GitHub Pages HTTPS; simulate cache update across releases and verify offline version/status warnings.
- Test restore of a large, real-world library with many high-resolution photos and extensive revision histories; monitor Safari storage eviction.
- Ask at least one competent engineer who has not seen the app to complete a fictional SOP and SWP without coaching; review the produced PDF readability and the number of actions/fields they needed.

**Non-goals:** no job logging, PPM execution, breakdown tracking, AI safety certification or invented machine-specific procedures.

## Next quality actions

- Run the GitHub Actions regression suite for every subsequent code change, check for failures and fix them before treating a change as verified.
- Complete actual iPhone acceptance testing and log device-specific issues.
- Conduct an expert safety/document-control review before any workplace deployment.

**Do not describe LineGuide as flawless or operationally approved based on this report.**