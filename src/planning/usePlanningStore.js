import { useCallback, useEffect, useState } from "react";
import {
  loadPlanningStore,
  savePlanningStore,
  upsertVorhaben,
  deleteVorhaben,
  getVorhabenById,
} from "./planningStore";

export const usePlanningStore = () => {
  const [store, setStore] = useState(() => loadPlanningStore());

  const refresh = useCallback(() => {
    setStore(loadPlanningStore());
  }, []);

  useEffect(() => {
    const onUpdate = () => refresh();
    window.addEventListener("lp21-planning-updated", onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener("lp21-planning-updated", onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, [refresh]);

  const saveVorhaben = useCallback((vorhaben) => {
    const current = loadPlanningStore();
    const saved = upsertVorhaben(current, vorhaben);
    setStore(loadPlanningStore());
    return saved;
  }, []);

  const removeVorhaben = useCallback((id) => {
    const next = deleteVorhaben(store, id);
    setStore(next);
  }, [store]);

  const patchStore = useCallback((updater) => {
    const current = loadPlanningStore();
    const next = typeof updater === "function" ? updater(current) : updater;
    savePlanningStore(next);
    setStore(next);
    return next;
  }, []);

  return {
    store,
    refresh,
    saveVorhaben,
    removeVorhaben,
    patchStore,
    getVorhaben: (id) => getVorhabenById(store, id),
  };
};

export default usePlanningStore;
