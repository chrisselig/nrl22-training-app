"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { LoginForm } from "@/components/LoginForm";
import { PageHeader } from "@/components/PageHeader";
import {
  POSITION_IDS,
  POSITION_LABELS,
  type PositionId,
} from "@/lib/positions";

interface StrategyRow {
  id: number;
  prop_id: number;
  position: PositionId;
  equipment: string | null;
  bag_placement: string | null;
  notes: string | null;
}

interface PropRow {
  id: number;
  name: string;
  category: string;
  notes: string | null;
  strategies: StrategyRow[];
}

const inputClass =
  "w-full rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm text-neutral-900 focus:border-blue-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100";
const labelClass =
  "block text-xs font-medium text-neutral-600 dark:text-neutral-400";

/** Thrown when a mutating request comes back 401 — caller shows the login form. */
class AuthRequiredError extends Error {}

async function postJson(path: string, body: unknown) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (res.status === 401) throw new AuthRequiredError();
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(
      typeof data.error === "string" ? data.error : "Request failed",
    );
  }
  return res.json();
}

async function deleteJson(path: string) {
  const res = await fetch(path, { method: "DELETE" });
  if (res.status === 401) throw new AuthRequiredError();
  if (!res.ok) throw new Error("Request failed");
}

export default function PropsPage() {
  const [props, setProps] = useState<PropRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);
  const retryRef = useRef<() => void>(() => {});

  async function reload() {
    setError(null);
    try {
      const res = await fetch("/api/props");
      if (!res.ok) throw new Error("Could not load props");
      setProps(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load props");
    }
  }

  useEffect(() => {
    // Mount-time fetch from the DB-backed API, not a live external
    // subscription — the documented pattern the rule is known to over-flag.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reload();
  }, []);

  async function withAuth(action: () => Promise<void>, retry: () => void) {
    setError(null);
    try {
      await action();
      setNeedsLogin(false);
    } catch (e) {
      if (e instanceof AuthRequiredError) {
        setNeedsLogin(true);
        retryRef.current = retry;
        return;
      }
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  async function handleAddProp(name: string, category: string, notes: string) {
    await withAuth(
      async () => {
        await postJson("/api/props", {
          name,
          category,
          notes: notes || undefined,
        });
        await reload();
      },
      () => void handleAddProp(name, category, notes),
    );
  }

  async function handleDeleteProp(id: number) {
    await withAuth(
      async () => {
        await deleteJson(`/api/props/${id}`);
        await reload();
      },
      () => void handleDeleteProp(id),
    );
  }

  async function handleSaveStrategy(
    propId: number,
    position: PositionId,
    equipment: string,
    bagPlacement: string,
    notes: string,
  ) {
    await withAuth(
      async () => {
        await postJson("/api/strategies", {
          propId,
          position,
          equipment: equipment || undefined,
          bagPlacement: bagPlacement || undefined,
          notes: notes || undefined,
        });
        await reload();
      },
      () =>
        void handleSaveStrategy(
          propId,
          position,
          equipment,
          bagPlacement,
          notes,
        ),
    );
  }

  const grouped = new Map<string, PropRow[]>();
  for (const prop of props ?? []) {
    const list = grouped.get(prop.category) ?? [];
    list.push(prop);
    grouped.set(prop.category, list);
  }

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 space-y-6 p-4 lg:p-6">
      <PageHeader eyebrow="Reference" title="Props & Strategy">
        What to do when you see it again: bag, position, and how to lay it on
        the prop.
      </PageHeader>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      {needsLogin && (
        <LoginForm
          onSuccess={() => {
            setNeedsLogin(false);
            retryRef.current();
          }}
        />
      )}

      <AddPropForm onAdd={handleAddProp} />

      {props === null ? (
        <p className="text-sm text-neutral-500">Loading…</p>
      ) : props.length === 0 ? (
        <p className="text-sm text-neutral-500">
          No props yet — add the first one above.
        </p>
      ) : (
        Array.from(grouped.entries()).map(([category, categoryProps]) => (
          <section key={category} className="space-y-3">
            <h2 className="text-sm font-semibold tracking-wide text-neutral-500 uppercase dark:text-neutral-400">
              {category}
            </h2>
            {categoryProps.map((prop) => (
              <PropCard
                key={prop.id}
                prop={prop}
                // Both handlers only run from PropCard's own onClick — the
                // ref write they trigger happens on click, never at render.
                // eslint-disable-next-line react-hooks/refs
                onDelete={() => handleDeleteProp(prop.id)}
                onSaveStrategy={(position, equipment, bagPlacement, notes) =>
                  // eslint-disable-next-line react-hooks/refs
                  handleSaveStrategy(
                    prop.id,
                    position,
                    equipment,
                    bagPlacement,
                    notes,
                  )
                }
              />
            ))}
          </section>
        ))
      )}
    </div>
  );
}

function AddPropForm({
  onAdd,
}: {
  onAdd: (name: string, category: string, notes: string) => void;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [notes, setNotes] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !category.trim()) return;
    onAdd(name.trim(), category.trim(), notes.trim());
    setName("");
    setCategory("");
    setNotes("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-2 rounded-lg border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900/50"
    >
      <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
        Add a prop
      </h2>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelClass} htmlFor="propName">
            Name
          </label>
          <input
            id="propName"
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Tank trap"
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="propCategory">
            Category
          </label>
          <input
            id="propCategory"
            className={inputClass}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g. barricade"
          />
        </div>
      </div>
      <div>
        <label className={labelClass} htmlFor="propNotes">
          General notes (optional)
        </label>
        <input
          id="propNotes"
          className={inputClass}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      <button
        type="submit"
        className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
      >
        Add prop
      </button>
    </form>
  );
}

function PropCard({
  prop,
  onDelete,
  onSaveStrategy,
}: {
  prop: PropRow;
  onDelete: () => void;
  onSaveStrategy: (
    position: PositionId,
    equipment: string,
    bagPlacement: string,
    notes: string,
  ) => void;
}) {
  const [addingPosition, setAddingPosition] = useState<PositionId | "">("");

  const strategyByPosition = new Map(
    prop.strategies.map((s) => [s.position, s]),
  );

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-medium">{prop.name}</h3>
          {prop.notes && (
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {prop.notes}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            if (confirm(`Delete "${prop.name}" and all its strategy notes?`)) {
              onDelete();
            }
          }}
          className="text-xs font-medium text-neutral-500 hover:text-red-600 dark:text-neutral-400 dark:hover:text-red-400"
        >
          Delete
        </button>
      </div>

      <div className="mt-2 space-y-2">
        {prop.strategies.map((strategy) => (
          <StrategyRowView
            key={strategy.id}
            strategy={strategy}
            onEdit={() => setAddingPosition(strategy.position)}
          />
        ))}
      </div>

      {addingPosition ? (
        <StrategyForm
          initial={strategyByPosition.get(addingPosition)}
          position={addingPosition}
          onCancel={() => setAddingPosition("")}
          onSave={(equipment, bagPlacement, notes) => {
            onSaveStrategy(addingPosition, equipment, bagPlacement, notes);
            setAddingPosition("");
          }}
        />
      ) : (
        <select
          className={`${inputClass} mt-2`}
          value=""
          onChange={(e) => setAddingPosition(e.target.value as PositionId)}
        >
          <option value="" disabled>
            Add / edit strategy for a position…
          </option>
          {POSITION_IDS.map((position) => (
            <option key={position} value={position}>
              {POSITION_LABELS[position]}
              {strategyByPosition.has(position) ? " (edit)" : ""}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

function StrategyRowView({
  strategy,
  onEdit,
}: {
  strategy: StrategyRow;
  onEdit: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onEdit}
      className="block w-full rounded-md border border-neutral-200 p-2 text-left text-xs hover:border-blue-400 dark:border-neutral-800"
    >
      <span className="font-medium">{POSITION_LABELS[strategy.position]}</span>
      {strategy.equipment && <span> — {strategy.equipment}</span>}
      {strategy.bag_placement && (
        <div className="text-neutral-500 dark:text-neutral-400">
          Placement: {strategy.bag_placement}
        </div>
      )}
      {strategy.notes && (
        <div className="text-neutral-500 dark:text-neutral-400">
          {strategy.notes}
        </div>
      )}
    </button>
  );
}

function StrategyForm({
  position,
  initial,
  onSave,
  onCancel,
}: {
  position: PositionId;
  initial?: StrategyRow;
  onSave: (equipment: string, bagPlacement: string, notes: string) => void;
  onCancel: () => void;
}) {
  const [equipment, setEquipment] = useState(initial?.equipment ?? "");
  const [bagPlacement, setBagPlacement] = useState(
    initial?.bag_placement ?? "",
  );
  const [notes, setNotes] = useState(initial?.notes ?? "");

  return (
    <div className="mt-2 space-y-2 rounded-md border border-blue-200 p-2 dark:border-blue-900">
      <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
        {POSITION_LABELS[position]}
      </p>
      <div>
        <label className={labelClass}>Equipment (bag / bipod / tripod)</label>
        <input
          className={inputClass}
          value={equipment}
          onChange={(e) => setEquipment(e.target.value)}
        />
      </div>
      <div>
        <label className={labelClass}>Bag placement</label>
        <input
          className={inputClass}
          value={bagPlacement}
          onChange={(e) => setBagPlacement(e.target.value)}
        />
      </div>
      <div>
        <label className={labelClass}>Notes</label>
        <input
          className={inputClass}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onSave(equipment, bagPlacement, notes)}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
