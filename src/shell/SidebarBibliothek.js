import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  DEFAULT_FOLDER_ID,
  addFolder,
  moveBookmark,
  removeBookmarkAndSave,
  totalBookmarkCount,
} from "../competencyBookmarks";
import { chainPath } from "../config/appUrls";
import useBookmarkStore from "../hooks/useBookmarkStore";
import {
  allowDrop,
  parseBookmarkDragData,
  setBookmarkDragData,
} from "./sidebarDrag";
import SidebarIcon from "./SidebarIcon";
import {
  readRecentCompetencies,
  RECENT_COMPETENCIES_STORAGE_KEY,
} from "../recentCompetencyHistory";

const MAX_VISIBLE = 8;
const MAX_RECENT = 6;

const SidebarBibliothek = ({ collapsed, onOpenMobileClose, onExpandRequest }) => {
  const navigate = useNavigate();
  const { store, persist } = useBookmarkStore();
  const [folderExpanded, setFolderExpanded] = useState({});
  const [dropFolderId, setDropFolderId] = useState(null);
  const [recentExpanded, setRecentExpanded] = useState(true);
  const [recentItems, setRecentItems] = useState(() => readRecentCompetencies());

  const refreshRecent = useCallback(() => {
    setRecentItems(readRecentCompetencies());
  }, []);

  useEffect(() => {
    refreshRecent();
    const onUpdate = () => refreshRecent();
    window.addEventListener("lp21-recent-updated", onUpdate);
    const onStorage = (event) => {
      if (event.key === RECENT_COMPETENCIES_STORAGE_KEY || event.key === null) {
        refreshRecent();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("lp21-recent-updated", onUpdate);
      window.removeEventListener("storage", onStorage);
    };
  }, [refreshRecent]);

  const total = totalBookmarkCount(store);
  const foldersOrdered = [
    ...store.folders.filter((f) => f.id === DEFAULT_FOLDER_ID),
    ...store.folders.filter((f) => f.id !== DEFAULT_FOLDER_ID),
  ];

  const isFolderOpen = (folderId, count) => {
    if (folderExpanded[folderId] !== undefined) {
      return folderExpanded[folderId];
    }
    return count > 0;
  };

  const toggleFolder = (folderId, count) => {
    setFolderExpanded((prev) => ({
      ...prev,
      [folderId]: !isFolderOpen(folderId, count),
    }));
  };

  const handleAddFolder = () => {
    const name = window.prompt("Name für den neuen Ordner:", "Neuer Ordner");
    if (name == null) {
      return;
    }
    const trimmed = String(name).trim();
    if (!trimmed) {
      return;
    }
    persist(addFolder(store, trimmed));
  };

  const handleOpenChain = (entry) => {
    onOpenMobileClose?.();
    const slug = entry.code?.trim() || entry.uid;
    navigate(chainPath(slug));
  };

  const handleDropOnFolder = (event, targetFolderId) => {
    event.preventDefault();
    event.stopPropagation();
    const payload = parseBookmarkDragData(event);
    if (!payload?.uid) {
      return;
    }
    persist(moveBookmark(store, payload.uid, targetFolderId, null));
    setDropFolderId(null);
  };

  if (collapsed) {
    return (
      <div className="app-sidebar-bib-collapsed">
        <button
          type="button"
          className="app-sidebar-rail-btn"
          onClick={onExpandRequest}
          title={`Bibliothek${total > 0 ? ` (${total})` : ""} — zum Erweitern tippen`}
          aria-label={`Bibliothek${total > 0 ? `, ${total} Einträge` : ""}`}
        >
          <SidebarIcon name="bookmark" />
          {total > 0 ? (
            <span className="app-sidebar-rail-badge">{total > 99 ? "99+" : total}</span>
          ) : null}
        </button>
      </div>
    );
  }

  return (
    <div className="app-sidebar-bibliothek">
      <div className="app-sidebar-section-head">
        <span className="app-sidebar-section-title">
          Bibliothek
          {total > 0 ? (
            <span className="app-sidebar-section-count"> ({total})</span>
          ) : null}
        </span>
        <button
          type="button"
          className="app-sidebar-section-action"
          onClick={handleAddFolder}
          aria-label="Neuer Ordner"
          title="Neuer Ordner"
        >
          +
        </button>
      </div>

      <p className="app-sidebar-empty app-sidebar-empty--hint" title="Kompetenz in der Suche merken, dann hier ins Thema ziehen">
        Merken in der Suche → ins Thema ziehen.
      </p>

      {recentItems.length > 0 ? (
        <section className="app-sidebar-bib-recent">
          <button
            type="button"
            className="app-sidebar-bib-folder-head"
            onClick={() => setRecentExpanded((o) => !o)}
            aria-expanded={recentExpanded}
          >
            <span aria-hidden="true">{recentExpanded ? "▾" : "▸"}</span>
            <span className="app-sidebar-bib-folder-name">Zuletzt</span>
            <span className="app-sidebar-badge">{recentItems.length}</span>
          </button>
          {recentExpanded ? (
            <ul className="app-sidebar-bib-list">
              {recentItems.slice(0, MAX_RECENT).map((entry) => (
                <li key={entry.uid}>
                  <button
                    type="button"
                    className="app-sidebar-bib-label app-sidebar-bib-label--recent"
                    onClick={() => handleOpenChain(entry)}
                    title={entry.label}
                  >
                    <span className="app-sidebar-bib-code">
                      {entry.code || entry.label.slice(0, 24)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      {total === 0 ? (
        <p className="app-sidebar-empty">
          {recentItems.length > 0
            ? "Noch keine Merkliste — oben siehst du Zuletzt angesehen."
            : "Noch nichts gemerkt."}
        </p>
      ) : (
        <div className="app-sidebar-bib-scroll">
          {foldersOrdered.map((folder) => {
            const count = folder.items?.length || 0;
            const open = isFolderOpen(folder.id, count);
            const visible = open ? (folder.items || []).slice(0, MAX_VISIBLE) : [];
            const rest = count - visible.length;
            return (
              <section
                key={folder.id}
                className={`app-sidebar-bib-folder${dropFolderId === folder.id ? " app-sidebar-bib-folder--drop" : ""}`}
                onDragOver={(e) => {
                  allowDrop(e);
                  setDropFolderId(folder.id);
                }}
                onDragLeave={() => setDropFolderId(null)}
                onDrop={(e) => handleDropOnFolder(e, folder.id)}
              >
                <button
                  type="button"
                  className="app-sidebar-bib-folder-head"
                  onClick={() => toggleFolder(folder.id, count)}
                  aria-expanded={open}
                >
                  <span aria-hidden="true">{open ? "▾" : "▸"}</span>
                  <span className="app-sidebar-bib-folder-name">{folder.name}</span>
                  <span className="app-sidebar-badge">{count}</span>
                </button>
                {open ? (
                  <ul className="app-sidebar-bib-list">
                    {visible.map((entry) => (
                      <li key={entry.uid}>
                        <div className="app-sidebar-bib-item">
                          <button
                            type="button"
                            className="app-sidebar-bib-drag"
                            draggable
                            onDragStart={(e) =>
                              setBookmarkDragData(e, entry.uid, folder.id)
                            }
                            onDragEnd={() => setDropFolderId(null)}
                            aria-label={`${entry.label}: ziehen`}
                            title="Ziehen"
                          >
                            ⠿
                          </button>
                          <button
                            type="button"
                            className="app-sidebar-bib-label"
                            onClick={() => handleOpenChain(entry)}
                            title={entry.label}
                          >
                            <span className="app-sidebar-bib-code">
                              {entry.code || entry.label.slice(0, 24)}
                            </span>
                          </button>
                          <button
                            type="button"
                            className="app-sidebar-bib-remove"
                            onClick={() =>
                              persist(removeBookmarkAndSave(entry.uid, store))
                            }
                            aria-label="Entfernen"
                          >
                            ×
                          </button>
                        </div>
                      </li>
                    ))}
                    {rest > 0 ? (
                      <li className="app-sidebar-bib-more">+ {rest} weitere</li>
                    ) : null}
                    {count === 0 ? (
                      <li className="app-sidebar-bib-more">Leer — hierher ziehen</li>
                    ) : null}
                  </ul>
                ) : null}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SidebarBibliothek;
