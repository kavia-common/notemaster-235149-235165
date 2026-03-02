"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { Note, NoteCreate, Tag, UUID } from "@/lib/apiClient";
import { Modal } from "@/components/Modal";

type Props = {
  open: boolean;
  mode: "create" | "edit";
  note?: Note | null;
  tags: Tag[];
  onClose: () => void;
  onSubmit: (payload: NoteCreate) => Promise<void>;
};

function extractTagIds(note?: Note | null): UUID[] {
  if (!note?.tags?.length) return [];
  return note.tags.map((t) => t.id);
}

// PUBLIC_INTERFACE
export function NoteEditorModal({ open, mode, note, tags, onClose, onSubmit }: Props) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [tagIds, setTagIds] = useState<UUID[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tagById = useMemo(() => Object.fromEntries(tags.map((t) => [t.id, t])), [tags]);

  useEffect(() => {
    if (!open) return;
    setError(null);

    if (mode === "edit" && note) {
      setTitle(note.title ?? "");
      setContent(note.content ?? "");
      setIsPinned(Boolean(note.is_pinned));
      setIsFavorite(Boolean(note.is_favorite));
      setTagIds(extractTagIds(note));
      return;
    }

    // create
    setTitle("");
    setContent("");
    setIsPinned(false);
    setIsFavorite(false);
    setTagIds([]);
  }, [open, mode, note]);

  const selectedTagNames = useMemo(() => tagIds.map((id) => tagById[id]?.name).filter(Boolean).join(", "), [tagIds, tagById]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedTitle = title.trim();
    if (trimmedTitle.length > 200) {
      setError("Title must be 200 characters or fewer.");
      return;
    }

    setSaving(true);
    try {
      await onSubmit({
        title: trimmedTitle,
        content,
        is_pinned: isPinned,
        is_favorite: isFavorite,
        tag_ids: tagIds,
      });
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save note.";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      title={mode === "create" ? "Create Note" : "Edit Note"}
      description="Write your note, then assign tags. Use Escape to close."
      onClose={() => {
        if (!saving) onClose();
      }}
      footer={
        <>
          <button type="button" className="btn btnSm btnGhost" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" form="note-editor-form" className="btn btnSm btnPrimary" disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </button>
        </>
      }
    >
      <form id="note-editor-form" onSubmit={submit}>
        {error ? (
          <div className="alert" role="alert" aria-live="assertive" style={{ marginBottom: 12 }}>
            {error}
          </div>
        ) : null}

        <label className="helpText" htmlFor="note-title">
          Title
        </label>
        <input
          id="note-title"
          className="input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled neon memo…"
          maxLength={240}
        />

        <div style={{ height: 10 }} />

        <label className="helpText" htmlFor="note-content">
          Content
        </label>
        <textarea
          id="note-content"
          className="textarea"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type your note…"
        />

        <div style={{ height: 10 }} />

        <fieldset style={{ border: "none" }}>
          <legend className="helpText">Flags</legend>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8 }}>
            <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" checked={isPinned} onChange={(e) => setIsPinned(e.target.checked)} />
              <span>Pin</span>
            </label>
            <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" checked={isFavorite} onChange={(e) => setIsFavorite(e.target.checked)} />
              <span>Favorite</span>
            </label>
          </div>
        </fieldset>

        <div style={{ height: 10 }} />

        <label className="helpText" htmlFor="note-tags">
          Tags <span className="helpText">(hold Ctrl/Cmd to select multiple)</span>
        </label>
        <select
          id="note-tags"
          className="select"
          multiple
          value={tagIds}
          onChange={(e) => {
            const ids = Array.from(e.target.selectedOptions).map((o) => o.value);
            setTagIds(ids);
          }}
          size={Math.min(8, Math.max(3, tags.length || 3))}
          aria-describedby="note-tags-help"
        >
          {tags.length ? (
            tags.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))
          ) : (
            <option value="" disabled>
              No tags yet
            </option>
          )}
        </select>
        <div id="note-tags-help" className="helpText" style={{ marginTop: 6 }}>
          Selected: {selectedTagNames || "none"}
        </div>
      </form>
    </Modal>
  );
}
