import React from "react";
import { Link } from "react-router-dom";
import { vorhabenLektionPath } from "../config/appUrls";
import ThemaMaterialListPanel from "./ThemaMaterialListPanel";

const ThemaMaterialInline = ({ vorhaben, onChange }) => {
  const lekWithMaterial = (vorhaben.lektionen || []).filter((l) =>
    String(l.material || "").trim()
  );

  return (
    <div className="thema-material-inline">
      <ThemaMaterialListPanel vorhaben={vorhaben} onChange={onChange} />
      {lekWithMaterial.length > 0 ? (
        <>
          <p className="thema-material-inline__lek-heading">In Lektionen</p>
          <ul className="thema-material-lek-list" aria-label="Material in Lektionen">
            {lekWithMaterial.map((lek) => (
              <li key={lek.id}>
                <Link
                  to={vorhabenLektionPath(vorhaben.id, lek.id)}
                  className="thema-material-lek-link"
                >
                  <span className="thema-material-lek-title">{lek.title}</span>
                  <span className="thema-material-lek-preview">
                    {String(lek.material).trim().slice(0, 80)}
                    {String(lek.material).trim().length > 80 ? "…" : ""}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
};

export default ThemaMaterialInline;
