/** localStorage: Merkliste mit Ordnern (Kompetenzen) */
import { truncateCompetencyLabel } from "./recentCompetencyHistory";

export const BOOKMARKS_STORAGE_KEY_V1 = "lp21-competency-bookmarks-v1";
export const BOOKMARKS_STORAGE_KEY = "lp21-competency-bookmarks-v2";
export const BOOKMARKS_MAX_TOTAL = 400;

export const DEFAULT_FOLDER_ID = "default";

/**
 * @typedef {{
 *   uid: string,
 *   label: string,
 *   code?: string,
 *   fach?: string,
 *   zyklus?: string,
 *   themenbereich?: string,
 *   addedAt: number
 * }} CompetencyBookmark
 */

/**
 * @typedef {{
 *   id: string,
 *   name: string,
 *   items: CompetencyBookmark[]
 * }} BookmarkFolder
 */

/**
 * @typedef {{
 *   version: number,
 *   folders: BookmarkFolder[]
 * }} BookmarkStore
 */

const optStr = (v) =>
  v != null && String(v).trim() ? String(v).trim() : undefined;

const normalizeRow = (item) => {
  const uid =
    item && typeof item.uid === "string"
      ? item.uid.trim()
      : item && item.uid != null
        ? String(item.uid).trim()
        : "";
  if (!uid) {
    return null;
  }
  const addedAt =
    typeof item.addedAt === "number" && Number.isFinite(item.addedAt)
      ? item.addedAt
      : Date.now();
  return {
    uid,
    label: truncateCompetencyLabel(
      item.label != null && String(item.label).trim()
        ? String(item.label).trim()
        : uid,
      200
    ),
    code: optStr(item.code),
    fach: optStr(item.fach),
    zyklus: optStr(item.zyklus),
    themenbereich: optStr(item.themenbereich),
    addedAt,
  };
};

const newFolderId = () =>
  `folder-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const cloneStore = (store) => JSON.parse(JSON.stringify(store));

const emptyStore = () => ({
  version: 2,
  folders: [
    {
      id: DEFAULT_FOLDER_ID,
      name: "Gemerkte Kompetenzen",
      items: [],
    },
  ],
});

const dedupeGlobalUids = (store) => {
  const seen = new Set();
  const next = cloneStore(store);
  for (const folder of next.folders) {
    folder.items = folder.items.filter((row) => {
      if (!row || !row.uid) {
        return false;
      }
      if (seen.has(row.uid)) {
        return false;
      }
      seen.add(row.uid);
      return true;
    });
  }
  return next;
};

const enforceTotalMax = (store, maxTotal) => {
  let total = totalBookmarkCount(store);
  if (total <= maxTotal) {
    return store;
  }
  const next = cloneStore(store);
  for (let i = next.folders.length - 1; i >= 0 && total > maxTotal; i -= 1) {
    const folder = next.folders[i];
    while (folder.items.length > 0 && total > maxTotal) {
      folder.items.pop();
      total -= 1;
    }
  }
  return next;
};

/**
 * @returns {number}
 */
export const totalBookmarkCount = (store) => {
  if (!store || !Array.isArray(store.folders)) {
    return 0;
  }
  return store.folders.reduce((n, f) => n + (f.items ? f.items.length : 0), 0);
};

/**
 * @param {BookmarkStore} store
 * @returns {Set<string>}
 */
export const uidSetFromStore = (store) => {
  const s = new Set();
  if (!store || !Array.isArray(store.folders)) {
    return s;
  }
  for (const folder of store.folders) {
    if (!folder.items) {
      continue;
    }
    for (const item of folder.items) {
      if (item && item.uid) {
        s.add(item.uid);
      }
    }
  }
  return s;
};

/**
 * @param {string} uid
 * @param {BookmarkStore} store
 */
export const bookmarkExists = (uid, store) => {
  const key =
    typeof uid === "string" ? uid.trim() : uid != null ? String(uid).trim() : "";
  if (!key) {
    return false;
  }
  return uidSetFromStore(store).has(key);
};

/**
 * Migriert v1 (flache Liste) → v2; liest nur v2.
 * @returns {BookmarkStore}
 */
export const loadBookmarkStore = () => {
  try {
    const rawV2 = window.localStorage.getItem(BOOKMARKS_STORAGE_KEY);
    if (rawV2) {
      const parsed = JSON.parse(rawV2);
      const normalized = normalizeLoadedStore(parsed);
      return dedupeGlobalUids(normalized);
    }
    const rawV1 = window.localStorage.getItem(BOOKMARKS_STORAGE_KEY_V1);
    if (rawV1) {
      const parsed = JSON.parse(rawV1);
      if (Array.isArray(parsed)) {
        const items = parsed.map(normalizeRow).filter(Boolean).slice(0, BOOKMARKS_MAX_TOTAL);
        const migrated = emptyStore();
        migrated.folders[0].items = items;
        saveBookmarkStore(migrated);
        try {
          window.localStorage.removeItem(BOOKMARKS_STORAGE_KEY_V1);
        } catch (_e) {
          // ignore
        }
        return migrated;
      }
    }
  } catch (_err) {
    // ignore
  }
  return emptyStore();
};

/**
 * @param {unknown} parsed
 * @returns {BookmarkStore}
 */
const normalizeLoadedStore = (parsed) => {
  if (
    parsed &&
    typeof parsed === "object" &&
    parsed.version === 2 &&
    Array.isArray(parsed.folders)
  ) {
    const folders = parsed.folders
      .map((f) => {
        if (!f || typeof f.id !== "string") {
          return null;
        }
        const name =
          typeof f.name === "string" && f.name.trim()
            ? f.name.trim()
            : "Ordner";
        const items = Array.isArray(f.items)
          ? f.items.map(normalizeRow).filter(Boolean)
          : [];
        return { id: f.id, name, items };
      })
      .filter(Boolean);
    if (folders.length === 0) {
      return emptyStore();
    }
    const hasDefault = folders.some((f) => f.id === DEFAULT_FOLDER_ID);
    if (!hasDefault) {
      folders.unshift({
        id: DEFAULT_FOLDER_ID,
        name: "Gemerkte Kompetenzen",
        items: [],
      });
    }
    return { version: 2, folders };
  }
  return emptyStore();
};

/**
 * @param {BookmarkStore} store
 */
export const saveBookmarkStore = (store) => {
  try {
    const cleaned = dedupeGlobalUids(enforceTotalMax(store, BOOKMARKS_MAX_TOTAL));
    window.localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(cleaned));
  } catch (_err) {
    // quota / private mode
  }
};

export const clearBookmarksStorage = () => {
  try {
    window.localStorage.removeItem(BOOKMARKS_STORAGE_KEY);
    window.localStorage.removeItem(BOOKMARKS_STORAGE_KEY_V1);
  } catch (_err) {
    // ignore
  }
};

/**
 * @param {BookmarkStore} store
 * @returns {BookmarkStore}
 */
export const replaceBookmarkStore = (store) => {
  const normalized = normalizeLoadedStore(store);
  saveBookmarkStore(normalized);
  return loadBookmarkStore();
};

/**
 * @param {Omit<CompetencyBookmark, 'addedAt'> & { addedAt?: number }} entry
 * @param {BookmarkStore} store
 * @returns {BookmarkStore}
 */
export const upsertBookmarkInDefaultFolder = (entry, store) => {
  const row = normalizeRow({
    ...entry,
    addedAt:
      typeof entry.addedAt === "number" && Number.isFinite(entry.addedAt)
        ? entry.addedAt
        : Date.now(),
  });
  if (!row) {
    return loadBookmarkStore();
  }
  let next = removeBookmarkEverywhere(row.uid, store);
  const def = next.folders.find((f) => f.id === DEFAULT_FOLDER_ID);
  if (!def) {
    next.folders.unshift({
      id: DEFAULT_FOLDER_ID,
      name: "Gemerkte Kompetenzen",
      items: [],
    });
    next.folders.find((f) => f.id === DEFAULT_FOLDER_ID).items.unshift(row);
  } else {
    def.items.unshift(row);
  }
  next = dedupeGlobalUids(next);
  saveBookmarkStore(next);
  return loadBookmarkStore();
};

/**
 * @param {string} uid
 * @param {BookmarkStore} store
 * @returns {BookmarkStore}
 */
export const removeBookmarkEverywhere = (uid, store) => {
  const key =
    typeof uid === "string" ? uid.trim() : uid != null ? String(uid).trim() : "";
  if (!key) {
    return cloneStore(store);
  }
  const next = cloneStore(store);
  for (const folder of next.folders) {
    folder.items = folder.items.filter((b) => b && b.uid !== key);
  }
  return next;
};

/**
 * @param {string} uid
 * @param {BookmarkStore} store
 */
export const removeBookmarkAndSave = (uid, store) => {
  const next = removeBookmarkEverywhere(uid, store);
  saveBookmarkStore(next);
  return loadBookmarkStore();
};

/**
 * @param {BookmarkStore} store
 * @param {string} name
 * @returns {BookmarkStore}
 */
export const addFolder = (store, name) => {
  const label =
    typeof name === "string" && name.trim() ? name.trim() : "Neuer Ordner";
  const next = cloneStore(store);
  next.folders.push({ id: newFolderId(), name: label, items: [] });
  saveBookmarkStore(next);
  return loadBookmarkStore();
};

/**
 * @param {BookmarkStore} store
 * @param {string} folderId
 * @param {string} name
 * @returns {BookmarkStore}
 */
export const renameFolder = (store, folderId, name) => {
  const label =
    typeof name === "string" && name.trim() ? name.trim() : "Ordner";
  const next = cloneStore(store);
  const f = next.folders.find((x) => x.id === folderId);
  if (f) {
    f.name = label;
  }
  saveBookmarkStore(next);
  return loadBookmarkStore();
};

/**
 * Ordner löschen: Einträge in den Standardordner anhängen.
 * @param {BookmarkStore} store
 * @param {string} folderId
 * @returns {BookmarkStore}
 */
export const deleteFolderMergeIntoDefault = (store, folderId) => {
  if (!folderId || folderId === DEFAULT_FOLDER_ID) {
    return loadBookmarkStore();
  }
  const next = cloneStore(store);
  const idx = next.folders.findIndex((f) => f.id === folderId);
  if (idx === -1) {
    return loadBookmarkStore();
  }
  const [removed] = next.folders.splice(idx, 1);
  const def = next.folders.find((f) => f.id === DEFAULT_FOLDER_ID);
  if (def && removed && removed.items && removed.items.length) {
    def.items.push(...removed.items.map((i) => normalizeRow(i)).filter(Boolean));
  }
  const deduped = dedupeGlobalUids(next);
  saveBookmarkStore(deduped);
  return loadBookmarkStore();
};

/**
 * @param {string} uid
 * @param {string} targetFolderId
 * @param {string | null} beforeUid — vor diesem Eintrag einfügen; null = ans Ende
 * @param {BookmarkStore} store
 * @returns {BookmarkStore}
 */
export const moveBookmark = (store, uid, targetFolderId, beforeUid) => {
  const key =
    typeof uid === "string" ? uid.trim() : uid != null ? String(uid).trim() : "";
  if (!key || !targetFolderId) {
    return loadBookmarkStore();
  }
  const next = cloneStore(store);
  let moved = null;
  for (const folder of next.folders) {
    const i = folder.items.findIndex((it) => it && it.uid === key);
    if (i !== -1) {
      moved = folder.items.splice(i, 1)[0];
      break;
    }
  }
  if (!moved) {
    return loadBookmarkStore();
  }
  const target = next.folders.find((f) => f.id === targetFolderId);
  if (!target) {
    const fallback = next.folders.find((f) => f.id === DEFAULT_FOLDER_ID);
    if (fallback) {
      fallback.items.push(moved);
    }
    saveBookmarkStore(dedupeGlobalUids(next));
    return loadBookmarkStore();
  }
  if (beforeUid) {
    const bi = target.items.findIndex((it) => it && it.uid === beforeUid);
    if (bi === -1) {
      target.items.push(moved);
    } else {
      target.items.splice(bi, 0, moved);
    }
  } else {
    target.items.push(moved);
  }
  saveBookmarkStore(dedupeGlobalUids(next));
  return loadBookmarkStore();
};

/**
 * Ordner als Word-taugliche Liste (nur Text, mit Aufzählung).
 * @param {BookmarkFolder} folder
 * @returns {string}
 */
export const folderToPlainTextForWord = (folder) => {
  if (!folder) {
    return "";
  }
  const lines = [];
  lines.push(folder.name);
  lines.push("");
  if (!folder.items || folder.items.length === 0) {
    return `${folder.name}\n\n(keine Einträge)`.trim();
  }
  folder.items.forEach((item, index) => {
    const title = item.code
      ? `${item.code} — ${item.label}`
      : item.label;
    lines.push(`${index + 1}. ${title}`);
    if (item.fach) {
      lines.push(`   Fach: ${item.fach}`);
    }
    if (item.zyklus) {
      lines.push(`   Zyklus: ${item.zyklus}`);
    }
    if (item.themenbereich) {
      lines.push(`   Themenbereich: ${item.themenbereich}`);
    }
    lines.push("");
  });
  return lines.join("\n").trim();
};

/**
 * Dateiname aus Ordnernamen ableiten (ohne Sonderzeichen).
 * @param {string} folderName
 */
export const sanitizeFileBaseName = (folderName) => {
  const raw = String(folderName || "Ordner")
    .trim()
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, " ")
    .slice(0, 80);
  return raw || "Ordner";
};
