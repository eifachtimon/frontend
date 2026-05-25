import React from "react";

const ThemaMeilensteineBlock = ({ vorhaben, onChange, className = "" }) => {
  const z = vorhaben.zweiWochen || { meilensteine: [], label: "", notizen: "" };

  const update = (patch) => {
    onChange({ ...vorhaben, zweiWochen: { ...z, ...patch } });
  };

  const handleMilestone = (id, field, value) => {
    update({
      meilensteine: (z.meilensteine || []).map((m) =>
        m.id === id ? { ...m, [field]: value } : m
      ),
    });
  };

  const handleAddMilestone = () => {
    update({
      meilensteine: [
        ...(z.meilensteine || []),
        { id: `m-${Date.now()}`, text: "", done: false },
      ],
    });
  };

  const openCount = (z.meilensteine || []).filter((m) => !m.done).length;

  return (
    <section
      id="thema-section-meilensteine"
      className={`thema-unified-section thema-unified-section--meilensteine${className ? ` ${className}` : ""}`}
      aria-labelledby="thema-ms-title"
    >
      <h2 id="thema-ms-title" className="thema-overview-section-title">
        Meilensteine
        {openCount > 0 ? (
          <span className="thema-unified-section-badge">{openCount}</span>
        ) : null}
      </h2>

      <div className="planning-field thema-ms-label-field">
        <label htmlFor="thema-ms-block-label" className="thema-ms-label-inline">
          Zeitraum
        </label>
        <input
          id="thema-ms-block-label"
          type="text"
          value={z.label || ""}
          onChange={(e) => update({ label: e.target.value })}
          placeholder="z. B. 2. Fortschrittsblock"
        />
      </div>

      <fieldset className="planning-milestones thema-ms-list">
        <legend className="planning-sr-only">Meilensteine</legend>
        <ul>
          {(z.meilensteine || []).map((m) => (
            <li key={m.id} className="planning-milestone-row">
              <input
                type="checkbox"
                checked={Boolean(m.done)}
                onChange={(e) => handleMilestone(m.id, "done", e.target.checked)}
                aria-label="Erledigt"
              />
              <input
                type="text"
                value={m.text}
                onChange={(e) => handleMilestone(m.id, "text", e.target.value)}
                placeholder="Meilenstein …"
              />
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="planning-btn planning-btn--ghost planning-btn--small"
          onClick={handleAddMilestone}
        >
          + Meilenstein
        </button>
      </fieldset>
    </section>
  );
};

export default ThemaMeilensteineBlock;
