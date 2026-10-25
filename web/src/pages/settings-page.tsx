import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export function SettingsPage() {
  const { user, updateProfile } = useAuth();

  const [displayName, setDisplayName] = useState(user?.display_name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url ?? "");
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profilePending, setProfilePending] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordPending, setPasswordPending] = useState(false);

  if (!user) return null;

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfileError(null);
    setProfileSaved(false);

    if (!displayName.trim()) {
      setProfileError("显示名称不能为空");
      return;
    }

    setProfilePending(true);
    try {
      await updateProfile({
        display_name: displayName.trim(),
        email: email.trim(),
        bio: bio.trim() || null,
        avatar_url: avatarUrl.trim() || null,
      });
      setProfileSaved(true);
    } catch (submitError) {
      setProfileError(
        submitError instanceof Error ? submitError.message : "保存失败",
      );
    } finally {
      setProfilePending(false);
    }
  };

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordError(null);
    setPasswordSaved(false);

    if (newPassword !== confirmPassword) {
      setPasswordError("两次输入的新密码不一致");
      return;
    }

    setPasswordPending(true);
    try {
      await api.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordSaved(true);
    } catch (submitError) {
      setPasswordError(
        submitError instanceof Error ? submitError.message : "修改失败",
      );
    } finally {
      setPasswordPending(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      <Breadcrumbs
        items={[
          { label: "首页", to: "/" },
          { label: "个人中心", to: "/me" },
          { label: "编辑资料" },
        ]}
      />

      <h1 className="text-xl font-semibold tracking-tight">账号设置</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        管理你的公开资料和登录信息
      </p>

      <Card className="mt-4 gap-5 py-6">
        <CardHeader>
          <CardTitle>个人资料</CardTitle>
          <CardDescription>这些信息会显示在你的主页和帖子中</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleProfileSubmit}>
            <div className="flex items-center gap-4">
              <UserAvatar
                user={{
                  display_name: displayName || user.display_name,
                  username: user.username,
                  avatar_url: avatarUrl || null,
                }}
                className="size-14"
                fallbackClassName="text-lg"
              />
              <div className="min-w-0">
                <p className="text-sm font-medium">头像预览</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  留空则使用显示名称的首字母
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="display-name" className="text-sm font-medium">
                显示名称
              </label>
              <Input
                id="display-name"
                value={displayName}
                maxLength={64}
                onChange={(event) => setDisplayName(event.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="avatar-url" className="text-sm font-medium">
                头像地址（可选）
              </label>
              <Input
                id="avatar-url"
                type="url"
                value={avatarUrl}
                maxLength={500}
                placeholder="https://example.com/avatar.png"
                onChange={(event) => setAvatarUrl(event.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium">
                邮箱
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="bio" className="text-sm font-medium">
                个人简介
              </label>
              <Textarea
                id="bio"
                value={bio}
                maxLength={2000}
                className="min-h-28"
                placeholder="介绍一下你自己..."
                onChange={(event) => setBio(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {bio.length} / 2000
              </p>
            </div>

            {profileError && (
              <p className="text-sm text-destructive">{profileError}</p>
            )}
            {profileSaved && (
              <p className="text-sm text-muted-foreground">资料已保存</p>
            )}

            <div className="flex items-center justify-between gap-3">
              <Button asChild variant="ghost" size="sm">
                <Link to="/me">返回个人中心</Link>
              </Button>
              <Button
                type="submit"
                disabled={profilePending || !displayName.trim() || !email.trim()}
              >
                {profilePending ? "保存中..." : "保存资料"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-4 gap-5 py-6">
        <CardHeader>
          <CardTitle>修改密码</CardTitle>
          <CardDescription>修改后下次登录请使用新密码</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handlePasswordSubmit}>
            <div className="space-y-1.5">
              <label htmlFor="current-password" className="text-sm font-medium">
                当前密码
              </label>
              <Input
                id="current-password"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="new-password" className="text-sm font-medium">
                新密码
              </label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">至少 8 个字符</p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="confirm-password" className="text-sm font-medium">
                确认新密码
              </label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
              />
            </div>

            {passwordError && (
              <p className="text-sm text-destructive">{passwordError}</p>
            )}
            {passwordSaved && (
              <p className="text-sm text-muted-foreground">密码已修改</p>
            )}

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={
                  passwordPending ||
                  !currentPassword ||
                  !newPassword ||
                  !confirmPassword
                }
              >
                {passwordPending ? "提交中..." : "修改密码"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
