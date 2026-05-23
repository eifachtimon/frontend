/**
 * Fach-Farben (Planung & Kalender).
 * Mathematik = rot, Deutsch = blau, NMG = grün; Themen desselben Fachs = hellere/abgestufte Töne.
 */

const FACH_PALETTES = {
  mathematik: {
    base: "#d02020",
    shades: ["#fff1f1", "#fcd4d4", "#e87070", "#a81818"],
  },
  deutsch: {
    base: "#1040c0",
    shades: ["#eef3fc", "#c5d4f5", "#5a78d4", "#0a2e8a"],
  },
  nmg: {
    base: "#2a8f4e",
    shades: ["#edf7f0", "#b8dfc8", "#52b072", "#1a6632"],
  },
  englisch: {
    base: "#e07820",
    shades: ["#fff6ed", "#fdd9b8", "#f0a060", "#b85a10"],
  },
  franzoesisch: {
    base: "#c44d8a",
    shades: ["#fceef5", "#f0c0da", "#e080b0", "#903060"],
  },
  natur_technik: {
    base: "#1a9a9a",
    shades: ["#e8f7f7", "#b0e0e0", "#50c0c0", "#0d7070"],
  },
  raeume_zeiten: {
    base: "#a06040",
    shades: ["#f8f0ec", "#e0c8b8", "#c08868", "#704028"],
  },
  sport: {
    base: "#8b3030",
    shades: ["#f5eded", "#ddb8b8", "#c06060", "#602020"],
  },
  musik: {
    base: "#7a48b0",
    shades: ["#f3edf9", "#d4c0ea", "#a078d0", "#4e2878"],
  },
  medien: {
    base: "#3a88c8",
    shades: ["#edf5fc", "#b8d8f0", "#68a8e0", "#1a5898"],
  },
  ethik: {
    base: "#7a9040",
    shades: ["#f4f6ec", "#d0dcb0", "#a0b868", "#506020"],
  },
  wirtschaft: {
    base: "#9a7040",
    shades: ["#f8f4ec", "#e0d0b0", "#c0a070", "#604820"],
  },
  default: {
    base: "#5a5a5a",
    shades: ["#f2f2f2", "#d8d8d8", "#9a9a9a", "#3a3a3a"],
  },
};

const hashId = (id = "") => {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) {
    h = (h + id.charCodeAt(i) * 17) % 997;
  }
  return h;
};

/** @returns {keyof typeof FACH_PALETTES} */
export const normalizeFachKey = (fach) => {
  const s = String(fach || "").trim().toLowerCase();

  if (!s) {
    return "default";
  }
  if (s.includes("mathematik") || s === "mathe" || s === "math" || s === "mu") {
    return "mathematik";
  }
  if (s.includes("deutsch") || s === "de" || s === "d") {
    return "deutsch";
  }
  if (
    s.includes("natur, mensch") ||
    s.includes("natur mensch") ||
    s === "nmg" ||
    s.includes("natur mensch gesellschaft")
  ) {
    return "nmg";
  }
  if (s.includes("englisch") || s === "en") {
    return "englisch";
  }
  if (s.includes("franz")) {
    return "franzoesisch";
  }
  if (s.includes("natur und technik") || s.includes("physik") || s === "nt") {
    return "natur_technik";
  }
  if (
    s.includes("raeume") ||
    s.includes("räume") ||
    s.includes("geschicht") ||
    s.includes("geograf")
  ) {
    return "raeume_zeiten";
  }
  if (s.includes("sport") || s.includes("bewegung")) {
    return "sport";
  }
  if (s.includes("musik")) {
    return "musik";
  }
  if (s.includes("medien") || s.includes("informatik")) {
    return "medien";
  }
  if (s.includes("ethik") || s.includes("religion") || s.includes("lebenskunde")) {
    return "ethik";
  }
  if (s.includes("wirtschaft") || s.includes("haushalt")) {
    return "wirtschaft";
  }
  return "default";
};

export const getFachPalette = (fach) => FACH_PALETTES[normalizeFachKey(fach)] || FACH_PALETTES.default;

export const getFachBaseColor = (fach) => getFachPalette(fach).base;

/** Akzentstreifen / Rahmen (dunkler Ton, pro Thema leicht variiert). */
export const getFachAccentColor = (fach, vorhabenId = "") => {
  const { shades } = getFachPalette(fach);
  const h = hashId(vorhabenId);
  return shades[2 + (h % 2)] || shades[shades.length - 1];
};

/** Hintergrund im Kalender (helle Stufe, pro Thema unterschiedlich). */
export const getFachBackgroundColor = (fach, vorhabenId = "", cardType = "") => {
  const { shades } = getFachPalette(fach);
  const key = normalizeFachKey(fach);
  if (key === "default") {
    return null;
  }
  const h = hashId(vorhabenId);
  if (cardType === "notiz") {
    return shades[0];
  }
  if (cardType === "ritual") {
    return shades[0];
  }
  return shades[h % 2];
};

export const getFachToneClassName = (fach) => {
  const key = normalizeFachKey(fach);
  return key === "default" ? "" : `fach-tone fach-tone--${key}`;
};

/** CSS-Variablen für Komponenten (Sidebar, Karten, Chips). */
export const getFachCssVars = (fach, vorhabenId = "") => ({
  "--fach-base": getFachBaseColor(fach),
  "--fach-accent": getFachAccentColor(fach, vorhabenId),
  "--fach-bg": getFachBackgroundColor(fach, vorhabenId),
});

export const resolvePlanningEventColors = (vorhaben, cardType = "") => {
  const fach = vorhaben?.fach || "";
  const id = vorhaben?.id || "";
  if (normalizeFachKey(fach) === "default") {
    return { accent: null, bg: null, toneClass: "" };
  }
  return {
    accent: getFachAccentColor(fach, id),
    bg: getFachBackgroundColor(fach, id, cardType),
    toneClass: getFachToneClassName(fach),
  };
};

export const applyFachEventElementStyles = (el, fach, vorhabenId = "", cardType = "") => {
  if (!el) {
    return;
  }
  const { accent, bg, toneClass } = resolvePlanningEventColors(
    { fach, id: vorhabenId },
    cardType
  );
  if (accent) {
    el.style.setProperty("--cal-event-accent", accent);
  }
  if (bg) {
    el.style.setProperty("--cal-event-bg", bg);
    el.classList.add("cal-event--fach");
  }
  if (toneClass) {
    toneClass.split(" ").forEach((c) => {
      if (c) {
        el.classList.add(c);
      }
    });
  }
};

/** Für Suche / App.js — Basisfarbe nach Fachname. */
export const getFachColorForLabel = (fachLabel) => getFachBaseColor(fachLabel);
