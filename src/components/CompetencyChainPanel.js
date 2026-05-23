import React from "react";
import CompetencyChainView from "./CompetencyChainView";
import { apiUrl } from "../api/lehrplanApi";

const defaultNetworkUrl = (uid) =>
  apiUrl(`/api/competency-network/${encodeURIComponent(uid)}`);

const EMPTY_CHAIN_VIEW = {
  loading: false,
  error: null,
  data: null,
  highlightAnchorUid: null,
  searchSelectionHighlight: false,
};

/**
 * Einheitliche Aufbau-Karte für Suche und Landkarte (CompetencyChainView + optionales map-chain-panel).
 */
const CompetencyChainPanel = ({
  chainView,
  variant = "search",
  onBack,
  onSelectNeighbor,
  getZyklusColorByPart,
  getFachColor,
  bookmarkUids,
  onToggleBookmarkStep,
  onOpenInCurriculumMap,
  mapOutlineChainNav = null,
  mapChainNavDirection = null,
  onMapChainNavAnimationEnd,
  chainIdleMessage,
  hideToolbarBack,
  backButtonLabel,
  backButtonAriaLabel,
  wrapMapPanel,
  chainLoadingStatusDelayMs,
}) => {
  const mv = chainView || EMPTY_CHAIN_VIEW;
  const isMap = variant === "map";
  const hasChainContent = Boolean(mv.loading || mv.error || mv.data);
  const useMapPanel = wrapMapPanel != null ? wrapMapPanel : isMap;
  const resolvedHideToolbarBack =
    hideToolbarBack != null ? hideToolbarBack : isMap && !hasChainContent;
  const resolvedDelayMs =
    chainLoadingStatusDelayMs != null
      ? chainLoadingStatusDelayMs
      : isMap
        ? 2000
        : undefined;

  const view = (
    <CompetencyChainView
      key={String(mv.highlightAnchorUid || mv.data?.current?.uid || "chain-idle")}
      loading={Boolean(mv.loading)}
      error={mv.error}
      chainData={mv.data}
      highlightAnchorUid={mv.highlightAnchorUid}
      searchSelectionHighlight={Boolean(mv.searchSelectionHighlight)}
      onBack={hasChainContent ? onBack : undefined}
      onSelectNeighbor={hasChainContent ? onSelectNeighbor : undefined}
      getZyklusColorByPart={getZyklusColorByPart}
      getFachColor={getFachColor}
      getCompetencyNetworkUrl={defaultNetworkUrl}
      bookmarkUids={bookmarkUids}
      onToggleBookmarkStep={onToggleBookmarkStep}
      onOpenInCurriculumMap={onOpenInCurriculumMap}
      mapOutlineChainNav={mapOutlineChainNav}
      mapChainNavDirection={mapChainNavDirection}
      onMapChainNavAnimationEnd={onMapChainNavAnimationEnd}
      chainLoadingStatusDelayMs={resolvedDelayMs}
      chainIdleMessage={chainIdleMessage}
      hideToolbarBack={resolvedHideToolbarBack}
      backButtonLabel={backButtonLabel}
      backButtonAriaLabel={backButtonAriaLabel}
    />
  );

  if (!useMapPanel) {
    return view;
  }

  return (
    <div className="map-chain-panel map-chain-panel--split" aria-label="Kompetenzaufbau">
      {view}
    </div>
  );
};

export default CompetencyChainPanel;
