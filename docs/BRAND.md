# `/m:os` brand adoption record

This is the consumer-side workflow for the stock and flow mapper, using the official `mos-brand` consumer intake template and protocol. No source-repository intake CLI ran in this separate workspace. No files were written to `mos-brand`, and this record does not claim automated routing or validation. The local intake data is in [BRAND-INTAKE.json](BRAND-INTAKE.json).

## Adopted workflow

The mapper is presented as a distinct `/m:os` service named “stock and flow mapper.” Its descriptor stays separate from the exact parent family lockup, which appears as a small endorsement. The exact parent logo asset was copied unchanged from the source; it was not redrawn. This codebase has no registered family member record, so `familyMember` remains `null` and the mapper’s family status is not represented as approved.

The app uses paper `#F7F5EE`, white `#FFFFFF`, ink `#111111`, soft `#4B4943`, blue `#1F3FBF`, red `#D6281F`, yellow `#F2C200`, and quiet `#ECEAE2`. Figtree, DM Sans, Heebo, and JetBrains Mono files are bundled with their OFL license texts. Blue marks inquiry and evidence attention, red marks assumptions under challenge or interruption, and yellow marks possibility, tension, or reframe. Evidence status and causal direction are also written as text or shown with line patterns and arrow marks.

## Selected source segments

Read-only source: private `jsagir/mos-brand`, default branch. SHAs identify the source content used for this local implementation.

| Segment | Source path | Source SHA | Use |
|---|---|---|---|
| Consumer intake template | `segments/governance/intake/entries/2026-10-19/consumer-template.json` | `83b83242c9fb8d8ad8de81355f176a7ba4d22186` | Shape of the local intake record |
| Intake protocol | `segments/governance/intake/entries/2026-10-19/PROTOCOL.md` | `604832645c71ca7e43dbd565ca7c27802c3c1721` | Workflow and provenance expectations |
| Intake schema | `segments/governance/intake/entries/2026-10-19/intake.schema.json` | `70b9f174f0c1545744aa0842d85d51569082414c` | Consumer contract fields and allowed surface values |
| Family architecture context | `segments/family/architecture/entries/2026-10-19/CONTEXT.md` | `76805d2ecc424daec7baf74cff22eb9d32f65329` | Separate family identity from service presentation |
| Family architecture | `segments/family/architecture/entries/2026-10-19/ROOM.md` | `73ee241aa819aa69be3e6ef6d00162e63865e0c8` | Family/service relationship |
| Family brief | `segments/family/architecture/entries/2026-10-19/asset-232768adb4.md` | `4dec7c6238dc8691d5f89b7db071c17b68ac4186` | Positioning and naming constraints |
| Family architecture guidance | `segments/family/architecture/entries/2026-10-19/content.html` | `17e9bd2c1abaeb8681c6bd4790cf82bc2809d281` | Distinct service job, identity and parent endorsement |
| Shared color rules | `segments/foundations/color/entries/2026-10-19/content.html` | `430269ebe1d8448d9fca2e5e447eb3359895befd` | Palette, contrast and semantic color meanings |
| Shared typography rules | `segments/foundations/typography/entries/2026-10-19/content.html` | `a3d0e5d810d6a111f83ddc5ba0b04ca17639cfa2` | Font families, weights and bilingual direction |
| Inherited brand rules | `references/brand-rules.md` | `3d7e7a2a6150bbde23ab1505b97819427ee8f0c0` | Product/family presentation rules |
| Parent logo contract | `segments/identity/logo/entries/2026-10-19/content.html` | `8a0866f784a6651db44d48564759bea13a77a7cd` | Exact asset use and endorsement behavior |
| Parent lockup SVG | `segments/identity/logo/variants/entries/2026-10-19/asset-acdd881a87.svg` | `f921bedf981339babcd1bcaf4c536df22e7b947a` | Unmodified parent endorsement asset |
| Figtree variable font | `segments/family/architecture/entries/2026-10-19/assets/Figtree-variable.woff2` | `05ce657de89207cf12c6a6457c4a1c83ea520626` | Bundled family font |
| DM Sans variable font | `segments/family/architecture/entries/2026-10-19/assets/DM-Sans-variable.ttf` | `c672f98060af9b2c85fca704ebd5ad9a8717c1df` | Bundled family font |
| Heebo variable font | `segments/family/architecture/entries/2026-10-19/assets/Heebo-variable.ttf` | `b51ed9b4f20d2f51663d10f8a8debea63792d39a` | Bundled family font |
| JetBrains Mono variable font | `segments/family/architecture/entries/2026-10-19/assets/JetBrains-Mono-variable.ttf` | `aa310be8b717fe3774f9444dd89d5f4101cc6d10` | Bundled family font |

The exact downloaded assets and their licenses are under `src/app/assets/`. Distribution keeps the App self-contained by embedding these local assets in the generated HTML. Font source SHAs and the logo SHA are provenance references, not claims that the source intake workflow ran.
