"use client";

import React from "react";
import type { Note } from "@/lib/apiClient";
import { formatDateTime } from "@/lib/format";
import { TagPill } from "@/components/TagPill";

type NoteCardProps = {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (note: Note) => void;
  onTogglePinned: (note: Note) => void;
  onToggleFavorite: (note: Note) => void;
};

// PUBLIC_INTERFACE
export function NoteCard({ note, onEdit, onDelete, onTogglePinned, onToggleFavorite }: NoteCardProps) {
  return (
    <article className="noteCard" aria-label={`Note: ${note.title || "Untitled"}`}>
      <div className="noteTitleRow">
        <div style={{ minWidth: 0 }}>
          <div className="noteTitle">{note.title?.trim() ? note.title : "Untitled"}</div>
          <div className="noteContentPreview">{note.content?.trim() ? note.content : "—"}</div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {note.is_pinned ? (
            <span className="pill pillActive" title="Pinned" aria-label="Pinned">
              PIN
            </span>
          ) : null}
          {note.is_favorite ? (
            <span className="pill pillActive" title="Favorite" aria-label="Favorite">
              FAV
            </span>
          ) : null}
        </div>
      </div>

      <div className="noteMeta">
        <span title={`Created ${note.created_at}`}>Created {formatDateTime(note.created_at)}</span>
        <span aria-hidden="true">•</span>
        <span title={`Updated ${note.updated_at}`}>Updated {formatDateTime(note.updated_at)}</span>
      </div>

      {note.tags?.length ? (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
          {note.tags.map((t) => (
            <TagPill key={t.id} tag={t} />
          ))}
        </div>
      ) : (
        <div className="helpText" style={{ marginTop: 10 }}>
          No tags
        </div>
      )}

      <div className="noteActions">
        <button
          type="button"
          className={`iconBtn ${note.is_pinned ? "iconBtnActive" : ""}`}
          onClick={() => onTogglePinned(note)}
          aria-pressed={note.is_pinned}
          aria-label={note.is_pinned ? "Unpin note" : "Pin note"}
          title={note.is_pinned ? "Unpin" : "Pin"}
        >
          {note.is_pinned ? "Unpin" : "Pin"}
        </button>

        <button
          type="button"
          className={`iconBtn ${note.is_favorite ? "iconBtnActive" : ""}`}
          onClick={() => onToggleFavorite(note)}
          aria-pressed={note.is_favorite}
          aria-label={note.is_favorite ? "Remove favorite" : "Add favorite"}
          title={note.is_favorite ? "Unfavorite" : "Favorite"}
        >
          {note.is_favorite ? "Unfav" : "Fav"}
        </button>

        <button type="button" className="iconBtn" onClick={() => onEdit(note)} aria-label="Edit note">
          Edit
        </button>

        <button
          type="button"
          className="iconBtn"
          onClick={() => onDelete(note)}
          aria-label="Delete note"
          title="Delete"
        >
          Delete
        </button>
      </div>
    </article>
  );
}
