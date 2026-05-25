/** Kurzvorschau für Toggle-Summary-Zeilen. */
export const truncateToggleMeta = (text, max = 48) => {
  const t = String(text || "").trim();
  if (!t) {
    return null;
  }
  return t.length > max ? `${t.slice(0, max)}…` : t;
};

/** Sprungmarke — öffnet nur die angezielte Kachel. */
export const openThemaOverviewHash = (hash) => {
  if (!hash) {
    return;
  }
  const sectionId = hash === "kompetenzen-ziele" ? "voraussetzungen" : hash;
  const el = document.getElementById(`thema-section-${sectionId}`);
  if (el && el.tagName === "DETAILS") {
    el.open = true;
  }
  const scrollTarget =
    hash === "kompetenzen-ziele"
      ? document.getElementById("thema-section-kompetenzen-ziele")
      : el;
  scrollTarget?.scrollIntoView({ behavior: "smooth", block: "start" });
};
