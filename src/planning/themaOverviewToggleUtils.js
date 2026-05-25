/** Kurzvorschau für Toggle-Summary-Zeilen. */
export const truncateToggleMeta = (text, max = 48) => {
  const t = String(text || "").trim();
  if (!t) {
    return null;
  }
  return t.length > max ? `${t.slice(0, max)}…` : t;
};

const COMBINED_PARENT = {
  todos: "todos-material",
  material: "todos-material",
  kompetenzen: "kompetenzen-ziele",
  ziele: "kompetenzen-ziele",
};

/** Sprungmarke — öffnet kombinierten oder einzelnen Toggle, scrollt zum Unterabschnitt. */
export const openThemaOverviewHash = (hash) => {
  if (!hash) {
    return;
  }

  const parentId = COMBINED_PARENT[hash] || hash;
  const parent = document.getElementById(`thema-section-${parentId}`);
  if (parent && parent.tagName === "DETAILS") {
    parent.open = true;
  }

  const scrollTarget = document.getElementById(`thema-section-${hash}`);
  (scrollTarget || parent)?.scrollIntoView({ behavior: "smooth", block: "start" });
};
