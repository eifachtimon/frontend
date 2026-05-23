import React from "react";

const PATHS = {
  search: (
    <>
      <circle cx="10" cy="10" r="5.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <line x1="14" y1="14" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  plan: (
    <>
      <circle cx="10" cy="10" r="6" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="10" cy="10" r="2" fill="currentColor" />
    </>
  ),
  map: (
    <>
      <rect x="3" y="5" width="14" height="12" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M3 9h14M10 5v12" stroke="currentColor" strokeWidth="1.5" />
    </>
  ),
  year: (
    <>
      <rect x="4" y="5" width="12" height="11" fill="none" stroke="currentColor" strokeWidth="2" />
      <line x1="4" y1="8" x2="16" y2="8" stroke="currentColor" strokeWidth="1.5" />
    </>
  ),
  month: (
    <>
      <rect x="4" y="5" width="12" height="11" fill="none" stroke="currentColor" strokeWidth="2" />
      <line x1="4" y1="8" x2="16" y2="8" stroke="currentColor" strokeWidth="1.5" />
      <line x1="8" y1="5" x2="8" y2="16" stroke="currentColor" strokeWidth="1.5" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="14" height="12" fill="none" stroke="currentColor" strokeWidth="2" />
      <line x1="3" y1="9" x2="17" y2="9" stroke="currentColor" strokeWidth="1.5" />
      <line x1="7" y1="3" x2="7" y2="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="13" y1="3" x2="13" y2="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  draft: (
    <>
      <path
        d="M6 16h8l6-6V6h-6L6 10v6z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M12 6l6 6" fill="none" stroke="currentColor" strokeWidth="2" />
    </>
  ),
  bookmark: (
    <path
      d="M6 4h8v14l-4-3-4 3V4z"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  ),
  plus: (
    <path d="M10 5v10M5 10h10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
  ),
  vorhaben: (
    <>
      <path d="M4 7h12M4 11h8M4 15h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  "chevron-left": (
    <path
      d="M12 5l-5 5 5 5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  "chevron-right": (
    <path
      d="M8 5l5 5-5 5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
};

/**
 * @param {keyof PATHS} name
 */
const SidebarIcon = ({ name, className = "" }) => (
  <svg
    className={`app-sidebar-icon ${className}`.trim()}
    viewBox="0 0 20 20"
    width="20"
    height="20"
    aria-hidden="true"
    focusable="false"
  >
    {PATHS[name] || null}
  </svg>
);

export default SidebarIcon;
