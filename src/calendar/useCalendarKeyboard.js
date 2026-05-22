import { useEffect } from "react";

const isTypingTarget = (el) => {
  if (!el) {
    return false;
  }
  const tag = el.tagName?.toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select" || el.isContentEditable;
};

export const useCalendarKeyboard = ({
  calendarApiRef,
  onSearchFocus,
  onNewEvent,
  onCloseOverlays,
  onToggleHelp,
  enabled = true,
}) => {
  useEffect(() => {
    if (!enabled) {
      return undefined;
    }
    const onKey = (e) => {
      if (isTypingTarget(document.activeElement) && e.key !== "Escape") {
        return;
      }
      const api = calendarApiRef.current?.();

      if (e.key === "Escape") {
        onCloseOverlays?.();
        return;
      }
      if (e.key === "/" || ((e.metaKey || e.ctrlKey) && e.key === "k")) {
        e.preventDefault();
        onSearchFocus?.();
        return;
      }
      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        onNewEvent?.();
        return;
      }
      if (e.key === "?" && e.shiftKey) {
        e.preventDefault();
        onToggleHelp?.();
        return;
      }
      if (!api) {
        return;
      }
      if (e.key === "t" || e.key === "T") {
        e.preventDefault();
        api.today();
        return;
      }
      if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        api.changeView("dayGridMonth");
        return;
      }
      if (e.key === "w" || e.key === "W") {
        e.preventDefault();
        api.changeView("timeGridWeek");
        return;
      }
      if (e.key === "d" || e.key === "D") {
        e.preventDefault();
        api.changeView("timeGridDay");
        return;
      }
      if (e.key === "l" || e.key === "L") {
        e.preventDefault();
        api.changeView("listWeek");
        return;
      }
      if (e.key === "ArrowLeft" && (e.metaKey || e.altKey)) {
        e.preventDefault();
        api.prev();
        return;
      }
      if (e.key === "ArrowRight" && (e.metaKey || e.altKey)) {
        e.preventDefault();
        api.next();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    enabled,
    calendarApiRef,
    onSearchFocus,
    onNewEvent,
    onCloseOverlays,
    onToggleHelp,
  ]);
};
