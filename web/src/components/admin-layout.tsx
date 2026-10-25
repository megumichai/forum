import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";

import { AdminSidebar } from "./admin-sidebar";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

export function AdminLayout() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:flex-row lg:gap-8">
        <AdminSidebar />
        <div
          key={pathname}
          className="min-w-0 flex-1 animate-page-in motion-reduce:animate-none"
        >
          <Outlet />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
