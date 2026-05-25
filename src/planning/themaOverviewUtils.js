import { WEEKDAYS } from "./planningDefaults";

const WEEKDAY_LABELS = Object.fromEntries(WEEKDAYS.map((d) => [d.id, d.label]));

/** Termin aus Wochenkarten oder Lektions-Feldern. */
export const findLektionSchedule = (vorhaben, lektionId) => {
  if (!vorhaben || !lektionId) {
    return null;
  }
  for (const week of vorhaben.wochen || []) {
    for (const wd of WEEKDAYS) {
      const day = week.days?.[wd.id];
      const card = (day?.cards || []).find((c) => c.lektionId === lektionId);
      if (card) {
        return {
          weekId: week.id,
          weekday: wd.id,
          kw: week.kw,
          year: week.year,
          label: card.label,
          startMin: card.startMin ?? null,
        };
      }
    }
  }
  const lek = (vorhaben.lektionen || []).find((l) => l.id === lektionId);
  if (lek?.weekId && lek?.weekday) {
    const week = (vorhaben.wochen || []).find((w) => w.id === lek.weekId);
    return {
      weekId: lek.weekId,
      weekday: lek.weekday,
      kw: week?.kw,
      year: week?.year,
      label: lek.title,
      startMin: null,
    };
  }
  if (lek?.weekday) {
    return { weekday: lek.weekday, label: lek.title, startMin: null };
  }
  return null;
};

export const isLektionScheduled = (lektion, vorhaben) => {
  if (!lektion) {
    return false;
  }
  if (vorhaben) {
    return Boolean(findLektionSchedule(vorhaben, lektion.id));
  }
  return Boolean(lektion.weekId && lektion.weekday);
};

export const lektionBlocksSumMin = (lektion) =>
  (lektion?.ablaufBlocks || []).reduce((s, b) => s + (b.durationMin || 0), 0);

export const lektionHasTimeMismatch = (lektion) => {
  const sum = lektionBlocksSumMin(lektion);
  const target = lektion?.durationMin || 0;
  return sum > 0 && target > 0 && sum !== target;
};

export const lektionHasZiel = (lektion) => Boolean((lektion?.ziele || "").trim());

export const getOverviewStats = (vorhaben) => {
  const lektionen = vorhaben?.lektionen || [];
  const zieleListe = vorhaben?.grob?.zieleListe || [];
  const themaZiele =
    zieleListe.length > 0
      ? zieleListe
          .filter((z) => !z.done)
          .map((z) => z.text)
          .join(" ")
          .trim() || zieleListe[0]?.text?.trim() || ""
      : (vorhaben?.grob?.ziele || "").trim();
  const withLektionZiel = lektionen.filter(lektionHasZiel).length;
  const compThema = vorhaben?.competencies?.length || 0;
  const compOnlyLektion = lektionen.reduce((n, l) => {
    const extra = (l.competencies || []).filter(
      (c) => !(vorhaben.competencies || []).some((t) => t.uid === c.uid)
    );
    return n + (extra.length > 0 ? 1 : 0);
  }, 0);
  const materialSnippets = collectMaterialItems(vorhaben);
  const materialPreview =
    materialSnippets.length > 0
      ? materialSnippets[0].text.slice(0, 72) +
        (materialSnippets[0].text.length > 72 ? "…" : "")
      : "";
  const openTodoItems = (vorhaben?.erinnerungen || []).filter((e) => !e.done);
  const openTodos = openTodoItems.length;
  const openTodoPreview =
    openTodoItems.length > 0
      ? openTodoItems[0].text.slice(0, 52) + (openTodoItems[0].text.length > 52 ? "…" : "")
      : "";
  const openTodoExtra =
    openTodoItems.length > 1 ? `+${openTodoItems.length - 1} weitere` : "";
  const unscheduled = lektionen.filter((l) => !isLektionScheduled(l, vorhaben)).length;

  return {
    themaZiele,
    withLektionZiel,
    lektionCount: lektionen.length,
    compThema,
    compOnlyLektion,
    materialCount: materialSnippets.length,
    materialPreview,
    openTodos,
    openTodoPreview,
    openTodoExtra,
    unscheduled,
  };
};

export const collectMaterialItems = (vorhaben) => {
  const items = [];
  for (const entry of vorhaben?.zweiWochen?.materialListe || []) {
    const text = (entry.text || "").trim();
    if (text) {
      items.push({ source: "Thema", text, done: entry.done });
    }
  }
  const zwei = (vorhaben?.zweiWochen?.material || "").trim();
  if (zwei && items.length === 0) {
    items.push({ source: "Thema", text: zwei });
  }
  for (const lek of vorhaben?.lektionen || []) {
    const mat = (lek.material || "").trim();
    if (mat) {
      items.push({ source: lek.title || "Lektion", lektionId: lek.id, text: mat });
    }
  }
  return items;
};

/** @returns {{ phaseId: string|null, title: string, lektionen: object[] }[]} */
export const groupLektionenByPhase = (vorhaben) => {
  const phases = [...(vorhaben?.grob?.phasen || [])].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0)
  );
  let lektionen = [...(vorhaben?.lektionen || [])];
  if (phases.length > 0) {
    lektionen = lektionen.map((l, index) => {
      if (l.phaseId && phases.some((p) => p.id === l.phaseId)) {
        return l;
      }
      const phase = phases[Math.min(index, phases.length - 1)];
      return phase ? { ...l, phaseId: phase.id } : l;
    });
  }
  const groups = phases
    .map((ph) => ({
      phaseId: ph.id,
      title: ph.title || "Phase",
      lektionen: lektionen.filter((l) => l.phaseId === ph.id),
    }))
    .filter((g) => g.lektionen.length > 0);
  const unassigned = lektionen.filter(
    (l) => !l.phaseId || !phases.some((p) => p.id === l.phaseId)
  );
  if (unassigned.length > 0) {
    groups.push({
      phaseId: null,
      title: "Noch nicht eingeordnet",
      lektionen: unassigned,
      isFallback: true,
    });
  }
  return groups.filter((g) => g.lektionen.length > 0 || !g.isFallback);
};

export const formatLektionSchedule = (lektion, vorhaben) => {
  const slot = findLektionSchedule(vorhaben, lektion?.id);
  if (!slot) {
    return null;
  }
  const dayLabel = WEEKDAY_LABELS[slot.weekday] || slot.weekday;
  if (slot.kw) {
    return `KW ${slot.kw} · ${dayLabel}`;
  }
  return dayLabel || null;
};

export const truncateLines = (text, maxLen = 120) => {
  const t = (text || "").trim();
  if (!t) {
    return "";
  }
  if (t.length <= maxLen) {
    return t;
  }
  return `${t.slice(0, maxLen).trim()}…`;
};
