"use client";

import React, { useEffect, useMemo, useState } from "react";
import { api, ApiError, type Note, type NoteCreate, type Tag, type UUID } from "@/lib/apiClient";
import { NoteCard } from "@/components/NoteCard";
import { NoteEditorModal } from "@/components/NoteEditorModal";
import { TagManagerModal } from "@/components/TagManagerModal";
import { TagPill } from "@/components/TagPill";

type ActiveFilter =
  | { kind: "all" }
  | { kind: "favorites" }
  | { kind: "tag"; tagId: UUID };

function filterLabel(filter: ActiveFilter, tags: Tag[]): string {
  if (filter.kind === "all") return "All Notes";
  if (filter.kind === "favorites") return "Favorites";
  const tag = tags.find((t) => t.id === filter.tagId);
  return tag ? `Tag: ${tag.name}` : "Tag";
}

export default function Home() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);

  const [filter, setFilter] = useState<ActiveFilter>({ kind: "all" });
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadingTags, setLoadingTags] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const errorMessage = (err: unknown): string => {
    if (err instanceof Error) return err.message;
    return "Unexpected error.";
  };

  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [noteModalMode, setNoteModalMode] = useState<"create" | "edit">("create");
  const [activeNote, setActiveNote] = useState<Note | null>(null);

  const [tagManagerOpen, setTagManagerOpen] = useState(false);

  const favoritesOnly = filter.kind === "favorites";
  const tagId = filter.kind === "tag" ? filter.tagId : null;

  const visibleNotes = useMemo(() => notes, [notes]);

  const fetchTags = async () => {
    setLoadingTags(true);
    try {
      const t = await api.listTags({ limit: 500 });
      setTags(t);
    } finally {
      setLoadingTags(false);
    }
  };

  const fetchNotes = async () => {
    setLoading(true);
    setError(null);
    try {
      const n = await api.listNotes({
        tag_id: tagId,
        favorites_only: favoritesOnly,
        q: search.trim() ? search.trim() : null,
        limit: 200,
        offset: 0,
      });
      setNotes(n);
    } catch (err: unknown) {
      if (err instanceof ApiError) setError(err.message);
      else setError("Failed to load notes.");
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    let alive = true;

    const boot = async () => {
      setError(null);
      try {
        await api.health();
      } catch (err: unknown) {
        if (!alive) return;
        setError(errorMessage(err) || "Cannot reach API. Check NEXT_PUBLIC_API_BASE_URL.");
      }

      if (!alive) return;

      await Promise.all([fetchTags().catch(() => undefined), fetchNotes().catch(() => undefined)]);
    };

    boot();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refetch notes when filters/search change (debounced)
  useEffect(() => {
    const t = window.setTimeout(() => {
      fetchNotes().catch(() => undefined);
    }, 220);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter.kind, tagId, favoritesOnly, search]);

  const openCreate = () => {
    setNoteModalMode("create");
    setActiveNote(null);
    setNoteModalOpen(true);
  };

  const openEdit = (note: Note) => {
    setNoteModalMode("edit");
    setActiveNote(note);
    setNoteModalOpen(true);
  };

  const submitNote = async (payload: NoteCreate) => {
    setStatusMsg(null);
    setError(null);

    if (noteModalMode === "create") {
      await api.createNote(payload);
      setStatusMsg("Note created.");
    } else {
      if (!activeNote) return;
      await api.updateNote(activeNote.id, {
        title: payload.title,
        content: payload.content,
        is_pinned: payload.is_pinned,
        is_favorite: payload.is_favorite,
        tag_ids: payload.tag_ids,
      });
      setStatusMsg("Note updated.");
    }

    await fetchNotes();
    await fetchTags(); // tags list may have changed externally; safe refresh
  };

  const deleteNote = async (note: Note) => {
    const ok = window.confirm(`Delete "${note.title?.trim() ? note.title : "Untitled"}"?`);
    if (!ok) return;

    setError(null);
    setStatusMsg(null);
    try {
      await api.deleteNote(note.id);
      setStatusMsg("Note deleted.");
      await fetchNotes();
    } catch (err: unknown) {
      setError(errorMessage(err) ?? "Failed to delete note.");
    }
  };

  const togglePinned = async (note: Note) => {
    setError(null);
    try {
      if (note.is_pinned) await api.unpinNote(note.id);
      else await api.pinNote(note.id);
      await fetchNotes();
    } catch (err: unknown) {
      setError(errorMessage(err) ?? "Failed to toggle pin.");
    }
  };

  const toggleFavorite = async (note: Note) => {
    setError(null);
    try {
      if (note.is_favorite) await api.unfavoriteNote(note.id);
      else await api.favoriteNote(note.id);
      await fetchNotes();
    } catch (err: unknown) {
      setError(errorMessage(err) ?? "Failed to toggle favorite.");
    }
  };

  const createTag = async (payload: { name: string; color?: string | null }) => {
    setError(null);
    await api.createTag(payload);
    await fetchTags();
  };

  const updateTag = async (tagId: string, payload: { name?: string | null; color?: string | null }) => {
    setError(null);
    await api.updateTag(tagId, payload);
    await Promise.all([fetchTags(), fetchNotes()]);
  };

  const deleteTag = async (tagId: string) => {
    setError(null);
    await api.deleteTag(tagId);
    // If currently filtering by deleted tag, reset to all.
    setFilter((f) => (f.kind === "tag" && f.tagId === tagId ? { kind: "all" } : f));
    await Promise.all([fetchTags(), fetchNotes()]);
  };

  return (
    <div className="appShell">
      <aside className="sidebar" aria-label="Sidebar">
        <div className="brand">
          <div className="logoMark" aria-hidden="true" />
          <div>
            <div className="brandTitle">NoteMaster</div>
            <div className="brandSubtitle">retro notes • tags • pins</div>
          </div>
        </div>

        <div className="panel" style={{ marginTop: 10 }}>
          <div className="panelHeader">
            <div>
              <div className="sectionTitle">Navigation</div>
            </div>
          </div>
          <div className="panelBody" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              className={`pill ${filter.kind === "all" ? "pillActive" : ""}`}
              onClick={() => setFilter({ kind: "all" })}
              aria-pressed={filter.kind === "all"}
            >
              All
            </button>
            <button
              type="button"
              className={`pill ${filter.kind === "favorites" ? "pillActive" : ""}`}
              onClick={() => setFilter({ kind: "favorites" })}
              aria-pressed={filter.kind === "favorites"}
            >
              Favorites
            </button>
          </div>
        </div>

        <div className="panel" style={{ marginTop: 12 }}>
          <div className="panelHeader">
            <div className="sectionTitle">Tags</div>
            <button type="button" className="btn btnSm btnGhost" onClick={() => setTagManagerOpen(true)}>
              Manage
            </button>
          </div>
          <div className="panelBody">
            {loadingTags ? <div className="helpText">Loading tags…</div> : null}
            {!loadingTags && !tags.length ? <div className="helpText">No tags yet.</div> : null}

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {tags.map((t) => (
                <TagPill
                  key={t.id}
                  tag={t}
                  active={filter.kind === "tag" && filter.tagId === t.id}
                  onClick={() => setFilter({ kind: "tag", tagId: t.id })}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="helpText" style={{ marginTop: 12, padding: "0 6px" }}>
          Tip: Use <span className="kbd">Esc</span> to close dialogs. Search updates live.
        </div>
      </aside>

      <div className="main">
        <header className="headerBar">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: 12,
              alignItems: "center",
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                <h1 style={{ fontSize: 18, fontWeight: 850, letterSpacing: 0.2 }}>
                  {filterLabel(filter, tags)}
                </h1>
                <span className="helpText" aria-live="polite">
                  {loading ? "Loading…" : `${visibleNotes.length} note${visibleNotes.length === 1 ? "" : "s"}`}
                </span>
              </div>

              <label className="srOnly" htmlFor="search-notes">
                Search notes
              </label>
              <input
                id="search-notes"
                className="input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search titles + content…"
                aria-describedby="search-help"
                style={{ marginTop: 10 }}
              />
              <div id="search-help" className="helpText" style={{ marginTop: 6 }}>
                Searches the backend (full-text where possible).
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
              <button type="button" className="btn btnPrimary" onClick={openCreate}>
                + New Note
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setStatusMsg(null);
                  fetchNotes().catch(() => undefined);
                }}
              >
                Refresh
              </button>
            </div>
          </div>
        </header>

        <main className="content" aria-label="Main content">
          {error ? (
            <div className="alert" role="alert" aria-live="assertive" style={{ marginBottom: 12 }}>
              {error}
              <div className="helpText" style={{ marginTop: 6 }}>
                Ensure the backend is running and <span className="kbd">NEXT_PUBLIC_API_BASE_URL</span> is set.
              </div>
            </div>
          ) : null}

          {statusMsg ? (
            <div className="success" role="status" aria-live="polite" style={{ marginBottom: 12 }}>
              {statusMsg}
            </div>
          ) : null}

          {loading && !visibleNotes.length ? <div className="helpText">Loading notes…</div> : null}

          {!loading && !visibleNotes.length ? (
            <div className="panel">
              <div className="panelBody">
                <div style={{ fontWeight: 800, marginBottom: 6 }}>No notes found</div>
                <div className="helpText">
                  Try a different filter, clear your search, or create a new note.
                </div>
                <div style={{ marginTop: 12 }}>
                  <button type="button" className="btn btnPrimary" onClick={openCreate}>
                    Create your first note
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          <div className="grid">
            <div className="notesCol" style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 14 }}>
              {visibleNotes.map((n) => (
                <div key={n.id} style={{ gridColumn: "span 12" }}>
                  <NoteCard
                    note={n}
                    onEdit={openEdit}
                    onDelete={deleteNote}
                    onTogglePinned={togglePinned}
                    onToggleFavorite={toggleFavorite}
                  />
                </div>
              ))}
            </div>
          </div>
        </main>

        <NoteEditorModal
          open={noteModalOpen}
          mode={noteModalMode}
          note={activeNote}
          tags={tags}
          onClose={() => setNoteModalOpen(false)}
          onSubmit={submitNote}
        />

        <TagManagerModal
          open={tagManagerOpen}
          tags={tags}
          onClose={() => setTagManagerOpen(false)}
          onCreate={createTag}
          onUpdate={updateTag}
          onDelete={deleteTag}
        />
      </div>
    </div>
  );
}
