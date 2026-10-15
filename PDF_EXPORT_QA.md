# LineGuide v2.7 PDF export regression report

**Scope:** iPhone unreliable print action; direct PDF generation independent of browser print dialog.

**Root cause:** v2.6 wired the printable preview to a direct `onclick="window.print()"` call. Evidence published in September/October 2026 documents cases where installed iOS 27 web apps ignore this command, although Safari tabs continue to print.

**Fix:** Direct native PDF file creation (including risk assessment, required controls, photos, steps, named document-control roles, revision and page number); use iOS Web Share file sheet where supported or browser download fallback. Keep Safari print as optional tab-only action.

**Regression checks:** 34 browser scenarios arranged in four groups, including ten additional checks targeting PDF export, native sharing, archived document status, long pages, photos, symbols and user cancellation. Existing procedure records/keys are unchanged. No migration needed.

**User acceptance test:** In iPhone Home Screen LineGuide, open an existing fictional SOP or SWP > Save / Share PDF > Save to Files > open PDF in Files > verify title, document ID, revision, paragraphs and photos > Print from PDF share sheet. Repeat for an older revision and a multipage procedure. Try Safari browser tab printing as a secondary route.

**Remaining limitations:** Apple iOS native share APIs require physical-device validation; browsers that lack file sharing fall back to downloads. No shared/backed-up procedure repository or authenticated approvals. Some uncommon Unicode glyphs cannot be encoded with the bundled Base-14 PDF fonts; export blocks these with an explicit message so safety-critical notation cannot be silently changed.