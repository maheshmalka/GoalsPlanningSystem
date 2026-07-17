import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import PlansListPage from "./pages/PlansListPage";
import PlanDetailPage from "./pages/PlanDetailPage";
import ProjectionsPage from "./pages/ProjectionsPage";
import GlobalSettingsPage from "./pages/GlobalSettingsPage";

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/plans" replace />} />
        <Route path="/plans" element={<PlansListPage />} />
        <Route path="/plans/:id" element={<PlanDetailPage />} />
        <Route path="/plans/:id/projections" element={<ProjectionsPage />} />
        <Route path="/settings" element={<GlobalSettingsPage />} />
      </Route>
    </Routes>
  );
}

export default App;
