
import * as React from "react";
import { Eye, EyeOff, ArrowLeft, KeyRound } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { authApi } from "@/lib/api/authApi";
import { useRouter } from "@/store/router";
import { AuthLayout } from "./AuthLayout";

interface FormErrors {
  email?: string;
  otp?: string;
  password?: string;
  confirmPassword?: string;
}

export default function ResetPasswordPage() {
  const { query, navigate } = useRouter();
  const initialEmail = React.useMemo(
    () => (query.email ? String(query.email) : ""),
    [query.email],
  );

  const [email, setEmail] = React.useState(initialEmail);
  const [otp, setOtp] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [errors, setErrors] = React.useState<FormErrors>({});
  const [loading, setLoading] = React.useState(false);

  function clearField(key: keyof FormErrors) {
    if (errors[key]) {
      setErrors((e) => {
        const next = { ...e };
        delete next[key];
        return next;
      });
    }
  }

  function validate(): FormErrors {
    const e: FormErrors = {};
    const trimmedEmail = email.trim();
    if (!trimmedEmail) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail))
      e.email = "Enter a valid email address";
    if (otp.length !== 6) e.otp = "Enter the 6-digit code";
    if (!password) e.password = "Password is required";
    else if (password.length < 8)
      e.password = "Password must be at least 8 characters";
    if (!confirmPassword) e.confirmPassword = "Please confirm your password";
    else if (confirmPassword !== password)
      e.confirmPassword = "Passwords do not match";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    const validation = validate();
    setErrors(validation);
    if (Object.keys(validation).length > 0) {
      toast.error("Please fix the highlighted fields");
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword(email.trim(), password, otp);
      toast.success("Password changed. Please log in.");
      navigate("/login", { replace: true });
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error?.message || "Unable to reset password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Set a new password"
      subtitle="Enter the code we sent to your email along with your new password."
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
        {/* Email (editable, prefilled) */}
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@university.edu"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              clearField("email");
            }}
            className="h-11 rounded-xl"
            disabled={loading}
            aria-invalid={!!errors.email}
            required
          />
          {errors.email ? (
            <p className="text-xs text-destructive leading-tight">
              {errors.email}
            </p>
          ) : null}
        </div>

        {/* OTP */}
        <div className="space-y-1.5">
          <Label htmlFor="otp" className="justify-center text-center">
            Verification code
          </Label>
          <div className="flex justify-center pt-1">
            <InputOTP
              id="otp"
              maxLength={6}
              value={otp}
              onChange={(v) => {
                setOtp(v);
                clearField("otp");
              }}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} className="size-11 text-base" />
                <InputOTPSlot index={1} className="size-11 text-base" />
                <InputOTPSlot index={2} className="size-11 text-base" />
                <InputOTPSlot index={3} className="size-11 text-base" />
                <InputOTPSlot index={4} className="size-11 text-base" />
                <InputOTPSlot index={5} className="size-11 text-base" />
              </InputOTPGroup>
            </InputOTP>
          </div>
          {errors.otp ? (
            <p className="text-xs text-destructive text-center leading-tight">
              {errors.otp}
            </p>
          ) : null}
        </div>

        {/* New password */}
        <div className="space-y-1.5">
          <Label htmlFor="password">New password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearField("password");
              }}
              className="h-11 rounded-xl pr-10"
              disabled={loading}
              aria-invalid={!!errors.password}
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
          {errors.password ? (
            <p className="text-xs text-destructive leading-tight">
              {errors.password}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              At least 8 characters
            </p>
          )}
        </div>

        {/* Confirm password */}
        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirm new password</Label>
          <Input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              clearField("confirmPassword");
            }}
            className="h-11 rounded-xl"
            disabled={loading}
            aria-invalid={!!errors.confirmPassword}
            required
          />
          {errors.confirmPassword ? (
            <p className="text-xs text-destructive leading-tight">
              {errors.confirmPassword}
            </p>
          ) : null}
        </div>

        {/* Submit */}
        <Button
          type="submit"
          size="lg"
          disabled={loading}
          className="w-full h-11 rounded-xl text-base font-medium transition-all duration-200 mt-1"
        >
          {loading ? (
            <>
              <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Resetting password…
            </>
          ) : (
            "Reset password"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
