import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import OverviewPage from "./pages/OverviewPage";
import AuthPage from "./pages/AuthPage";
import { useEffect, useState } from "react";
import "./index.css";
// import "./App.css";

function AuthHandler() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
    setLoading(false);

    // Add navigation effect
    if (token && location.pathname === "/auth") {
      navigate("/overview", { replace: true });
    }
  }, [location, navigate]);

  if (loading) return <div>Loading...</div>;

  if (!isAuthenticated && location.pathname !== "/auth") {
    return <Navigate to="/auth" replace />;
  }

  return (
    <Routes>
      <Route path="/overview" element={<OverviewPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route
        path="*"
        element={
          <Navigate to={isAuthenticated ? "/overview" : "/auth"} replace />
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AuthHandler />
    </Router>
  );
}
