import React, { useCallback } from "react";
import UnterrichtChecklistPanel from "./UnterrichtChecklistPanel";
import { checklistToPlainText, createChecklistItem } from "./planningStore";

const ThemaZielePanel = ({ vorhaben, onChange }) => {
  const items = vorhaben.grob?.zieleListe || [];

  const updateListe = useCallback(
    (zieleListe) => {
      onChange({
        ...vorhaben,
        grob: {
          ...vorhaben.grob,
          zieleListe,
          ziele: checklistToPlainText(zieleListe),
        },
      });
    },
    [vorhaben, onChange]
  );

  const handleToggle = useCallback(
    (id) => {
      updateListe(items.map((e) => (e.id === id ? { ...e, done: !e.done } : e)));
    },
    [items, updateListe]
  );

  const handleAdd = useCallback(
    (text) => {
      updateListe([...items, createChecklistItem(text, "zl")]);
    },
    [items, updateListe]
  );

  const handleRemove = useCallback(
    (id) => {
      updateListe(items.filter((e) => e.id !== id));
    },
    [items, updateListe]
  );

  return (
    <UnterrichtChecklistPanel
      items={items}
      onToggle={handleToggle}
      onAdd={handleAdd}
      onRemove={handleRemove}
      emptyLabel="Noch keine Ziele — unten hinzufügen."
      addPlaceholder="Neues Ziel …"
      openListAriaLabel="Offene Ziele"
      doneListAriaLabel="Erledigte Ziele"
    />
  );
};

export default ThemaZielePanel;
