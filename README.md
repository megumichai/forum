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

## 数据库

数据库结构由 Alembic 管理：

```bash
cd api
uv run alembic revision --autogenerate -m "message"
uv run alembic upgrade head
```

开发库位于 `api/data/forum.db`，`seed.py` 会写入 admin、分类和示例话题。
