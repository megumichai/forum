import { Route, Routes } from "react-router-dom";

import { SiteLayout } from "@/components/site-layout";
import { CategoriesPage } from "@/pages/categories-page";
import { CategoryPage } from "@/pages/category-page";
import { HomePage } from "@/pages/home-page";
import { NotFoundPage } from "@/pages/not-found-page";
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
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
