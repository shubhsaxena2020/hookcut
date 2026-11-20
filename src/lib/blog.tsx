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
          <Link href="/app">Try it on your last stream</Link>.
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
          replace without drift. <Link href="/app">Open the studio</Link> and try fixing a name.
        </p>
      </>
    ),
  },
];

export function getPost(slug: string) {
  return POSTS.find((p) => p.slug === slug);
}
