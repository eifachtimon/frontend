import { normalizeFachKey } from "../planning/fachColors";

export const FACH_QUICK_PICKS = [
  { key: "mathematik", label: "Mathe", fach: "Mathematik" },
  { key: "deutsch", label: "Deutsch", fach: "Deutsch" },
  { key: "nmg", label: "NMG", fach: "NMG" },
  { key: "englisch", label: "Engl.", fach: "Englisch" },
  { key: "musik", label: "Musik", fach: "Musik" },
  { key: "sport", label: "Sport", fach: "Sport" },
];

export const buildFachPickerOptions = (vorhabenOptions = []) => {
  const seen = new Set(FACH_QUICK_PICKS.map((p) => p.key));
  const items = [...FACH_QUICK_PICKS];
  for (const v of vorhabenOptions) {
    const key = normalizeFachKey(v.fach);
    if (key === "default" || seen.has(key)) {
      continue;
    }
    seen.add(key);
    items.push({ key, label: v.fach, fach: v.fach });
  }
  return items;
};

export const fachNameForKey = (key, fachOptions) =>
  fachOptions.find((o) => o.key === key)?.fach ||
  fachOptions.find((o) => o.key === key)?.label ||
  "";
