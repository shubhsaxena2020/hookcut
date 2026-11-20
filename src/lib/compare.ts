/**
 * Facts for the /vs/* comparison pages. Every claim about a competitor carries a
 * source. Official pricing pages were re-read on CHECKED; where an official page
 * did not show a number (for example prices rendered only in another currency),
 * the third-party source from docs/MARKETING.md is cited and labelled as such.
 */
export const CHECKED = "2026-11-21";
export const PRICE_NOTE = "As of Nov 2026, verify on their site";

export type Source = { label: string; url: string };
export type Row = {
  label: string;
  hookcut: string;
  them: string;
  source?: Source;
  price?: boolean;
};
export type Competitor = {
  slug: string;
  name: string;
  /** keyword-led title for the page */
  title: string;
  description: string;
  intro: string;
  rows: Row[];
  theyFit: string[];
  weFit: string[];
  faq: [string, string][];
};

const HOOKCUT_ROWS = {
  where: "On your computer, in the browser tab. The video file is never uploaded.",
  price: "Free. No credits, no export limit.",
  watermark: "None, on every export",
  posting: "Not yet. You download the MP4 and post it yourself.",
  api: "No API",
  team: "No team workspace yet",
};

const OPUS_PRICING: Source = { label: "opus.pro/pricing", url: "https://www.opus.pro/pricing" };
const VIZARD_PRICING: Source = { label: "vizard.ai/pricing", url: "https://vizard.ai/pricing" };
const KLAP_PRICING: Source = { label: "klap.app/pricing", url: "https://klap.app/pricing" };
const SUBMAGIC_PRICING: Source = { label: "submagic.co/pricing", url: "https://www.submagic.co/pricing" };

export const COMPETITORS: Competitor[] = [
  {
    slug: "opus-clip",
    name: "Opus Clip",
    title: "Opus Clip alternative: free, no watermark, no upload",
    description:
      "Hookcut vs Opus Clip, compared on free-plan limits, watermarks, credits, posting and privacy, with a source for every claim.",
    intro:
      "Opus Clip is the best-known AI clipper. It runs in the cloud: you send it a video, it processes it on its servers and you spend credits as you go. Hookcut does the same job on your own computer, so there is nothing to meter. Here is how the two compare, including where Opus Clip is the better pick.",
    rows: [
      {
        label: "Where the video is processed",
        hookcut: HOOKCUT_ROWS.where,
        them: "On their servers. Media you add is stored there; on the free plan it expires after 3 days.",
        source: OPUS_PRICING,
      },
      {
        label: "Free plan",
        hookcut: HOOKCUT_ROWS.price,
        them: "Free plan with watermarked exports, kept for 3 days",
        source: OPUS_PRICING,
      },
      {
        label: "Free monthly allowance",
        hookcut: "Unlimited",
        them: "60 credits a month; a credit is roughly one minute of source video (third-party summary)",
        source: { label: "castmagic.io", url: "https://www.castmagic.io/blog/opus-clip-pricing" },
      },
      {
        label: "Paid plans",
        hookcut: "None yet. A paid Pro plan for cloud features is planned; the browser studio stays free.",
        them: "Starter $15/mo, Pro $29/mo, Business custom",
        source: OPUS_PRICING,
        price: true,
      },
      {
        label: "Watermark",
        hookcut: HOOKCUT_ROWS.watermark,
        them: "On free exports; removed on paid plans",
        source: OPUS_PRICING,
      },
      {
        label: "Posting and scheduling",
        hookcut: HOOKCUT_ROWS.posting,
        them: "Posting to YouTube Shorts, TikTok and Instagram from Starter; a scheduler from Pro",
        source: OPUS_PRICING,
      },
      {
        label: "API",
        hookcut: HOOKCUT_ROWS.api,
        them: "Included on Pro and Business",
        source: OPUS_PRICING,
      },
      {
        label: "Team workspace",
        hookcut: HOOKCUT_ROWS.team,
        them: "From Pro (2 users per pack, up to 4); unlimited seats on Business",
        source: OPUS_PRICING,
      },
    ],
    theyFit: [
      "You want to post or schedule straight to YouTube, TikTok and Instagram from the same tool.",
      "You work on a phone, a Chromebook or an older laptop. Cloud processing does not care how fast your machine is.",
      "You need a shared team workspace or an API for automated clipping.",
    ],
    weFit: [
      "You clip long videos often and do not want to watch a credit balance.",
      "Your footage is private: unreleased episodes, client work, anything you would rather not upload.",
      "You want to see why each clip was picked, and keep captions in sync when you fix a word.",
      "You stream and want a stacked facecam layout on every clip without paying per minute.",
    ],
    faq: [
      [
        "Is Hookcut a free Opus Clip alternative with no watermark?",
        "Yes. Hookcut is free, has no credits and never adds a watermark. It can do this because transcription, scoring and encoding run on your own computer, so a long video costs nothing extra to process.",
      ],
      [
        "What does Opus Clip do that Hookcut does not?",
        "Today: direct posting and scheduling, team workspaces, an API, and working well on low-powered devices. Hookcut needs a recent desktop Chrome, Edge or Safari 17+, and runs much faster with WebGPU.",
      ],
      [
        "Are these prices current?",
        `We read Opus Clip's pricing page on ${CHECKED}. Prices change, so check opus.pro/pricing before you decide.`,
      ],
    ],
  },
  {
    slug: "vizard",
    name: "Vizard",
    title: "Vizard alternative: unlimited clips without the upload",
    description:
      "Hookcut vs Vizard on free-plan limits, export quality, watermarks, scheduling and privacy, with a source for every claim.",
    intro:
      "Vizard is a cloud clipper with a virality score, reframing and social scheduling. Its free plan is credit-based with limits on upload length and export quality. Hookcut runs in your browser instead, so it has no allowance to run out of. Here is a side-by-side comparison, including the cases where Vizard is the better fit.",
    rows: [
      {
        label: "Where the video is processed",
        hookcut: HOOKCUT_ROWS.where,
        them: "On their servers; free-plan storage expires after 3 days",
        source: VIZARD_PRICING,
      },
      {
        label: "Free plan",
        hookcut: HOOKCUT_ROWS.price,
        them: "60 credits a month; uploads up to 60 minutes and 1 GB",
        source: VIZARD_PRICING,
      },
      {
        label: "Free export quality",
        hookcut: "1080 by 1920 at 30 or 60 fps",
        them: "720p exports on the free plan",
        source: VIZARD_PRICING,
      },
      {
        label: "Watermark",
        hookcut: HOOKCUT_ROWS.watermark,
        them: "Watermark removal is not included on the free plan",
        source: VIZARD_PRICING,
      },
      {
        label: "Paid plans",
        hookcut: "None yet; the browser studio stays free",
        them: "Creator about $29 per user/mo, Business about $39 per user/mo (third-party listing; the official page did not show USD prices when we checked)",
        source: { label: "Capterra", url: "https://www.capterra.com/p/10009818/Vizard/pricing/" },
        price: true,
      },
      {
        label: "Posting and scheduling",
        hookcut: HOOKCUT_ROWS.posting,
        them: "Scheduling social posts on Creator and Business",
        source: VIZARD_PRICING,
      },
      {
        label: "Team features",
        hookcut: HOOKCUT_ROWS.team,
        them: "Team members, shared projects and brand kit on Business",
        source: VIZARD_PRICING,
      },
    ],
    theyFit: [
      "You want scheduling to social platforms in the same tool.",
      "You need shared projects and a team brand kit.",
      "Your computer is slow or you work on mobile, so local processing would drag.",
    ],
    weFit: [
      "You want full 1080p exports with no watermark without paying.",
      "Your source videos run longer than an hour and you would rather not split them to fit a limit.",
      "You prefer that raw footage never leaves your machine.",
      "You want a stacked gameplay-and-facecam layout and an explainable score for every clip.",
    ],
    faq: [
      [
        "Is there a free Vizard alternative without a watermark?",
        "Hookcut is free with no watermark and no credits. It runs on your computer, so there is no per-minute cost to pass on.",
      ],
      [
        "Does Hookcut have a virality score like Vizard?",
        "Yes, and it shows its working: every clip lists the signals behind its score (hook, payoff, energy, emotion, completeness, novelty and visuals), and the score updates as you trim.",
      ],
      [
        "Are these numbers current?",
        `We read vizard.ai/pricing on ${CHECKED}. Its USD prices were not visible to us, so the paid prices above come from a third-party listing. Check Vizard's own page before deciding.`,
      ],
    ],
  },
  {
    slug: "klap",
    name: "Klap",
    title: "Klap alternative: free AI clips you can actually download",
    description:
      "Hookcut vs Klap on free trial limits, clip-based pricing, auto-posting and privacy, with a source for every claim.",
    intro:
      "Klap turns long videos into shorts in the cloud and charges by the number of clips you make. You can try it on one video for free, but downloading needs a paid plan. Hookcut is free to download from the first clip, because it does the processing on your own computer. Here is the comparison, including where Klap is the stronger choice.",
    rows: [
      {
        label: "Where the video is processed",
        hookcut: HOOKCUT_ROWS.where,
        them: "On their servers (cloud service)",
        source: KLAP_PRICING,
      },
      {
        label: "Free option",
        hookcut: "Free, including downloads, with no limit",
        them: "Try it free on 1 video with no card; downloading and posting clips need a paid plan",
        source: KLAP_PRICING,
      },
      {
        label: "Paid plans",
        hookcut: "None yet; the browser studio stays free",
        them: "Basic $29/mo (100 clips), Pro $79/mo (300 clips), Pro+ $189/mo (1,000 clips); half price per month when billed yearly",
        source: KLAP_PRICING,
        price: true,
      },
      {
        label: "How usage is counted",
        hookcut: "It is not counted",
        them: "By clips made, not minutes; source videos up to 3 hours",
        source: KLAP_PRICING,
      },
      {
        label: "Posting and scheduling",
        hookcut: HOOKCUT_ROWS.posting,
        them: "Scheduling and publishing to TikTok, YouTube, Instagram, LinkedIn and Facebook on every paid plan",
        source: KLAP_PRICING,
      },
      {
        label: "API",
        hookcut: HOOKCUT_ROWS.api,
        them: "Separate, pay-per-use API",
        source: KLAP_PRICING,
      },
    ],
    theyFit: [
      "You want clips scheduled to five social networks without leaving the tool.",
      "You need an API to automate clipping at volume.",
      "You do not have a computer that can run AI transcription in the browser.",
    ],
    weFit: [
      "You want to download clips without a subscription.",
      "You make a lot of clips per video and do not want a per-clip budget.",
      "Your footage is private and you would rather not upload it.",
      "You want to audit why each clip was picked and keep captions in sync while editing.",
    ],
    faq: [
      [
        "Can I use Klap for free?",
        `According to Klap's pricing page (read on ${CHECKED}), you can try it on one video for free, but downloading and posting clips needs a paid plan. Hookcut is free to download, with no plan needed.`,
      ],
      [
        "Why is Hookcut free when cloud clippers are not?",
        "Cloud clippers pay for the servers that process your video, so they charge per clip or per minute. Hookcut runs on your machine, so the heavy work costs us nothing.",
      ],
      [
        "What is Hookcut missing compared with Klap?",
        "Auto-posting, scheduling and an API. Hookcut also needs a recent desktop browser, while Klap works on any device that can upload a file.",
      ],
    ],
  },
  {
    slug: "submagic",
    name: "Submagic",
    title: "Submagic alternative: free captions and AI clips, no upload",
    description:
      "Hookcut vs Submagic on plans, AI clip limits, watermarks, publishing and privacy, with a source for every claim.",
    intro:
      "Submagic is best known for animated captions, and its plans include Magic Clips, which turns long videos into shorts, up to a monthly limit. Hookcut combines word-level animated captions and AI clipping in a free browser tool with no limits. Here is how they compare, including when Submagic is the better choice.",
    rows: [
      {
        label: "Where the video is processed",
        hookcut: HOOKCUT_ROWS.where,
        them: "On their servers (cloud service)",
        source: SUBMAGIC_PRICING,
      },
      {
        label: "Free option",
        hookcut: HOOKCUT_ROWS.price,
        them: "No free plan listed; a free trial is offered, with limits not stated on the pricing page",
        source: SUBMAGIC_PRICING,
      },
      {
        label: "AI clips from long videos",
        hookcut: "Unlimited",
        them: "Magic Clips included, up to 5, 15 or 37 long videos a month on Starter, Pro and Business (up to 3 hours each)",
        source: SUBMAGIC_PRICING,
      },
      {
        label: "Paid plans",
        hookcut: "None yet; the browser studio stays free",
        them: "Starter reported at about $19/mo, about $12/mo billed yearly (third-party; the official page showed us regional pricing)",
        source: { label: "hooked.so", url: "https://www.hooked.so/compare/submagic-pricing" },
        price: true,
      },
      {
        label: "Watermark",
        hookcut: HOOKCUT_ROWS.watermark,
        them: "No watermark from Starter",
        source: SUBMAGIC_PRICING,
      },
      {
        label: "Publishing",
        hookcut: HOOKCUT_ROWS.posting,
        them: "Social publishing and analytics from Pro",
        source: SUBMAGIC_PRICING,
      },
      {
        label: "API",
        hookcut: HOOKCUT_ROWS.api,
        them: "API minutes included on every plan, more on Business",
        source: SUBMAGIC_PRICING,
      },
    ],
    theyFit: [
      "You mostly edit short videos you already have and want a polished caption and editing tool.",
      "You want publishing and analytics in the same place.",
      "You need an API, or you work on a device that cannot run AI in the browser.",
    ],
    weFit: [
      "You start from long videos and want as many clips as you like each month.",
      "You want captions whose timing stays locked to each word when you fix the text.",
      "You would rather keep raw footage on your own machine.",
      "You stream and want a stacked facecam layout.",
    ],
    faq: [
      [
        "Is there a free Submagic alternative?",
        "Hookcut is free, with eight caption styles, word-level timing and AI clip finding, and no watermark. It runs in your browser, so there are no monthly limits.",
      ],
      [
        "Does Hookcut have animated captions?",
        "Yes. There are eight styles, from a karaoke highlight to a big single-word punch, with keyword colour, emoji, size, stroke and position controls. Each word keeps its own timestamp, so edits never drift.",
      ],
      [
        "Why are Submagic's prices marked third-party?",
        `When we read submagic.co/pricing on ${CHECKED}, it showed prices in a regional currency, not USD. The USD figure comes from a third-party tracker. Check Submagic's own page for the price in your region.`,
      ],
    ],
  },
];

export function getCompetitor(slug: string) {
  return COMPETITORS.find((c) => c.slug === slug);
}
