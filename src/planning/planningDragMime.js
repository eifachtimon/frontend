/** HTML5-Drag-Typ für Lektionskarten (Liste + Kalender). */
export const LEKTION_DRAG_MIME = "application/x-lp21-lektion-reorder";

let activeLektionDragId = null;

export const setActiveLektionDrag = (lektionId) => {
  activeLektionDragId = lektionId || null;
};

export const getActiveLektionDrag = () => activeLektionDragId;

export const isLektionDragActive = () => Boolean(activeLektionDragId);

const transferHasMime = (dataTransfer, mime) => {
  if (!dataTransfer?.types) {
    return false;
  }
  const types = dataTransfer.types;
  if (typeof types.includes === "function") {
    return types.includes(mime);
  }
  return Array.from(types).includes(mime);
};

/** dragOver: oft ohne Custom-MIME — dann aktiver Drag aus dem Store. */
export const hasLektionDrag = (dataTransfer) =>
  isLektionDragActive() || transferHasMime(dataTransfer, LEKTION_DRAG_MIME);

export const readLektionDragId = (dataTransfer) => {
  if (dataTransfer) {
    const fromMime = dataTransfer.getData(LEKTION_DRAG_MIME);
    if (fromMime) {
      return fromMime;
    }
    const fromText = dataTransfer.getData("text/plain");
    if (fromText && isLektionDragActive() && fromText === activeLektionDragId) {
      return fromText;
    }
  }
  return getActiveLektionDrag();
};

export const writeLektionDragData = (dataTransfer, lektionId) => {
  if (!dataTransfer || !lektionId) {
    return;
  }
  dataTransfer.setData(LEKTION_DRAG_MIME, lektionId);
  dataTransfer.setData("text/plain", lektionId);
};
