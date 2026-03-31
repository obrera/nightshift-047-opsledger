import { useState } from "react";
import type { TimelineKind } from "@/lib/types";

export function TimelineComposer({
  onSubmit,
}: {
  onSubmit: (payload: { kind: TimelineKind; body: string; actor: string }) => Promise<void>;
}) {
  const [actor, setActor] = useState("");
  const [kind, setKind] = useState<TimelineKind>("note");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await onSubmit({ actor, kind, body });
      setBody("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4" onSubmit={handleSubmit}>
      <div className="grid gap-3 md:grid-cols-[1fr_180px]">
        <input
          className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-accent"
          onChange={(event) => setActor(event.target.value)}
          placeholder="Actor"
          value={actor}
        />
        <select
          className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-accent"
          onChange={(event) => setKind(event.target.value as TimelineKind)}
          value={kind}
        >
          <option value="note">note</option>
          <option value="blocker">blocker</option>
          <option value="status">status</option>
          <option value="decision">decision</option>
        </select>
      </div>
      <textarea
        className="min-h-24 w-full rounded-3xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-accent"
        onChange={(event) => setBody(event.target.value)}
        placeholder="Add blocker context, launch notes, or a release decision"
        value={body}
      />
      <button
        className="rounded-full border border-accent/50 px-4 py-2 text-sm font-semibold text-accent transition hover:bg-accent hover:text-slate-950 disabled:opacity-60"
        disabled={!actor || !body || saving}
        type="submit"
      >
        {saving ? "Posting..." : "Add timeline entry"}
      </button>
    </form>
  );
}
