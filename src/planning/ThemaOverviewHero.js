import React from "react";
import { getFachCssVars, getFachToneClassName } from "./fachColors";

const ThemaOverviewHero = ({ vorhaben, onChange }) => {
  const update = (patch) => onChange({ ...vorhaben, ...patch });
  const toneClass = getFachToneClassName(vorhaben.fach);
  const heroStyle = {
    ...getFachCssVars(vorhaben.fach, vorhaben.id),
    background: "var(--fach-bg, var(--bh-yellow-pale, #fff8d6))",
  };

  return (
    <header
      className={`thema-overview-hero thema-overview-hero--compact${toneClass ? ` ${toneClass}` : ""}`}
      style={heroStyle}
      aria-label="Thema"
    >
      <div className="thema-overview-hero__main">
        <label className="thema-overview-hero__fach">
          <span className="thema-overview-hero__fach-label">Fach</span>
          <input
            type="text"
            className="thema-overview-hero__line-input"
            value={vorhaben.fach || ""}
            onChange={(e) => update({ fach: e.target.value })}
            placeholder="Fach"
            aria-label="Fach"
          />
        </label>

        <input
          type="text"
          className="thema-overview-hero__title thema-overview-hero__line-input"
          value={vorhaben.title}
          onChange={(e) => update({ title: e.target.value })}
          placeholder="Titel des Themas"
          aria-label="Titel des Themas"
        />

        <label className="thema-overview-hero__inline">
          <span className="thema-overview-hero__inline-label">Zyklus</span>
          <input
            type="text"
            className="thema-overview-hero__line-input thema-overview-hero__line-input--short"
            value={vorhaben.zyklus || ""}
            onChange={(e) => update({ zyklus: e.target.value })}
            placeholder="2"
            aria-label="Zyklus"
          />
        </label>

        <label className="thema-overview-hero__inline">
          <span className="thema-overview-hero__inline-label">Klasse</span>
          <input
            type="text"
            className="thema-overview-hero__line-input thema-overview-hero__line-input--short"
            value={vorhaben.klasse || ""}
            onChange={(e) => update({ klasse: e.target.value })}
            placeholder="5b"
            aria-label="Klasse"
          />
        </label>
      </div>
    </header>
  );
};

export default ThemaOverviewHero;
