"use client";
import { track as vercelTrack } from "@vercel/analytics";

/**
 * Custom events. Vercel Web Analytics only records custom events on Pro and
 * Enterprise plans (https://vercel.com/docs/analytics/custom-events), so they are
 * off unless NEXT_PUBLIC_ANALYTICS_EVENTS=1 is set at build time. Page views work
 * on every plan without this.
 *
 * Properties are coarse buckets only: never file names, transcript text, titles or
 * anything else from the user's video.
 */
type Events = {
  studio_open: { webgpu: boolean };
  video_loaded: { minutes: string };
  clips_found: { clips: string; device: string };
  export_done: { layout: string; fps: number; endcard: boolean };
};

const ENABLED = process.env.NEXT_PUBLIC_ANALYTICS_EVENTS === "1";

export function track<K extends keyof Events>(name: K, props: Events[K]) {
  if (!ENABLED) return;
  try {
    vercelTrack(name, props);
  } catch {
    /* analytics must never break the studio */
  }
}

/** "<5", "5-15", "15-30", "30-60", "60-120", "120+" */
export function minutesBucket(seconds: number) {
  const m = seconds / 60;
  if (m < 5) return "<5";
  if (m < 15) return "5-15";
  if (m < 30) return "15-30";
  if (m < 60) return "30-60";
  if (m < 120) return "60-120";
  return "120+";
}

export function countBucket(n: number) {
  if (n === 0) return "0";
  if (n <= 5) return "1-5";
  if (n <= 10) return "6-10";
  return "11+";
}
