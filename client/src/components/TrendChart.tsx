import type { DashboardData } from "@/lib/types";

export function TrendChart({ trend }: { trend: DashboardData["trend"] }) {
  const maxValue = Math.max(1, ...trend.flatMap((entry) => [entry.created, entry.decisions, entry.completed]));

  return (
    <div className="rounded-[28px] border border-white/10 bg-slate-950/70 p-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Seven-day ops trend</h2>
          <p className="text-sm text-slate-400">Created items, approval decisions, and completed work over the last week.</p>
        </div>
        <div className="flex gap-3 text-xs text-slate-400">
          <Legend color="bg-cyan-400" label="Created" />
          <Legend color="bg-amber-400" label="Decisions" />
          <Legend color="bg-emerald-400" label="Completed" />
        </div>
      </div>
      <div className="mt-6 grid grid-cols-7 gap-3">
        {trend.map((entry) => (
          <div key={entry.label} className="rounded-3xl border border-white/5 bg-white/[0.03] p-3">
            <div className="flex h-40 items-end justify-center gap-1">
              <Bar color="bg-cyan-400" height={(entry.created / maxValue) * 100} />
              <Bar color="bg-amber-400" height={(entry.decisions / maxValue) * 100} />
              <Bar color="bg-emerald-400" height={(entry.completed / maxValue) * 100} />
            </div>
            <div className="mt-3 text-center text-xs text-slate-400">{entry.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Bar({ height, color }: { height: number; color: string }) {
  return <div className={`w-4 rounded-t-full ${color}`} style={{ height: `${Math.max(height, 6)}%` }} />;
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      <span>{label}</span>
    </div>
  );
}
