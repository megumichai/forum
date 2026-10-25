import { Route, Routes } from "react-router-dom";

import { AdminLayout } from "@/components/admin-layout";
import { RequireAdmin } from "@/components/require-admin";
import { RequireAuth } from "@/components/require-auth";
import { SiteLayout } from "@/components/site-layout";
import { AdminAnnouncementsPage } from "@/pages/admin-announcements-page";
import { AdminCategoriesPage } from "@/pages/admin-categories-page";
import { AdminDashboardPage } from "@/pages/admin-dashboard-page";
import { AdminPostsPage } from "@/pages/admin-posts-page";
import { AdminTopicsPage } from "@/pages/admin-topics-page";
import { AdminUsersPage } from "@/pages/admin-users-page";
import { CategoriesPage } from "@/pages/categories-page";
import { CategoryPage } from "@/pages/category-page";
import { HomePage } from "@/pages/home-page";
import { LoginPage } from "@/pages/login-page";
import { MePage } from "@/pages/me-page";
import { NewTopicPage } from "@/pages/new-topic-page";
import { NotFoundPage } from "@/pages/not-found-page";
import { RegisterPage } from "@/pages/register-page";
import { SettingsPage } from "@/pages/settings-page";
import { TopicPage } from "@/pages/topic-page";
import { UserPage } from "@/pages/user-page";

export function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route index element={<HomePage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="c/:slug" element={<CategoryPage />} />
        <Route path="t/:id" element={<TopicPage />} />
        <Route path="u/:username" element={<UserPage />} />
        <Route path="new" element={<NewTopicPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route element={<RequireAuth />}>
          <Route path="me" element={<MePage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      <Route element={<RequireAdmin />}>
        <Route element={<AdminLayout />}>
          <Route path="admin" element={<AdminDashboardPage />} />
          <Route path="admin/categories" element={<AdminCategoriesPage />} />
          <Route path="admin/topics" element={<AdminTopicsPage />} />
          <Route path="admin/posts" element={<AdminPostsPage />} />
          <Route path="admin/users" element={<AdminUsersPage />} />
          <Route
            path="admin/announcements"
            element={<AdminAnnouncementsPage />}
          />
        </Route>
      </Route>
    </Routes>
  );
}
