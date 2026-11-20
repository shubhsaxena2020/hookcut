# Hookcut: launch and marketing plan (v1)

> Written 2026-11-20. Product spec: `docs/PRD.md`. Live URL (planned): https://hookcut.vercel.app
> Rules for everything below: original wording, no fake testimonials, no invented stats, and every claim about a competitor carries a source link. Re-check competitor prices on their own pricing pages before publishing any comparison page, because third-party pricing blogs disagree and some are written by competitors.

---

## 1. Positioning

**Category:** AI clipping (long video to vertical Shorts).

**Positioning statement:** For creators who turn long videos into Shorts, Hookcut is the AI clipper that runs entirely in your browser. Your video never leaves your computer, so there's nothing to upload, no queue, no credits and no watermark. Cloud clippers, by contrast, meter you by the source minute and make you wait on their servers.

**One-line pitch:** *Drop in a long video and get captioned, reframed, scored Shorts in minutes. It runs in your browser, so there's no upload, no credits and no watermark.*

Short variants:
- "The AI clipper that never uploads your video."
- "Unlimited AI Shorts. Your GPU, your files, your clips."

### Top 3 differentiators
1. **Local-first, so it's unlimited and free.** Whisper (WebGPU) and WebCodecs run on the user's own machine. There are no server costs per minute, so Hookcut has no credits, no watermark and no monthly minute cap. For contrast, Opus Clip's free plan gives 60 credits a month with a watermark, and its free clips stop being exportable after 3 days ([opus.pro/pricing](https://opus.pro/pricing), [castmagic.io](https://www.castmagic.io/blog/opus-clip-pricing)).
2. **Instant start and privacy.** Nothing is uploaded and there is no render queue. Only transcript text goes to the optional AI re-rank step, and the UI says so plainly. This suits unreleased podcast episodes, client footage and anyone who doesn't want raw footage on a third-party server.
3. **Explainable picks and captions that don't drift.** Every clip shows a "Why this clip" breakdown (hook, payoff, energy, completeness and so on), and the score updates as you drag the trim handles. Caption edits stay locked to word timestamps. Add stacked streamer layouts (gameplay plus a facecam box, set once and reused on every clip) and Hookcut covers the gaming use case in the same tool.

> **Honesty note on the streamer layout.** Split or stacked facecam layouts are not unique. Twitch's own clip editor has a split view ([Yahoo/Engadget](https://www.yahoo.com/tech/twitchs-clip-editor-makes-sharing-043612622.html)), and Eklipse offers facecam templates ([eklipse.gg](https://eklipse.gg/features/eklipse-studio)). The PRD line "the streamer layout competitors lack" should not appear in public copy. The defensible claim is the combination: AI moment-finding plus a stacked layout plus local, unlimited processing, all in one free tool.

### Target ICPs
| ICP | Pain today | What Hookcut gives them | Where they hang out |
|---|---|---|---|
| **Streamers and clippers** (Twitch/Kick/YouTube Live VODs, 2–6 h) | Credit-metered tools get expensive on long VODs; layouts for facecam are fiddly | Unlimited VOD length (up to ~2 h per file in v1), stacked facecam, gaming caption preset | r/Twitch, r/LivestreamFail (consumers, not a promo venue), Discord clipping servers, X gaming |
| **Podcasters** (video podcasts, 45–120 min) | Upload times, privacy of unreleased episodes, caption errors | No upload, fixable captions without drift, SRT/VTT export | r/podcasting, podcast Facebook groups, LinkedIn |
| **Small creators** (YouTube long-form, 0–50k subs) | Can't justify $15–$29/mo; watermark on free tiers | Free core, no watermark, brand kit stored locally | r/NewTubers, r/SmallYTChannel, YouTube Shorts |
| **Agencies / freelance editors** | Client footage privacy; credits burned across many clients | Local processing, unlimited, batch export; v2 team workspace | LinkedIn, X, Upwork/Fiverr editor communities |

---

## 2. SEO keyword plan

### What currently ranks (spot-checked with web search, 2026-11-20)
- **"opus clip alternative free" / "...no watermark":** listicles from alternativeto.net, capcut.com, ssemble.com, riverside.com, rendley.com, plus a set of programmatic guide pages on fluxnote.io and competitor blogs (quso.ai). *Implication:* winnable with one honest, detailed comparison page and listicle outreach. Many of these listicles are vendor-written, so being included in third-party "best free" roundups matters.
- **"twitch clip to tiktok":** tool landing pages from kapwing.com, flexclip.com, eklipse.gg and streamlabs.com (Crossclip). *Implication:* needs a dedicated tool-style landing page (`/twitch-clip-to-tiktok`) with the stacked layout demo above the fold, not a blog post.
- **"ai clip maker no watermark" / "podcast to shorts":** dominated by tool pages (choppity.com, kapwing.com, restream.io, heygen.com, flexclip.com). *Implication:* same pattern; build intent-matched landing pages.

### 20 target keywords
Intent: **T** = transactional (wants a tool now), **C** = commercial investigation (comparing), **I** = informational.

| # | Keyword | Intent | Target page |
|---|---|---|---|
| 1 | opus clip alternative free | C | `/vs/opus-clip` |
| 2 | opus clip alternative no watermark | C | `/vs/opus-clip` |
| 3 | ai clip maker no watermark | T | `/` (home) |
| 4 | free ai clip maker unlimited | T | `/` |
| 5 | ai shorts generator from long video | T | `/` |
| 6 | twitch clip to tiktok | T | `/twitch-clip-to-tiktok` |
| 7 | twitch vod to youtube shorts | T | `/twitch-clip-to-tiktok` (section) |
| 8 | facecam gameplay vertical video | T | `/twitch-clip-to-tiktok` |
| 9 | podcast to shorts ai | T | `/podcast-clips` |
| 10 | podcast clip maker free | T | `/podcast-clips` |
| 11 | auto captions for shorts free | T | `/captions` |
| 12 | add animated captions to video online | T | `/captions` |
| 13 | vizard alternative | C | `/vs/vizard` |
| 14 | klap alternative | C | `/vs/klap` |
| 15 | submagic alternative free | C | `/vs/submagic` |
| 16 | ai video clipper without upload / private | T | `/privacy` + home section |
| 17 | how to find viral moments in a long video | I | blog |
| 18 | how to clip a twitch stream for tiktok | I | blog |
| 19 | best length for youtube shorts clips | I | blog |
| 20 | reframe horizontal video to vertical 9:16 | T | `/reframe` |

On-page basics (already in the PRD): unique title and meta per page, `SoftwareApplication` JSON-LD with `offers.price = 0`, OG images, sitemap. Add `FAQPage` JSON-LD on the `/vs/*` and tool pages.

### 8 blog posts (original, outlines)
1. **How to find the best moments in a 2-hour stream (without watching it twice)**
   - Why VOD scrubbing doesn't scale; the signals that predict a good clip (hook in the first 3 s, payoff, energy spikes, chat-worthy reactions); a manual checklist; how Hookcut scores these automatically; exporting with a facecam stack.
2. **Twitch clip to TikTok: the stacked facecam layout, step by step**
   - Measure your overlay; set the facecam box once; caption placement that avoids the TikTok UI; frame rate (30 vs 60) for gameplay; common mistakes (tiny text, cropped HUD).
3. **Opus Clip alternatives in 2026: an honest comparison of free tiers**
   - Table of free-tier limits with sources and a check date; who each tool is best for (including where Hookcut is the wrong pick, e.g. no direct posting in v1, needs a WebGPU-capable browser); how to test a clipper in 10 minutes.
4. **Why your auto-captions drift out of sync, and how word timestamps fix it**
   - How ASR word timestamps work; why editing text in some editors shifts timing; locking edits to words; a caption QA checklist before posting.
5. **Podcast to Shorts: a weekly workflow for one-person shows**
   - Pick 5 clip candidates per episode; title/hook overlays; SRT export for YouTube; batching; keeping unreleased episodes private by processing locally.
6. **What makes a clip "viral"? The signals behind a virality score (and their limits)**
   - Explain each Hookcut signal in plain terms; why a score is a ranking aid, not a promise; how to A/B your own hooks.
7. **Best length for YouTube Shorts, TikTok and Reels clips: choosing 15, 30, 60 or 90 s**
   - Trade-offs by content type (gaming highlight vs podcast insight); how to end on a full thought; link to platform help pages for current max lengths.
8. **AI video tools that don't upload your footage: how in-browser processing works**
   - WebGPU and WebCodecs in plain English; what leaves the device (Hookcut: transcript text only, for the optional re-rank) and what doesn't; browser support; when cloud tools still make sense.

---

## 3. Launch channels and copy (ready to paste)

### 3.1 Product Hunt
**Name:** Hookcut
**Tagline (60 chars max):** `AI Shorts from long videos, in your browser, no watermark`

**Description (260 chars max):**
> Drop in a long video and Hookcut finds the best moments, then captions, reframes and scores them as vertical Shorts. It all runs in your browser with WebGPU, so there's no upload, no credits, no watermark and no cap. It includes a stacked facecam layout for streamers.

**First comment (maker):**
> Hi PH! I'm the maker of Hookcut.
>
> I kept running into the same loop with AI clippers: upload a 2-hour file, wait in a queue, burn credits, then fix captions that slip out of sync. So I tried something different. Hookcut does the heavy work (transcription with Whisper, face-tracked reframing, encoding) on your own machine, inside the browser.
>
> What that means in practice:
> - **No upload.** Your video file never leaves your computer.
> - **No credits or watermark.** Processing costs me nothing per minute, so the core is free and unlimited.
> - **"Why this clip".** Every suggested clip shows the signals behind its score, and the score updates as you trim.
> - **Captions that stay in sync** when you edit them, with 8 style presets.
> - **Streamer layout:** draw a box over your facecam once, and every clip gets gameplay plus a stacked cam.
>
> Honest limits: it needs a recent Chrome, Edge or Safari 17+; WebGPU makes it much faster (there's a slower WASM fallback); there's no direct posting yet; and it can't download YouTube links in the browser. The optional AI re-rank sends transcript text only, never video.
>
> I'd love your toughest feedback, especially on clip picks. Tell me where it picked a bad moment and I'll tune the scorer.

### 3.2 Reddit

**Read first.** I could not load the live rules pages (reddit.com blocks automated fetches), so the notes below come from third-party mirrors and guides. **Before posting, read each sub's sidebar and pinned posts yourself and message the mods asking whether a disclosed tool post is allowed.** Post from an account with genuine history in that sub. Post once, answer every comment, and don't cross-post the same text on the same day.

What the sources say:
- **r/NewTubers:** a mirrored rules wiki mentions self-promotion limited to once a week, no all-caps titles and a required flair. Video links go in the weekly Feedback Friday thread ([mirror of rules](https://r.datuan.dev/r/newtube/wiki/rules), [Feedback Friday mirror](https://lr.eu.psf.lt/r/NewTubers/comments/1gs0zql/feedback_friday_post_your_videos_here_if_you_want)). Another mirror shows a line saying "No self-promotion or content links", so confirm with the mods.
- **r/Twitch:** its rules include a "Third-Party Tools" section ([2020 mirror](https://redlib.hyperreal.coffee/r/Twitch)); the current wording isn't confirmed. Note that **r/TwitchStreaming** reportedly has zero tolerance for third-party advertising ([hiveindex](https://thehiveindex.com/communities/r-twitchstreaming/)), so do not post there.
- **r/podcasting:** promotion of products and services is reportedly restricted outside designated threads or without mod approval ([podcasthost guide](https://www.thepodcasthost.com/promotion/reddit-for-podcasters/)). Ask the mods first. If they say no, only mention Hookcut when someone directly asks for a tool.

**r/NewTubers** (flair: "Tools/Resources" or whatever the closest available flair is; text post, link in a comment only if the rules allow):
> **Title:** I built a free in-browser tool that turns long videos into Shorts (no upload or watermark). Looking for blunt feedback
>
> Disclosure: I made this. It's free, there's no signup, and I'm not selling anything right now.
>
> Like a lot of people here, I couldn't justify $15–30 a month for a clipper while my channel is small, and free tiers kept adding watermarks. So I built Hookcut. It runs in your browser: you drop in a video, it transcribes on your own GPU, suggests clips with a score and the reasons behind it, adds captions and reframes to 9:16. Nothing gets uploaded.
>
> What I'd really like from this sub:
> 1. Run one of your long videos through it. Did it pick the moments you'd pick?
> 2. Which caption style actually fits small-channel Shorts?
> 3. Anything confusing in the first 2 minutes of using it?
>
> Known limits: Chrome/Edge/Safari 17+, much faster with a decent GPU, and no YouTube-link import (browsers can't legally or technically do that). Happy to answer anything.

**r/Twitch** (only if the mods OK it; otherwise answer "how do you clip VODs" threads with a disclosed one-line mention):
> **Title:** Made a free tool for turning VODs into vertical clips with a stacked facecam. It runs locally in the browser, so feedback from streamers would help
>
> Disclosure up front: I'm the developer. It's free, with no account and no watermark.
>
> The workflow: download your VOD (or part of it), drop it into Hookcut, and draw a box around your facecam once. It finds candidate moments using speech, volume spikes and reactions, then exports 1080×1920 clips with gameplay on top and your cam stacked below, plus captions. The processing happens on your PC in the browser, so a 2-hour VOD doesn't have to be uploaded anywhere.
>
> What I'm unsure about and would love input on:
> - Does the facecam stack look right for your overlay, or do you need the cam on top?
> - Which moments does it miss? Quiet clutch plays are hard to detect from audio alone.
> - Would you want Kick/YouTube Live presets?
>
> It won't pull clips from a Twitch URL yet; you need the file. Thanks for any honest takes.

**r/podcasting** (ask the mods first; use the designated thread if they point you to one):
> **Title:** Free tool for making video-podcast clips without uploading your episode. I'm the dev and would like feedback from podcasters
>
> I'm the developer, so take this as a disclosed share. Mods approved this post *(only keep this line if true)*.
>
> I built Hookcut for people who record video podcasts and want Shorts but don't love uploading unreleased episodes to a cloud service. It runs in the browser: transcription, clip finding, captions and the 9:16 reframe all happen on your own machine. You can fix caption text without the timing drifting, and export SRT/VTT for YouTube.
>
> Questions for the sub:
> - For interview shows, should the reframe follow whoever is speaking, or would you rather have a fixed two-person split?
> - Is a "virality score" useful to you, or is a plain "best moments" ranking enough?
>
> Free, no account, no watermark. I'll reply to everyone.

### 3.3 X/Twitter launch thread
> **1/** I built an AI clipper that never uploads your video.
>
> Hookcut turns a long video into captioned, reframed vertical Shorts, entirely in your browser. No credits, no watermark, no queue.
>
> hookcut.vercel.app 🧵
>
> **2/** Most clippers bill by the source minute because they run your video on their GPUs. Hookcut runs Whisper (WebGPU) and WebCodecs on yours, so the core costs nothing to run and stays free and unlimited.
>
> **3/** It finds candidate clips using several signals: a hook in the first 3 s, a payoff at the end, energy spikes, whether it's a complete thought, and keyword novelty. Every clip shows its "why", and the score updates live as you trim. [GIF: score bars moving while dragging trim]
>
> **4/** Captions: 8 styles, word-level animation, and edits stay locked to word timestamps, so fixing a typo doesn't push everything out of sync. [GIF]
>
> **5/** For streamers: draw a box over your facecam once, and every clip exports as gameplay on top with your cam stacked below. 1080×1920, 30 or 60 fps. [GIF]
>
> **6/** Privacy: the video file never leaves your device. The optional AI re-rank sends transcript text only, and the app tells you when it does.
>
> **7/** Limits, honestly: it needs Chrome/Edge/Safari 17+, a GPU helps a lot, there's no direct posting yet, and it can't import YouTube links in-browser.
>
> **8/** It's free right now. Try it on your longest video and tell me where it picked a bad clip, because that's the feedback I want most. hookcut.vercel.app

### 3.4 LinkedIn post
> Most AI video tools are priced by the minute because the video runs on their servers.
>
> I wanted to see what happens if it doesn't.
>
> Hookcut is a clipping tool I've been building that turns long videos (podcasts, webinars, streams) into captioned vertical Shorts, and it does all the heavy work inside your browser. Transcription, finding the best moments, reframing to 9:16 and encoding all happen on your own machine.
>
> Three things that follow from that:
> → Client footage and unreleased episodes never get uploaded.
> → There are no credits and no watermark, because processing doesn't cost anything per minute.
> → You can start right away, with no upload bar and no render queue.
>
> Each suggested clip also shows why it was picked, so you're not just trusting a black-box score.
>
> It's free to use now: hookcut.vercel.app
>
> If you run a podcast or an agency that repurposes long-form content, I'd value 10 minutes of your honest feedback. Comment or DM me.

### 3.5 YouTube Shorts demo script (about 40 s, 9:16, made with Hookcut itself)
| Time | Visual | Voiceover / on-screen text |
|---|---|---|
| 0–2 s | A 2-hour video file dragged onto the browser; a timer overlay appears | VO: "This is a two-hour stream. Watch this." On-screen: **2:03:41 of footage** |
| 2–7 s | The progress bar runs; clip cards start appearing while transcription is still going | VO: "No upload. It's processing right here, on my laptop." |
| 7–14 s | Clip grid with scores; zoom into the "Why this clip" bars | VO: "It finds the moments and shows you why each one was picked." |
| 14–21 s | Drag a trim handle; the score changes; edit a caption word and it stays in sync | VO: "Trim it, and the score updates. Fix a caption, and it stays in sync." |
| 21–29 s | Facecam box drawn once; preview flips to gameplay plus stacked cam | VO: "Streamers: draw your facecam box once, and every clip gets the stacked layout." |
| 29–35 s | Click "Export all"; the MP4s land in the downloads folder; no watermark visible | VO: "Export all of them. No watermark, no credits." |
| 35–40 s | End card: Hookcut wordmark + URL | VO: "Hookcut. Free, in your browser." On-screen: **hookcut.vercel.app** |

Recording notes: use footage you own. The timings shown must come from a real run on stated hardware, and you should add a small "recorded on <laptop/GPU>" caption, so the speed isn't overstated.

---

## 4. 14-day launch calendar
Day 1 is the first day the production URL is stable and the export E2E test passes. Product Hunt goes on Day 8; aim for a Tuesday–Thursday, launching at 00:01 PT.

| Day | Focus | Tasks |
|---|---|---|
| 1 | Readiness | Turn on Vercel Web Analytics + custom events (§6). Smoke-test on Chrome, Edge and Safari 17. Record a raw demo run and note the hardware. |
| 2 | Assets | Cut the 40 s demo Short (§3.5) and 3 GIFs (score bars, caption edit, facecam stack). Make OG images. Prepare the PH gallery (5 images + video). |
| 3 | SEO base | Publish `/vs/opus-clip` and `/twitch-clip-to-tiktok`. Submit the sitemap to Google Search Console and Bing Webmaster Tools. |
| 4 | Content | Publish blog posts #1 and #2. Post the demo Short on YouTube Shorts and TikTok. |
| 5 | Soft launch | Share with 10–20 creators you know personally and ask for written feedback (no reviews requested). Fix the top issues. |
| 6 | Reddit prep | Message the mods of r/NewTubers, r/Twitch and r/podcasting with the drafts. Keep commenting helpfully in those subs (no links). |
| 7 | PH prep | Schedule the PH launch, write the first comment, and line up people who would genuinely try it (ask them to try it and comment honestly, not to upvote). |
| 8 | **Product Hunt launch** | Go live; post the X thread and the LinkedIn post; reply to every PH comment within an hour all day. |
| 9 | Reddit #1 | Post to r/NewTubers (or its weekly thread) if allowed. Publish blog post #3 (the honest alternatives comparison). |
| 10 | Reddit #2 | Post to r/Twitch if mods OK'd it. Share a facecam-stack clip on X/TikTok. |
| 11 | Reddit #3 + content | Post to r/podcasting if OK'd. Publish blog post #5 (podcast workflow). |
| 12 | Listicles | Email authors of the "best free AI clipper / Opus Clip alternative" roundups (one short, factual pitch each). Submit to AlternativeTo and directories such as There's An AI For That and Futurepedia. |
| 13 | Iterate | Ship a changelog entry with fixes from feedback; post "what we changed from your feedback" on X/LinkedIn. |
| 14 | Review | Check metrics against §6 targets; decide which channel gets week 3; start the Pro waitlist count. |

---

## 5. Growth loops

1. **"Made with Hookcut" end card (opt-in, off by default).**
   - Export setting: "Add a 1-second end card". It is never a watermark over the clip. The card shows a small wordmark and `hookcut.vercel.app/?ref=<code>`.
   - The referral code is generated locally and stored in IndexedDB; there are no accounts in v1. Attribution happens via the `ref` query parameter on the landing page (count it as an analytics event).
   - Reward: none needed in v1, so keep it honest. In v2 (with accounts), give referrers a free month of Pro per activated referral.
   - Copy in the setting: "Help Hookcut stay free: add a tiny end card to your clips. You can turn it off any time."
2. **Shareable public clip pages (v2, needs cloud sync).**
   - `hookcut.app/c/<id>`: the clip plays with its title, a "Why this clip" breakdown and a "Make clips like this" CTA. The creator explicitly publishes each one; pages are private by default.
   - SEO benefit: indexable pages with transcripts (only with the creator's consent; add `noindex` by default and an opt-in to index).
3. **Comparison and alternative pages (now).**
   - `/vs/opus-clip`, `/vs/vizard`, `/vs/klap`, `/vs/submagic`, `/vs/quso`, plus `/alternatives`.
   - Format: a factual table (free tier, watermark, credits, upload required, streamer layout, direct posting) with a source link and "checked on <date>" per cell, plus a section "When <competitor> is the better choice". Re-verify quarterly.
   - No competitor logos or copied wording (per the PRD).
4. **Tool-intent landing pages.** `/twitch-clip-to-tiktok`, `/podcast-clips`, `/captions` and `/reframe` each have the app embedded or a one-click "Open studio with this preset" button. Each page is a keyword entry point that leads straight to activation.
5. **Creator-made demos.** Every clip exported with the end card is a micro-ad. Encourage it with a "Share your best Hookcut clip" thread on X; repost with permission and credit.

---

## 6. Metrics to track

**North-star metric:** weekly clips exported.

| Stage | Metric | Definition |
|---|---|---|
| Acquisition | Unique visitors by source | Vercel Web Analytics referrers + `utm_source` / `ref` |
| Capability | Supported-browser rate | % of `/app` visits with WebCodecs available; also WebGPU vs WASM split |
| Activation | **First export** | % of new `/app` visitors who export ≥1 MP4 in their first session |
| Time to value | Time to first candidate / first export | Median seconds from file drop to first clip card and to first export; split by WebGPU/WASM |
| Engagement | Clips per session; caption edits; layout used | Signals whether the AI picks needed fixing and which layouts matter |
| Quality | Pick acceptance rate | % of suggested clips that get exported (a low rate means the scorer needs work) |
| Retention | Return within 7 days | Same browser returns (anonymous; localStorage flag, no PII) |
| Referral | End-card opt-in rate; `ref` visits | Loop health |
| Monetization (later) | Pro waitlist sign-ups | Count only; no promises on dates |

Set targets after the first 2 weeks of real data rather than guessing them now.

**Analytics setup (simple, privacy-friendly):**
- **Vercel Web Analytics:** free on the Hobby plan; cookieless page views and referrers. Add `@vercel/analytics` and `<Analytics />` in the root layout.
- **Custom events:** `track('file_dropped', {sizeBucket, durationBucket})`, `track('first_candidate', {ms, backend})`, `track('export', {count, layout, fps})`, `track('caption_edit')`, `track('endcard_optin')`, `track('unsupported_browser', {missing})`. Never send file names, transcript text or other content. Note: custom events may require a paid Vercel plan, so check the current Vercel docs; if they're unavailable, use a free cookieless alternative (self-hosted Umami, or PostHog's free tier with autocapture off).
- **Vercel Speed Insights** for Core Web Vitals on the landing page (Lighthouse targets are in the PRD).
- **Google Search Console** for keyword impressions on the §2 pages.
- Mention analytics plainly on `/privacy`.

---

## 7. Pricing strategy

### Competitor reference points (verify before publishing; sources vary)
| Tool | Free tier | Entry paid | Source |
|---|---|---|---|
| Opus Clip | 60 credits/mo, watermark, free clips exportable for 3 days | Starter $15/mo; Pro $29/mo ($14.50/mo billed yearly); Business custom, API on Business only | [opus.pro/pricing](https://opus.pro/pricing), [castmagic.io](https://www.castmagic.io/blog/opus-clip-pricing), [quso.ai](https://quso.ai/blog/opus-clip-pricing) |
| Vizard | Free plan exists | Creator $29/user/mo; Business $39/user/mo | [Capterra](https://www.capterra.com/p/10009818/Vizard/pricing/), [GetApp](https://www.getapp.com/website-ecommerce-software/a/vizard-1) |
| Submagic | Limited/trial | Starter about $19/mo (about $12/mo yearly); higher tiers reported inconsistently | [hooked.so](https://www.hooked.so/compare/submagic-pricing), [toolsurf.com](https://www.toolsurf.com/submagic-pricing-2026/) |
| Klap | Unconfirmed; check klap.app | Reported from about $23 to $29/mo (sources disagree) | [kompozy.io](https://kompozy.io/compare/klap-vs-vizard); verify on klap.app before citing |
| Quso | Vendor says 75 min/mo, no watermark; another source says free exports are watermarked at 720p | n/a | [quso.ai (vendor)](https://quso.ai/blog/opus-clip-free), [fluxnote.io](https://fluxnote.io/guides/opus-clip-alternative-free-no-watermark) |

### Strategy
- **Now: Free core, permanently.** Everything in PRD v1 stays free: unlimited length and exports, no watermark, all caption styles, all layouts, brand kit, SRT/VTT. This is sustainable because the compute runs on the client; the only marginal cost is the optional `/api/rank` LLM call, which is rate-limited and falls back to the heuristic scorer. Promise publicly: "Local processing will always be free." Don't promise more than that.
- **Later: Pro**, charging only for things that genuinely cost money to run (servers, storage, platform APIs):
  - cloud sync of projects and brand kits across devices;
  - direct posting and scheduling to YouTube, TikTok and Instagram;
  - higher limits or a better model for the AI re-rank (titles, hooks, hashtags);
  - public clip pages with analytics.
- **Later: Team**, adding shared workspaces, shared brand kits, roles and client folders for agencies.

### Suggested price points
| Plan | Monthly | Yearly | Rationale |
|---|---|---|---|
| Free | $0 | $0 | The local core is the product's whole wedge; never paywall it |
| Pro | **$9/mo** | **$79/yr** (about $6.60/mo) | Below Opus Clip Starter ($15) and Submagic Starter (~$19), because the clipping itself is already free; Pro sells convenience, not minutes |
| Team | **$19/seat/mo** (min 2) | $180/seat/yr | Well under Vizard Business ($39/user) and Opus Business (custom) for small agencies |

Pricing rules: no credits ever; flat prices; cancel in one click (cancellation billing complaints about cloud clippers are noted in the PRD's research, so make painless cancellation a visible promise); a 14-day refund window. Validate the price with the Pro waitlist first. On `/pricing`, show "Pro: coming soon" with a mailto or waitlist, and no dates or features you haven't committed to.
