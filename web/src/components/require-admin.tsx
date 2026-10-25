import { Navigate, Outlet } from "react-router-dom";

import { DetailSkeleton } from "@/components/loading";
import { useAuth } from "@/lib/auth";

export function RequireAdmin() {
  const { user, loading } = useAuth();

  if (loading) return <DetailSkeleton />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/" replace />;

  return <Outlet />;
}
