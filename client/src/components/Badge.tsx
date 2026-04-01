import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const toneMap = {
  incident: "bg-rose-500/15 text-rose-200 ring-rose-500/30",
  change: "bg-sky-500/15 text-sky-200 ring-sky-500/30",
  open: "bg-amber-500/15 text-amber-200 ring-amber-500/30",
  planned: "bg-violet-500/15 text-violet-200 ring-violet-500/30",
  "in-progress": "bg-cyan-500/15 text-cyan-200 ring-cyan-500/30",
  blocked: "bg-red-500/15 text-red-200 ring-red-500/30",
  resolved: "bg-emerald-500/15 text-emerald-200 ring-emerald-500/30",
  closed: "bg-slate-500/15 text-slate-200 ring-slate-500/30",
  low: "bg-emerald-500/15 text-emerald-200 ring-emerald-500/30",
  medium: "bg-amber-500/15 text-amber-200 ring-amber-500/30",
  high: "bg-orange-500/15 text-orange-200 ring-orange-500/30",
  critical: "bg-red-500/15 text-red-200 ring-red-500/30",
  pending: "bg-amber-500/15 text-amber-200 ring-amber-500/30",
  approved: "bg-emerald-500/15 text-emerald-200 ring-emerald-500/30",
  rejected: "bg-red-500/15 text-red-200 ring-red-500/30",
  production: "bg-fuchsia-500/15 text-fuchsia-200 ring-fuchsia-500/30",
  staging: "bg-cyan-500/15 text-cyan-200 ring-cyan-500/30",
  sandbox: "bg-slate-500/15 text-slate-200 ring-slate-500/30",
  active: "bg-emerald-500/15 text-emerald-200 ring-emerald-500/30",
  completed: "bg-slate-500/15 text-slate-200 ring-slate-500/30",
  cancelled: "bg-zinc-500/15 text-zinc-200 ring-zinc-500/30",
  overlap: "bg-red-500/15 text-red-200 ring-red-500/30",
  "open-item": "bg-orange-500/15 text-orange-200 ring-orange-500/30",
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
