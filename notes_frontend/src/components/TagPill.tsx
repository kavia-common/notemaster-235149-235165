"use client";

import React from "react";
import type { Tag } from "@/lib/apiClient";
import { tagColorToDotStyle } from "@/lib/format";

type TagPillProps = {
  tag: Tag;
  active?: boolean;
  onClick?: () => void;
  rightSlot?: React.ReactNode;
};

// PUBLIC_INTERFACE
export function TagPill({ tag, active, onClick, rightSlot }: TagPillProps) {
  if (onClick) {
    return (
      <button
        type="button"
        className={`pill ${active ? "pillActive" : ""}`}
        onClick={onClick}
        aria-pressed={Boolean(active)}
      >
        <span className="pillDot" style={tagColorToDotStyle(tag.color)} aria-hidden="true" />
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 160 }}>
          {tag.name}
        </span>
        {rightSlot ? <span style={{ marginLeft: 6 }}>{rightSlot}</span> : null}
      </button>
    );
  }

  return (
    <span className="pill">
      <span className="pillDot" style={tagColorToDotStyle(tag.color)} aria-hidden="true" />
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 160 }}>
        {tag.name}
      </span>
      {rightSlot ? <span style={{ marginLeft: 6 }}>{rightSlot}</span> : null}
    </span>
  );
}
