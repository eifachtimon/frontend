import React, { useCallback } from "react";
import UnterrichtChecklistPanel from "./UnterrichtChecklistPanel";
import { checklistToPlainText, createChecklistItem } from "./planningStore";

const ThemaMaterialListPanel = ({ vorhaben, onChange }) => {
  const items = vorhaben.zweiWochen?.materialListe || [];

  const updateListe = useCallback(
    (materialListe) => {
      onChange({
        ...vorhaben,
        zweiWochen: {
          ...vorhaben.zweiWochen,
          materialListe,
          material: checklistToPlainText(materialListe),
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
      updateListe([...items, createChecklistItem(text, "ml")]);
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
      emptyLabel="Noch kein Material — unten hinzufügen."
      addPlaceholder="Neues Material …"
      openListAriaLabel="Material am Thema"
      doneListAriaLabel="Erledigtes Material am Thema"
    />
  );
};

export default ThemaMaterialListPanel;
