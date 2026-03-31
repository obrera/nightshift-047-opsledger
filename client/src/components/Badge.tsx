import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const toneMap = {
  planning: "bg-slate-500/15 text-slate-200 ring-slate-500/30",
  "at-risk": "bg-amber-500/15 text-amber-200 ring-amber-500/30",
  blocked: "bg-red-500/15 text-red-200 ring-red-500/30",
  ready: "bg-emerald-500/15 text-emerald-200 ring-emerald-500/30",
  shipped: "bg-sky-500/15 text-sky-200 ring-sky-500/30",
  blocker: "bg-red-500/15 text-red-200 ring-red-500/30",
  note: "bg-slate-500/15 text-slate-200 ring-slate-500/30",
  status: "bg-emerald-500/15 text-emerald-200 ring-emerald-500/30",
  decision: "bg-cyan-500/15 text-cyan-200 ring-cyan-500/30",
  high: "bg-red-500/15 text-red-200 ring-red-500/30",
  medium: "bg-amber-500/15 text-amber-200 ring-amber-500/30",
  low: "bg-emerald-500/15 text-emerald-200 ring-emerald-500/30",
} as const;

export function Badge({
  tone,
  children,
  className,
}: {
  tone: keyof typeof toneMap;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] ring-1 ring-inset",
        toneMap[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
