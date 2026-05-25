import React, { useCallback } from "react";
import TagesTodosPanel from "./TagesTodosPanel";
import { addErinnerung } from "./planningStore";

/** Vorhaben-Todos — gleiche UI wie auf „Mein Unterricht“ (TagesTodosPanel). */
const ThemaVorhabenTodosPanel = ({ vorhaben, onChange }) => {
  const items = vorhaben.erinnerungen || [];

  const handleToggle = useCallback(
    (id) => {
      onChange({
        ...vorhaben,
        erinnerungen: items.map((e) => (e.id === id ? { ...e, done: !e.done } : e)),
      });
    },
    [vorhaben, items, onChange]
  );

  const handleAdd = useCallback(
    (text) => {
      onChange(addErinnerung(vorhaben, { text }));
    },
    [vorhaben, onChange]
  );

  const handleRemove = useCallback(
    (id) => {
      onChange({
        ...vorhaben,
        erinnerungen: items.filter((e) => e.id !== id),
      });
    },
    [vorhaben, items, onChange]
  );

  return (
    <TagesTodosPanel
      items={items}
      onToggle={handleToggle}
      onAdd={handleAdd}
      onRemove={handleRemove}
    />
  );
};

export default ThemaVorhabenTodosPanel;
