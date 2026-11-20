"use client";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export function Btn({
  variant = "ghost",
  className = "",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "quiet" | "danger" }) {
  const base =
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";
  const v = {
    primary: "bg-mark text-ink hover:bg-white",
    ghost: "border border-night-line text-night-text hover:border-night-muted hover:bg-night-2",
    quiet: "text-night-muted hover:text-night-text",
    danger: "border border-hot/50 text-hot hover:bg-hot/10",
  }[variant];
  return <button type="button" className={`${base} ${v} ${className}`} {...rest} />;
}

export function Toggle({
  checked,
  onChange,
  label,
  hint,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
  id: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5">
      <label htmlFor={id} className="text-sm">
        <span className="text-night-text">{label}</span>
        {hint && <span className="block text-xs text-night-muted">{hint}</span>}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-mark" : "bg-night-line"}`}
      >
        <span
          className={`absolute left-0 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-[22px]" : "translate-x-0.5"}`}
        />
      </button>
    </div>
  );
}

export function Field({ label, children, htmlFor }: { label: string; children: ReactNode; htmlFor?: string }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-xs font-medium text-night-muted">
        {label}
      </label>
      {children}
    </div>
  );
}

export const inputCls =
  "w-full rounded-lg border border-night-line bg-night px-3 py-2 text-sm text-night-text placeholder:text-night-muted/70 focus:border-mark focus:outline-none";

export function Bar({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-28 shrink-0 text-night-muted">{label}</span>
      <span className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-night-line" aria-hidden="true">
        <span className="absolute inset-y-0 left-0 rounded-full bg-mark" style={{ width: `${Math.round(value * 100)}%` }} />
      </span>
      <span className="w-7 text-right tabular-nums text-night-muted">{Math.round(value * 100)}</span>
    </div>
  );
}

export function ScoreBadge({ score, large }: { score: number; large?: boolean }) {
  const tone = score >= 80 ? "bg-mark text-ink" : score >= 60 ? "bg-white text-ink" : "bg-night-line text-night-text";
  return (
    <span
      className={`font-display inline-flex items-center justify-center rounded-lg font-black tabular-nums ${tone} ${large ? "h-12 min-w-12 px-2 text-2xl" : "h-8 min-w-8 px-1.5 text-base"}`}
      aria-label={`Score ${score} out of 100`}
    >
      {score}
    </span>
  );
}

export function fmtTime(t: number) {
  if (!isFinite(t)) return "0:00";
  const s = Math.max(0, Math.floor(t));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}
