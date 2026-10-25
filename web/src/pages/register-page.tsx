import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setPending(true);

    try {
      await register({
        username,
        email,
        password,
        display_name: displayName || undefined,
      });
      navigate("/");
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "注册失败",
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-sm py-6">
      <div className="rounded-md border bg-card p-6">
        <h1 className="text-xl font-semibold tracking-tight">注册</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          创建一个新的论坛账号
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label htmlFor="username" className="text-sm font-medium">
              用户名
            </label>
            <Input
              id="username"
              name="username"
              autoComplete="username"
              minLength={3}
              maxLength={32}
              pattern="[a-zA-Z0-9_]+"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              3-32 位字母、数字或下划线
            </p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium">
              邮箱
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="display-name" className="text-sm font-medium">
              显示名称（可选）
            </label>
            <Input
              id="display-name"
              name="display_name"
              maxLength={64}
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
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
              autoComplete="new-password"
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">至少 8 个字符</p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "注册中..." : "注册"}
          </Button>
        </form>

        <p className="mt-4 text-sm text-muted-foreground">
          已有账号？
          <Link
            to="/login"
            className="font-medium text-foreground hover:underline"
          >
            登录
          </Link>
        </p>
      </div>
    </div>
  );
}
