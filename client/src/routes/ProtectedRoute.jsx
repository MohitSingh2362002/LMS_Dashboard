import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Loader from "../components/Loader";

const ProtectedRoute = ({ roles, children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Loader fullScreen label="Loading your workspace..." />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!roles.includes(user.role)) return <Navigate to={`/${user.role}`} replace />;
  return children;
};

export default ProtectedRoute;
