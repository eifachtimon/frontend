export const BOOKMARK_DRAG_MIME = "application/x-lp21-bookmark";
export const COMPETENCY_DRAG_MIME = "application/x-lp21-competency";

export const setBookmarkDragData = (event, uid, folderId) => {
  event.dataTransfer.setData(
    BOOKMARK_DRAG_MIME,
    JSON.stringify({ uid, folderId })
  );
  event.dataTransfer.setData("text/plain", uid);
  event.dataTransfer.effectAllowed = "move";
};

export const parseBookmarkDragData = (event) => {
  try {
    const raw = event.dataTransfer.getData(BOOKMARK_DRAG_MIME);
    if (!raw) {
      return null;
    }
    const payload = JSON.parse(raw);
    if (!payload?.uid) {
      return null;
    }
    return payload;
  } catch (_e) {
    return null;
  }
};

export const setCompetencyDragData = (event, entry) => {
  if (!entry?.uid) {
    return;
  }
  event.dataTransfer.setData(COMPETENCY_DRAG_MIME, JSON.stringify(entry));
  event.dataTransfer.setData("text/plain", entry.uid);
  event.dataTransfer.effectAllowed = "copy";
};

export const parseCompetencyDragData = (event) => {
  const bookmark = parseBookmarkDragData(event);
  if (bookmark?.uid) {
    return { uid: bookmark.uid, folderId: bookmark.folderId };
  }
  try {
    const raw = event.dataTransfer.getData(COMPETENCY_DRAG_MIME);
    if (!raw) {
      return null;
    }
    const entry = JSON.parse(raw);
    return entry?.uid ? entry : null;
  } catch (_e) {
    return null;
  }
};

export const allowDrop = (event, effect = "move") => {
  event.preventDefault();
  event.dataTransfer.dropEffect = effect;
};
