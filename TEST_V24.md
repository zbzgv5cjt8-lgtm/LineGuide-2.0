# LineGuide v2.4 — acceptance checks

Use only fictional machines/procedures in a public GitHub Pages prototype. Export a JSON backup before testing with existing local data.

## Dependent dropdowns

1. Create a procedure. Before choosing a site, Line and Asset should be unavailable.
2. Choose Site A → Line 1. Only machines recorded against Site A / Line 1 should appear.
3. Change Line 1 → Line 2; the previous asset should clear, and only Line 2 assets appear.
4. Change Site A → Site B. Line and Asset selections must clear. Select a line under B; the assets must belong to B, even if that line name also exists at A.
5. Choose Other for Site, type a site name, then Other for Line and Asset. Continue, go Back and confirm all custom values remain.

## Wizard position

6. On the first or second stage, scroll down and press Continue. The next stage should display from its top. Back must do the same.

## Conditional isolation

7. Start a fictional normal line start-up procedure. In stage 2 choose **Not required for this procedure**. Isolation reference should disappear and not be mandatory; optional explanation should be visible. Add an approved operating reference as example data.
8. Save and preview: the procedure should say **Isolation: Not required for this procedure** and show the rationale, not a blank mandatory isolation warning.
9. Start a separate fictional maintenance procedure, choose **Isolation required**, and try Continue with no reference: app should block. Enter a valid example reference and continue.
10. Choose **Other — specify safe-state arrangement** and verify an explanation is mandatory.
11. Edit a v2.3 procedure: its old isolation reference must survive editing; before revision the preview must label its classification as legacy/unrecorded.

## General checks

12. Save, reopen and export JSON. Verify the new `isolationMode` and optional `isolationReason` are retained.
13. Refresh while online; after GitHub Pages publishes, check the Home page label **Workflow build v2.4**. Don't clear Safari website data to fix an old cache; that may erase local procedures.

**Limits:** No authenticated approvals, no shared database or automatic backup; selecting no isolation is not an approved safe-work decision. Follow site/OEM requirements and competent review.