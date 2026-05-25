import React from "react";
import { Navigate, Route, Routes, useNavigate, useParams } from "react-router-dom";
import "./planning/planning.css";
import "./calendar/calendar.css";
import App from "./App";
import AppShellLayout from "./shell/AppShellLayout";
import PlanungEntwurfPage from "./pages/PlanungEntwurfPage";
import PlanungHubPage from "./pages/PlanungHubPage";
import VorhabenPage from "./pages/VorhabenPage";
import LektionPlanPage from "./pages/LektionPlanPage";
import JahresplanPage from "./pages/JahresplanPage";
import MonatsplanPage from "./pages/MonatsplanPage";
import KalenderPage from "./pages/KalenderPage";
import {
  APP_ROUTES,
  jahresplanPath,
  monatsplanPath,
  vorhabenLevelPath,
} from "./config/appUrls";
import { getSchoolYearStart } from "./planning/calendarUtils";
import { EditShortcutsProvider } from "./hooks/EditShortcutsProvider";

const SearchRoute = () => {
  const navigate = useNavigate();
  return <App routerNavigate={navigate} />;
};

const ChainRoute = () => {
  const navigate = useNavigate();
  const { uid } = useParams();
  return <App routerNavigate={navigate} routeChainUid={uid} />;
};

const LandkarteRoute = () => {
  const navigate = useNavigate();
  return <App routerNavigate={navigate} mapOnly />;
};

const VorhabenRedirect = () => {
  const { id } = useParams();
  return <Navigate to={vorhabenLevelPath(id, "uebersicht")} replace />;
};

const JahresplanRedirect = () => (
  <Navigate to={jahresplanPath(getSchoolYearStart())} replace />
);

const MonatsplanRedirect = () => {
  const now = new Date();
  return (
    <Navigate
      to={monatsplanPath(now.getFullYear(), now.getMonth() + 1)}
      replace
    />
  );
};

const AppRouter = () => (
  <EditShortcutsProvider>
    <AppShellLayout>
      <Routes>
        <Route path={APP_ROUTES.home} element={<PlanungHubPage />} />
        <Route path="/planung" element={<Navigate to={APP_ROUTES.home} replace />} />
        <Route path={APP_ROUTES.search} element={<SearchRoute />} />
        <Route path="/kette/:uid" element={<ChainRoute />} />
        <Route path={APP_ROUTES.landkarte} element={<LandkarteRoute />} />
        <Route path={APP_ROUTES.kalender} element={<KalenderPage />} />
        <Route path={`${APP_ROUTES.jahresplan}/:startYear`} element={<JahresplanPage />} />
        <Route path={APP_ROUTES.jahresplan} element={<JahresplanRedirect />} />
        <Route
          path={`${APP_ROUTES.monatsplan}/:year/:month`}
          element={<MonatsplanPage />}
        />
        <Route path={APP_ROUTES.monatsplan} element={<MonatsplanRedirect />} />
        <Route path="/planung/vorhaben/:id" element={<VorhabenRedirect />} />
        <Route
          path="/planung/vorhaben/:id/lektion/:lektionId"
          element={<LektionPlanPage />}
        />
        <Route path="/planung/vorhaben/:id/:level" element={<VorhabenPage />} />
        <Route path={APP_ROUTES.planungEntwurf} element={<PlanungEntwurfPage />} />
        <Route path="*" element={<Navigate to={APP_ROUTES.home} replace />} />
      </Routes>
    </AppShellLayout>
  </EditShortcutsProvider>
);

export default AppRouter;
