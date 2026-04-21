import { lazy, Suspense } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import ScenariosPage from "./pages/ScenariosPage";
import RunSetupPage from "./pages/RunSetupPage";
import LobbyPage from "./pages/LobbyPage";
import SimulationPage from "./pages/SimulationPage";
import ReplayPage from "./pages/ReplayPage";
import { useAuthStore } from "./stores/authStore";
import HelpPage from "./pages/HelpPage";

const TutorialPage = lazy(() => import("./pages/TutorialPage"));
const SimSpecPage = lazy(() => import("./pages/SimSpecPage"));

function RequireAuth({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const location = useLocation();

  if (!user || !accessToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<HomePage />} />
        <Route path="/scenarios" element={<ScenariosPage />} />
        <Route path="/runs/new" element={<RunSetupPage />} />
        <Route path="/runs/:runId/lobby" element={<LobbyPage />} />
        <Route path="/runs/:runId" element={<SimulationPage />} />
        <Route path="/runs/:runId/replay" element={<ReplayPage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route
          path="/tutorial"
          element={
            <Suspense fallback={<div style={{ padding: "2rem", color: "var(--text-muted)" }}>Loading tutorial…</div>}>
              <TutorialPage />
            </Suspense>
          }
        />
        <Route
          path="/sim-spec"
          element={
            <Suspense fallback={<div style={{ padding: "2rem", color: "var(--text-muted)" }}>Loading spec…</div>}>
              <SimSpecPage />
            </Suspense>
          }
        />
      </Route>
    </Routes>
  );
}
