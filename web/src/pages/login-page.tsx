import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setPending(true);

    try {
      await login({ identifier, password });
      navigate("/");
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "登录失败",
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-sm py-6">
      <div className="rounded-md border bg-card p-6">
        <h1 className="text-xl font-semibold tracking-tight">登录</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          使用用户名或邮箱登录
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label htmlFor="identifier" className="text-sm font-medium">
              用户名或邮箱
            </label>
            <Input
              id="identifier"
              name="identifier"
              autoComplete="username"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium">
              密码
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "登录中..." : "登录"}
          </Button>
        </form>

        <p className="mt-4 text-sm text-muted-foreground">
          还没有账号？
          <Link
            to="/register"
            className="font-medium text-foreground hover:underline"
          >
            注册
          </Link>
        </p>
      </div>
    </div>
  );
}
