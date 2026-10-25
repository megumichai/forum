import { Navigate, Outlet } from "react-router-dom";

import { DetailSkeleton } from "@/components/loading";
import { useAuth } from "@/lib/auth";

export function RequireAuth() {
  const { user, loading } = useAuth();

  if (loading) return <DetailSkeleton />;
  if (!user) return <Navigate to="/login" replace />;

  return <Outlet />;
}
