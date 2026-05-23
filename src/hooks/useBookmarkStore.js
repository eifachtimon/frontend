import { useCallback, useEffect, useState } from "react";
import {
  BOOKMARKS_STORAGE_KEY,
  loadBookmarkStore,
  replaceBookmarkStore,
} from "../competencyBookmarks";

const useBookmarkStore = () => {
  const [store, setStore] = useState(() => loadBookmarkStore());

  const refresh = useCallback(() => {
    setStore(loadBookmarkStore());
  }, []);

  useEffect(() => {
    const onUpdate = () => refresh();
    window.addEventListener("lp21-bookmarks-updated", onUpdate);
    const onStorage = (event) => {
      if (event.key === BOOKMARKS_STORAGE_KEY || event.key === null) {
        refresh();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("lp21-bookmarks-updated", onUpdate);
      window.removeEventListener("storage", onStorage);
    };
  }, [refresh]);

  const persist = useCallback((next) => {
    const saved = replaceBookmarkStore(next);
    setStore(saved);
    return saved;
  }, []);

  return { store, refresh, persist };
};

export default useBookmarkStore;
