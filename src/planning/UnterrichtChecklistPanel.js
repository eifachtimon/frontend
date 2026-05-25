import React, { useState } from "react";

/**
 * Checkbox-Liste mit +-Eingabe (Todos, Ziele, Material am Thema).
 */
const UnterrichtChecklistPanel = ({
  items,
  onToggle,
  onAdd,
  onRemove,
  emptyLabel = "Noch keine Einträge — unten hinzufügen.",
  addPlaceholder = "Neuer Eintrag …",
  openListAriaLabel = "Offene Einträge",
  doneListAriaLabel = "Erledigte Einträge",
}) => {
  const [newText, setNewText] = useState("");

  const handleAdd = () => {
    const text = newText.trim();
    if (!text) {
      return;
    }
    onAdd(text);
    setNewText("");
  };

  const open = items.filter((t) => !t.done);
  const done = items.filter((t) => t.done);

  return (
    <div className="unterricht-todos">
      <ul className="unterricht-todo-list" aria-label={openListAriaLabel}>
        {open.length === 0 && done.length === 0 ? (
          <li className="unterricht-todo-empty">{emptyLabel}</li>
        ) : null}
        {open.map((item) => (
          <li key={item.id} className="unterricht-todo-item">
            <label className="unterricht-todo-label">
              <input
                type="checkbox"
                checked={item.done}
                onChange={() => onToggle(item.id)}
                aria-label={`Erledigt: ${item.text}`}
              />
              <span className="unterricht-todo-text">{item.text}</span>
            </label>
            <button
              type="button"
              className="unterricht-todo-remove"
              onClick={() => onRemove(item.id)}
              aria-label={`«${item.text}» entfernen`}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      {done.length > 0 ? (
        <ul
          className="unterricht-todo-list unterricht-todo-list--done"
          aria-label={doneListAriaLabel}
        >
          {done.map((item) => (
            <li key={item.id} className="unterricht-todo-item unterricht-todo-item--done">
              <label className="unterricht-todo-label">
                <input
                  type="checkbox"
                  checked={item.done}
                  onChange={() => onToggle(item.id)}
                  aria-label={`Wieder offen: ${item.text}`}
                />
                <span className="unterricht-todo-text">{item.text}</span>
              </label>
              <button
                type="button"
                className="unterricht-todo-remove"
                onClick={() => onRemove(item.id)}
                aria-label={`«${item.text}» entfernen`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="unterricht-todo-add">
        <input
          type="text"
          className="unterricht-todo-add-input"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder={addPlaceholder}
          aria-label={addPlaceholder}
        />
        <button
          type="button"
          className="planning-btn planning-btn--ghost unterricht-todo-add-btn"
          onClick={handleAdd}
          disabled={!newText.trim()}
        >
          +
        </button>
      </div>
    </div>
  );
};

export default UnterrichtChecklistPanel;
