import React from "react";
import { Link } from "react-router-dom";
import { vorhabenLevelPath } from "../config/appUrls";
import { getFachCssVars, getFachToneClassName } from "./fachColors";

const ThemaHeroMeta = ({
  vorhaben,
  onChange,
  compCount,
  lekCount,
  openReminders,
}) => {
  const update = (patch) => onChange({ ...vorhaben, ...patch });
  const id = vorhaben.id;
  const toneClass = getFachToneClassName(vorhaben.fach);
  const fachStyle = toneClass ? getFachCssVars(vorhaben.fach, id) : undefined;

  return (
    <div className="thema-hero-meta">
      <div className="thema-meta-chips" role="group" aria-label="Fach, Zyklus, Klasse">
        <label
          className={`thema-meta-chip${toneClass ? ` ${toneClass}` : ""}`}
          style={fachStyle}
        >
          <span className="thema-meta-chip-label">Fach</span>
          <input
            type="text"
            value={vorhaben.fach || ""}
            onChange={(e) => update({ fach: e.target.value })}
            placeholder="z. B. Mathematik"
            aria-label="Fach"
          />
        </label>
        <label className="thema-meta-chip">
          <span className="thema-meta-chip-label">Zyklus</span>
          <input
            type="text"
            value={vorhaben.zyklus || ""}
            onChange={(e) => update({ zyklus: e.target.value })}
            placeholder="z. B. 2"
            aria-label="Zyklus"
          />
        </label>
        <label className="thema-meta-chip">
          <span className="thema-meta-chip-label">Klasse</span>
          <input
            type="text"
            value={vorhaben.klasse || ""}
            onChange={(e) => update({ klasse: e.target.value })}
            placeholder="z. B. 5b"
            aria-label="Klasse"
          />
        </label>
      </div>
      <div className="thema-hero-stats" role="list" aria-label="Überblick">
        <Link
          to={vorhabenLevelPath(id, "grob")}
          className={`thema-stat-pill${toneClass ? ` ${toneClass}` : ""}`}
          style={fachStyle}
          role="listitem"
        >
          <span className="thema-stat-pill-n">{compCount}</span>
          Kompetenzen
        </Link>
        <Link
          to={vorhabenLevelPath(id, "lektion")}
          className={`thema-stat-pill${toneClass ? ` ${toneClass}` : ""}`}
          style={fachStyle}
          role="listitem"
        >
          <span className="thema-stat-pill-n">{lekCount}</span>
          Lektionen
        </Link>
        {openReminders > 0 ? (
          <Link
            to={vorhabenLevelPath(id, "woche")}
            className={`thema-stat-pill thema-stat-pill--accent${toneClass ? ` ${toneClass}` : ""}`}
            style={fachStyle}
            role="listitem"
          >
            <span className="thema-stat-pill-n">{openReminders}</span>
            Erinnerungen
          </Link>
        ) : null}
      </div>
    </div>
  );
};

export default ThemaHeroMeta;
