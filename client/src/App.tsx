import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { AlertTriangle, CalendarRange, ClipboardList, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { Badge } from "./components/Badge";
import { MetricCard } from "./components/MetricCard";
import { TrendChart } from "./components/TrendChart";
import {
  createItem,
  createWindow,
  decideApproval,
  deleteItem,
  deleteWindow,
  getDashboard,
  getItem,
  getItems,
  getWindows,
  requestApproval,
  updateItem,
  updateWindow,
} from "./lib/api";
import type {
  DashboardData,
  DeploymentWindow,
  ItemDetail,
  ItemPayload,
  ItemStatus,
  ItemSummary,
  WindowPayload,
} from "./lib/types";
import { formatCountdown, formatDate, formatDay } from "./lib/utils";

const defaultItem: ItemPayload = {
  itemType: "incident",
  title: "",
  service: "",
  description: "",
  status: "open",
  priority: "medium",
  owner: "",
  dueDate: new Date(Date.now() + 24 * 60 * 60_000).toISOString().slice(0, 16),
  impactSummary: "",
};

const defaultWindow: WindowPayload = {
  title: "",
  environment: "production",
  owner: "",
  status: "planned",
  startAt: new Date(Date.now() + 2 * 60 * 60_000).toISOString().slice(0, 16),
  endAt: new Date(Date.now() + 4 * 60 * 60_000).toISOString().slice(0, 16),
  notes: "",
};

export function App() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [items, setItems] = useState<ItemSummary[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedItem, setSelectedItem] = useState<ItemDetail | null>(null);
  const [windows, setWindows] = useState<DeploymentWindow[]>([]);
  const [itemDraft, setItemDraft] = useState<ItemPayload>(defaultItem);
  const [windowDraft, setWindowDraft] = useState<WindowPayload>(defaultWindow);
  const [mode, setMode] = useState<"create" | "edit">("edit");
  const [windowMode, setWindowMode] = useState<"create" | number>("create");

  async function refresh(nextId?: number | null) {
    const [dashboardData, itemRows, windowRows] = await Promise.all([getDashboard(), getItems(), getWindows()]);
    setDashboard(dashboardData);
    setItems(itemRows);
    setWindows(windowRows);

    const activeId = nextId ?? selectedId ?? itemRows[0]?.id ?? null;
    setSelectedId(activeId);
    if (activeId) {
      const detail = await getItem(activeId);
      setSelectedItem(detail);
      setItemDraft({
        itemType: detail.itemType,
        title: detail.title,
        service: detail.service,
        description: detail.description,
        status: detail.status,
        priority: detail.priority,
        owner: detail.owner,
        dueDate: detail.dueDate ? new Date(detail.dueDate).toISOString().slice(0, 16) : null,
        impactSummary: detail.impactSummary,
      });
      setMode("edit");
    } else {
      setSelectedItem(null);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function handleItemSubmit(event: React.FormEvent) {
    event.preventDefault();
    const payload = {
      ...itemDraft,
      dueDate: itemDraft.dueDate ? new Date(itemDraft.dueDate).toISOString() : null,
    };
    if (mode === "create") {
      const created = await createItem(payload);
      await refresh(created.id);
      return;
    }
    if (selectedId) {
      await updateItem(selectedId, payload);
      await refresh(selectedId);
    }
  }

  async function handleDeleteItem() {
    if (!selectedId) return;
    await deleteItem(selectedId);
    setMode("create");
    setItemDraft(defaultItem);
    await refresh(null);
  }

  async function handleApprovalRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedId) return;
    const form = new FormData(event.currentTarget);
    await requestApproval(selectedId, {
      reviewer: String(form.get("reviewer") ?? ""),
      comment: String(form.get("comment") ?? ""),
    });
    event.currentTarget.reset();
    await refresh(selectedId);
  }

  async function handleDecision(approvalId: number, decision: "approved" | "rejected", form: FormData) {
    if (!selectedId) return;
    await decideApproval(selectedId, approvalId, {
      decision,
      reviewer: String(form.get("reviewer") ?? ""),
      comment: String(form.get("comment") ?? ""),
    });
    await refresh(selectedId);
  }

  async function handleWindowSubmit(event: React.FormEvent) {
    event.preventDefault();
    const payload = {
      ...windowDraft,
      startAt: new Date(windowDraft.startAt).toISOString(),
      endAt: new Date(windowDraft.endAt).toISOString(),
    };
    if (windowMode === "create") {
      const next = await createWindow(payload);
      setWindows(next);
    } else {
      const next = await updateWindow(windowMode, payload);
      setWindows(next);
    }
    setWindowDraft(defaultWindow);
    setWindowMode("create");
    await refresh(selectedId);
  }

  return (
    <div className="min-h-screen bg-canvas bg-grid [background-size:22px_22px] text-ink">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="rounded-[32px] border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/50 p-8 shadow-glow">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Nightshift Build 047</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">OpsLedger</h1>
              <p className="mt-4 max-w-2xl text-base text-slate-300">
                Operational ledger for incidents, changes, approvals, and deployment windows. Durable SQLite state,
                one Hono backend, one domain.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Chip icon={<ClipboardList size={16} />} label={`${dashboard?.metrics.trackedItems ?? 0} tracked`} />
              <Chip icon={<AlertTriangle size={16} />} label={`${dashboard?.metrics.openItems ?? 0} open`} />
              <Chip icon={<ShieldCheck size={16} />} label={`${dashboard?.metrics.approvalsPending ?? 0} pending`} />
              <Chip icon={<CalendarRange size={16} />} label={`${dashboard?.metrics.windowConflicts ?? 0} conflicts`} />
            </div>
          </div>
        </header>

        <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <MetricCard label="Tracked Items" value={dashboard?.metrics.trackedItems ?? 0} note="Incidents and changes on the ledger." />
          <MetricCard label="Open Work" value={dashboard?.metrics.openItems ?? 0} note="Anything not resolved or closed." />
          <MetricCard label="Pending Approvals" value={dashboard?.metrics.approvalsPending ?? 0} note="Reviewer actions still outstanding." />
          <MetricCard label="Window Conflicts" value={dashboard?.metrics.windowConflicts ?? 0} note="Planner warnings from overlap or open work." />
          <MetricCard label="Due This Week" value={dashboard?.metrics.dueThisWeek ?? 0} note="Upcoming deadlines inside seven days." />
        </section>

        {dashboard ? (
          <section className="mt-8 grid gap-8 xl:grid-cols-[1.3fr_0.9fr]">
            <TrendChart trend={dashboard.trend} />
            <div className="space-y-6">
              <BreakdownCard title="Status mix" data={dashboard.statusBreakdown} />
              <BreakdownCard title="Priority mix" data={dashboard.priorityBreakdown} />
            </div>
          </section>
        ) : null}

        <section className="mt-8 grid gap-8 xl:grid-cols-[1.05fr_1.05fr_0.9fr]">
          <div className="space-y-6">
            <div className="rounded-[28px] border border-white/10 bg-slate-950/70 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white">Ledger</h2>
                  <p className="text-sm text-slate-400">Incidents and changes with due dates and approval pressure.</p>
                </div>
                <button
                  className="rounded-full border border-white/10 px-4 py-2 text-sm text-white transition hover:border-cyan-400"
                  onClick={() => {
                    setMode("create");
                    setSelectedId(null);
                    setSelectedItem(null);
                    setItemDraft(defaultItem);
                  }}
                  type="button"
                >
                  <span className="inline-flex items-center gap-2">
                    <Plus size={15} />
                    New item
                  </span>
                </button>
              </div>
              <div className="mt-5 space-y-3">
                {items.map((item) => (
                  <button
                    key={item.id}
                    className={`w-full rounded-[26px] border p-4 text-left transition ${
                      selectedId === item.id
                        ? "border-cyan-400/40 bg-cyan-500/10 shadow-glow"
                        : "border-white/10 bg-white/5 hover:border-white/25"
                    }`}
                    onClick={() => void refresh(item.id)}
                    type="button"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={item.itemType}>{item.itemType}</Badge>
                      <Badge tone={item.status}>{item.status}</Badge>
                      <Badge tone={item.priority}>{item.priority}</Badge>
                    </div>
                    <div className="mt-3 flex items-start justify-between gap-4">
                      <div>
                        <p className="text-base font-semibold text-white">{item.title}</p>
                        <p className="mt-1 text-sm text-slate-400">
                          {item.service} · {item.owner}
                        </p>
                      </div>
                      <div className="text-right text-xs text-slate-400">
                        <div>{formatDay(item.dueDate)}</div>
                        <div>{formatCountdown(item.dueDate)}</div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                      <span>{item.pendingApprovalCount} pending approvals</span>
                      <span>{item.impactSummary}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-slate-950/70 p-5">
              <h2 className="text-xl font-semibold text-white">Planner spotlight</h2>
              <div className="mt-4 space-y-3">
                {windows.slice(0, 3).map((window) => (
                  <div key={window.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={window.environment}>{window.environment}</Badge>
                      <Badge tone={window.status}>{window.status}</Badge>
                    </div>
                    <p className="mt-3 text-sm font-semibold text-white">{window.title}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {formatDate(window.startAt)} to {formatDate(window.endAt)}
                    </p>
                    <p className="mt-2 text-sm text-slate-300">{window.warnings.length} warnings</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <section className="rounded-[28px] border border-white/10 bg-slate-950/70 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white">{mode === "create" ? "Create ledger item" : "Update item"}</h2>
                  <p className="text-sm text-slate-400">Persistent CRUD for incidents and changes.</p>
                </div>
                {mode === "edit" ? (
                  <button
                    className="rounded-full border border-red-500/30 px-4 py-2 text-sm text-red-200 transition hover:bg-red-500/10"
                    onClick={() => void handleDeleteItem()}
                    type="button"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Trash2 size={15} />
                      Delete
                    </span>
                  </button>
                ) : null}
              </div>
              <form className="mt-5 space-y-4" onSubmit={(event) => void handleItemSubmit(event)}>
                <div className="grid gap-4 md:grid-cols-2">
                  <Select label="Type" value={itemDraft.itemType} options={["incident", "change"]} onChange={(itemType) => setItemDraft({ ...itemDraft, itemType: itemType as ItemPayload["itemType"] })} />
                  <Select label="Status" value={itemDraft.status} options={["open", "planned", "in-progress", "blocked", "resolved", "closed"]} onChange={(status) => setItemDraft({ ...itemDraft, status: status as ItemStatus })} />
                  <Input label="Title" value={itemDraft.title} onChange={(title) => setItemDraft({ ...itemDraft, title })} />
                  <Input label="Service" value={itemDraft.service} onChange={(service) => setItemDraft({ ...itemDraft, service })} />
                  <Input label="Owner" value={itemDraft.owner} onChange={(owner) => setItemDraft({ ...itemDraft, owner })} />
                  <Select label="Priority" value={itemDraft.priority} options={["low", "medium", "high", "critical"]} onChange={(priority) => setItemDraft({ ...itemDraft, priority: priority as ItemPayload["priority"] })} />
                  <Input
                    label="Due date"
                    type="datetime-local"
                    value={itemDraft.dueDate ?? ""}
                    onChange={(dueDate) => setItemDraft({ ...itemDraft, dueDate })}
                  />
                  <Input label="Impact" value={itemDraft.impactSummary} onChange={(impactSummary) => setItemDraft({ ...itemDraft, impactSummary })} />
                </div>
                <TextArea label="Description" value={itemDraft.description} onChange={(description) => setItemDraft({ ...itemDraft, description })} />
                <button className="rounded-full bg-cyan-400 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300" type="submit">
                  {mode === "create" ? "Create item" : "Save changes"}
                </button>
              </form>
            </section>

            {selectedItem ? (
              <section className="rounded-[28px] border border-white/10 bg-slate-950/70 p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={selectedItem.itemType}>{selectedItem.itemType}</Badge>
                  <Badge tone={selectedItem.status}>{selectedItem.status}</Badge>
                  <Badge tone={selectedItem.priority}>{selectedItem.priority}</Badge>
                </div>
                <h2 className="mt-4 text-2xl font-semibold text-white">{selectedItem.title}</h2>
                <p className="mt-2 text-sm text-slate-300">{selectedItem.description}</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Detail label="Service" value={selectedItem.service} />
                  <Detail label="Owner" value={selectedItem.owner} />
                  <Detail label="Due" value={formatDate(selectedItem.dueDate)} />
                  <Detail label="Impact" value={selectedItem.impactSummary} />
                </div>
              </section>
            ) : null}
          </div>

          <div className="space-y-6">
            {selectedItem ? (
              <section className="rounded-[28px] border border-white/10 bg-slate-950/70 p-5">
                <h2 className="text-xl font-semibold text-white">Approval workflow</h2>
                <p className="text-sm text-slate-400">Request reviewer sign-off and record decisions with timestamps.</p>
                <form className="mt-4 space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4" onSubmit={(event) => void handleApprovalRequest(event)}>
                  <Input name="reviewer" label="Reviewer" value="" onChange={() => undefined} uncontrolled />
                  <TextArea name="comment" label="Request note" value="" onChange={() => undefined} uncontrolled />
                  <button className="rounded-full border border-cyan-400/40 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-400/10" type="submit">
                    Add approval request
                  </button>
                </form>
                <div className="mt-4 space-y-3">
                  {selectedItem.approvals.map((approval) => (
                    <div key={approval.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white">{approval.reviewer}</p>
                          <p className="text-xs text-slate-400">Updated {formatDate(approval.updatedAt)}</p>
                        </div>
                        <Badge tone={approval.status}>{approval.status}</Badge>
                      </div>
                      <p className="mt-3 text-sm text-slate-300">{approval.latestComment}</p>
                      <form
                        className="mt-4 grid gap-3"
                        onSubmit={(event) => {
                          event.preventDefault();
                          void handleDecision(approval.id, "approved", new FormData(event.currentTarget));
                          event.currentTarget.reset();
                        }}
                      >
                        <input className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none" name="reviewer" placeholder="Reviewer name" />
                        <textarea className="min-h-24 rounded-3xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none" name="comment" placeholder="Decision comment" />
                        <div className="flex gap-3">
                          <button className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950" type="submit">
                            Approve
                          </button>
                          <button
                            className="rounded-full border border-red-500/30 px-4 py-2 text-sm font-semibold text-red-200"
                            onClick={(event) => {
                              event.preventDefault();
                              const form = event.currentTarget.form;
                              if (form) {
                                void handleDecision(approval.id, "rejected", new FormData(form));
                                form.reset();
                              }
                            }}
                            type="button"
                          >
                            Reject
                          </button>
                        </div>
                      </form>
                      <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
                        {approval.history.map((entry) => (
                          <div key={entry.id} className="rounded-2xl bg-slate-950/60 p-3">
                            <div className="flex items-center justify-between gap-2">
                              <Badge tone={entry.decision === "requested" ? "pending" : entry.decision}>{entry.decision}</Badge>
                              <span className="text-xs text-slate-400">{formatDate(entry.decidedAt)}</span>
                            </div>
                            <p className="mt-2 text-xs text-slate-300">{entry.reviewer}</p>
                            <p className="mt-1 text-sm text-slate-200">{entry.comment}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="rounded-[28px] border border-white/10 bg-slate-950/70 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white">Deployment windows</h2>
                  <p className="text-sm text-slate-400">Plan windows and surface conflicts before deployment.</p>
                </div>
                {windowMode !== "create" ? (
                  <button
                    className="rounded-full border border-white/10 px-4 py-2 text-sm text-white"
                    onClick={() => {
                      setWindowMode("create");
                      setWindowDraft(defaultWindow);
                    }}
                    type="button"
                  >
                    New window
                  </button>
                ) : null}
              </div>
              <form className="mt-4 space-y-4 rounded-3xl border border-white/10 bg-white/5 p-4" onSubmit={(event) => void handleWindowSubmit(event)}>
                <Input label="Window title" value={windowDraft.title} onChange={(title) => setWindowDraft({ ...windowDraft, title })} />
                <div className="grid gap-4 md:grid-cols-2">
                  <Select label="Environment" value={windowDraft.environment} options={["production", "staging", "sandbox"]} onChange={(environment) => setWindowDraft({ ...windowDraft, environment: environment as WindowPayload["environment"] })} />
                  <Select label="Status" value={windowDraft.status} options={["planned", "approved", "active", "completed", "cancelled"]} onChange={(status) => setWindowDraft({ ...windowDraft, status: status as WindowPayload["status"] })} />
                  <Input label="Owner" value={windowDraft.owner} onChange={(owner) => setWindowDraft({ ...windowDraft, owner })} />
                  <Input label="Start" type="datetime-local" value={windowDraft.startAt} onChange={(startAt) => setWindowDraft({ ...windowDraft, startAt })} />
                  <Input label="End" type="datetime-local" value={windowDraft.endAt} onChange={(endAt) => setWindowDraft({ ...windowDraft, endAt })} />
                </div>
                <TextArea label="Notes" value={windowDraft.notes} onChange={(notes) => setWindowDraft({ ...windowDraft, notes })} />
                <button className="rounded-full bg-amber-400 px-5 py-2 text-sm font-semibold text-slate-950" type="submit">
                  {windowMode === "create" ? "Plan window" : "Save window"}
                </button>
              </form>
              <div className="mt-4 space-y-3">
                {windows.map((window) => (
                  <div key={window.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap gap-2">
                        <Badge tone={window.environment}>{window.environment}</Badge>
                        <Badge tone={window.status}>{window.status}</Badge>
                      </div>
                      <div className="flex gap-2">
                        <button
                          className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-200"
                          onClick={() => {
                            setWindowMode(window.id);
                            setWindowDraft({
                              title: window.title,
                              environment: window.environment,
                              owner: window.owner,
                              status: window.status,
                              startAt: new Date(window.startAt).toISOString().slice(0, 16),
                              endAt: new Date(window.endAt).toISOString().slice(0, 16),
                              notes: window.notes,
                            });
                          }}
                          type="button"
                        >
                          Edit
                        </button>
                        <button
                          className="rounded-full border border-red-500/30 px-3 py-1 text-xs text-red-200"
                          onClick={async () => {
                            setWindows(await deleteWindow(window.id));
                            await refresh(selectedId);
                          }}
                          type="button"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <p className="mt-3 text-base font-semibold text-white">{window.title}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {formatDate(window.startAt)} to {formatDate(window.endAt)}
                    </p>
                    <p className="mt-2 text-sm text-slate-300">{window.notes}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {window.warnings.length ? (
                        window.warnings.map((warning, index) => (
                          <Badge key={`${warning.relatedId}-${index}`} tone={warning.type}>
                            {warning.message}
                          </Badge>
                        ))
                      ) : (
                        <Badge tone="approved">No conflicts</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </section>
      </div>
    </div>
  );
}

function Chip({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
      <div className="flex items-center gap-2">
        {icon}
        <span>{label}</span>
      </div>
    </div>
  );
}

function BreakdownCard({ title, data }: { title: string; data: Array<{ label: string; value: number }> }) {
  const total = Math.max(1, ...data.map((entry) => entry.value));
  return (
    <div className="rounded-[28px] border border-white/10 bg-slate-950/70 p-5">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <div className="mt-4 space-y-3">
        {data.map((entry) => (
          <div key={entry.label}>
            <div className="flex items-center justify-between text-sm text-slate-300">
              <span className="capitalize">{entry.label}</span>
              <span>{entry.value}</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-white/10">
              <div className="h-2 rounded-full bg-cyan-400" style={{ width: `${(entry.value / total) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm text-slate-200">{value}</p>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  name,
  uncontrolled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  name?: string;
  uncontrolled?: boolean;
}) {
  return (
    <label className="space-y-2 text-sm text-slate-300">
      <span>{label}</span>
      <input
        className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
        name={name}
        onChange={(event) => onChange(event.target.value)}
        type={type}
        value={uncontrolled ? undefined : value}
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  name,
  uncontrolled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  name?: string;
  uncontrolled?: boolean;
}) {
  return (
    <label className="space-y-2 text-sm text-slate-300">
      <span>{label}</span>
      <textarea
        className="min-h-28 w-full rounded-3xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
        name={name}
        onChange={(event) => onChange(event.target.value)}
        value={uncontrolled ? undefined : value}
      />
    </label>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-2 text-sm text-slate-300">
      <span>{label}</span>
      <select
        className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
