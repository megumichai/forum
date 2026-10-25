# Forum Project

论坛项目：FastAPI + SQLAlchemy 2.0（API），Vite + React + Tailwind CSS（Web）。

## 依赖

Python 3.14+、[uv](https://docs.astral.sh/uv/)、Node.js 22+、pnpm。

## API

```bash
cd api
cp .env.example .env
uv sync
uv run alembic upgrade head
uv run seed.py
uv run fastapi dev
```

## Web

```bash
cd web
pnpm install
pnpm dev
```

前端通过 Vite 代理把 `/api` 转发到 `http://127.0.0.1:8000`。

## 部署

- 生产构建默认请求 `https://forum.fastapicloud.dev/api`，可通过 `VITE_API_BASE_URL` 覆盖。
- 后端允许的跨域来源通过 `FORUM_CORS_ORIGINS` 配置，多个来源用逗号分隔。
- HTTPS 部署会自动使用 `Secure` + `SameSite=None` Cookie，也可以通过 `FORUM_COOKIE_SECURE=true` 强制启用。
- 后端启动时默认自动执行 `alembic upgrade head`；多实例部署建议设置 `FORUM_AUTO_MIGRATE=false`，改为在发布阶段执行迁移。
- 设置 `FORUM_INITIAL_ADMIN_PASSWORD` 后，若数据库中没有管理员，会自动创建初始管理员；用户名和邮箱可通过 `FORUM_INITIAL_ADMIN_USERNAME`、`FORUM_INITIAL_ADMIN_EMAIL` 配置。
- SQLite 文件位于应用文件系统，重新部署可能丢失数据；生产环境建议使用 PostgreSQL。

## 数据库

数据库结构由 Alembic 管理：

```bash
cd api
uv run alembic revision --autogenerate -m "message"
uv run alembic upgrade head
```

开发库位于 `api/data/forum.db`，`seed.py` 会写入 admin、分类和示例话题。
