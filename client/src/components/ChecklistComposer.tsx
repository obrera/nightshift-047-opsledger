import { useState } from "react";

export function ChecklistComposer({
  onSubmit,
}: {
  onSubmit: (payload: { title: string; category: string; assignee: string }) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [assignee, setAssignee] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await onSubmit({ title, category, assignee });
      setTitle("");
      setCategory("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4" onSubmit={handleSubmit}>
      <input
        className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-accent"
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Checklist item"
        value={title}
      />
      <div className="grid gap-3 md:grid-cols-2">
        <input
          className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-accent"
          onChange={(event) => setCategory(event.target.value)}
          placeholder="Category"
          value={category}
        />
        <input
          className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-accent"
          onChange={(event) => setAssignee(event.target.value)}
          placeholder="Assignee"
          value={assignee}
        />
      </div>
      <button
        className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/30 disabled:opacity-60"
        disabled={!title || !category || !assignee || saving}
        type="submit"
      >
        {saving ? "Adding..." : "Add checklist item"}
      </button>
    </form>
  );
}
