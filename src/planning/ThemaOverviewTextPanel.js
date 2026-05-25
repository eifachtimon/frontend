import React from "react";

/**
 * Freitext im gleichen UI-Rahmen wie Todos (unterricht-todos), ohne Checkbox.
 */
const ThemaOverviewTextPanel = ({
  id,
  value,
  onChange,
  placeholder,
  rows = 4,
  ariaLabel,
}) => (
  <div className="thema-overview-field-panel unterricht-todos">
    <label className="thema-overview-field-panel__label" htmlFor={id}>
      <textarea
        id={id}
        className="thema-overview-field-panel__input"
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel || placeholder}
      />
    </label>
  </div>
);

export default ThemaOverviewTextPanel;
