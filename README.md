# LineGuide — v2.4 dependent asset choices and conditional isolation

This release builds on the stability fixes and introduces short, relevant pick-lists with an **Other — enter your own** option. It does **not** implement the distinct document templates or major/minor revision model yet. Those are recorded in `DESIGN_AND_PHASES.md` and will be implemented after Phase 1 is accepted.

## Version 2.4 — site/line selection, navigation and isolation

- **Cascading equipment lists:** choose a site to see only its known production lines; choose the line to see only assets from that exact site and line. Changing a parent clears incompatible child choices. Sites, lines and assets entered through **Other** work as well. Existing options come from saved procedures; a separate asset master list is not yet implemented.
- **Stage navigation:** Next and Back return the screen to the top of the newly displayed stage, including on mobile-size screens.
- **Isolation is conditional:** every procedure must explicitly identify whether isolation is **required**, **not required for this procedure**, or whether **other task-specific safe-state arrangements** apply. A reference is mandatory only for required/other choices. A supporting explanation or approved operating reference is recommended for the no-isolation choice, such as a routine line start-up. No isolation selection is prefilled for new procedures.
- **Document output:** the selected isolation status and relevant text appear clearly in preview/printed PDF. Switching to not required ensures old isolation text is not mistakenly exported as a current isolation instruction.
- **Backward compatibility:** existing v2.3 procedures retain their saved isolation text, with a legacy-classification warning in previews until revised. Stored browser keys and JSON backup format are unchanged.
- **Important safety boundary:** a choice of “not required” is not a finding that work is safe without isolation. Machine intervention may still require isolation and control of stored energy. Always use approved site/OEM procedures, risk assessments and competent review.

`TEST_V24.md` contains a targeted manual test plan. `test_v24.py` is an optional automated Chromium/Playwright regression test.

### Curated choices retained from v2.3

- Keep menus short: common task types, audiences, prerequisites, hazards, PPE, step types and verification methods.
- Use **Other — enter your own** for site/line/asset and other configurable answers. Multiple custom hazard, PPE and prerequisite items can be entered one per line.
- Document status and types remain controlled classifications. Site-specific methods, warnings, acceptance criteria and references stay authored and verified by a competent user.

## Before replacing the current app

1. Open **your current installed LineGuide app**, open **Library**, then tap **Export backup**. Save the JSON backup somewhere you can find it in Files. This is important: Safari and a Home Screen app can have different storage areas on some iPhone configurations.
2. Check you can see the exported JSON file in Files. Keep that original safe.
3. Do not clear Safari website data, uninstall your LineGuide Home Screen app, or delete the existing GitHub repository. Those actions can remove locally stored procedures.
4. If an error prevents backup export, stop and ask for help before updating or clearing data.

## Update the existing GitHub Pages deployment

1. If updating manually, download and unzip the LineGuide v2.4 ZIP. (When the files are pushed to GitHub for you, no ZIP upload is necessary.)
2. Sign in to GitHub and open your **LineGuide-2.0** repository.
3. Upload the files **inside** the `lineguide_mvp` folder to the **repository root** (where the existing `index.html` is), replacing the existing `index.html`, `app.js`, `sw.js` and `manifest.json`. Do not upload only the ZIP or put them in a new nested folder. The extra Markdown documents can be uploaded too, but are not required to run the app.
4. Commit the changed files. You don't need to create a new repository or change GitHub Pages settings.
5. Wait for GitHub Pages to finish deploying. Open your **existing** LineGuide URL in Safari, connected to the internet, and refresh. If old content remains, refresh again after a short wait so the updated service worker can take over. Do **not** clear website storage to force an update.
6. On the Home screen within LineGuide, look for the text **“Workflow build v2.4”**. That confirms the new HTML/JavaScript was loaded.
7. Run the checklist in `PHASE1_TEST_CHECKLIST.md` with fictional data first.

## What changed

- Single delegated click handler for dynamic content: searching no longer multiplies button listeners.
- Transactional writes: new, edited, deleted and imported data is committed only when browser storage succeeds.
- Explicit protection of unreadable stored data, with an option to export the raw damaged record for recovery.
- Import validation and backward compatibility with v2 backups that lack `revisionHistory`.
- Guard against losing unsaved wizard changes when leaving the builder.
- Verify all required fields at final save, including fields from earlier wizard stages.
- Safer image-file checks and safer rendering of imported step images.
- Fixed service-worker fallback so a missing script doesn't silently return an HTML page.
- Removed the non-functional QR button until there is a meaningful shared procedure URL.
- Saved existing browser key `lineguide-procedures-v1` to preserve compatibility with existing locally saved records.

## Known limitations — do not treat as complete

- Currently one generic procedure template; separate **SOP, Work Instruction and Inspection Procedure** templates are planned for Phase 3.
- Current numeric revisions still increment on each saved edit. The agreed **1.0 / 1.1 / 2.0** revision logic and immutable approved releases are planned for Phase 6.
- Reviewer/approver names are not authenticated and can be entered manually. This is **not** a secure or enforceable approval workflow; planned for Phase 5 and team-ready Phase 10.
- PDF uses the browser's Print / Save PDF dialog; document layout improvements are Phase 7.
- Data exists only in the specific browser/app storage on the device. There is no account, cloud sync or automatic server backup. Export JSON backups after meaningful changes.
- Changes in a wizard **are not autosaved** until the final Save action. The app warns when you try to leave or reload while editing, but cannot guarantee recovery from a crash or OS-initiated termination.
- Offline caching and iOS Home Screen behaviour were not tested on a physical iPhone in this release. Verify them with the included checklist.
- Never use the demonstration procedure operationally. A completed form does not establish machine-specific safety or authorise work. Use approved OEM/site procedures and competent review.
- Do not enter sensitive workplace content into a public-facing prototype unless your organisation explicitly permits the storage and hosting arrangement.

## Technical summary

Static HTML / CSS / JavaScript application with a service worker for offline shell caching, localStorage for prototype data, JSON backup and import, and browser print-to-PDF. Four runtime files: `index.html`, `app.js`, `manifest.json`, `sw.js`. Serve with GitHub Pages over HTTPS for normal iPhone testing. `index.html` can be opened locally for a rough browser preview but has restricted storage/offline capabilities depending on browser.


## Version 2.2 — quick-select authoring

- Document type: SOP, work instruction or inspection procedure drop-down (document-specific templates are planned for a later phase).
- Existing sites, production lines and assets appear in drop-downs, filtered by their parent where relevant; choose **Add new / other** to create a new value.
- Task type, audience and named people use selection lists with a custom-entry option.
- Prerequisites, hazards and PPE use expandable multi-choice checklists; required machine-specific details remain free-text.
- Step category and verification approach are selectable; unique actions, expected results, and warning details remain free-text.
- Existing records, local storage key and v1 JSON backup compatibility are preserved.
- **Selecting a procedure type does not yet produce a different full template.** That belongs to the guided-template phase.

Always use fictional example procedures in publicly hosted prototype testing. Checklists are prompts, not safety certification.