/** Kompetenz-Einträge in Vorhaben übernehmen (Suche → Planung). */

export const competencyAlreadyInVorhaben = (vorhaben, uid) => {
  if (!vorhaben || !uid) {
    return false;
  }
  return (vorhaben.competencies || []).some((c) => c.uid === uid);
};

export const addCompetencyToVorhaben = (vorhaben, entry) => {
  if (!vorhaben || !entry?.uid) {
    return vorhaben;
  }
  if (competencyAlreadyInVorhaben(vorhaben, entry.uid)) {
    return vorhaben;
  }
  return {
    ...vorhaben,
    competencies: [
      ...(vorhaben.competencies || []),
      {
        uid: entry.uid,
        label: entry.label || entry.uid,
        code: entry.code,
        fach: entry.fach,
        zyklus: entry.zyklus,
        themenbereich: entry.themenbereich,
      },
    ],
  };
};
