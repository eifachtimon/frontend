/**
 * Zielposition für reorderLektion (globale Liste, Anzeige nach Phase).
 * beforeLektionId = null → ans Ende der Ziel-Phase (vor erster Lektion der nächsten Phase).
 */
export const resolveReorderDrop = (phaseGroups, dragLektionId, dropTarget) => {
  if (!dragLektionId || !dropTarget) {
    return null;
  }

  const phaseId = dropTarget.phaseId ?? null;
  let beforeLektionId = dropTarget.beforeLektionId ?? null;

  if (beforeLektionId === dragLektionId) {
    return null;
  }

  if (!beforeLektionId) {
    beforeLektionId = getInsertBeforeIdForPhaseEnd(phaseGroups, phaseId, dragLektionId);
  }

  return {
    lektionId: dragLektionId,
    beforeLektionId,
    phaseId,
  };
};

export const getInsertBeforeIdForPhaseEnd = (phaseGroups, targetPhaseId, excludeLektionId) => {
  const group = phaseGroups.find((g) => (g.phaseId ?? null) === (targetPhaseId ?? null));
  if (!group) {
    return null;
  }

  const inPhase = group.lektionen.filter((l) => l.id !== excludeLektionId);
  if (inPhase.length === 0) {
    const idx = phaseGroups.findIndex((g) => (g.phaseId ?? null) === (targetPhaseId ?? null));
    for (let i = idx + 1; i < phaseGroups.length; i += 1) {
      const first = phaseGroups[i].lektionen.find((l) => l.id !== excludeLektionId);
      if (first) {
        return first.id;
      }
    }
    return null;
  }

  const flat = phaseGroups.flatMap((g) => g.lektionen);
  const lastInPhase = inPhase[inPhase.length - 1];
  const pos = flat.findIndex((l) => l.id === lastInPhase.id);
  if (pos < 0) {
    return null;
  }

  for (let i = pos + 1; i < flat.length; i += 1) {
    if (flat[i].id !== excludeLektionId) {
      return flat[i].id;
    }
  }
  return null;
};

export const isDropMarkerBefore = (dropTarget, phaseId, beforeLektionId) =>
  dropTarget != null &&
  (dropTarget.phaseId ?? null) === (phaseId ?? null) &&
  dropTarget.beforeLektionId === beforeLektionId;

export const isDropAppendToPhase = (dropTarget, phaseId) =>
  dropTarget != null &&
  (dropTarget.phaseId ?? null) === (phaseId ?? null) &&
  dropTarget.beforeLektionId == null;

export const dropTargetsEqual = (a, b) =>
  (a?.phaseId ?? null) === (b?.phaseId ?? null) &&
  (a?.beforeLektionId ?? null) === (b?.beforeLektionId ?? null);

/** Einfügeposition aus Zeigerhöhe (Mitte der Karte = danach / ans Phasenende). */
export const resolveDropTargetFromPointer = ({
  listEl,
  clientY,
  phaseId,
  dragLektionId,
}) => {
  if (!listEl) {
    return null;
  }

  const items = [...listEl.querySelectorAll(
    ".thema-overview-lek-item[data-lektion-id]:not(.thema-overview-lek-item--dragging)"
  )];

  for (let i = 0; i < items.length; i += 1) {
    const id = items[i].getAttribute("data-lektion-id");
    if (!id || id === dragLektionId) {
      continue;
    }
    const rect = items[i].getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    if (clientY < midY) {
      return { phaseId: phaseId ?? null, beforeLektionId: id };
    }
  }

  return { phaseId: phaseId ?? null, beforeLektionId: null };
};
