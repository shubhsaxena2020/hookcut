"use client";

import { useEffect, useRef, useState } from "react";
import type { BrandKit } from "@/lib/store/brand";
import type { CaptionFont, CaptionPreset } from "@/lib/types";
import { FONT_OPTIONS, PRESETS, PRESET_ORDER } from "@/lib/captions/presets";
import { Btn, Field, inputCls } from "./ui";

export function BrandKitDialog({
  brand,
  onClose,
  onSave,
}: {
  brand: BrandKit;
  onClose: () => void;
  onSave: (b: BrandKit, applyAll: boolean) => void;
}) {
  const [b, setB] = useState(brand);
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);

  const onLogo = async (file: File) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.src = url;
    await img.decode();
    const scale = Math.min(1, 400 / Math.max(img.width, img.height));
    const c = document.createElement("canvas");
    c.width = Math.round(img.width * scale);
    c.height = Math.round(img.height * scale);
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    URL.revokeObjectURL(url);
    setB({ ...b, logo: c.toDataURL("image/png") });
  };

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-2xl border border-night-line bg-night-1 p-0 text-night-text backdrop:bg-black/60"
      aria-labelledby="brand-title"
    >
      <div className="p-6">
        <h2 id="brand-title" className="font-display text-xl font-black">
          Brand kit
        </h2>
        <p className="mt-1 text-sm text-night-muted">Saved in this browser and applied to new clips.</p>
        <div className="mt-5 space-y-4">
          <Field label="Logo watermark (your own)" htmlFor="logo">
            <div className="flex items-center gap-3">
              {b.logo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={b.logo} alt="Your logo" className="h-10 w-auto rounded bg-night p-1" />
              )}
              <input
                id="logo"
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                className="text-sm"
                onChange={(e) => e.target.files?.[0] && onLogo(e.target.files[0])}
              />
              {b.logo && (
                <Btn variant="quiet" onClick={() => setB({ ...b, logo: null })}>
                  Remove
                </Btn>
              )}
            </div>
          </Field>
          <Field label="Default caption style" htmlFor="b-preset">
            <select id="b-preset" className={inputCls} value={b.preset} onChange={(e) => setB({ ...b, preset: e.target.value as CaptionPreset })}>
              {PRESET_ORDER.map((p) => (
                <option key={p} value={p}>
                  {PRESETS[p].label}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Caption font" htmlFor="b-font">
              <select id="b-font" className={inputCls} value={b.font ?? ""} onChange={(e) => setB({ ...b, font: (e.target.value || null) as CaptionFont | null })}>
                <option value="">Style default</option>
                {FONT_OPTIONS.map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </select>
            </Field>
            <Field label="Accent (progress bar)" htmlFor="b-accent">
              <input id="b-accent" type="color" value={b.accent} onChange={(e) => setB({ ...b, accent: e.target.value })} className="h-9 w-full rounded-lg border border-night-line bg-night" />
            </Field>
          </div>
          <Field label="Spoken word colour" htmlFor="b-hl">
            <div className="flex items-center gap-3">
              <input id="b-hl" type="color" value={b.highlight ?? "#ffe14a"} onChange={(e) => setB({ ...b, highlight: e.target.value })} className="h-9 w-20 rounded-lg border border-night-line bg-night" />
              {b.highlight && (
                <Btn variant="quiet" onClick={() => setB({ ...b, highlight: null })}>
                  Use style default
                </Btn>
              )}
            </div>
          </Field>
        </div>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Btn variant="quiet" onClick={() => ref.current?.close()}>
            Cancel
          </Btn>
          <Btn onClick={() => onSave(b, true)}>Save and apply to all clips</Btn>
          <Btn variant="primary" onClick={() => onSave(b, false)}>
            Save
          </Btn>
        </div>
      </div>
    </dialog>
  );
}
