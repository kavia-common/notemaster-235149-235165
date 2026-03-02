"use client";

import React, { useMemo, useState } from "react";
import type { Tag } from "@/lib/apiClient";
import { Modal } from "@/components/Modal";
import { TagPill } from "@/components/TagPill";

type Props = {
  open: boolean;
  tags: Tag[];
  onClose: () => void;
  onCreate: (payload: { name: string; color?: string | null }) => Promise<void>;
  onUpdate: (tagId: string, payload: { name?: string | null; color?: string | null }) => Promise<void>;
  onDelete: (tagId: string) => Promise<void>;
};

function normalizeHexOrNull(v: string): string | null {
  const s = v.trim();
  if (!s) return null;
  return s;
}

// PUBLIC_INTERFACE
export function TagManagerModal({ open, tags, onClose, onCreate, onUpdate, onDelete }: Props) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sorted = useMemo(() => [...tags].sort((a, b) => a.name.localeCompare(b.name)), [tags]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = name.trim();
    if (!trimmed) {
      setError("Tag name is required.");
      return;
    }
    if (trimmed.length > 50) {
      setError("Tag name must be 50 characters or fewer.");
      return;
    }

    setBusy(true);
    try {
      await onCreate({ name: trimmed, color: normalizeHexOrNull(color) });
      setName("");
      setColor("");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create tag.";
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  const rename = async (tag: Tag) => {
    const next = window.prompt(`Rename tag "${tag.name}" to:`, tag.name);
    if (next === null) return;
    const trimmed = next.trim();
    if (!trimmed) return;

    setBusy(true);
    setError(null);
    try {
      await onUpdate(tag.id, { name: trimmed });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update tag.";
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  const recolor = async (tag: Tag) => {
    const next = window.prompt(`Set hex color for "${tag.name}" (blank to clear):`, tag.color ?? "");
    if (next === null) return;

    setBusy(true);
    setError(null);
    try {
      await onUpdate(tag.id, { color: normalizeHexOrNull(next) });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update tag color.";
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (tag: Tag) => {
    const ok = window.confirm(`Delete tag "${tag.name}"? It will be removed from all notes.`);
    if (!ok) return;

    setBusy(true);
    setError(null);
    try {
      await onDelete(tag.id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete tag.";
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      title="Tag Manager"
      description="Create new tags, rename, recolor, or delete them."
      onClose={() => {
        if (!busy) onClose();
      }}
      footer={
        <button type="button" className="btn btnSm btnGhost" onClick={onClose} disabled={busy}>
          Close
        </button>
      }
    >
      {error ? (
        <div className="alert" role="alert" aria-live="assertive" style={{ marginBottom: 12 }}>
          {error}
        </div>
      ) : null}

      <form onSubmit={create} style={{ display: "grid", gridTemplateColumns: "1fr 170px auto", gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <label className="helpText" htmlFor="new-tag-name">
            New tag name
          </label>
          <input
            id="new-tag-name"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Synthwave"
            disabled={busy}
          />
        </div>

        <div>
          <label className="helpText" htmlFor="new-tag-color">
            Color (optional)
          </label>
          <input
            id="new-tag-color"
            className="input"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            placeholder="#06b6d4"
            disabled={busy}
          />
        </div>

        <div style={{ alignSelf: "end" }}>
          <button type="submit" className="btn btnSm btnPrimary" disabled={busy}>
            {busy ? "Working…" : "Add"}
          </button>
        </div>
      </form>

      <div style={{ height: 14 }} />

      <div className="helpText" style={{ marginBottom: 8 }}>
        Existing tags ({sorted.length})
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {sorted.length ? (
          sorted.map((t) => (
            <TagPill
              key={t.id}
              tag={t}
              rightSlot={
                <span style={{ display: "inline-flex", gap: 6 }}>
                  <button type="button" className="iconBtn" onClick={() => rename(t)} disabled={busy}>
                    Rename
                  </button>
                  <button type="button" className="iconBtn" onClick={() => recolor(t)} disabled={busy}>
                    Color
                  </button>
                  <button type="button" className="iconBtn" onClick={() => remove(t)} disabled={busy}>
                    Delete
                  </button>
                </span>
              }
            />
          ))
        ) : (
          <div className="helpText">No tags yet. Create your first tag above.</div>
        )}
      </div>
    </Modal>
  );
}
