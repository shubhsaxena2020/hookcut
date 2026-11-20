import type { ReactNode } from "react";
import Link from "next/link";

export type Post = {
  slug: string;
  title: string;
  description: string;
  date: string; // ISO
  readMins: number;
  body: ReactNode;
};

export const POSTS: Post[] = [
  {
    slug: "twitch-clip-to-tiktok-stacked-facecam",
    title: "Twitch clip to TikTok: the stacked facecam layout, step by step",
    description:
      "How to turn a horizontal Twitch clip into a vertical TikTok with your facecam on top and gameplay below: measuring the overlay, caption placement, frame rate and the mistakes that make clips hard to watch.",
    date: "2026-11-21",
    readMins: 6,
    body: (
      <>
        <p>
          A Twitch stream is 16:9 with your webcam in a corner. A TikTok is 9:16. If you just crop the
          middle, you lose either your face or the game. The stacked layout solves this: your facecam
          fills the top of the vertical frame and the gameplay fills the rest. Here is how to set it up
          so it looks deliberate rather than squeezed.
        </p>
        <h2>1. Measure your overlay before you cut anything</h2>
        <p>
          Open a frame from the VOD and look at where your camera actually sits. Most overlays put a
          frame or border around the webcam, and some add alerts or a name plate next to it. Decide
          whether that border belongs in the clip. Usually it does not: crop just inside it so the top
          of the Short shows your face, not your overlay.
        </p>
        <p>
          Check two or three moments from different parts of the stream. If you moved your camera or
          switched scenes mid-stream, the box that works at the start may cut your head off later.
        </p>
        <h2>2. Set the facecam box once, not per clip</h2>
        <p>
          The slow way is to reposition the crop for every clip. Once your overlay is fixed, the webcam
          is in the same place for the whole stream, so the box should be too. In Hookcut you drag a
          box over the webcam in the Layout tab and choose to apply it to every clip in the project.
          Then each new clip comes out stacked without any extra work.
        </p>
        <p>
          The split matters as much as the box. A cam that takes 35 to 40 percent of the height leaves
          enough room for the gameplay to stay readable. Go much bigger and the game becomes a strip;
          go smaller and your reactions, which are often the point of the clip, get lost.
        </p>
        <h2>3. Keep captions out of the app&apos;s way</h2>
        <p>
          TikTok, Shorts and Reels all draw their own interface over your video: the caption text and
          account name near the bottom, and the like, comment and share buttons down the right side.
          The exact layout changes between apps and versions, so there is no single safe margin to
          memorise. Two habits cover most cases:
        </p>
        <ul>
          <li>put the captions around the seam between the cam and the gameplay, or just below it, rather than at the very bottom;</li>
          <li>keep lines short (one to three words) so they never run under the buttons on the right.</li>
        </ul>
        <p>
          Then watch the export on your phone in the actual app before you post. That one check catches
          more problems than any template.
        </p>
        <h2>4. Choose 30 or 60 fps on purpose</h2>
        <p>
          Fast games with quick camera turns look noticeably smoother at 60 frames per second. Slower
          games and talking segments look the same at 30 and make smaller files that export faster. If
          you streamed at 30 fps, exporting at 60 adds nothing, because there are no extra frames to
          show. Match the export to the source, and drop to 30 when the clip is mostly you talking.
        </p>
        <h2>5. Avoid the common mistakes</h2>
        <ul>
          <li>
            <strong>Tiny text.</strong> Captions sized for a desktop screen are unreadable on a phone.
            Use a large, bold, outlined style, and fewer words per line.
          </li>
          <li>
            <strong>A cropped HUD.</strong> If the clip is about your health bar, score or kill feed, make
            sure the gameplay crop includes it. Centre-cropping a wide game often cuts off exactly the
            corner that explains what happened.
          </li>
          <li>
            <strong>Starting too late.</strong> The play that matters needs a second or two of setup. Start
            the clip where a viewer can tell what is about to happen.
          </li>
          <li>
            <strong>Overlay leftovers.</strong> Chat boxes and alert pop-ups in the gameplay area are noise
            in a Short. Pick a moment where they are not covering the action, or trim around them.
          </li>
        </ul>
        <h2>Doing it in Hookcut</h2>
        <p>
          Drop in the VOD file, draw the facecam box once, and Hookcut finds candidate moments using
          speech, energy spikes and reactions, then exports each one at 1080 by 1920 with your cam
          stacked on top and captions burned in. It runs in your browser, so the stream is never
          uploaded. <Link prefetch={false} href="/twitch-clip-to-tiktok">Open the stream preset</Link> to
          start with the stacked layout and gaming captions already set.
        </p>
      </>
    ),
  },
  {
    slug: "podcast-to-shorts-weekly-workflow",
    title: "Podcast to Shorts: a weekly workflow for one-person shows",
    description:
      "A repeatable routine for turning each video podcast episode into five Shorts: choosing moments, writing hooks, fixing captions, exporting caption files and keeping unreleased episodes private.",
    date: "2026-11-21",
    readMins: 6,
    body: (
      <>
        <p>
          If you make a podcast on your own, clips are the job that gets skipped. Recording and editing
          the episode already takes the week. The fix is not a bigger effort once in a while; it is a
          small routine that takes about an hour per episode and runs the same way every time.
        </p>
        <h2>1. Aim for five clips, not twenty</h2>
        <p>
          Five strong clips spread across a week beat twenty average ones posted in a burst. It also
          makes the selection easier: you are looking for the five moments a stranger would stop
          scrolling for, not for every interesting sentence.
        </p>
        <p>
          Good podcast clips tend to be one of three things: a clear opinion stated in the first
          sentence, a short story with an ending, or a surprising fact with the reason behind it. If a
          moment needs the previous ten minutes to make sense, leave it for the full episode.
        </p>
        <h2>2. Let the transcript do the first pass</h2>
        <p>
          Reading is faster than listening. Transcribe the episode, skim it, and mark candidate moments.
          A tool can rank these for you. Hookcut scores sentence-aligned windows on the hook in the first
          three seconds, the payoff at the end, vocal energy and whether the clip is a complete thought,
          and it shows those reasons for each pick so you can disagree with it quickly.
        </p>
        <h2>3. Write the hook as text, too</h2>
        <p>
          Many people watch with the sound off. A short title on screen for the first three seconds
          tells them why to keep watching. Keep it under about eight words and make it a claim or a
          question, not a label. &ldquo;Episode 42 highlights&rdquo; gives no reason to stay;
          &ldquo;Why we stopped posting every day&rdquo; does.
        </p>
        <h2>4. Fix names once</h2>
        <p>
          Automatic captions are most often wrong on names: your guest, a company, a place. Fix each one
          once with find and replace across the clip instead of word by word. In Hookcut the timing of
          every word stays where it was spoken, so corrections do not push the captions out of sync.
          (There is a <Link href="/blog/captions-that-stay-in-sync">longer explanation of why captions drift</Link>.)
        </p>
        <h2>5. Export caption files for YouTube</h2>
        <p>
          Burned-in captions work everywhere, but YouTube also accepts separate caption files, which
          viewers can turn on and off and which are searchable text. YouTube lists SubRip (.srt) and
          WebVTT (.vtt) among its supported formats (
          <a href="https://support.google.com/youtube/answer/2734698" rel="noopener" target="_blank">
            YouTube Help: supported subtitle and closed caption files
          </a>
          ), and you can upload them in YouTube Studio (
          <a href="https://support.google.com/youtube/answer/2734796" rel="noopener" target="_blank">
            YouTube Help: add subtitles and captions
          </a>
          ). Hookcut exports both formats for each clip, timed to the clip itself rather than the full
          episode.
        </p>
        <h2>6. Batch the boring parts</h2>
        <p>Do the same steps in the same order for every episode:</p>
        <ul>
          <li>drop in the episode as soon as the edit is locked;</li>
          <li>pick five clips, fix names, and set one caption style you always use;</li>
          <li>export all five in one go;</li>
          <li>write five titles and descriptions in one sitting and schedule them across the week.</li>
        </ul>
        <p>
          Saving your logo, colours and caption style as a brand kit means every clip starts looking
          like your show without any extra clicks.
        </p>
        <h2>7. Keep unreleased episodes private</h2>
        <p>
          Clips are often made before the episode goes out, which means the full recording is still
          private. Cloud tools need the file uploaded to their servers. Hookcut processes it in your
          browser instead: the video never leaves your computer, and only the optional AI titles step
          sends transcript text, which you can leave switched off.
        </p>
        <p>
          <Link prefetch={false} href="/podcast-to-shorts">Open the podcast preset</Link> to start with
          face-tracked reframing and 60-second clips.
        </p>
      </>
    ),
  },
  {
    slug: "find-best-moments-in-a-long-stream",
    title: "How to find the best moments in a 2-hour stream",
    description:
      "A practical method for pulling 10 strong Shorts out of a long stream or podcast: what to listen for, how to judge a hook, and how to avoid clips that start mid-thought.",
    date: "2026-11-20",
    readMins: 7,
    body: (
      <>
        <p>
          A two-hour stream holds maybe ten minutes that strangers would watch. The hard part is not
          editing those ten minutes; it is finding them without scrubbing through two hours of
          footage. Here is the method we built into Hookcut, which also works by hand.
        </p>
        <h2>1. Listen for energy before you read anything</h2>
        <p>
          The loudest moments are not always the best, but the best moments are almost never the
          quietest. Look at the waveform of the whole stream and mark the spikes: laughter, shouting,
          a sudden change in pace. In a typical gaming stream these spikes cluster around wins,
          fails and chat interactions. In a podcast they cluster around disagreements and stories.
        </p>
        <p>
          Energy is relative. A calm speaker&apos;s peak is a loud speaker&apos;s baseline, so compare
          each moment with the rest of the same video, not with an absolute level.
        </p>
        <h2>2. Judge the first three seconds harshly</h2>
        <p>
          On a vertical feed, a viewer decides within about three seconds. Strong openings tend to
          share a few traits:
        </p>
        <ul>
          <li>a question (&ldquo;Do you know why this map is broken?&rdquo;);</li>
          <li>a number or a bold claim (&ldquo;I lost 40,000 coins in ten seconds&rdquo;);</li>
          <li>direct address (&ldquo;you&rdquo;, &ldquo;look at this&rdquo;, &ldquo;watch&rdquo;);</li>
          <li>a reaction word: &ldquo;wait&rdquo;, &ldquo;no way&rdquo;, &ldquo;what&rdquo;.</li>
        </ul>
        <p>
          If a candidate opens with &ldquo;so, and then he&rdquo;, it depends on context the viewer
          does not have. Move the start back to where the thought begins, or drop the clip.
        </p>
        <h2>3. Make sure there is a payoff</h2>
        <p>
          A hook without a payoff gets swiped away and hurts the next clip too. The last few seconds
          should resolve something: the punchline lands, the play succeeds or fails, the speaker
          reacts. Energy that rises toward the end of a window is a good sign.
        </p>
        <h2>4. Keep clips as complete thoughts</h2>
        <p>
          Cut on sentence boundaries. Starting and ending on full sentences makes a 30-second clip
          feel finished, while mid-word cuts feel like an accident. Add a fifth of a second of
          padding so the first syllable is not clipped.
        </p>
        <h2>5. Prefer what is unusual in this video</h2>
        <p>
          If every segment of a stream mentions the same game, that game is not what makes a clip
          special. The words that appear in one moment and rarely elsewhere usually mark the story
          worth telling. Hookcut measures this with a simple keyword-rarity score across the
          transcript.
        </p>
        <h2>6. Do not let clips overlap</h2>
        <p>
          The five best-scoring windows are often the same moment shifted by a few seconds. Once you
          pick a clip, rule out anything that overlaps it, then pick the next best. This alone turns
          a list of near-duplicates into ten distinct Shorts.
        </p>
        <h2>Doing it automatically</h2>
        <p>
          Hookcut runs all six checks on every sentence-aligned window of your video and shows you
          the breakdown for each clip, so you can see why it was picked and overrule it. It runs in
          your browser, so a two-hour stream never has to be uploaded.{" "}
          <Link prefetch={false} href="/app">Try it on your last stream</Link>.
        </p>
      </>
    ),
  },
  {
    slug: "captions-that-stay-in-sync",
    title: "Why edited captions drift out of sync, and how to stop it",
    description:
      "Auto captions are rarely perfect, and fixing them often breaks the timing. Here is why that happens and how word-level timing keeps every correction in sync.",
    date: "2026-11-18",
    readMins: 5,
    body: (
      <>
        <p>
          Every automatic caption tool gets some words wrong: names, slang, product terms. Fixing
          them should take seconds. In many editors it causes a second problem: after the fix, the
          captions no longer match the voice. Here is why.
        </p>
        <h2>Line timing versus word timing</h2>
        <p>
          Many tools store captions as lines: a block of text with one start time and one end time.
          Word highlighting is then estimated by spreading the line&apos;s duration across its
          words, often in proportion to their length. When you edit the text, the estimate is
          recalculated from the new text. Replace a short word with a long one and every following
          word in the line shifts. Merge two lines and the estimate stretches across a pause.
        </p>
        <p>
          The result is the familiar drift: the highlighted word runs ahead of or behind the
          speaker, and the fix you made becomes a new error.
        </p>
        <h2>Keep the timing on the word</h2>
        <p>
          Speech models such as Whisper can return a start and end time for each word. If each word
          keeps its own timing as the source of truth, editing becomes safe:
        </p>
        <ul>
          <li>changing a word&apos;s text never changes when it is spoken;</li>
          <li>splitting or merging lines only changes how words are grouped on screen;</li>
          <li>find and replace across a clip touches the text and nothing else.</li>
        </ul>
        <h2>What about words the model missed?</h2>
        <p>
          Sometimes the model merges two words into one or misses a short word. Splitting a word
          divides its own time span between the parts, and nothing outside that span moves. The
          rest of the clip stays locked.
        </p>
        <h2>Check timing where it matters</h2>
        <p>
          A quick review pass catches most issues: play the first three seconds, any line you
          edited, and the final punchline. Those are the places viewers notice.
        </p>
        <p>
          Hookcut keeps word-level timing for every caption and lets you edit, split, merge and
          replace without drift. <Link prefetch={false} href="/app">Open the studio</Link> and try fixing a name.
        </p>
      </>
    ),
  },
];

export function getPost(slug: string) {
  return POSTS.find((p) => p.slug === slug);
}
