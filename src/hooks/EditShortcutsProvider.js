import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useEditShortcuts } from "./useEditShortcuts";

const EditShortcutsContext = createContext(null);

export const EditShortcutsProvider = ({ children }) => {
  const [deleteHandlers, setDeleteHandlers] = useState({
    onDelete: null,
    canDelete: false,
  });
  const [undoTick, setUndoTick] = useState(0);

  const registerEditHandlers = useCallback((handlers) => {
    setDeleteHandlers({
      onDelete: handlers?.onDelete || null,
      canDelete: Boolean(handlers?.canDelete),
    });
  }, []);

  const bumpStores = useCallback(() => {
    setUndoTick((t) => t + 1);
  }, []);

  useEditShortcuts({
    enabled: true,
    onUndo: bumpStores,
    onRedo: bumpStores,
    onDelete: deleteHandlers.onDelete,
    canDelete: deleteHandlers.canDelete,
  });

  const value = useMemo(
    () => ({
      registerEditHandlers,
      undoTick,
    }),
    [registerEditHandlers, undoTick]
  );

  return (
    <EditShortcutsContext.Provider value={value}>{children}</EditShortcutsContext.Provider>
  );
};

export const useRegisterEditShortcuts = (handlers) => {
  const ctx = useContext(EditShortcutsContext);
  const onDelete = handlers?.onDelete;
  const canDelete = handlers?.canDelete;

  React.useEffect(() => {
    if (!ctx) {
      return undefined;
    }
    ctx.registerEditHandlers({ onDelete, canDelete });
    return () => ctx.registerEditHandlers({ onDelete: null, canDelete: false });
  }, [ctx, onDelete, canDelete]);
};

export const useEditShortcutsTick = () => {
  const ctx = useContext(EditShortcutsContext);
  return ctx?.undoTick ?? 0;
};

export default EditShortcutsProvider;
