import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import OverviewPage from "./pages/OverviewPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import { useEffect, useState } from "react";

function AuthHandler() {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check auth status
  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
    setLoading(false);
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  // Allow access to auth pages when unauthenticated
  if (
    !isAuthenticated &&
    !["/login", "/register"].includes(location.pathname)
  ) {
    return <Navigate to="/login" replace />;
  }

  // Redirect authenticated users away from auth pages
  if (isAuthenticated && ["/login", "/register"].includes(location.pathname)) {
    return <Navigate to="/overview" replace />;
  }

  return (
    <Routes>
      <Route path="/overview" element={<OverviewPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
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
