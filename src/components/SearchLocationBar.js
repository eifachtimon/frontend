import React from "react";
import { Link } from "react-router-dom";
import { APP_ROUTES } from "../config/appUrls";

const BreadcrumbSep = () => (
  <span className="search-location-sep" aria-hidden="true">
    /
  </span>
);

/**
 * @param {"chain"|"landkarte"|null} mode
 * @param {string} [chainLabel]
 */
const SearchLocationBar = ({ mode, chainLabel }) => {
  if (!mode) {
    return null;
  }

  return (
    <nav className="search-location-bar" aria-label="Orientierung Suche">
      <ol className="search-location-trail">
        <li className="search-location-item">
          <Link to={APP_ROUTES.search}>Suche</Link>
        </li>
        <BreadcrumbSep />
        {mode === "landkarte" ? (
          <li className="search-location-item search-location-item--current" aria-current="page">
            <span>Landkarte</span>
          </li>
        ) : (
          <>
            <li className="search-location-item">
              <Link to={APP_ROUTES.search}>Kette</Link>
            </li>
            {chainLabel ? (
              <>
                <BreadcrumbSep />
                <li
                  className="search-location-item search-location-item--current"
                  aria-current="page"
                >
                  <span className="search-location-chain-label">{chainLabel}</span>
                </li>
              </>
            ) : null}
          </>
        )}
      </ol>
    </nav>
  );
};

export default SearchLocationBar;
