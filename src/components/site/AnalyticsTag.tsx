"use client";
import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";

const KEEP = /^(ref|utm_source|utm_medium|utm_campaign)$/;

/** Cookieless page views. Query strings are reduced to the referral and campaign keys. */
export function AnalyticsTag() {
  return (
    <Analytics
      beforeSend={(event: BeforeSendEvent) => {
        try {
          const u = new URL(event.url);
          for (const k of [...u.searchParams.keys()]) if (!KEEP.test(k)) u.searchParams.delete(k);
          u.hash = "";
          return { ...event, url: u.toString() };
        } catch {
          return event;
        }
      }}
    />
  );
}
