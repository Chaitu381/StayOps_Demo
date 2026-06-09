import { Navigate, useLocation } from "react-router-dom";
import { ReactNode } from "react";
import { useAuth, Role } from "@/context/AuthContext";
import { getSelectedPgId } from "@/lib/api";

interface Props {
  children: ReactNode;
  roles?: Role[];
}

function getHomePath(role: Role) {
  if (role === "SUPER_ADMIN") {
    return "/super-admin/pgs";
  }

  if (role === "OWNER") {
    return "/owner/pgs";
  }

  const pgId = getSelectedPgId();

  if (pgId) {
    return `/pg/${pgId}/dashboard`;
  }

  return "/login";
}

export default function ProtectedRoute({ children, roles }: Props) {
  const { creds } = useAuth();
  const location = useLocation();

  if (!creds) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles && !roles.includes(creds.role)) {
    return <Navigate to={getHomePath(creds.role)} replace />;
  }

  return <>{children}</>;
}