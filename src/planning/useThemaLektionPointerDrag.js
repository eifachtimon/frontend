import { useCallback, useEffect, useRef, useState } from "react";
import { dropLektionOnCalendarAtPointer } from "../calendar/calendarActions";
import {
  calendarSlotKey,
  slotFromCalendarPointer,
} from "../calendar/calendarDropFromPointer";
import {
  dropTargetsEqual,
  resolveDropTargetFromPointer,
  resolveReorderDrop,
} from "./themaOverviewDnD";

const DRAG_THRESHOLD_PX = 6;

/**
 * Einheitliches Ziehen per Pointer (Liste umsortieren + Kalender).
 * Kein HTML5-Drag, kein FullCalendar-Draggable auf den Karten.
 */
const useThemaLektionPointerDrag = ({
  vorhaben,
  phaseGroups,
  onChange,
  reorderLektion,
  onCalendarDragPreview,
  calendarRootSelector = ".thema-dashboard__woche .cal-fullcalendar-host",
}) => {
  const [draggingId, setDraggingId] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);

  const draggingIdRef = useRef(null);
  const dropTargetRef = useRef(null);
  const pointerRef = useRef(null);
  const didDragRef = useRef(false);
  const suppressClickRef = useRef(false);
  const calendarPreviewKeyRef = useRef(null);
  const calendarStickyDateRef = useRef(null);
  const pointerOverCalendarRef = useRef(false);

  const isPointerOverCalendar = useCallback((calRoot, clientX, clientY) => {
    const calRect = calRoot?.getBoundingClientRect();
    if (!calRect) {
      return false;
    }
    const pad = pointerOverCalendarRef.current ? 12 : 0;
    return (
      clientX >= calRect.left - pad &&
      clientX <= calRect.right + pad &&
      clientY >= calRect.top - pad &&
      clientY <= calRect.bottom + pad
    );
  }, []);

  const clearDrag = useCallback(() => {
    draggingIdRef.current = null;
    pointerRef.current = null;
    didDragRef.current = false;
    setDraggingId(null);
    setDropTarget(null);
    document.body.classList.remove("cal-is-dragging");
    calendarPreviewKeyRef.current = null;
    calendarStickyDateRef.current = null;
    pointerOverCalendarRef.current = false;
    onCalendarDragPreview?.(null);
  }, [onCalendarDragPreview]);

  const findListAt = useCallback((clientX, clientY) => {
    const hit = document.elementFromPoint(clientX, clientY);
    if (!hit) {
      return null;
    }
    const list = hit.closest(".thema-overview-lek-list");
    if (!list?.closest(".thema-dashboard__lektionen")) {
      return null;
    }
    return list;
  }, []);

  const findCalendarRoot = useCallback(() => {
    return document.querySelector(calendarRootSelector);
  }, [calendarRootSelector]);

  const syncDropTargetAt = useCallback(
    (clientX, clientY) => {
      const list = findListAt(clientX, clientY);
      if (!list) {
        dropTargetRef.current = null;
        setDropTarget(null);
        return null;
      }
      const phaseId = list.dataset.phaseId ?? null;
      const next = resolveDropTargetFromPointer({
        listEl: list,
        clientY,
        phaseId: phaseId === "" ? null : phaseId,
        dragLektionId: draggingIdRef.current,
      });
      if (!next) {
        return null;
      }
      dropTargetRef.current = next;
      setDropTarget((prev) => {
        if (prev && dropTargetsEqual(prev, next)) {
          return prev;
        }
        return next;
      });
      return next;
    },
    [findListAt]
  );

  const commitReorder = useCallback(() => {
    const resolved = resolveReorderDrop(
      phaseGroups,
      draggingIdRef.current,
      dropTargetRef.current
    );
    if (resolved) {
      onChange(
        reorderLektion(
          vorhaben,
          resolved.lektionId,
          resolved.beforeLektionId,
          resolved.phaseId
        )
      );
    }
  }, [phaseGroups, onChange, reorderLektion, vorhaben]);

  const handlePointerDown = useCallback((e) => {
    if (e.button !== 0) {
      return;
    }
    const card = e.target.closest?.(".thema-lek-card");
    const item = card?.closest?.(".thema-overview-lek-item");
    if (!item?.closest(".thema-dashboard__lektionen")) {
      return;
    }
    const lektionId = item.dataset.lektionId;
    if (!lektionId) {
      return;
    }
    pointerRef.current = {
      x: e.clientX,
      y: e.clientY,
      lektionId,
    };
    didDragRef.current = false;
  }, []);

  const handlePointerMove = useCallback(
    (e) => {
      const start = pointerRef.current;
      if (!start) {
        return;
      }
      if (!draggingIdRef.current) {
        const dx = Math.abs(e.clientX - start.x);
        const dy = Math.abs(e.clientY - start.y);
        if (dx < DRAG_THRESHOLD_PX && dy < DRAG_THRESHOLD_PX) {
          return;
        }
        draggingIdRef.current = start.lektionId;
        setDraggingId(start.lektionId);
        setDropTarget(null);
        document.body.classList.add("cal-is-dragging");
        didDragRef.current = true;
      }
      const calRoot = findCalendarRoot();
      const onCalendar = isPointerOverCalendar(calRoot, e.clientX, e.clientY);
      pointerOverCalendarRef.current = onCalendar;

      if (onCalendar) {
        dropTargetRef.current = null;
        setDropTarget(null);
        const slot = slotFromCalendarPointer(calRoot, e.clientX, e.clientY, {
          stickyDate: calendarStickyDateRef.current,
        });
        if (slot) {
          const slotKey = calendarSlotKey(slot);
          if (slotKey !== calendarPreviewKeyRef.current) {
            calendarPreviewKeyRef.current = slotKey;
            calendarStickyDateRef.current = slot.start.toISOString().slice(0, 10);
            onCalendarDragPreview?.({
              lektionId: draggingIdRef.current,
              vorhabenId: vorhaben.id,
              slot,
            });
          }
        } else if (calendarPreviewKeyRef.current) {
          calendarPreviewKeyRef.current = null;
          calendarStickyDateRef.current = null;
          onCalendarDragPreview?.(null);
        }
      } else {
        if (calendarPreviewKeyRef.current) {
          calendarPreviewKeyRef.current = null;
          calendarStickyDateRef.current = null;
          onCalendarDragPreview?.(null);
        }
        syncDropTargetAt(e.clientX, e.clientY);
      }
    },
    [syncDropTargetAt, findCalendarRoot, isPointerOverCalendar, onCalendarDragPreview, vorhaben.id]
  );

  const handlePointerUp = useCallback(
    (e) => {
      const start = pointerRef.current;
      if (!start) {
        return;
      }
      if (!draggingIdRef.current) {
        pointerRef.current = null;
        return;
      }

      const calRoot = findCalendarRoot();
      const calRect = calRoot?.getBoundingClientRect();
      const onCalendar = Boolean(
        calRect &&
          e.clientX >= calRect.left &&
          e.clientX <= calRect.right &&
          e.clientY >= calRect.top &&
          e.clientY <= calRect.bottom
      );

      if (didDragRef.current) {
        suppressClickRef.current = true;
        window.setTimeout(() => {
          suppressClickRef.current = false;
        }, 400);
      }

      if (onCalendar) {
        dropLektionOnCalendarAtPointer({
          planningStore: { vorhaben: [vorhaben] },
          draftVorhabenId: vorhaben.id,
          lektionId: draggingIdRef.current,
          clientX: e.clientX,
          clientY: e.clientY,
          calendarRoot: calRoot,
          saveVorhaben: onChange,
          stickyDate: calendarStickyDateRef.current,
        });
      } else {
        syncDropTargetAt(e.clientX, e.clientY);
        if (dropTargetRef.current) {
          commitReorder();
        }
      }

      clearDrag();
    },
    [vorhaben, onChange, findCalendarRoot, isPointerOverCalendar, commitReorder, clearDrag]
  );

  useEffect(() => {
    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);
    document.addEventListener("pointercancel", handlePointerUp);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
      document.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [handlePointerDown, handlePointerMove, handlePointerUp]);

  const shouldSuppressOpenClick = useCallback(() => suppressClickRef.current, []);

  return {
    draggingId,
    dropTarget,
    isDragging: Boolean(draggingId),
    handlePointerDown,
    shouldSuppressOpenClick,
    clearDrag,
  };
};

export default useThemaLektionPointerDrag;
