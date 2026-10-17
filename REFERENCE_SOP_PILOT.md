# Palletiser SOP — LineGuide reference pilot

**Status:** Design and testing reference only. **NOT approved for operational use.**

This pilot is based on the **six-page palletiser operators' SOP provided by the user**. The original source remains outside the public GitHub repository. The app uses its **five activity groups** as a practical, guided test of creating one clearly organised SOP rather than splitting the uploaded document into separate procedures.

| Original PDF page(s) | Guided LineGuide activity | What to compare |
|---|---|---|
| 1–2 | Recipe access and selection | Authorised access, recipe choice, HMI photos, confirmation |
| 2–4 | Cell preparation and start-up | Cell checks, programme states, approved safeguarding and re-start instructions |
| 4–5 | Normal operation and full pallet change | Layer/position status, full pallet change, expected machine response |
| 5 | Part pallet / batch changeover | Part pallet and product changeover flow |
| 5–6 | Production totals | Totals display, authorised recording/reset |

## Workflow design

- Home screen prioritises **Start palletiser SOP test**, using the existing four-stage LineGuide builder.
- The draft preselects **SOP**, operator audience, procedure title and pilot purpose. Site, line and asset are supplied by the user; real site data is not embedded into the public source.
- Stage 3 has the five source-derived activity labels. **Add instruction step** continues within an activity; **Next activity** advances to the next. **Other** allows additional activities when justified.
- Long drafts are easier to edit because populated instruction cards collapse to short summaries. Each step supports an action, expected result, optional verification, warning, original-source page, photograph and caption.
- The Review stage shows which of the five source activities have at least one step. A partial pilot can be saved as a Draft; the approval path checks coverage and named review information. Coverage is not a safety check.
- Generated document and PDF have visible activity subheadings, photo captions, revision information and **DRAFT / NOT FOR OPERATIONAL USE** status.
- The app library and any older saved procedures remain intact; unrelated demo data is no longer preloaded on a fresh installation.

## Private reference import

A separate optional **local JSON test import** was generated from the uploaded source. It contains 16 condensed, unapproved test steps and six original equipment photos. It is **not included in the GitHub repository**. The document's printed supervisor password is deliberately omitted. The private test import is distributed to the user only through the ChatGPT conversation.

To test: back up the existing LineGuide library, open **Library → Import backup**, select the local JSON test file, confirm import, and search for **Palletiser Operators SOP**. Do not enter company secrets into the public GitHub source code.

## Safety and source fidelity

The imported example is a **review copy**, not an approved SOP. It condenses the source into the five activities and highlights areas requiring competent machine-specific verification, especially safeguards, zone status, machine-cell entry, stored energy, cycle resets and return to service. It must not be used to operate machinery. Source text must not be construed as a verified safety method or a licence to bypass site procedures.

## Acceptance test

- [ ] The user recognises all five areas of the original source.
- [ ] Every step appears under the correct activity.
- [ ] HMI photos and their captions match the intended steps.
- [ ] SOP language, sequence and safety controls are reviewed against approved current instructions.
- [ ] No credential is present in app records or exported PDF.
- [ ] Mobile viewing is easy to follow, with no forced sideways scrolling.
- [ ] Full document exports to a readable, searchable PDF with numbered steps, page numbers, document control and no clipping.
- [ ] Draft, search, reopen, edit and revision history work after saving.
- [ ] A locally exported JSON backup can be restored safely.

**Current limits:** Browser-only local storage; approvals not authenticated; not a company-controlled document repository; real iPhone Safari behaviour and actual procedure technical accuracy require human testing.