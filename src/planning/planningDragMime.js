/** HTML5-Drag-Typ für Lektionskarten (Liste + Kalender). */
export const LEKTION_DRAG_MIME = "application/x-lp21-lektion-reorder";

export const hasLektionDrag = (dataTransfer) =>
  Boolean(dataTransfer?.types?.includes?.(LEKTION_DRAG_MIME));
