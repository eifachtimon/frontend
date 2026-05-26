import React, { useMemo, useState } from "react";
import { loadBookmarkStore } from "../competencyBookmarks";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import { vorhabenLevelPath } from "../config/appUrls";
import { addCompetencyToVorhaben } from "../planning/planningCompetencies";
import { createVorhaben } from "../planning/planningStore";
import { getFachCssVars, getFachToneClassName } from "../planning/fachColors";
import { groupVorhabenByFach } from "../planning/planningHomeUtils";
import { getLevelBadge } from "../planning/planningLevels";
import {
  FAECHER,
  FAECHER_UND_THEMEN,
  NEUES_THEMA,
  NOCH_KEIN_THEMA_UNTER_FACH,
  SIDEBAR_THEMEN_QUICK,
  THEMEN_IN_FACH,
} from "../planning/themaLabels";
import usePlanningStore from "../planning/usePlanningStore";
import {
  allowDrop,
  parseCompetencyDragData,
} from "./sidebarDrag";
import SidebarIcon from "./SidebarIcon";

const SidebarVorhabenTree = ({ collapsed, onDropToast }) => {
  const navigate = useNavigate();
  const params = useParams();
  const { store, saveVorhaben } = usePlanningStore();
  const [dropTargetId, setDropTargetId] = useState(null);
  const [folderExpanded, setFolderExpanded] = useState({});

  const fachFolders = useMemo(
    () => groupVorhabenByFach(store.vorhaben),
    [store.vorhaben]
  );

  const sortedFlat = useMemo(
    () =>
      [...store.vorhaben].sort((a, b) => {
        if (a.id === store.lastActiveVorhabenId) {
          return -1;
        }
        if (b.id === store.lastActiveVorhabenId) {
          return 1;
        }
        return (b.updatedAt || 0) - (a.updatedAt || 0);
      }),
    [store.vorhaben, store.lastActiveVorhabenId]
  );

  const handleCreate = () => {
    const v = createVorhaben({ templateId: "thema" });
    const saved = saveVorhaben(v);
    navigate(vorhabenLevelPath(saved.id, "uebersicht"));
  };

  const findBookmarkEntry = (uid) => {
    const bs = loadBookmarkStore();
    for (const folder of bs.folders || []) {
      const hit = (folder.items || []).find((i) => i.uid === uid);
      if (hit) {
        return hit;
      }
    }
    return null;
  };

  const handleDropOnVorhaben = (event, vorhabenId) => {
    event.preventDefault();
    event.stopPropagation();
    setDropTargetId(null);
    const parsed = parseCompetencyDragData(event);
    if (!parsed?.uid) {
      return;
    }
    const entry =
      findBookmarkEntry(parsed.uid) || {
        uid: parsed.uid,
        label: parsed.uid,
      };
    if (!entry) {
      return;
    }
    const v = store.vorhaben.find((x) => x.id === vorhabenId);
    if (!v) {
      return;
    }
    const next = addCompetencyToVorhaben(v, entry);
    if (next === v) {
      onDropToast?.(`«${entry.code || entry.label}» ist bereits im Thema.`);
      return;
    }
    saveVorhaben(next);
    onDropToast?.(`«${entry.code || entry.label}» → ${v.title}`);
  };

  const isFolderOpen = (fach, count) => {
    if (folderExpanded[fach] !== undefined) {
      return folderExpanded[fach];
    }
    return count <= 3;
  };

  const toggleFolder = (fach, count) => {
    setFolderExpanded((prev) => ({
      ...prev,
      [fach]: !isFolderOpen(fach, count),
    }));
  };

  const renderVorhabenRow = (v) => {
    const badge = getLevelBadge(v, v.lastVisitedLevel || "uebersicht");
    const isDrop = dropTargetId === v.id;
    const toneClass = getFachToneClassName(v.fach);
    return (
      <li
        key={v.id}
        className="app-sidebar-tree-vorhaben"
        role="treeitem"
        aria-selected={params.id === v.id || store.lastActiveVorhabenId === v.id}
      >
        <div
          className={`app-sidebar-vorhaben-row${isDrop ? " app-sidebar-vorhaben-row--drop" : ""}`}
          onDragOver={(e) => {
            allowDrop(e, "copy");
            setDropTargetId(v.id);
          }}
          onDragLeave={() => setDropTargetId(null)}
          onDrop={(e) => handleDropOnVorhaben(e, v.id)}
        >
          <NavLink
            to={vorhabenLevelPath(v.id, "uebersicht")}
            className={({ isActive }) =>
              `app-sidebar-vorhaben-link${toneClass ? ` ${toneClass}` : ""}${isActive ? " app-sidebar-vorhaben-link--active" : ""}`
            }
            style={toneClass ? getFachCssVars(v.fach, v.id) : undefined}
            title={`${v.title} (${v.fach || "Fach"})`}
          >
            <span className="app-sidebar-vorhaben-title">{v.title}</span>
            {badge ? (
              <span className="app-sidebar-badge" aria-label={`${badge} Einträge`}>
                {badge}
              </span>
            ) : null}
          </NavLink>
        </div>
      </li>
    );
  };

  if (collapsed) {
    return (
      <nav className="app-sidebar-vorhaben-collapsed" aria-label={SIDEBAR_THEMEN_QUICK}>
        {sortedFlat.slice(0, 5).map((v) => {
          const initial = (v.title || "?").trim().slice(0, 1).toUpperCase();
          const toneClass = getFachToneClassName(v.fach);
          return (
            <NavLink
              key={v.id}
              to={vorhabenLevelPath(v.id, "uebersicht")}
              className={({ isActive }) =>
                `app-sidebar-rail-btn app-sidebar-rail-btn--vorhaben${toneClass ? ` ${toneClass}` : ""}${isActive ? " app-sidebar-rail-btn--active" : ""}`
              }
              style={toneClass ? getFachCssVars(v.fach, v.id) : undefined}
              title={v.title}
              aria-label={v.title}
            >
              <span className="app-sidebar-rail-initial">{initial}</span>
            </NavLink>
          );
        })}
        <button
          type="button"
          className="app-sidebar-rail-btn app-sidebar-rail-btn--add"
          onClick={handleCreate}
          aria-label={NEUES_THEMA}
          title={NEUES_THEMA}
        >
          <SidebarIcon name="plus" />
        </button>
      </nav>
    );
  }

  return (
    <div className="app-sidebar-vorhaben">
      <div className="app-sidebar-section-head">
        <span className="app-sidebar-section-label">{FAECHER}</span>
        <button
          type="button"
          className="app-sidebar-section-action"
          onClick={handleCreate}
          aria-label={NEUES_THEMA}
          title={NEUES_THEMA}
        >
          +
        </button>
      </div>
      {fachFolders.length === 0 ? (
        <p className="app-sidebar-empty">{NOCH_KEIN_THEMA_UNTER_FACH}</p>
      ) : (
        <ul className="app-sidebar-tree" role="tree" aria-label={FAECHER_UND_THEMEN}>
          {fachFolders.map(({ fach, items }) => {
            const open = isFolderOpen(fach, items.length);
            const toneClass = getFachToneClassName(fach);
            const folderId = `sidebar-fach-${fach.replace(/\s+/g, "-")}`;
            return (
              <li
                key={fach}
                className="app-sidebar-tree-fach"
                role="treeitem"
                aria-expanded={open}
              >
                <div className="app-sidebar-fach-folder-head">
                  <button
                    type="button"
                    className="app-sidebar-tree-toggle"
                    onClick={() => toggleFolder(fach, items.length)}
                    aria-expanded={open}
                    aria-controls={folderId}
                    title={`${fach} ${open ? "zuklappen" : "aufklappen"}`}
                  >
                    <span aria-hidden="true">{open ? "▾" : "▸"}</span>
                  </button>
                  <span
                    className={`app-sidebar-fach-label${toneClass ? ` ${toneClass}` : ""}`}
                    style={toneClass ? getFachCssVars(fach) : undefined}
                  >
                    {fach}
                    <span className="app-sidebar-section-count"> ({items.length})</span>
                  </span>
                </div>
                {open ? (
                  <ul
                    id={folderId}
                    className="app-sidebar-tree-children"
                    role="group"
                    aria-label={THEMEN_IN_FACH(fach)}
                  >
                    {items.map((v) => renderVorhabenRow(v))}
                  </ul>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default SidebarVorhabenTree;
