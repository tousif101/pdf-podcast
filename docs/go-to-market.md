# 📣 Go-to-Market Strategy

*Source strategy for launching PDF Podcast. Pairs with [roadmap.md](./roadmap.md) (what to build) and [market-research.md](./market-research.md) (why the product wins). Added 2026-07-31.*

## TL;DR
- **Two personas at launch, no more:** (1) grad students / exam-cramming undergrads as the **volume/viral engine**, (2) document-heavy professionals (analysts, consultants, lawyers, PMs) as the **revenue engine**. One product, two message tracks. Do not try to serve all personas.
- **Position as "listen to your documents on the go, without the hallucinations" — NOT a generic "NotebookLM/Gemini Notebook alternative."** Google renamed NotebookLM → **Gemini Notebook (July 16, 2026)**; it's free and dominant (30M+ users) but structurally weak exactly where we're strong: mobile lock-screen playback, editable scripts, private RSS, source-linked citations.
- **Follow the Podsqueeze playbook** (solo founder → $10K MRR in 5 months): value-first Reddit + AI directories + build-in-public on X + narrow cold outreach, with **SEO comparison content as the durable channel** and Product Hunt as a one-day spike, not a strategy.

## Why now / the opening
The incumbent's weaknesses are our feature list, and they're structural choices Google won't reverse for a mobile-listening niche:
- Audio settings **lock once you hit Generate** → we have (planned) editable scripts before generation.
- Android app widely panned, weak offline → we ship reliable Media Session playback + offline download **today**.
- ~3 free Audio Overviews/day free cap → our credit model is transparent and generous.
- "Source-grounded" but still hallucinates → our read-aloud mode is hallucination-proof; citations (planned) close the trust gap.

Audio-first document consumption is a real paid market: TTS is ~$4–5B in 2025 growing double digits; Speechify ($139/yr or $29/mo) proves both personas pay for exactly our features (offline MP3, speed control, cross-device). Speechify's student discounts + free K-12 access confirm **campus is a proven acquisition channel.**

## WHO — personas, ranked
**Tier 1 (launch focus):**
1. **Grad students & exam-cramming undergrads** — strongest immediate demand, price-sensitive (target sub-$10/mo, student discount precedent). Want: fast conversion of dense readings, offline download, lock-screen playback, trust it didn't hallucinate (graded work). Their subs: r/GetStudying, r/college, r/gradschool, r/lawschool, r/Accounting.
2. **Professionals digesting long docs** — highest willingness to pay, our fastest path to sustainable revenue. Want: reliable background playback, source-linked citations (non-negotiable for legal/financial), editable scripts, private RSS "morning briefing," offline MP3.

**Tier 2 (expand):** 3. Accessibility (dyslexia/ADHD/low-vision — deep demand but incumbent-heavy; supporting message). 4. Commuters (diffuse; reach via 1 & 2). 5. Creators repurposing posts to a personal feed (Substack ships native narration — differentiate on multi-voice/editable/cross-source).

**Tier 3 (later):** Corporate L&D / internal-docs briefings (high-value B2B, longer cycle), language learners, journalists, sales-call prep.

## HOW — channel plan, in priority order
1. **Reddit (value-first, highest-intent early channel).** Podsqueeze's first 10 customers came from one r/podcasting post. Most subs restrict promo — participate genuinely (~9:1 value-to-promo), answer "how do I listen to my readings?" threads, respect karma/age gates. Friendliest: r/SideProject, r/microsaas, r/SaaS (once/60 days + disclosure), r/indiehackers ("SHOW IH" flair).
2. **Build-in-public on X.** Demo GIFs, before/after audio clips, revenue/failure milestones. Compounds into an owned audience that de-risks Product Hunt + the course.
3. **AI tool directories** — There's An AI For That, TopAI.tools, FutureTools.io, Futurepedia. Cheap durable backlinks.
4. **SEO / comparison content (the durable channel — primary long-term investment).** Long-tail, persona-specific ("best way to listen to research papers on your commute," "listen to PDFs on Android," "edit a NotebookLM podcast script") — not the saturated "NotebookLM alternative" head term. This is the floor that survives past launch week and earns ChatGPT/Perplexity citations.
5. **TikTok / YouTube Shorts** — "watch me turn a 40-page PDF into a podcast on my lock screen." Cheap, high-variance, format fits.
6. **Product Hunt — a spike, not a strategy.** Needs a 400–1,000 warm list built over months; launch 12:01 AM PT Tue–Thu; ask for feedback not upvotes. The badge + AI-search indexing are the real prizes.
7. **Partnerships & campus** — cold-email newsletter writers (offer a branded private audio feed of their archive; Substack's "audio grows revenue 2.5× faster" is the pitch), professors (free class licenses), disability offices. Winning cold email is two lines: "I built this for people like you; try it free."
8. **Freemium viral loop** — shareable branded public episode links + "make your own" CTA. Cheapest organic acquisition for this product.

**Start distribution before shipping** — ~75% of launch-only tools see traffic collapse within a month; survivors build the SEO/community floor pre-launch.

## Positioning / naming
- **Do NOT brand as a "Gemini Notebook alternative"** — use that phrase only as an SEO capture layer.
- **Primary hero message:** *"Turn anything you have to read into a podcast you can actually play on your phone, edit before it's made, and trust because every claim links back to the source."* Names the segment (readers-on-the-go) and attacks the incumbent's three weakest points at once.
- Accessibility = strong supporting pillar, not the masthead. Win by getting **narrower**, not out-featuring Google.

## Staged plan
**Stage 1 (pre-launch, wks 0–8): pick the wedge, build the floor.** Students = volume, professionals = revenue. Start X build-in-public now; publish long-tail SEO pages; list on AI directories; seed 5–10 subreddits with genuine value (build karma/age). **Kill-criterion:** if in 6–8 weeks organic Reddit/X posts don't convert to signups, the messaging/wedge is wrong — narrow before spending.

**Stage 2 (launch, wks 8–14): coordinated spike + narrow cold outreach.** Product Hunt once 400+ warm list; cold-email ONE narrow niche (law students / equity-research associates / one newsletter's audience); ship shareable episode links. **Benchmark:** micro-SaaS median $1–3K MRR in ~6 months; if free→paid is well below ~10%, fix onboarding/paywall before scaling spend.

**Stage 3 (months 4–9): durable channel + monetize the audience.** Make SEO comparison/how-to content the primary ongoing investment. Validate a companion **paid** workshop ($19–50, not free) to the build-in-public audience. Then explore B2B (internal-docs briefings, team RSS).

**Pivot thresholds:** if professionals convert dramatically better than students (likely, per willingness-to-pay), flip priority to B2B/professional messaging. If Google adds mobile background playback + editable scripts to Gemini Notebook, pivot hard to the private-RSS + team-briefing niche it won't serve.

## Caveats
- The incumbent is free and moves fast; any single feature is copyable. Defensibility = the **combination** (mobile playback + editing + RSS + citations) aimed at a niche Google underserves, plus community/brand.
- Market-size figures vary widely across firms (TTS CAGR ~3.7%–22.4%); treat as directional, not TAM.
- Competitor traction numbers are self-reported/third-party estimated (Podsqueeze MRR, Jellypod ~10% conversion, Wondercraft $3.5M raise).
- Consumer subscription math is hard solo: a $5/mo app needs 1,000+ payers for $5K MRR — which is why Persona 2 (higher-price RSS/team features) anchors revenue even as Persona 1 drives volume.
