import {
  DEFAULT_RITUALS,
  VORHABEN_TEMPLATES,
  WEEKDAYS,
} from "./planningDefaults";
import { getSchoolYearStart } from "./calendarUtils";
import {
  buildKalenderForSchoolYear,
  normalizeKalender,
} from "./planningKalender";
import { recordUndoSnapshot } from "../undo/undoHistory";

export const PLANNING_STORAGE_KEY = "lp21-planning-v1";

const newId = (prefix) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const getIsoWeek = (date = new Date()) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return { kw: week, year: d.getUTCFullYear() };
};

const emptyDay = () => ({ cards: [], notiz: "" });

const emptyWeek = (kw, year) => ({
  id: newId("w"),
  kw,
  year,
  focus: "",
  days: Object.fromEntries(WEEKDAYS.map((d) => [d.id, emptyDay()])),
  sonderTage: [],
});

const templateGrob = (templateId) => {
  const t = VORHABEN_TEMPLATES.find((x) => x.id === templateId);
  if (!t) {
    return {
      ziele: "",
      phasen: [],
      schwerpunkte: "",
      voraussetzungen: "",
      sicherung: "",
      notizen: "",
    };
  }
  return {
    ziele: t.grob.ziele,
    schwerpunkte: "",
    voraussetzungen: "",
    sicherung: "",
    notizen: "",
    phasen: t.grob.phasen.map((p, i) => ({
      id: newId("ph"),
      title: p.title,
      notes: p.notes || "",
      order: i,
    })),
  };
};

export const createVorhaben = (partial = {}) => {
  const { kw, year } = getIsoWeek();
  const templateId = partial.templateId || "thema";
  const t = VORHABEN_TEMPLATES.find((x) => x.id === templateId);
  return {
    id: newId("v"),
    title: partial.title || (t ? `${t.label} …` : "Neues Thema"),
    fach: partial.fach || "",
    zyklus: partial.zyklus || "",
    klasse: partial.klasse || "",
    templateId,
    competencies: Array.isArray(partial.competencies) ? partial.competencies : [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    grob: templateGrob(templateId),
    zweiWochen: {
      label: "Nächste 2 Wochen",
      meilensteine: [],
      beobachtung: "",
      material: "",
      notizen: "",
    },
    wochen: [emptyWeek(kw, year)],
    lektionen: [],
    erinnerungen: [],
    lastVisitedLevel: "grob",
  };
};

const emptyStore = () => ({
  version: 2,
  rituals: DEFAULT_RITUALS.map((r) => ({ ...r })),
  vorhaben: [],
  lastActiveVorhabenId: null,
  kalender: buildKalenderForSchoolYear(getSchoolYearStart()),
  /** Tages-Todos & Notizen pro ISO-Datum: { [date]: { todos, notizen } } */
  tagesNotizen: {},
});

const emptyTagesEintrag = () => ({ todos: [], notizen: "" });

/** @returns {{ id: string, text: string, done: boolean }[]} */
export const normalizeTagesTodoList = (raw) => {
  if (Array.isArray(raw)) {
    return raw
      .map((item) => {
        if (!item || typeof item !== "object") {
          return null;
        }
        const text =
          item.text != null ? String(item.text).trim() : String(item.label || "").trim();
        if (!text) {
          return null;
        }
        const id =
          item.id != null && String(item.id).trim()
            ? String(item.id).trim()
            : newId("td");
        return { id, text, done: Boolean(item.done) };
      })
      .filter(Boolean);
  }
  if (typeof raw === "string" && raw.trim()) {
    return raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const checked = /^\[[xX]\]\s*/.test(line);
        const bullet = line.replace(/^[-*]\s*/, "");
        const text = bullet.replace(/^\[[xX ]?\]\s*/, "").trim();
        if (!text) {
          return null;
        }
        return { id: newId("td"), text, done: checked };
      })
      .filter(Boolean);
  }
  return [];
};

const normalizeTagesEintrag = (raw) => {
  if (raw == null) {
    return emptyTagesEintrag();
  }
  if (typeof raw === "string") {
    return { todos: [], notizen: String(raw) };
  }
  if (typeof raw === "object") {
    return {
      todos: normalizeTagesTodoList(raw.todos),
      notizen: raw.notizen != null ? String(raw.notizen) : "",
    };
  }
  return emptyTagesEintrag();
};

const tagesEintragHasContent = (entry) =>
  (entry.todos?.length || 0) > 0 || Boolean(entry.notizen?.trim());

export const normalizeTagesNotizenMap = (map) => {
  if (!map || typeof map !== "object") {
    return {};
  }
  const out = {};
  for (const [iso, value] of Object.entries(map)) {
    if (!iso || typeof iso !== "string") {
      continue;
    }
    const entry = normalizeTagesEintrag(value);
    if (tagesEintragHasContent(entry)) {
      out[iso] = entry;
    }
  }
  return out;
};

export const createTagesTodoItem = (text) => ({
  id: newId("td"),
  text: String(text || "").trim(),
  done: false,
});

const normalizeVorhaben = (v) => {
  if (!v || !v.id) {
    return null;
  }
  const { kw, year } = getIsoWeek();
  return {
    ...v,
    competencies: Array.isArray(v.competencies) ? v.competencies : [],
    grob: v.grob || templateGrob(v.templateId || "thema"),
    zweiWochen: v.zweiWochen || {
      label: "Nächste 2 Wochen",
      meilensteine: [],
      beobachtung: "",
      material: "",
      notizen: "",
    },
    wochen:
      Array.isArray(v.wochen) && v.wochen.length > 0
        ? v.wochen
        : [emptyWeek(kw, year)],
    lektionen: Array.isArray(v.lektionen) ? v.lektionen : [],
    erinnerungen: Array.isArray(v.erinnerungen) ? v.erinnerungen : [],
    lastVisitedLevel: v.lastVisitedLevel || "grob",
  };
};

export const loadPlanningStore = () => {
  try {
    const raw = window.localStorage.getItem(PLANNING_STORAGE_KEY);
    if (!raw) {
      return emptyStore();
    }
    const parsed = JSON.parse(raw);
    const rituals =
      Array.isArray(parsed.rituals) && parsed.rituals.length > 0
        ? parsed.rituals
        : DEFAULT_RITUALS.map((r) => ({ ...r }));
    const vorhaben = (Array.isArray(parsed.vorhaben) ? parsed.vorhaben : [])
      .map(normalizeVorhaben)
      .filter(Boolean);
    const tagesNotizen = normalizeTagesNotizenMap(parsed.tagesNotizen);
    return {
      version: 2,
      rituals,
      vorhaben,
      lastActiveVorhabenId: parsed.lastActiveVorhabenId || null,
      kalender: normalizeKalender(parsed.kalender),
      tagesNotizen,
    };
  } catch (_e) {
    return emptyStore();
  }
};

export const savePlanningStore = (store) => {
  try {
    recordUndoSnapshot();
    window.localStorage.setItem(PLANNING_STORAGE_KEY, JSON.stringify(store));
    window.dispatchEvent(new CustomEvent("lp21-planning-updated"));
  } catch (_e) {
    // quota
  }
};

export const getVorhabenById = (store, id) =>
  store.vorhaben.find((v) => v.id === id) || null;

export const upsertVorhaben = (store, vorhaben) => {
  const normalized = normalizeVorhaben({
    ...vorhaben,
    updatedAt: Date.now(),
    lastVisitedLevel: vorhaben.lastVisitedLevel || "grob",
  });
  const idx = store.vorhaben.findIndex((v) => v.id === normalized.id);
  const vorhabenList =
    idx >= 0
      ? store.vorhaben.map((v, i) => (i === idx ? normalized : v))
      : [...store.vorhaben, normalized];
  const next = {
    ...store,
    vorhaben: vorhabenList,
    lastActiveVorhabenId: normalized.id,
  };
  savePlanningStore(next);
  return normalized;
};

export const getTodayIsoDate = (date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export const getTagesEintrag = (store, isoDate = getTodayIsoDate()) => {
  const map =
    store?.tagesNotizen && typeof store.tagesNotizen === "object"
      ? store.tagesNotizen
      : {};
  return normalizeTagesEintrag(map[isoDate]);
};

export const getTagesTodos = (store, isoDate = getTodayIsoDate()) =>
  getTagesEintrag(store, isoDate).todos;

export const getTagesNotiz = (store, isoDate = getTodayIsoDate()) =>
  getTagesEintrag(store, isoDate).notizen;

export const setTagesEintrag = (
  store,
  isoDate = getTodayIsoDate(),
  partial = {}
) => {
  const current = getTagesEintrag(store, isoDate);
  const next = {
    todos:
      partial.todos !== undefined
        ? normalizeTagesTodoList(partial.todos)
        : current.todos,
    notizen:
      partial.notizen !== undefined ? String(partial.notizen) : current.notizen,
  };
  const notes = { ...(store.tagesNotizen || {}) };
  if (!tagesEintragHasContent(next)) {
    delete notes[isoDate];
  } else {
    notes[isoDate] = next;
  }
  return { ...store, tagesNotizen: notes };
};

export const toggleTagesTodoItem = (store, isoDate, todoId) => {
  const entry = getTagesEintrag(store, isoDate);
  const todos = entry.todos.map((item) =>
    item.id === todoId ? { ...item, done: !item.done } : item
  );
  return setTagesEintrag(store, isoDate, { todos });
};

export const addTagesTodoItem = (store, isoDate, text) => {
  const trimmed = String(text || "").trim();
  if (!trimmed) {
    return store;
  }
  const entry = getTagesEintrag(store, isoDate);
  return setTagesEintrag(store, isoDate, {
    todos: [...entry.todos, createTagesTodoItem(trimmed)],
  });
};

export const removeTagesTodoItem = (store, isoDate, todoId) => {
  const entry = getTagesEintrag(store, isoDate);
  return setTagesEintrag(store, isoDate, {
    todos: entry.todos.filter((item) => item.id !== todoId),
  });
};

export const setTagesTodos = (store, todos, isoDate = getTodayIsoDate()) =>
  setTagesEintrag(store, isoDate, { todos });

export const setTagesNotiz = (store, text, isoDate = getTodayIsoDate()) =>
  setTagesEintrag(store, isoDate, { notizen: text });

export const deleteVorhaben = (store, id) => {
  const next = {
    ...store,
    vorhaben: store.vorhaben.filter((v) => v.id !== id),
    lastActiveVorhabenId:
      store.lastActiveVorhabenId === id ? null : store.lastActiveVorhabenId,
  };
  savePlanningStore(next);
  return next;
};

export const getOrCreateCurrentWeek = (vorhaben) => {
  const { kw, year } = getIsoWeek();
  const { vorhaben: next, week } = getOrCreateWeek(vorhaben, kw, year);
  vorhaben.wochen = next.wochen;
  return week;
};

/** Stellt sicher, dass eine KW existiert; gibt { vorhaben, week } zurück. */
export const getOrCreateWeek = (vorhaben, kw, year) => {
  let week = vorhaben.wochen.find((w) => w.kw === kw && w.year === year);
  if (week) {
    return { vorhaben, week };
  }
  week = emptyWeek(kw, year);
  return {
    vorhaben: { ...vorhaben, wochen: [...vorhaben.wochen, week] },
    week,
  };
};

export const addLektion = (vorhaben, partial = {}) => {
  const lektion = {
    id: newId("l"),
    title: partial.title || "Neue Lektion",
    durationMin: partial.durationMin ?? 45,
    competencies: partial.competencies || [],
    ablaufBlocks: partial.ablaufBlocks || [],
    material: partial.material || "",
    sicherung: partial.sicherung || "",
    durchfuehren: partial.durchfuehren || "",
    notizen: partial.notizen || "",
    weekId: partial.weekId || null,
    weekday: partial.weekday || null,
  };
  return { ...vorhaben, lektionen: [...vorhaben.lektionen, lektion], lektion };
};

export const addErinnerung = (vorhaben, partial = {}) => {
  const item = {
    id: newId("e"),
    text: partial.text || "",
    done: false,
    dueDate: partial.dueDate || null,
    kw: partial.kw ?? null,
    weekday: partial.weekday ?? null,
  };
  return {
    ...vorhaben,
    erinnerungen: [...vorhaben.erinnerungen, item],
    erinnerung: item,
  };
};

export const addSonderTag = (vorhaben, weekId, partial = {}) => {
  const wochen = vorhaben.wochen.map((w) => {
    if (w.id !== weekId) {
      return w;
    }
    const tag = {
      id: newId("s"),
      weekday: partial.weekday || "mo",
      type: partial.type || "sonstiges",
      label: partial.label || "",
    };
    return { ...w, sonderTage: [...(w.sonderTage || []), tag] };
  });
  return { ...vorhaben, wochen };
};

export const addDayCard = (vorhaben, weekId, weekday, card) => {
  const wochen = vorhaben.wochen.map((w) => {
    if (w.id !== weekId) {
      return w;
    }
    const day = w.days[weekday] || emptyDay();
    const newCard = {
      id: newId("c"),
      type: card.type || "notiz",
      label: card.label || "",
      durationMin: card.durationMin ?? null,
      ritualId: card.ritualId || null,
      lektionId: card.lektionId || null,
      startMin:
        typeof card.startMin === "number" && Number.isFinite(card.startMin)
          ? card.startMin
          : null,
    };
    return {
      ...w,
      days: {
        ...w.days,
        [weekday]: { ...day, cards: [...day.cards, newCard] },
      },
    };
  });
  return { ...vorhaben, wochen };
};

export const removeDayCard = (vorhaben, weekId, weekday, cardId) => {
  const wochen = vorhaben.wochen.map((w) => {
    if (w.id !== weekId) {
      return w;
    }
    const day = w.days[weekday] || emptyDay();
    return {
      ...w,
      days: {
        ...w.days,
        [weekday]: {
          ...day,
          cards: day.cards.filter((c) => c.id !== cardId),
        },
      },
    };
  });
  return { ...vorhaben, wochen };
};

export const moveDayCard = (vorhaben, weekId, cardId, fromWeekday, toWeekday, patch = {}) => {
  let moved = null;
  const wochen = vorhaben.wochen.map((w) => {
    if (w.id !== weekId) {
      return w;
    }
    const fromDay = w.days[fromWeekday] || emptyDay();
    const card = fromDay.cards.find((c) => c.id === cardId);
    if (!card) {
      return w;
    }
    moved = { ...card, ...patch };
    const days = { ...w.days };
    days[fromWeekday] = {
      ...fromDay,
      cards: fromDay.cards.filter((c) => c.id !== cardId),
    };
    const toDay = days[toWeekday] || emptyDay();
    days[toWeekday] = { ...toDay, cards: [...toDay.cards, moved] };
    return { ...w, days };
  });
  return moved ? { ...vorhaben, wochen } : vorhaben;
};

export const reorderDayCard = (vorhaben, weekId, weekday, cardId, toIndex) => {
  const wochen = vorhaben.wochen.map((w) => {
    if (w.id !== weekId) {
      return w;
    }
    const day = w.days[weekday] || emptyDay();
    const cards = [...day.cards];
    const fromIndex = cards.findIndex((c) => c.id === cardId);
    if (fromIndex < 0) {
      return w;
    }
    const [item] = cards.splice(fromIndex, 1);
    const idx = Math.max(0, Math.min(toIndex, cards.length));
    cards.splice(idx, 0, item);
    return {
      ...w,
      days: { ...w.days, [weekday]: { ...day, cards } },
    };
  });
  return { ...vorhaben, wochen };
};

export const updateDayCard = (vorhaben, weekId, weekday, cardId, patch) => {
  const wochen = vorhaben.wochen.map((w) => {
    if (w.id !== weekId) {
      return w;
    }
    const day = w.days[weekday] || emptyDay();
    return {
      ...w,
      days: {
        ...w.days,
        [weekday]: {
          ...day,
          cards: day.cards.map((c) => (c.id === cardId ? { ...c, ...patch } : c)),
        },
      },
    };
  });
  return { ...vorhaben, wochen };
};

export const linkLektionToWeekDay = (vorhaben, weekId, weekday, lektionId, startMin = null) => {
  const lek = vorhaben.lektionen.find((l) => l.id === lektionId);
  if (!lek) {
    return vorhaben;
  }
  const week = vorhaben.wochen.find((w) => w.id === weekId);
  if (!week) {
    return vorhaben;
  }
  const day = week.days[weekday] || emptyDay();
  const existing = day.cards.find((c) => c.lektionId === lektionId);
  if (existing) {
    let next = updateDayCard(vorhaben, weekId, weekday, existing.id, {
      startMin: startMin ?? existing.startMin,
    });
    return {
      ...next,
      lektionen: next.lektionen.map((l) =>
        l.id === lektionId ? { ...l, weekId, weekday } : l
      ),
    };
  }
  let next = addDayCard(vorhaben, weekId, weekday, {
    type: "lektion",
    label: lek.title,
    durationMin: lek.durationMin,
    lektionId: lek.id,
    startMin,
  });
  const card = next.wochen
    .find((w) => w.id === weekId)
    ?.days[weekday]?.cards?.slice(-1)[0];
  if (card) {
    next = {
      ...next,
      lektionen: next.lektionen.map((l) =>
        l.id === lektionId ? { ...l, weekId, weekday } : l
      ),
    };
  }
  return next;
};
