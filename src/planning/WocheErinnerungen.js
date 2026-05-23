import React, { useMemo, useState } from "react";
import { WEEKDAYS } from "./planningDefaults";
import { getTodayIsoDate, isReminderForToday } from "./planningHomeUtils";
import { addErinnerung, getIsoWeek } from "./planningStore";
import { getTodayWeekdayId } from "./planningLevels";

const weekdayLabel = (id) => WEEKDAYS.find((d) => d.id === id)?.label || id;

const ErinnerungRow = ({ item, onToggle, onRemove, onEditText }) => (
  <li className={`woche-erinnerung-row${item.done ? " is-done" : ""}`}>
    <input
      type="checkbox"
      checked={Boolean(item.done)}
      onChange={(e) => onToggle(item.id, e.target.checked)}
      aria-label={item.done ? "Als offen markieren" : "Als erledigt markieren"}
    />
    <input
      type="text"
      className="woche-erinnerung-text"
      value={item.text}
      onChange={(e) => onEditText(item.id, e.target.value)}
      aria-label="Erinnerungstext"
    />
    <button
      type="button"
      className="planning-icon-btn"
      onClick={() => onRemove(item.id)}
      aria-label="Erinnerung löschen"
    >
      ×
    </button>
  </li>
);

const WocheErinnerungen = ({ vorhaben, onChange }) => {
  const [draft, setDraft] = useState("");
  const [bindKw, setBindKw] = useState(true);
  const { kw } = getIsoWeek();
  const todayWd = getTodayWeekdayId();
  const isoDate = getTodayIsoDate();

  const list = vorhaben.erinnerungen || [];
  const ctx = useMemo(() => ({ isoDate, kw, todayWd }), [isoDate, kw, todayWd]);

  const { heute, weitereOffen, erledigt } = useMemo(() => {
    const open = list.filter((e) => !e.done);
    const heuteIds = new Set();
    const heuteItems = open.filter((e) => {
      if (isReminderForToday(e, ctx)) {
        heuteIds.add(e.id);
        return true;
      }
      return false;
    });
    return {
      heute: heuteItems,
      weitereOffen: open.filter((e) => !heuteIds.has(e.id)),
      erledigt: list.filter((e) => e.done),
    };
  }, [list, ctx]);

  const updateList = (nextList) => onChange({ ...vorhaben, erinnerungen: nextList });

  const handleToggle = (id, done) => {
    updateList(list.map((e) => (e.id === id ? { ...e, done } : e)));
  };

  const handleEditText = (id, text) => {
    updateList(list.map((e) => (e.id === id ? { ...e, text } : e)));
  };

  const handleRemove = (id) => {
    updateList(list.filter((e) => e.id !== id));
  };

  const handleAdd = () => {
    const text = draft.trim();
    if (!text) {
      return;
    }
    onChange(
      addErinnerung(vorhaben, {
        text,
        kw: bindKw ? kw : null,
        weekday: bindKw && todayWd ? todayWd : null,
      })
    );
    setDraft("");
  };

  const metaHint =
    bindKw && todayWd
      ? `KW ${kw}, ${weekdayLabel(todayWd)}`
      : bindKw
        ? `KW ${kw}`
        : "Ohne KW-Bindung";

  return (
    <section className="woche-erinnerungen" aria-label="Erinnerungen">
      {heute.length > 0 ? (
        <div className="woche-erinnerungen-head">
          <span className="woche-erinnerungen-badge">{heute.length} heute</span>
        </div>
      ) : null}

      <div className="woche-erinnerung-add">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Material, Vorbereitung, Elternmail …"
          aria-label="Neue Erinnerung"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
        />
        <button
          type="button"
          className="planning-btn planning-btn--primary"
          onClick={handleAdd}
          disabled={!draft.trim()}
        >
          +
        </button>
      </div>
      <label className="woche-erinnerung-scope">
        <input
          type="checkbox"
          checked={bindKw}
          onChange={(e) => setBindKw(e.target.checked)}
        />
        An aktuelle KW binden
        <span className="woche-erinnerung-scope-hint">({metaHint})</span>
      </label>

      {heute.length > 0 ? (
        <>
          <h4 className="woche-erinnerungen-sub">Heute</h4>
          <ul>
            {heute.map((e) => (
              <ErinnerungRow
                key={e.id}
                item={e}
                onToggle={handleToggle}
                onRemove={handleRemove}
                onEditText={handleEditText}
              />
            ))}
          </ul>
        </>
      ) : null}

      {weitereOffen.length > 0 ? (
        <>
          <h4 className="woche-erinnerungen-sub">
            {heute.length > 0 ? "Weitere offen" : "Offen"}
          </h4>
          <ul>
            {weitereOffen.map((e) => (
              <ErinnerungRow
                key={e.id}
                item={e}
                onToggle={handleToggle}
                onRemove={handleRemove}
                onEditText={handleEditText}
              />
            ))}
          </ul>
        </>
      ) : null}

      {list.length === 0 ? (
        <p className="woche-erinnerungen-empty">
          Noch keine Erinnerungen — oder über «Bericht → Struktur» aus Freitext erzeugen.
        </p>
      ) : null}

      {erledigt.length > 0 ? (
        <details className="woche-erinnerungen-done">
          <summary>Erledigt ({erledigt.length})</summary>
          <ul>
            {erledigt.map((e) => (
              <ErinnerungRow
                key={e.id}
                item={e}
                onToggle={handleToggle}
                onRemove={handleRemove}
                onEditText={handleEditText}
              />
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
};

export default WocheErinnerungen;
