
import * as React from "react";
import { UserPlus, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { authApi } from "@/lib/api/authApi";
import { useRouter } from "@/store/router";
import { ROLES } from "@/types";
import type { Role } from "@/types";
import { ROLE_PERMISSIONS } from "@/config/rolePermissions";
import { AuthLayout } from "./AuthLayout";

interface FormState {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: Role | "";
  department: string;
  institution: string;
}

const INITIAL: FormState = {
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
  role: "",
  department: "",
  institution: "",
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

function validate(values: FormState): FieldErrors {
  const errors: FieldErrors = {};
  if (!values.username.trim()) errors.username = "Username is required";
  if (!values.email.trim()) {
    errors.email = "Email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = "Enter a valid email address";
  }
  if (!values.password) {
    errors.password = "Password is required";
  } else if (values.password.length < 8) {
    errors.password = "Password must be at least 8 characters";
  }
  if (!values.confirmPassword) {
    errors.confirmPassword = "Please confirm your password";
  } else if (values.confirmPassword !== values.password) {
    errors.confirmPassword = "Passwords do not match";
  }
  if (!values.role) errors.role = "Please select a role";
  if (!values.department.trim()) errors.department = "Department is required";
  if (!values.institution.trim())
    errors.institution = "Institution is required";
  return errors;
}

export default function RegisterPage() {
  const { navigate } = useRouter();
  const [values, setValues] = React.useState<FormState>(INITIAL);
  const [errors, setErrors] = React.useState<FieldErrors>({});
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    // clear field error on edit
    if (errors[key]) {
      setErrors((e) => {
        const next = { ...e };
        delete next[key];
        return next;
      });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    const validation = validate(values);
    setErrors(validation);
    if (Object.keys(validation).length > 0) {
      toast.error("Please fix the highlighted fields");
      return;
    }

    setLoading(true);
    try {
      await authApi.register({
        username: values.username.trim(),
        email: values.email.trim(),
        password: values.password,
        role: values.role as Role,
        department: values.department.trim(),
        institution: values.institution.trim(),
      });
      toast.success("Account created. Verify your email.");
      navigate(`/verify-otp?email=${encodeURIComponent(values.email.trim())}`);
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error?.message || "Unable to create account");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join LabFlow to book equipment and manage your research schedule."
      footer={
        <p className="text-center">
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="font-medium text-primary hover:underline transition-all"
          >
            Log in
          </button>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Username */}
        <Field
          id="username"
          label="Username"
          error={errors.username}
          required
        >
          <Input
            id="username"
            type="text"
            autoComplete="username"
            placeholder="jdoe"
            value={values.username}
            onChange={(e) => setField("username", e.target.value)}
            className="h-11 rounded-xl"
            disabled={loading}
            aria-invalid={!!errors.username}
          />
        </Field>

        {/* Email */}
        <Field id="email" label="Email" error={errors.email} required>
          <Input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@university.edu"
            value={values.email}
            onChange={(e) => setField("email", e.target.value)}
            className="h-11 rounded-xl"
            disabled={loading}
            aria-invalid={!!errors.email}
          />
        </Field>

        {/* Role */}
        <Field id="role" label="Role" error={errors.role} required>
          <Select
            value={values.role || undefined}
            onValueChange={(v) => setField("role", v as Role)}
            disabled={loading}
          >
            <SelectTrigger
              id="role"
              className="h-11 w-full rounded-xl"
              aria-invalid={!!errors.role}
            >
              <SelectValue placeholder="Select your role" />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map((r) => (
                <SelectItem key={r} value={r}>
                  {ROLE_PERMISSIONS[r].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Department */}
          <Field
            id="department"
            label="Department"
            error={errors.department}
            required
          >
            <Input
              id="department"
              type="text"
              placeholder="Biology"
              value={values.department}
              onChange={(e) => setField("department", e.target.value)}
              className="h-11 rounded-xl"
              disabled={loading}
              aria-invalid={!!errors.department}
            />
          </Field>

          {/* Institution */}
          <Field
            id="institution"
            label="Institution"
            error={errors.institution}
            required
          >
            <Input
              id="institution"
              type="text"
              placeholder="State University"
              value={values.institution}
              onChange={(e) => setField("institution", e.target.value)}
              className="h-11 rounded-xl"
              disabled={loading}
              aria-invalid={!!errors.institution}
            />
          </Field>
        </div>

        {/* Password */}
        <Field
          id="password"
          label="Password"
          error={errors.password}
          hint="At least 8 characters"
          required
        >
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="••••••••"
              value={values.password}
              onChange={(e) => setField("password", e.target.value)}
              className="h-11 rounded-xl pr-10"
              disabled={loading}
              aria-invalid={!!errors.password}
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
        </Field>

        {/* Confirm password */}
        <Field
          id="confirmPassword"
          label="Confirm password"
          error={errors.confirmPassword}
          required
        >
          <Input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="••••••••"
            value={values.confirmPassword}
            onChange={(e) => setField("confirmPassword", e.target.value)}
            className="h-11 rounded-xl"
            disabled={loading}
            aria-invalid={!!errors.confirmPassword}
          />
        </Field>

        {/* Submit */}
        <Button
          type="submit"
          size="lg"
          disabled={loading}
          className="w-full h-11 rounded-xl text-base font-medium transition-all duration-200 mt-2"
        >
          {loading ? (
            <>
              <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Creating account…
            </>
          ) : (
            <>
              <UserPlus className="size-4" />
              Create account
            </>
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}

function Field({
  id,
  label,
  error,
  hint,
  required,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={id}>
          {label}
          {required ? <span className="text-destructive">*</span> : null}
        </Label>
        {hint && !error ? (
          <span className="text-xs text-muted-foreground">{hint}</span>
        ) : null}
      </div>
      {children}
      {error ? (
        <p className="text-xs text-destructive leading-tight">{error}</p>
      ) : null}
    </div>
  );
}
