"use client";

/** "Made with Hookcut" end card. Off by default; stored only in this browser. */
export type EndCard = {
  on: boolean;
  /** show hookcut's URL with ?ref=<code> */
  withRef: boolean;
  /** random code made in this browser; not tied to any account or person */
  ref: string;
};

const KEY = "hookcut.endcard.v1";

function newRef() {
  const abc = "abcdefghjkmnpqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(bytes, (b) => abc[b % abc.length]).join("");
}

export function loadEndCard(): EndCard {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const v = JSON.parse(raw) as Partial<EndCard>;
      return { on: !!v.on, withRef: !!v.withRef, ref: typeof v.ref === "string" && v.ref ? v.ref : newRef() };
    }
  } catch {
    /* storage may be blocked */
  }
  return { on: false, withRef: false, ref: newRef() };
}

export function saveEndCard(e: EndCard) {
  try {
    localStorage.setItem(KEY, JSON.stringify(e));
  } catch {
    /* ignore */
  }
}
