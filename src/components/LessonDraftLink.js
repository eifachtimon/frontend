import React from "react";
import { Link } from "react-router-dom";
import { planungEntwurfPath } from "../config/appUrls";

/**
 * Link to lesson draft planning stub with competency context in query params.
 */
const LessonDraftLink = ({ uid, code, fach, text, className = "lesson-draft-link", children }) => {
  const to = planungEntwurfPath({ uid, code, fach, text });
  const label =
    children != null
      ? children
      : "Stundenentwurf";

  return (
    <Link
      to={to}
      className={className}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
      aria-label="Stundenentwurf für diese Kompetenz öffnen"
    >
      {label}
    </Link>
  );
};

export default LessonDraftLink;
