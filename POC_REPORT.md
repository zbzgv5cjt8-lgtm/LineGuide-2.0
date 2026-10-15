# LineGuide v2.5 proof of concept — browser test report

Date: 15 October 2026. Tested in automated Chromium at an iPhone-style 390 × 844 viewport using the actual application JavaScript and HTML with isolated browser storage. **Not a physical iPhone or formal safety validation.**

## Realistic workflow scenarios

1. **SOP, routine line start-up:** No isolation selected, documented reason, moving-parts and noise hazards, two steps. Created, saved and previewed.
2. **SWP, mechanical maintenance:** Isolation required with reference placeholder, separate sharp-edge hazard, two steps. Created, saved and previewed.
3. **SWP, hot surface inspection:** Other safe-state arrangement with placeholder reference, hot-surface hazard only. Created, saved and previewed.
4. **SOP, routine inspection:** No isolation selected; electrical hazard plus a custom 'Other' hazard. Created, saved and previewed.
5. **Revision:** Edited SOP 01, produced revision 2 and preserved revision 1 snapshot.
6. **Deletion:** Searched Library for SWP 02, deleted directly from result card after confirmation, checked other procedures remained.
7. **Options:** Verified only SOP and SWP document templates; hot surfaces and sharp edges separate.
8. **Runtime:** No uncaught JavaScript page errors in the test.

All test scenarios passed. See `POC_RESULTS.json`, `proof_library.png` and `proof_procedure_preview.png` for evidence. The example JSON is explicitly fictional and deliberately lacks site-approved instructions: do not use it as a live operational procedure.

## Follow-up issues

- Test on an actual iPhone, including Safari printing, offline caching and storage persistence.
- Implement authenticated approval and archiving instead of hard delete before workplace deployment.
- Implement planned major/minor revision numbers separately (current revisions are sequential).
- Review layout with users for readability and minimal on-screen choices.