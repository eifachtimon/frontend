import { useEffect } from "react";
import { performRedo, performUndo } from "../undo/undoHistory";

export const isTypingTarget = (el) => {
  if (!el) {
    return false;
  }
  const tag = el.tagName?.toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select" || el.isContentEditable;
};

const isMod = (e) => e.metaKey || e.ctrlKey;

/**
 * Globale Bearbeitungskürzel: ⌘/Ctrl+Z (Undo), ⌘/Ctrl+Shift+Z bzw. ⌘Y (Redo), Entf (Löschen).
 * In Eingabefeldern: Undo/Redo = Browser; Löschen = Zeichen (außer explizit erlaubt).
 */
export const useEditShortcuts = ({
  enabled = true,
  onDelete,
  canDelete = false,
  onUndo,
  onRedo,
  allowDeleteInFields = false,
}) => {
  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const onKey = (e) => {
      const typing = isTypingTarget(document.activeElement);
      const mod = isMod(e);
      const key = e.key.toLowerCase();

      if (mod && key === "z" && !typing) {
        e.preventDefault();
        if (e.shiftKey) {
          if (performRedo()) {
            onRedo?.();
          }
        } else if (performUndo()) {
          onUndo?.();
        }
        return;
      }

      if (mod && key === "y" && !typing) {
        e.preventDefault();
        if (performRedo()) {
          onRedo?.();
        }
        return;
      }

      const deleteKey = e.key === "Delete" || e.key === "Backspace";
      if (!deleteKey || !canDelete || !onDelete) {
        return;
      }
      if (typing && !allowDeleteInFields) {
        return;
      }
      if (mod) {
        return;
      }
      e.preventDefault();
      onDelete();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled, onDelete, canDelete, onUndo, onRedo, allowDeleteInFields]);
};

export default useEditShortcuts;
