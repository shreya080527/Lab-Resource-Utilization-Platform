
import * as React from "react";
import { Mail, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/lib/api/authApi";
import { useRouter } from "@/store/router";
import { AuthLayout } from "./AuthLayout";

export default function ForgotPasswordPage() {
  const { navigate } = useRouter();
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    const trimmed = email.trim();
    if (!trimmed) {
      toast.error("Please enter your email");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error("Enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPasswordRequest(trimmed);
      toast.success("Reset code sent to your email");
      navigate(`/reset-password?email=${encodeURIComponent(trimmed)}`);
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error?.message || "Unable to send reset code");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your email and we'll send you a verification code to set a new password."
      footer={
        <p className="text-center">
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="inline-flex items-center gap-1 font-medium text-primary hover:underline transition-all"
          >
            <ArrowLeft className="size-3.5" />
            Back to login
          </button>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 rounded-xl pl-9"
              disabled={loading}
              autoFocus
              required
            />
          </div>
        </div>

        <Button
          type="submit"
          size="lg"
          disabled={loading}
          className="w-full h-11 rounded-xl text-base font-medium transition-all duration-200"
        >
          {loading ? (
            <>
              <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Sending code…
            </>
          ) : (
            "Send reset code"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
