const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api";

export type Role = "user" | "moderator" | "admin";

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  role: Role;
  bio: string | null;
  created_at: string;
}

export interface Author {
  id: number;
  username: string;
  display_name: string;
  avatar_url: string | null;
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

export interface UserPost {
  id: number;
  content: string;
  created_at: string;
  updated_at: string;
  topic: {
    id: number;
    title: string;
  };
}

export interface TopicDetail extends TopicSummary {
  content: string;
}

export interface ViewCount {
  view_count: number;
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

export interface TopicCreateInput {
  category_id: number;
  title: string;
  content: string;
}

export interface TopicUpdateInput {
  title?: string;
  content?: string;
  category_id?: number;
  is_pinned?: boolean;
  is_locked?: boolean;
}

export interface PostInput {
  content: string;
}

export interface ProfileUpdateInput {
  display_name?: string;
  email?: string;
  bio?: string | null;
  avatar_url?: string | null;
}

export interface PasswordChangeInput {
  current_password: string;
  new_password: string;
}

export interface LoginInput {
  identifier: string;
  password: string;
}

export interface RegisterInput {
  username: string;
  email: string;
  password: string;
  display_name?: string;
}

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function detailMessage(body: unknown): string | null {
  if (typeof body !== "object" || body === null || !("detail" in body)) {
    return null;
  }

  const detail = body.detail;
  if (typeof detail === "string") return detail;

  if (Array.isArray(detail)) {
    const first: unknown = detail[0];
    if (
      typeof first === "object" &&
      first !== null &&
      "msg" in first &&
      typeof first.msg === "string"
    ) {
      return first.msg;
    }
  }

  return null;
}

async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body !== undefined) headers.set("Content-Type", "application/json");

  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...init,
    headers,
  });

  if (!response.ok) {
    let message = `请求失败（${response.status}）`;
    try {
      message = detailMessage(await response.json()) ?? message;
    } catch {}
    throw new ApiError(response.status, message);
  }

  if (response.status === 204) return undefined as T;
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
  viewTopic: (id: number) =>
    request<ViewCount>(`/topics/${id}/view`, { method: "POST" }),
  topicPosts: (id: number, page = 1, pageSize = 20) =>
    request<Page<Post>>(
      `/topics/${id}/posts?page=${page}&page_size=${pageSize}`,
    ),
  createTopic: (payload: TopicCreateInput) =>
    request<TopicSummary>("/topics", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateTopic: (id: number, payload: TopicUpdateInput) =>
    request<TopicSummary>(`/topics/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteTopic: (id: number) =>
    request<void>(`/topics/${id}`, { method: "DELETE" }),
  createPost: (topicId: number, payload: PostInput) =>
    request<Post>(`/topics/${topicId}/posts`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updatePost: (id: number, payload: PostInput) =>
    request<Post>(`/posts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deletePost: (id: number) =>
    request<void>(`/posts/${id}`, { method: "DELETE" }),
  user: (username: string) =>
    request<UserProfile>(`/users/${encodeURIComponent(username)}`),
  userTopics: (username: string, page = 1, pageSize = 20) =>
    request<Page<TopicSummary>>(
      `/users/${encodeURIComponent(username)}/topics?page=${page}&page_size=${pageSize}`,
    ),
  userPosts: (username: string, page = 1, pageSize = 20) =>
    request<Page<UserPost>>(
      `/users/${encodeURIComponent(username)}/posts?page=${page}&page_size=${pageSize}`,
    ),
  me: () => request<AuthUser>("/auth/me"),
  updateProfile: (payload: ProfileUpdateInput) =>
    request<AuthUser>("/auth/me", {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  changePassword: (payload: PasswordChangeInput) =>
    request<void>("/auth/password", {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  login: (payload: LoginInput) =>
    request<AuthUser>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  register: (payload: RegisterInput) =>
    request<AuthUser>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  logout: () => request<void>("/auth/logout", { method: "POST" }),
};
