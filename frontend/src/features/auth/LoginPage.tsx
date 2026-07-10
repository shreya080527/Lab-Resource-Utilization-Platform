
import * as React from "react";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "@/store/router";
import { ROLE_PERMISSIONS } from "@/config/rolePermissions";
import { AuthLayout } from "./AuthLayout";

const DEMO_RESEARCHER = { email: "researcher@demo.com", password: "password" };
const DEMO_MANAGER = { email: "manager@demo.com", password: "password" };

export default function LoginPage() {
  const login = useAuthStore((s) => s.login);
  const { navigate } = useRouter();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      toast.error("Please enter your email and password");
      return;
    }

    setLoading(true);
    try {
      const user = await login(trimmedEmail, password);
      toast.success(`Welcome back, ${user.username}`);
      navigate(ROLE_PERMISSIONS[user.role].landing);
    } catch (err: unknown) {
      const error = err as { message?: string; email?: string };
      if (error?.message === "EMAIL_NOT_VERIFIED") {
        toast.error("Please verify your email first");
        navigate(
          `/verify-otp?email=${encodeURIComponent(trimmedEmail)}`,
        );
      } else {
        toast.error(error?.message || "Unable to sign in");
      }
    } finally {
      setLoading(false);
    }
  }

  function fillDemo(credentials: { email: string; password: string }) {
    setEmail(credentials.email);
    setPassword(credentials.password);
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to manage your lab bookings and equipment."
      footer={
        <p className="text-center">
          Don&apos;t have an account?{" "}
          <button
            type="button"
            onClick={() => navigate("/register")}
            className="font-medium text-primary hover:underline transition-all"
          >
            Register
          </button>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {/* Quick-fill demo chips */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Try a demo:</span>
          <button
            type="button"
            onClick={() => fillDemo(DEMO_RESEARCHER)}
            className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
          >
            Researcher
          </button>
          <button
            type="button"
            onClick={() => fillDemo(DEMO_MANAGER)}
            className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
          >
            Lab Manager
          </button>
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@university.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11 rounded-xl"
            disabled={loading}
            required
          />
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <button
              type="button"
              onClick={() => navigate("/forgot-password")}
              className="text-xs font-medium text-primary hover:underline transition-all"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 rounded-xl pr-10"
              disabled={loading}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 flex size-6 items-center justify-center rounded-md text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          size="lg"
          disabled={loading}
          className="w-full h-11 rounded-xl text-base font-medium transition-all duration-200"
        >
          {loading ? (
            <>
              <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Signing in…
            </>
          ) : (
            <>
              <LogIn className="size-4" />
              Sign in
            </>
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
