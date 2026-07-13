
import * as React from "react";
import { ShieldCheck, RefreshCw, ArrowLeft, KeyRound } from "lucide-react";
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

export default function VerifyOtpPage() {
  const { query, navigate } = useRouter();
  const initialEmail = React.useMemo(
    () => (query.email ? String(query.email) : ""),
    [query.email],
  );

  const [email, setEmail] = React.useState(initialEmail);
  const [emailDraft, setEmailDraft] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [resending, setResending] = React.useState(false);

  const hasEmail = email.trim().length > 0;

  function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = emailDraft.trim();
    if (!trimmed) {
      toast.error("Please enter your email");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error("Enter a valid email address");
      return;
    }
    setEmail(trimmed);
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    if (otp.length !== 6) {
      toast.error("Please enter the 6-digit code");
      return;
    }
    setLoading(true);
    try {
      await authApi.verify(email.trim(), otp);
      toast.success("Email verified. Please log in.");
      setOtp("");
      navigate("/login", { replace: true });
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (resending) return;
    setResending(true);
    try {
      await authApi.resendOtp(email.trim());
      toast.success("OTP resent");
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error?.message || "Failed to resend OTP");
    } finally {
      setResending(false);
    }
  }

  // ── Step 1: collect email if not prefilled ──────────────────────────────
  if (!hasEmail) {
    return (
      <AuthLayout
        title="Verify your email"
        subtitle="Enter the email address you used to register."
        footer={
          <p className="text-center">
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="font-medium text-primary hover:underline transition-all"
            >
              Back to login
            </button>
          </p>
        }
      >
        <form onSubmit={handleEmailSubmit} className="space-y-5" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@university.edu"
              value={emailDraft}
              onChange={(e) => setEmailDraft(e.target.value)}
              className="h-11 rounded-xl"
              autoFocus
              required
            />
          </div>
          <Button
            type="submit"
            size="lg"
            className="w-full h-11 rounded-xl text-base font-medium transition-all duration-200"
          >
            <KeyRound className="size-4" />
            Continue
          </Button>
        </form>
      </AuthLayout>
    );
  }

  // ── Step 2: enter OTP ───────────────────────────────────────────────────
  return (
    <AuthLayout
      title="Enter verification code"
      subtitle={
        <>
          We sent a 6-digit code to{" "}
          <span className="font-medium text-foreground">{email}</span>.
        </>
      }
      footer={
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="inline-flex items-center gap-1 font-medium text-primary hover:underline transition-all"
          >
            <ArrowLeft className="size-3.5" />
            Back to login
          </button>
          <button
            type="button"
            onClick={() => {
              setEmail("");
              setOtp("");
            }}
            className="font-medium text-primary hover:underline transition-all"
          >
            Use a different email
          </button>
        </div>
      }
    >
      <form onSubmit={handleVerify} className="space-y-6" noValidate>
        {/* OTP input */}
        <div className="space-y-2">
          <Label htmlFor="otp" className="justify-center text-center">
            Verification code
          </Label>
          <div className="flex justify-center pt-1">
            <InputOTP
              id="otp"
              maxLength={6}
              value={otp}
              onChange={(v) => setOtp(v)}
              autoFocus
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
        </div>

        {/* Submit */}
        <Button
          type="submit"
          size="lg"
          disabled={loading || otp.length !== 6}
          className="w-full h-11 rounded-xl text-base font-medium transition-all duration-200"
        >
          {loading ? (
            <>
              <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Verifying…
            </>
          ) : (
            <>
              <ShieldCheck className="size-4" />
              Verify email
            </>
          )}
        </Button>

        {/* Resend */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2">
            Didn&apos;t receive a code?
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResend}
            disabled={resending}
            className="rounded-xl transition-all duration-200"
          >
            {resending ? (
              <>
                <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Resending…
              </>
            ) : (
              <>
                <RefreshCw className="size-3.5" />
                Resend OTP
              </>
            )}
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
}
