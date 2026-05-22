import React from "react";
import { Navigate, Route, Routes, useNavigate, useParams } from "react-router-dom";
import "./planning/planning.css";
import "./calendar/calendar.css";
import App from "./App";
import AppTopNav from "./components/AppTopNav";
import PlanungEntwurfPage from "./pages/PlanungEntwurfPage";
import PlanungHubPage from "./pages/PlanungHubPage";
import VorhabenPage from "./pages/VorhabenPage";
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
  return <App routerNavigate={navigate} initialMapOpen />;
};

const VorhabenRedirect = () => {
  const { id } = useParams();
  return <Navigate to={vorhabenLevelPath(id, "grob")} replace />;
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
    <AppTopNav />
    <Routes>
      <Route path={APP_ROUTES.search} element={<SearchRoute />} />
      <Route path="/kette/:uid" element={<ChainRoute />} />
      <Route path={APP_ROUTES.landkarte} element={<LandkarteRoute />} />
      <Route path={APP_ROUTES.kalender} element={<KalenderPage />} />
      <Route path={APP_ROUTES.planung} element={<PlanungHubPage />} />
      <Route path={`${APP_ROUTES.jahresplan}/:startYear`} element={<JahresplanPage />} />
      <Route path={APP_ROUTES.jahresplan} element={<JahresplanRedirect />} />
      <Route
        path={`${APP_ROUTES.monatsplan}/:year/:month`}
        element={<MonatsplanPage />}
      />
      <Route path={APP_ROUTES.monatsplan} element={<MonatsplanRedirect />} />
      <Route path="/planung/vorhaben/:id" element={<VorhabenRedirect />} />
      <Route path="/planung/vorhaben/:id/:level" element={<VorhabenPage />} />
      <Route path={APP_ROUTES.planungEntwurf} element={<PlanungEntwurfPage />} />
      <Route path="*" element={<Navigate to={APP_ROUTES.search} replace />} />
    </Routes>
  </EditShortcutsProvider>
);

export default AppRouter;
