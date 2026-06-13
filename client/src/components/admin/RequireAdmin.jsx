import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore.js";

const STAFF_ROLES = ["moderator", "subadmin", "admin", "master_admin"];

export default function RequireAdmin({ children }) {
  const { user, loading } = useAuthStore();
  if (loading) return <div className="grid h-screen place-items-center text-muted">Loading...</div>;
  if (!user) return <Navigate to="/admin/login" replace />;
  if (!STAFF_ROLES.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}
