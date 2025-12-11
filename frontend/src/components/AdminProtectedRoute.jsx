// AdminProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const AdminProtectedRoute = ({ children }) => {
  const { user, isAdmin, isSuperAdmin, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin && !isSuperAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default AdminProtectedRoute;
