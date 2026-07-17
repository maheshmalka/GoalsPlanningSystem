import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import ProtectedRoute from "./auth/ProtectedRoute";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import PlansListPage from "./pages/PlansListPage";
import PlanDetailPage from "./pages/PlanDetailPage";
import ProjectionsPage from "./pages/ProjectionsPage";
import GlobalSettingsPage from "./pages/GlobalSettingsPage";

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/plans" replace />} />
            <Route path="/plans" element={<PlansListPage />} />
            <Route path="/plans/:id" element={<PlanDetailPage />} />
            <Route path="/plans/:id/projections" element={<ProjectionsPage />} />
            <Route path="/settings" element={<GlobalSettingsPage />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
