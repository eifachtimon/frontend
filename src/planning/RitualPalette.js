import React from "react";

const RitualPalette = ({ rituals, onPick, onDragStartItem, label = "Baukasten" }) => (
  <aside className="ritual-palette" aria-label={label}>
    <h3 className="ritual-palette-title">{label}</h3>
    <p className="ritual-palette-hint">
      Ziehen auf einen Tag oder klicken für heute — Methode/Zeit zuerst klären.
    </p>
    <ul className="ritual-palette-list">
      {rituals.map((rit) => (
        <li key={rit.id}>
          <button
            type="button"
            className="ritual-palette-btn"
            draggable={Boolean(onDragStartItem)}
            onDragStart={onDragStartItem ? onDragStartItem(rit) : undefined}
            onClick={() => onPick(rit)}
            aria-label={`${rit.name}, ${rit.durationMin} Minuten hinzufügen`}
          >
            <span className="ritual-palette-name">{rit.name}</span>
            <span className="ritual-palette-dur">{rit.durationMin}′</span>
          </button>
        </li>
      ))}
    </ul>
  </aside>
);

export default RitualPalette;
