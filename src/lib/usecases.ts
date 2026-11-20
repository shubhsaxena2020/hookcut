import type { Source } from "./compare";

/** Studio presets a landing page can open with: /app?preset=<key> */
export type StudioPreset = "stream" | "podcast" | "talk";

export type UseCase = {
  slug: string;
  preset: StudioPreset;
  kicker: string;
  title: string;
  metaTitle: string;
  description: string;
  lead: string;
  cta: string;
  presetNote: string;
  steps: [string, string][];
  points: [string, string][];
  limits: { text: string; source?: Source }[];
  faq: [string, string][];
  related: { href: string; label: string }[];
};

export const USE_CASES: UseCase[] = [
  {
    slug: "twitch-clip-to-tiktok",
    preset: "stream",
    kicker: "Twitch to TikTok",
    title: "Turn Twitch VODs into TikToks, with your facecam stacked",
    metaTitle: "Twitch clip to TikTok: stacked facecam, free, no watermark",
    description:
      "Turn a Twitch VOD or clip into vertical TikToks and YouTube Shorts with gameplay on the bottom and your facecam stacked on top. Free, in your browser, no upload.",
    lead: "Drop in your VOD, draw a box over your webcam once, and Hookcut finds the moments worth posting. Every clip exports at 1080 by 1920 with your cam above the gameplay and captions on top. It runs in your browser, so a two-hour stream never gets uploaded.",
    cta: "Open the studio with the stream preset",
    presetNote: "Opens with the stacked layout, Gaming captions and 30-second clips. You can change all of it.",
    steps: [
      ["Get the video file", "Download the past broadcast or highlight from your Twitch dashboard, or use a local recording from your streaming software."],
      ["Drop it into Hookcut", "MP4, MOV, WebM or MKV, up to about two hours. Transcription runs on your GPU while the first clips appear."],
      ["Draw your facecam box once", "In the Layout tab, drag a box over your webcam. Every clip in the project reuses it."],
      ["Export for TikTok and Shorts", "1080 by 1920 MP4 at 30 or 60 fps, captions burned in, no watermark. Export one clip or all of them."],
    ],
    points: [
      ["Stacked layout that remembers your cam", "Set the box once per stream instead of once per clip. Change how much of the frame the cam takes with one slider."],
      ["Picks you can check", "Each clip shows why it scored: hype in the voice, a hook in the first seconds, a payoff at the end. Drag the edges and the score updates."],
      ["Gaming captions that stay readable", "Big, outlined words with keyword colour. Fix a misheard name and the timing stays on the word."],
      ["60 fps when the game needs it", "Fast shooters look better at 60 fps; talky segments are fine at 30. Choose per clip."],
    ],
    limits: [
      { text: "Hookcut cannot pull clips from a Twitch URL. Browsers cannot download Twitch video directly, so you need the file." },
      { text: "Quiet clutch plays are hard to detect from audio alone. Scan the clip list for moments the scorer missed and trim them yourself." },
      { text: "It needs a recent desktop Chrome, Edge or Safari 17+. WebGPU makes transcription much faster." },
    ],
    faq: [
      [
        "How do I put my facecam on top of gameplay for TikTok?",
        "Choose the Stacked layout and drag a box over your webcam in the source video. Hookcut crops the cam into the top of the 9:16 frame and the gameplay into the rest, on every clip.",
      ],
      [
        "Can I turn a Twitch VOD into YouTube Shorts too?",
        "Yes. The export is a standard 1080 by 1920 MP4, which works for YouTube Shorts, TikTok and Instagram Reels.",
      ],
      [
        "Is there a watermark or a limit on clips?",
        "No. Hookcut is free with no watermark and no clip limit, because the processing runs on your own computer.",
      ],
    ],
    related: [
      { href: "/blog/twitch-clip-to-tiktok-stacked-facecam", label: "Step by step: the stacked facecam layout" },
      { href: "/blog/find-best-moments-in-a-long-stream", label: "How to find the best moments in a 2-hour stream" },
    ],
  },
  {
    slug: "podcast-to-shorts",
    preset: "podcast",
    kicker: "Podcast to Shorts",
    title: "Turn every podcast episode into a week of Shorts",
    metaTitle: "Podcast to Shorts: free AI podcast clip maker, no upload",
    description:
      "Find the best moments in a video podcast and turn them into captioned vertical Shorts, plus SRT files for YouTube. Free, private, runs in your browser.",
    lead: "Drop in a full episode and Hookcut transcribes it, ranks the moments that work on their own and reframes them to vertical around whoever is speaking. Unreleased episodes stay on your computer the whole time.",
    cta: "Open the studio with the podcast preset",
    presetNote: "Opens with face-tracked reframing, Karaoke captions and 60-second clips. You can change all of it.",
    steps: [
      ["Export the episode as video", "Use the full recording from your editor or recording tool. MP4, MOV, WebM or MKV, up to about two hours."],
      ["Let Hookcut find the moments", "Whisper transcribes with word timestamps on your machine. Clips are cut on sentence boundaries, so each one is a complete thought."],
      ["Fix names and titles", "Correct a guest's name once with find and replace. Timing stays locked to each word, so nothing drifts."],
      ["Export clips and caption files", "1080 by 1920 MP4s with burned-in captions, plus SRT or VTT files for platforms that take separate captions."],
    ],
    points: [
      ["Private by design", "The video file never leaves your computer. Only if you switch on AI titles is transcript text sent, and the studio says so."],
      ["Clips that stand on their own", "The scorer rewards a clear opening, a payoff and a complete thought, and penalises clips that start with “so” or “and he”."],
      ["Face-tracked reframing", "Auto mode follows the speaker with smoothed motion. Fit with a blurred background keeps both hosts in frame."],
      ["Caption files included", "Download SRT or VTT for each clip, timed to the clip itself, not the full episode."],
    ],
    limits: [
      { text: "Auto reframe follows one face at a time. For a wide two-person shot, the fit-with-blurred-background layout keeps both people in view." },
      { text: "Very long episodes use a lot of memory in the browser. Up to about two hours works well on most laptops." },
      {
        text: "YouTube accepts SRT and WebVTT caption files, so the caption downloads can go straight to YouTube Studio.",
        source: { label: "YouTube Help: supported caption files", url: "https://support.google.com/youtube/answer/2734698" },
      },
    ],
    faq: [
      [
        "Is my unreleased episode uploaded anywhere?",
        "No. Decoding, transcription, scoring and encoding all happen in your browser tab. Projects are saved in your browser's storage and you can delete them at any time.",
      ],
      [
        "How many clips will it find in an episode?",
        "Up to 20, depending on length. Near-duplicate windows are filtered out so each clip is a different moment, and you can trim or extend any of them.",
      ],
      [
        "Can I choose the clip length?",
        "Yes: 15, 30, 60 or 90 seconds. Clips start and end on full sentences, so actual lengths vary a little around the target.",
      ],
    ],
    related: [
      { href: "/blog/podcast-to-shorts-weekly-workflow", label: "A weekly podcast-to-Shorts workflow" },
      { href: "/blog/captions-that-stay-in-sync", label: "Why edited captions drift out of sync" },
    ],
  },
  {
    slug: "youtube-video-to-shorts",
    preset: "talk",
    kicker: "YouTube to Shorts",
    title: "Turn your long YouTube videos into Shorts",
    metaTitle: "YouTube video to Shorts: free AI Shorts maker, no watermark",
    description:
      "Turn your own long YouTube videos into captioned, reframed YouTube Shorts. Hookcut finds the best moments and explains why. Free, no watermark, no upload.",
    lead: "Your back catalogue is full of Shorts. Drop in a long video you made and Hookcut finds the moments with a strong hook and a payoff, captions every word and reframes it to 9:16. It runs in your browser, so there is no upload and no queue.",
    cta: "Open the studio with the YouTube preset",
    presetNote: "Opens with face-tracked reframing, Bold Pop captions and 30-second clips. You can change all of it.",
    steps: [
      ["Use your original file", "The best quality is the file you edited. If you only have the upload, YouTube Studio can download your own videos."],
      ["Drop it into Hookcut", "Candidate clips appear while transcription is still running, each with a score and the reasons behind it."],
      ["Polish the best ones", "Pick a caption style, adjust the hook title for the first three seconds and trim on the word track."],
      ["Export and post", "1080 by 1920 MP4 ready for YouTube Shorts, with copy-ready title, description and hashtags."],
    ],
    points: [
      ["Hooks first", "The scorer looks hard at the first three seconds: a question, a number, a bold claim or direct address all count."],
      ["Explainable scores", "No black box. Every clip lists hook, payoff, energy, emotion, completeness, novelty and visuals."],
      ["Eight caption styles", "From loud single-word punches to a quiet lower third, with your brand font and colours saved locally."],
      ["No watermark, ever", "Exports are clean on the free studio, with no credits to buy."],
    ],
    limits: [
      { text: "You cannot paste a YouTube link. Browsers cannot download YouTube videos, so Hookcut needs the file." },
      {
        text: "YouTube Studio downloads of your own videos are limited to 720p or 360p, so use your original edit when you have it.",
        source: { label: "YouTube Help: download videos you've uploaded", url: "https://support.google.com/youtube/answer/56100" },
      },
      { text: "It needs a recent desktop Chrome, Edge or Safari 17+." },
    ],
    faq: [
      [
        "Can I make Shorts from a YouTube link?",
        "Not directly. Browsers cannot download YouTube videos. If the video is yours, use your original file or download it from YouTube Studio, then drop it in.",
      ],
      [
        "What length should my Shorts be?",
        "Hookcut lets you target 15, 30, 60 or 90 seconds. Shorter clips suit one punchline; longer clips suit a story or an explanation. Check YouTube's help pages for the current maximum length.",
      ],
      [
        "Is it really free?",
        "Yes. Hookcut runs on your computer, so there are no per-minute server costs, no credits and no watermark.",
      ],
    ],
    related: [
      { href: "/blog/find-best-moments-in-a-long-stream", label: "How to find the best moments in a long video" },
      { href: "/vs/opus-clip", label: "Hookcut vs Opus Clip" },
    ],
  },
];

export function getUseCase(slug: string) {
  return USE_CASES.find((u) => u.slug === slug);
}
