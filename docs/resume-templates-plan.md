# Resume templates — design contract

Twelve templates render as twelve genuinely different layouts. This file is the
shared contract so the preview, the thumbnails and the PDF export never drift.

## Where things live

| Concern | File |
| --- | --- |
| Template list + per-template design settings | `src/types/resume.ts` (`TEMPLATE_INFO`) |
| The single renderer that draws every template | `src/components/ResumePreview.tsx` |
| Print / page rules per template | `src/styles/globals.css` (`.resume-preview[data-template="…"]`) |
| Thumbnails in the builder and Settings | `src/components/TemplateThumbnail.tsx` |

## Rules for every template

1. **One column of normal document flow.** No absolute positioning, no tables,
   no content in headers or footers. That is what an ATS parser reads.
2. **Real text only.** Section headings are `<h2>`, never images or icons.
3. **Dates sit with the role**, so "Title — Company" and "2020 – 2024" stay
   together when the parser flattens the page.
4. **Contact details are one plain line**, separated by `|` or `·`.
5. **Two accent colours at most**, and never on body text.
6. Body text stays readable at 9.5–11px, headings 11–13px.
7. The container keeps `id="resume-preview-content"` — the PDF export
   photographs that exact element.

## The twelve templates

| Template | Layout key | Hook | Heading style | Notes |
| --- | --- | --- | --- | --- |
| Modern | `modern` | Thick role line, highlights box on top | Small caps + accent rule | Highlights box appears when there are 2+ bullets |
| Corporate | `corporate` | Centered header, conservative | Centered + full rule | Skills split into two plain columns |
| Executive | `executive` | Large name, letter-spaced headings | Uppercase, long thin rule | Highlights first, skills tucked lower |
| Technical | `technical` | Monospace name and `> role` line | `// SECTION` with left accent bar | Adds a Stack line, Projects before Experience |
| Graduate | `graduate` | Education first, centered | Heading on a grey band | For students and new grads |
| Creative ATS-Safe | `creative` | Accent bar down the header | Small caps + accent rule | Skills as outlined chips |
| Government | `government` | Centered, no colour at all | Plain bold, no decoration | Long bullet lists come first |
| Academic | `academic` | Serif name, centered | Centered small caps, hairline | Serif body, dates in a left column |
| Minimal | `minimal` | Lots of white space | Plain text + thin underline | Nothing extra beyond the sections |
| Elegant | `elegant` | Serif name | Centered small caps, hairline | Awards and languages high up |
| Sidebar | `sidebar` | Accent rail on the right | Small caps + accent rule | Skills, certs, education, languages in the rail |
| Compact One-Page | `compact` | Name and role on one line | Heading on a grey band | 9.5px body, only the 3 latest roles |

## Spaces that are not templates

- The builder's preview area is the **only** place a template is applied to a
  document. The Settings screen picks a **default** for new resumes.
- The picker shows a drawn thumbnail (see `TemplateThumbnail`) so the user can
  see the shape before committing.

## ATS caveat worth keeping

`sidebar` sets `atsSafe: false` in `TEMPLATE_INFO`. The `resume-preview` role in
the builder reads that flag and warns the user, because older parsers can drop a
side rail. Every other template stays single-column.

## Adding another template

1. Add the key to `TemplateType` and to `TEMPLATE_INFO` (with `layout`,
   `accent` and `atsSafe`).
2. Add the layout to `TemplateLayout` and write its `LayoutFn` in
   `LAYOUTS` in `src/components/ResumePreview.tsx`.
3. Add its entry to `DESIGN` (font, size, gap, heading) and a
   `.resume-preview[data-template="…"]` padding rule in `globals.css`.
4. Add its thumbnail in `src/components/TemplateThumbnail.tsx`.
5. Run `npx tsc -b` — the `Record<TemplateLayout, …>` maps will name anything
   you forgot to fill in.
