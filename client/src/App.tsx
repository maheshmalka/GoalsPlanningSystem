import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import ClientsListPage from "./pages/ClientsListPage";
import ClientDetailPage from "./pages/ClientDetailPage";
import ProjectionsPage from "./pages/ProjectionsPage";
import GlobalSettingsPage from "./pages/GlobalSettingsPage";

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/clients" replace />} />
        <Route path="/clients" element={<ClientsListPage />} />
        <Route path="/clients/:id" element={<ClientDetailPage />} />
        <Route path="/clients/:id/projections" element={<ProjectionsPage />} />
        <Route path="/settings" element={<GlobalSettingsPage />} />
      </Route>
    </Routes>
  );
}

export default App;
