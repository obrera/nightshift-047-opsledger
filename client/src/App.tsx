import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { AlertTriangle, CalendarClock, CheckCircle2, Filter, ListTodo, Search, ShieldCheck } from "lucide-react";
import { Badge } from "./components/Badge";
import { ChecklistComposer } from "./components/ChecklistComposer";
import { MetricCard } from "./components/MetricCard";
import { ReleaseForm } from "./components/ReleaseForm";
import { TimelineComposer } from "./components/TimelineComposer";
import {
  addChecklistItem,
  addTimelineEntry,
  createRelease,
  getDashboard,
  getRelease,
  getReleases,
  updateChecklistItem,
  updateRelease,
} from "./lib/api";
import type { DashboardData, ReleaseDetail, ReleasePayload, ReleaseSummary } from "./lib/types";
import { formatCountdown, formatDate, formatShortDate, riskTone } from "./lib/utils";

type Filters = {
  search: string;
  status: string;
  owner: string;
  risk: string;
  hasBlockers: boolean;
};

const defaultFilters: Filters = {
  search: "",
  status: "",
  owner: "",
  risk: "",
  hasBlockers: false,
};

export function App() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [releases, setReleases] = useState<ReleaseSummary[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedRelease, setSelectedRelease] = useState<ReleaseDetail | null>(null);
  const [filters, setFilters] = useState(defaultFilters);
  const [mode, setMode] = useState<"create" | "edit">("create");

  const query = new URLSearchParams();
  if (filters.search) query.set("search", filters.search);
  if (filters.status) query.set("status", filters.status);
  if (filters.owner) query.set("owner", filters.owner);
  if (filters.risk) query.set("risk", filters.risk);
  if (filters.hasBlockers) query.set("hasBlockers", "true");
  const queryString = query.toString() ? `?${query.toString()}` : "";

  async function refreshList(nextSelectedId?: number | null) {
    const [dashboardData, releaseRows] = await Promise.all([getDashboard(), getReleases(queryString)]);
    setDashboard(dashboardData);
    setReleases(releaseRows);

    const activeId = nextSelectedId ?? selectedId ?? releaseRows[0]?.id ?? null;
    setSelectedId(activeId);
    if (activeId) {
      setSelectedRelease(await getRelease(activeId));
      setMode("edit");
    } else {
      setSelectedRelease(null);
    }
  }

  useEffect(() => {
    void refreshList();
  }, [queryString]);

  async function selectRelease(id: number) {
    setSelectedId(id);
    setSelectedRelease(await getRelease(id));
    setMode("edit");
  }

  async function handleCreate(values: ReleasePayload) {
    const release = await createRelease(values);
    await refreshList(release.id);
  }

  async function handleUpdate(values: ReleasePayload) {
    if (!selectedId) return;
    await updateRelease(selectedId, values);
    await refreshList(selectedId);
  }

  async function handleChecklistToggle(itemId: number, completed: boolean) {
    if (!selectedId) return;
    const next = await updateChecklistItem(selectedId, itemId, completed);
    setSelectedRelease(next);
    setDashboard(await getDashboard());
    setReleases(await getReleases(queryString));
  }

  async function handleChecklistCreate(payload: { title: string; category: string; assignee: string }) {
    if (!selectedId) return;
    const next = await addChecklistItem(selectedId, payload);
    setSelectedRelease(next);
    setDashboard(await getDashboard());
    setReleases(await getReleases(queryString));
  }

  async function handleTimelineSubmit(payload: { kind: "blocker" | "note" | "status" | "decision"; body: string; actor: string }) {
    if (!selectedId) return;
    const next = await addTimelineEntry(selectedId, payload);
    setSelectedRelease(next);
    setDashboard(await getDashboard());
    setReleases(await getReleases(queryString));
  }

  return (
    <div className="min-h-screen bg-canvas bg-grid [background-size:24px_24px] text-ink">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="rounded-[32px] border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/60 p-8 shadow-glow">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Nightshift Build 046</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">ReleaseBridge</h1>
              <p className="mt-4 max-w-2xl text-base text-slate-300">
                Dark-mode release readiness cockpit for small teams. Track owners, risk, checklist completion, and
                blockers in one backend-first workspace.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Chip icon={<ShieldCheck size={16} />} label={`${dashboard?.metrics.ready ?? 0} ready`} />
              <Chip icon={<AlertTriangle size={16} />} label={`${dashboard?.metrics.blocked ?? 0} blocked`} />
              <Chip icon={<CalendarClock size={16} />} label={`${dashboard?.metrics.dueSoon ?? 0} due soon`} />
              <Chip icon={<ListTodo size={16} />} label={`${dashboard?.metrics.checklistCompletion ?? 0}% done`} />
            </div>
          </div>
        </header>

        <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Tracked Releases" value={dashboard?.metrics.total ?? 0} note="SQLite-backed release plans." />
          <MetricCard label="High Risk" value={dashboard?.metrics.highRisk ?? 0} note="Risk score at or above 70." />
          <MetricCard label="Blocked" value={dashboard?.metrics.blocked ?? 0} note="Releases with active blockers." />
          <MetricCard
            label="Owners"
            value={dashboard?.owners.length ?? 0}
            note="Distinct release owners on the board."
          />
        </section>

        <section className="mt-8 grid gap-8 xl:grid-cols-[1.05fr_1.2fr_0.95fr]">
          <div className="space-y-6">
            <div className="rounded-[28px] border border-white/10 bg-slate-950/70 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-white">Release board</h2>
                  <p className="text-sm text-slate-400">Search and narrow the board by status, owner, risk, or blockers.</p>
                </div>
                <button
                  className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:border-accent hover:text-accent"
                  onClick={() => {
                    setMode("create");
                    setSelectedRelease(null);
                    setSelectedId(null);
                  }}
                  type="button"
                >
                  New release
                </button>
              </div>

              <div className="mt-5 grid gap-3">
                <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <Search size={16} className="text-slate-500" />
                  <input
                    className="w-full bg-transparent text-sm text-white outline-none"
                    onChange={(event) => setFilters({ ...filters, search: event.target.value })}
                    placeholder="Search release name"
                    value={filters.search}
                  />
                </label>
                <div className="grid gap-3 md:grid-cols-2">
                  <SelectFilter
                    value={filters.status}
                    onChange={(status) => setFilters({ ...filters, status })}
                    options={["", "planning", "at-risk", "blocked", "ready", "shipped"]}
                  />
                  <SelectFilter
                    value={filters.risk}
                    onChange={(risk) => setFilters({ ...filters, risk })}
                    options={["", "low", "medium", "high"]}
                  />
                </div>
                <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                  <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <Filter size={16} className="text-slate-500" />
                    <input
                      className="w-full bg-transparent text-sm text-white outline-none"
                      onChange={(event) => setFilters({ ...filters, owner: event.target.value })}
                      placeholder="Filter owner"
                      value={filters.owner}
                    />
                  </label>
                  <label className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                    <input
                      checked={filters.hasBlockers}
                      onChange={(event) => setFilters({ ...filters, hasBlockers: event.target.checked })}
                      type="checkbox"
                    />
                    Blockers only
                  </label>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {releases.map((release) => (
                  <button
                    key={release.id}
                    className={`w-full rounded-3xl border p-4 text-left transition ${
                      selectedId === release.id
                        ? "border-accent/50 bg-cyan-500/10 shadow-glow"
                        : "border-white/10 bg-white/5 hover:border-white/25"
                    }`}
                    onClick={() => void selectRelease(release.id)}
                    type="button"
                  >
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={release.status}>{release.status}</Badge>
                        <Badge tone={riskTone(release.riskScore)}>risk {release.riskScore}</Badge>
                        {release.blockerCount > 0 ? <Badge tone="blocker">{release.blockerCount} blockers</Badge> : null}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{release.name}</h3>
                        <p className="mt-1 text-sm text-slate-400">
                          owner {release.owner} · target {formatDate(release.targetDate)} · {release.openChecklistCount} open
                          items
                        </p>
                        <p className="mt-3 text-sm text-slate-300">{release.summary}</p>
                      </div>
                      <div className="flex items-center justify-between gap-4 text-sm">
                        <span className="text-slate-400">{release.checklistCompletion}% checklist complete</span>
                        <span className="font-semibold text-cyan-200">{formatCountdown(release.targetDate)}</span>
                      </div>
                    </div>
                  </button>
                ))}
                {!releases.length ? <p className="text-sm text-slate-400">No releases match the active filters.</p> : null}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-slate-950/70 p-5">
              <h2 className="text-xl font-semibold text-white">Spotlight</h2>
              <div className="mt-4 space-y-3">
                {dashboard?.spotlight.map((item) => (
                  <div key={item.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-medium text-white">{item.name}</p>
                        <p className="text-sm text-slate-400">
                          {item.owner} · {formatShortDate(item.targetDate)}
                        </p>
                      </div>
                      <Badge tone={item.status}>{item.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[28px] border border-white/10 bg-slate-950/70 p-5">
              <h2 className="text-xl font-semibold text-white">{mode === "create" ? "Create release" : "Edit release"}</h2>
              <p className="mb-5 text-sm text-slate-400">
                Capture target date, owner, status, scope, and release risk from a single control panel.
              </p>
              <ReleaseForm
                release={mode === "edit" ? selectedRelease : null}
                onCancel={
                  mode === "edit"
                    ? () => {
                        setMode("create");
                        setSelectedRelease(null);
                        setSelectedId(null);
                      }
                    : undefined
                }
                onSubmit={mode === "create" ? handleCreate : handleUpdate}
              />
            </div>

            <div className="rounded-[28px] border border-white/10 bg-slate-950/70 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-white">Readiness checklist</h2>
                  <p className="text-sm text-slate-400">Track release tasks with completion state and assignee ownership.</p>
                </div>
                {selectedRelease ? (
                  <Badge tone={riskTone(selectedRelease.riskScore)}>{selectedRelease.checklistCompletion}% complete</Badge>
                ) : null}
              </div>
              {selectedRelease ? (
                <>
                  <div className="mt-5 space-y-3">
                    {selectedRelease.checklist.map((item) => (
                      <label
                        key={item.id}
                        className="flex items-start gap-3 rounded-3xl border border-white/10 bg-white/5 p-4 text-sm"
                      >
                        <input
                          checked={item.completed}
                          className="mt-1"
                          onChange={(event) => void handleChecklistToggle(item.id, event.target.checked)}
                          type="checkbox"
                        />
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`font-medium ${item.completed ? "text-slate-400 line-through" : "text-white"}`}>
                              {item.title}
                            </span>
                            <Badge tone="note">{item.category}</Badge>
                          </div>
                          <p className="mt-1 text-slate-400">
                            {item.assignee} · {item.completedAt ? `done ${formatDate(item.completedAt)}` : "open"}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                  <div className="mt-5">
                    <ChecklistComposer onSubmit={handleChecklistCreate} />
                  </div>
                </>
              ) : (
                <p className="mt-5 text-sm text-slate-400">Select a release to manage its checklist.</p>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[28px] border border-white/10 bg-slate-950/70 p-5">
              <h2 className="text-xl font-semibold text-white">Blockers and notes</h2>
              <p className="text-sm text-slate-400">Chronological feed for blockers, decisions, and release notes.</p>
              {selectedRelease ? (
                <>
                  <div className="mt-5 space-y-3">
                    {selectedRelease.timeline.map((entry) => (
                      <div key={entry.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <Badge tone={entry.kind}>{entry.kind}</Badge>
                          <span className="text-xs uppercase tracking-[0.22em] text-slate-500">{formatDate(entry.createdAt)}</span>
                        </div>
                        <p className="mt-3 text-sm text-slate-100">{entry.body}</p>
                        <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-400">{entry.actor}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5">
                    <TimelineComposer onSubmit={handleTimelineSubmit} />
                  </div>
                </>
              ) : (
                <p className="mt-5 text-sm text-slate-400">Select a release to review or post timeline entries.</p>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function Chip({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <span className="text-cyan-300">{icon}</span>
        <span>{label}</span>
      </div>
    </div>
  );
}

function SelectFilter({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <select
      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm capitalize text-white outline-none transition focus:border-accent"
      onChange={(event) => onChange(event.target.value)}
      value={value}
    >
      {options.map((option) => (
        <option key={option || "all"} value={option}>
          {option || "all"}
        </option>
      ))}
    </select>
  );
}
