import { Routes, Route } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import HomePage from "./pages/HomePage";
import ScenariosPage from "./pages/ScenariosPage";
import RunSetupPage from "./pages/RunSetupPage";
import LobbyPage from "./pages/LobbyPage";
import SimulationPage from "./pages/SimulationPage";
import ReplayPage from "./pages/ReplayPage";

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/scenarios" element={<ScenariosPage />} />
        <Route path="/runs/new" element={<RunSetupPage />} />
        <Route path="/runs/:runId/lobby" element={<LobbyPage />} />
        <Route path="/runs/:runId" element={<SimulationPage />} />
        <Route path="/runs/:runId/replay" element={<ReplayPage />} />
      </Route>
    </Routes>
  );
}
