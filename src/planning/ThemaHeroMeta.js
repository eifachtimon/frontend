import React from "react";
import { Link } from "react-router-dom";
import { vorhabenLevelPath, vorhabenOverviewSectionPath } from "../config/appUrls";
import { getFachCssVars, getFachToneClassName } from "./fachColors";

const ThemaHeroMeta = ({
  vorhaben,
  onChange,
  compCount,
  lekCount,
  openReminders,
  variant = "default",
}) => {
  const update = (patch) => onChange({ ...vorhaben, ...patch });
  const id = vorhaben.id;
  const toneClass = getFachToneClassName(vorhaben.fach);
  const fachStyle = toneClass ? getFachCssVars(vorhaben.fach, id) : undefined;
  const isOverview = variant === "overview";

  const metaFields = (
    <>
      <label
        className={`thema-meta-field${toneClass ? ` ${toneClass}` : ""}`}
        style={fachStyle}
      >
        <span className="thema-meta-field-label">Fach</span>
        <input
          type="text"
          value={vorhaben.fach || ""}
          onChange={(e) => update({ fach: e.target.value })}
          placeholder="z. B. Mathematik"
          aria-label="Fach"
        />
      </label>
      <label className="thema-meta-field">
        <span className="thema-meta-field-label">Zyklus</span>
        <input
          type="text"
          value={vorhaben.zyklus || ""}
          onChange={(e) => update({ zyklus: e.target.value })}
          placeholder="z. B. 2"
          aria-label="Zyklus"
        />
      </label>
      <label className="thema-meta-field">
        <span className="thema-meta-field-label">Klasse</span>
        <input
          type="text"
          value={vorhaben.klasse || ""}
          onChange={(e) => update({ klasse: e.target.value })}
          placeholder="z. B. 5b"
          aria-label="Klasse"
        />
      </label>
    </>
  );

  const stats = (
    <div className="thema-hero-stats" role="list" aria-label="Überblick">
      <a
        href={vorhabenOverviewSectionPath(id, "kompetenzen-ziele")}
        className={`thema-hero-stat${toneClass ? ` ${toneClass}` : ""}`}
        style={fachStyle}
        role="listitem"
      >
        <span className="thema-hero-stat-n">{compCount}</span>
        <span className="thema-hero-stat-label">Komp. &amp; Ziele</span>
      </a>
      <Link
        to={vorhabenLevelPath(id, "uebersicht")}
        className={`thema-hero-stat${toneClass ? ` ${toneClass}` : ""}`}
        style={fachStyle}
        role="listitem"
      >
        <span className="thema-hero-stat-n">{lekCount}</span>
        <span className="thema-hero-stat-label">Lektionen</span>
      </Link>
      {openReminders > 0 ? (
        <a
          href={vorhabenOverviewSectionPath(id, "todos")}
          className={`thema-hero-stat thema-hero-stat--accent${toneClass ? ` ${toneClass}` : ""}`}
          style={fachStyle}
          role="listitem"
        >
          <span className="thema-hero-stat-n">{openReminders}</span>
          <span className="thema-hero-stat-label">Todos</span>
        </a>
      ) : null}
    </div>
  );

  if (isOverview) {
    return (
      <div className="thema-hero-meta thema-hero-meta--overview">
        <div className="thema-hero-meta-row" role="group" aria-label="Fach, Zyklus, Klasse">
          {metaFields}
        </div>
        {stats}
      </div>
    );
  }

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
        <a
          href={vorhabenOverviewSectionPath(id, "kompetenzen-ziele")}
          className={`thema-stat-pill${toneClass ? ` ${toneClass}` : ""}`}
          style={fachStyle}
          role="listitem"
        >
          <span className="thema-stat-pill-n">{compCount}</span>
          Komp. &amp; Ziele
        </a>
        <Link
          to={vorhabenLevelPath(id, "uebersicht")}
          className={`thema-stat-pill${toneClass ? ` ${toneClass}` : ""}`}
          style={fachStyle}
          role="listitem"
        >
          <span className="thema-stat-pill-n">{lekCount}</span>
          Lektionen
        </Link>
        {openReminders > 0 ? (
          <a
            href={vorhabenOverviewSectionPath(id, "todos")}
            className={`thema-stat-pill thema-stat-pill--accent${toneClass ? ` ${toneClass}` : ""}`}
            style={fachStyle}
            role="listitem"
          >
            <span className="thema-stat-pill-n">{openReminders}</span>
            Todos
          </a>
        ) : null}
      </div>
    </div>
  );
};

export default ThemaHeroMeta;
