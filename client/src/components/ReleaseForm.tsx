import { useEffect, useState } from "react";
import type { ReleaseDetail, ReleasePayload, ReleaseStatus } from "@/lib/types";

const initialValues: ReleasePayload = {
  name: "",
  owner: "",
  status: "planning",
  riskScore: 45,
  targetDate: new Date(Date.now() + 48 * 60 * 60_000).toISOString().slice(0, 16),
  summary: "",
  scope: "",
};

export function ReleaseForm({
  release,
  onSubmit,
  onCancel,
}: {
  release?: ReleaseDetail | null;
  onSubmit: (values: ReleasePayload) => Promise<void>;
  onCancel?: () => void;
}) {
  const [values, setValues] = useState(initialValues);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!release) {
      setValues(initialValues);
      return;
    }

    setValues({
      name: release.name,
      owner: release.owner,
      status: release.status,
      riskScore: release.riskScore,
      targetDate: new Date(release.targetDate).toISOString().slice(0, 16),
      summary: release.summary,
      scope: release.scope,
    });
  }, [release]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await onSubmit({
        ...values,
        targetDate: new Date(values.targetDate).toISOString(),
      });
      if (!release) {
        setValues(initialValues);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <Input label="Release name" value={values.name} onChange={(name) => setValues({ ...values, name })} />
        <Input label="Owner" value={values.owner} onChange={(owner) => setValues({ ...values, owner })} />
        <Select
          label="Status"
          value={values.status}
          options={["planning", "at-risk", "blocked", "ready", "shipped"]}
          onChange={(status) => setValues({ ...values, status: status as ReleaseStatus })}
        />
        <Input
          label="Target date"
          type="datetime-local"
          value={values.targetDate}
          onChange={(targetDate) => setValues({ ...values, targetDate })}
        />
        <label className="space-y-2 text-sm text-slate-300 md:col-span-2">
          <span>Risk score</span>
          <input
            className="w-full accent-accent"
            max={100}
            min={0}
            onChange={(event) => setValues({ ...values, riskScore: Number(event.target.value) })}
            type="range"
            value={values.riskScore}
          />
          <div className="text-right text-xs uppercase tracking-[0.22em] text-slate-400">{values.riskScore} / 100</div>
        </label>
      </div>
      <TextArea label="Summary" value={values.summary} onChange={(summary) => setValues({ ...values, summary })} />
      <TextArea label="Scope" value={values.scope} onChange={(scope) => setValues({ ...values, scope })} />
      <div className="flex flex-wrap gap-3">
        <button
          className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-60"
          disabled={saving}
          type="submit"
        >
          {saving ? "Saving..." : release ? "Update release" : "Create release"}
        </button>
        {onCancel ? (
          <button
            className="rounded-full border border-white/15 px-5 py-2 text-sm text-slate-200 transition hover:border-white/30"
            onClick={onCancel}
            type="button"
          >
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="space-y-2 text-sm text-slate-300">
      <span>{label}</span>
      <input
        className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none ring-0 transition focus:border-accent"
        onChange={(event) => onChange(event.target.value)}
        type={type}
        value={value}
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-2 text-sm text-slate-300">
      <span>{label}</span>
      <textarea
        className="min-h-28 w-full rounded-3xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-accent"
        onChange={(event) => onChange(event.target.value)}
        value={value}
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
        className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-accent"
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
