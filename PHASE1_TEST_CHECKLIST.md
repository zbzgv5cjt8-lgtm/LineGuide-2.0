# LineGuide Phase 1 — iPhone acceptance checklist

Use entirely fictional equipment and procedures for these tests.

## Before testing
- [ ] Export a JSON backup from the old LineGuide app and locate it in Files.
- [ ] Update repository root files and confirm “Phase 1 stability build” on Home.
- [ ] Confirm existing saved procedures are still visible in the same app/browser context.

## Library
- [ ] Search a procedure using its name, then alter the query several times.
- [ ] Open a search result once: only one details screen opens.
- [ ] Filter for Draft and then clear the filter: results return normally.
- [ ] Browse via Site → Line → Asset without a broken screen.

## Create and save
- [ ] Start a fictional procedure and complete Stage 1. Go forward, back, and forward again. All entered values remain intact.
- [ ] Complete Stage 2; verify requirements persist after moving backwards.
- [ ] Add two instruction steps, reorder manually if needed (reordering is not yet a feature), remove one; surviving step retains data.
- [ ] Leave a mandatory field empty and confirm saving is blocked with a useful message.
- [ ] Complete all stages, enter author, save as Draft, and check preview.
- [ ] Return to library, reopen and confirm the contents are unchanged.
- [ ] Begin editing, try to leave without saving, and confirm a warning appears.

## Revision and export
- [ ] Edit a saved fictional procedure, save it, and view the previous snapshot under Document control.
- [ ] Print / Save PDF; check headings, images, warning visibility and A4 page breaks.
- [ ] Export a JSON backup and verify the file exists in Files.
- [ ] Import a saved backup into the same test library; confirm the app asks before replacing matching document IDs.

## Reliability
- [ ] Close and reopen LineGuide; procedures remain available.
- [ ] With the app already opened online at least once, enable Airplane Mode and try to reopen it from Home Screen. Document whether the app opens and records remain visible.
- [ ] Try it in Safari and in the Home Screen app separately; their storage may be separate.

## Bug report format
Record: **screen / what you tapped / what you expected / what actually happened / whether data was lost**. Add a screenshot if practical, but avoid confidential site information.

## Automated checks performed
The Phase 1 build passed Chromium DOM/browser tests for startup, live search, wizard state preservation, creation, revision snapshot viewing, failure of browser storage writes, backup download, invalid import rejection and reloading records. Additional tests checked import of previous v2 backup format and recovery download for unreadable storage. These automated tests used a simulated browser storage environment; they do not replace physical iPhone, live GitHub Pages, print, or offline acceptance testing.