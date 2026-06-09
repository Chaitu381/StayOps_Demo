import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function RoleHome() {
  const { creds } = useAuth();

  if (!creds) {
    return <Navigate to="/login" replace />;
  }

  if (creds.role === "SUPER_ADMIN") {
    return <Navigate to="/super-admin/pgs" replace />;
  }

  return <Navigate to="/pg/default/dashboard" replace />;
}