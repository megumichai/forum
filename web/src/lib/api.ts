const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api";

export type Role = "user" | "moderator" | "admin";

export interface Author {
  id: number;
  username: string;
  display_name: string;
  role: Role;
}

export interface UserProfile extends Author {
  bio: string | null;
  created_at: string;
  topic_count: number;
  post_count: number;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
}

export interface TopicSummary {
  id: number;
  title: string;
  is_pinned: boolean;
  is_locked: boolean;
  view_count: number;
  reply_count: number;
  created_at: string;
  updated_at: string;
  category: Category;
  author: Author;
}

export interface Post {
  id: number;
  content: string;
  created_at: string;
  updated_at: string;
  author: Author;
}

export interface TopicDetail extends TopicSummary {
  content: string;
  posts: Post[];
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface TopicQuery {
  category?: string;
  page?: number;
  pageSize?: number;
}

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    let message = `请求失败（${response.status}）`;
    try {
      const body: unknown = await response.json();
      if (
        typeof body === "object" &&
        body !== null &&
        "detail" in body &&
        typeof body.detail === "string"
      ) {
        message = body.detail;
      }
    } catch {}
    throw new Error(message);
  }

  return (await response.json()) as T;
}

function toQuery({ category, page = 1, pageSize = 20 }: TopicQuery) {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });
  if (category) params.set("category", category);
  return params.toString();
}

export const api = {
  categories: () => request<Category[]>("/categories"),
  category: (slug: string) =>
    request<Category>(`/categories/${encodeURIComponent(slug)}`),
  topics: (query: TopicQuery = {}) =>
    request<Page<TopicSummary>>(`/topics?${toQuery(query)}`),
  topic: (id: number) => request<TopicDetail>(`/topics/${id}`),
  topicPosts: (id: number, page = 1, pageSize = 20) =>
    request<Page<Post>>(
      `/topics/${id}/posts?page=${page}&page_size=${pageSize}`,
    ),
  user: (username: string) =>
    request<UserProfile>(`/users/${encodeURIComponent(username)}`),
};
