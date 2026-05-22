import React, { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { planungEntwurfPath } from "../../config/appUrls";
import { useRegisterEditShortcuts } from "../../hooks/EditShortcutsProvider";
import { DURATION_OPTIONS } from "../planningDefaults";
import { addLektion } from "../planningStore";

const LektionPanel = ({ vorhaben, rituals, onChange }) => {
  const [focus, setFocus] = useState({ lektionId: null, blockId: null });
  const handleAddLektion = () => {
    onChange(addLektion(vorhaben));
  };

  const updateLektion = (id, patch) => {
    onChange({
      ...vorhaben,
      lektionen: vorhaben.lektionen.map((l) =>
        l.id === id ? { ...l, ...patch } : l
      ),
    });
  };

  const removeLektion = (id) => {
    onChange({
      ...vorhaben,
      lektionen: vorhaben.lektionen.filter((l) => l.id !== id),
    });
  };

  const addBlock = (lektionId, rit) => {
    const lek = vorhaben.lektionen.find((l) => l.id === lektionId);
    if (!lek) {
      return;
    }
    updateLektion(lektionId, {
      ablaufBlocks: [
        ...(lek.ablaufBlocks || []),
        {
          id: `b-${Date.now()}`,
          label: rit.name,
          durationMin: rit.durationMin,
          ritualId: rit.id,
          notes: "",
        },
      ],
    });
  };

  const removeBlock = (lektionId, blockId) => {
    const lek = vorhaben.lektionen.find((l) => l.id === lektionId);
    if (!lek) {
      return;
    }
    updateLektion(lektionId, {
      ablaufBlocks: (lek.ablaufBlocks || []).filter((b) => b.id !== blockId),
    });
  };

  const totalMin = (blocks) =>
    (blocks || []).reduce((s, b) => s + (b.durationMin || 0), 0);

  const handleKeyboardDelete = useCallback(() => {
    if (focus.blockId && focus.lektionId) {
      removeBlock(focus.lektionId, focus.blockId);
      setFocus({ lektionId: focus.lektionId, blockId: null });
      return;
    }
    if (focus.lektionId) {
      removeLektion(focus.lektionId);
      setFocus({ lektionId: null, blockId: null });
    }
  }, [focus, removeBlock, removeLektion]);

  useRegisterEditShortcuts({
    onDelete: handleKeyboardDelete,
    canDelete: Boolean(focus.lektionId),
  });

  const firstComp = vorhaben.competencies?.[0];
  const entwurfTo = planungEntwurfPath({
    uid: firstComp?.uid,
    code: firstComp?.code,
    fach: firstComp?.fach || vorhaben.fach,
    text: firstComp?.label,
    vorhabenId: vorhaben.id,
  });

  return (
    <div className="planning-panel planning-panel--lektion">
      <div className="planning-panel-main">
        <section className="lektion-entwurf-card" aria-labelledby="lektion-entwurf-title">
          <h2 id="lektion-entwurf-title" className="planning-subtitle">
            Stundenentwurf
          </h2>
          <p className="lektion-entwurf-desc">
            Kompetenzen, Dauer und Notizen für eine konkrete Stunde — verknüpft mit diesem
            Vorhaben.
          </p>
          <Link to={entwurfTo} className="planning-btn planning-btn--primary">
            Stundenentwurf öffnen
          </Link>
        </section>

        <div className="lektion-toolbar">
          <h2 className="planning-subtitle">Lektionen</h2>
          <span className="planning-kbd-hint">
            <kbd>⌘Z</kbd> Rückgängig · <kbd>Entf</kbd> Lektion/Block
          </span>
          <button type="button" className="planning-btn planning-btn--primary" onClick={handleAddLektion}>
            + Lektion
          </button>
        </div>
        {vorhaben.lektionen.length === 0 ? (
          <p className="planning-empty">
            Noch keine Lektionen. Lege eine an oder nutze den Stundenentwurf direkt.
          </p>
        ) : (
          <ul className="lektion-list">
            {vorhaben.lektionen.map((lek) => (
              <li
                key={lek.id}
                className={`lektion-card lektion-card--draggable ${
                  focus.lektionId === lek.id && !focus.blockId ? "lektion-card--focused" : ""
                }`}
                onClick={() => setFocus({ lektionId: lek.id, blockId: null })}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    setFocus({ lektionId: lek.id, blockId: null });
                  }
                }}
                role="button"
                tabIndex={0}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData(
                    "application/x-lp21-woche",
                    JSON.stringify({ kind: "lektion", lektionId: lek.id })
                  );
                  e.dataTransfer.effectAllowed = "copy";
                }}
                title="In der Wochenplanung auf einen Tag ziehen"
              >
                <div className="lektion-card-head">
                  <input
                    type="text"
                    className="lektion-title-input"
                    value={lek.title}
                    onChange={(e) => updateLektion(lek.id, { title: e.target.value })}
                    aria-label="Lektionstitel"
                  />
                  <select
                    value={lek.durationMin}
                    onChange={(e) =>
                      updateLektion(lek.id, { durationMin: Number(e.target.value) })
                    }
                    aria-label="Dauer"
                  >
                    {DURATION_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="planning-icon-btn"
                    onClick={() => removeLektion(lek.id)}
                    aria-label="Lektion löschen"
                  >
                    ×
                  </button>
                </div>
                <ul className="lektion-ablauf">
                  {(lek.ablaufBlocks || []).map((b) => (
                    <li
                      key={b.id}
                      className={focus.blockId === b.id ? "lektion-ablauf-item--focused" : ""}
                      onClick={(e) => {
                        e.stopPropagation();
                        setFocus({ lektionId: lek.id, blockId: b.id });
                      }}
                    >
                      <span>{b.label}</span>
                      <span className="lektion-block-dur">{b.durationMin}′</span>
                      <button
                        type="button"
                        className="planning-icon-btn planning-icon-btn--small"
                        onClick={() => removeBlock(lek.id, b.id)}
                        aria-label="Block entfernen"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
                <p className="lektion-time-sum">
                  Blöcke: {totalMin(lek.ablaufBlocks)} / {lek.durationMin} Min
                </p>
                <div className="lektion-ritual-quick">
                  {rituals.map((rit) => (
                    <button
                      key={rit.id}
                      type="button"
                      className="woche-ritual-quick"
                      onClick={() => addBlock(lek.id, rit)}
                    >
                      + {rit.name}
                    </button>
                  ))}
                </div>
                <div className="planning-field">
                  <label htmlFor={`lek-durch-${lek.id}`}>Durchführen — Rückblick nach der Lektion</label>
                  <textarea
                    id={`lek-durch-${lek.id}`}
                    rows={2}
                    value={lek.durchfuehren || ""}
                    onChange={(e) => updateLektion(lek.id, { durchfuehren: e.target.value })}
                    placeholder="Was ist aufgefallen? Was folgt daraus für die nächste Planung?"
                  />
                </div>
                <div className="planning-field">
                  <label htmlFor={`lek-sich-${lek.id}`}>Sichern — Ergebnissicherung (vorher)</label>
                  <textarea
                    id={`lek-sich-${lek.id}`}
                    rows={2}
                    value={lek.sicherung || ""}
                    onChange={(e) => updateLektion(lek.id, { sicherung: e.target.value })}
                    placeholder="Wie werden Lernergebnisse erfasst?"
                  />
                </div>
                <textarea
                  rows={2}
                  value={lek.notizen || ""}
                  onChange={(e) => updateLektion(lek.id, { notizen: e.target.value })}
                  placeholder="Weitere Notizen …"
                  aria-label="Notizen zur Lektion"
                />
                <Link
                  to={planungEntwurfPath({
                    uid: lek.competencies?.[0]?.uid,
                    code: lek.competencies?.[0]?.code,
                    fach: lek.competencies?.[0]?.fach,
                    text: lek.competencies?.[0]?.label,
                  })}
                  className="planning-link-entwurf"
                >
                  Stundenentwurf öffnen →
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default LektionPanel;
