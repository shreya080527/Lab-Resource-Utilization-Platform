
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
import { institutionApi, departmentApi } from "@/lib/api/equipmentApi";
import { useAsync } from "@/hooks/use-async";
import { useRouter } from "@/store/router";
import { ROLES } from "@/types";
import type { Institution, Department, Role } from "@/types";
import { ROLE_PERMISSIONS } from "@/config/rolePermissions";
import { AuthLayout } from "./AuthLayout";

interface FormState {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: Role | "";
  institutionId: number | null;
  departmentId: number | null;
}

const INITIAL: FormState = {
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
  role: "",
  institutionId: null,
  departmentId: null,
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
  if (values.institutionId == null)
    errors.institutionId = "Institution is required";
  if (values.departmentId == null)
    errors.departmentId = "Department is required";
  return errors;
}

export default function RegisterPage() {
  const { navigate } = useRouter();
  const [values, setValues] = React.useState<FormState>(INITIAL);
  const [errors, setErrors] = React.useState<FieldErrors>({});
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  // Institutions are fetched once on mount.
  const institutions = useAsync<Institution[]>(
    () => institutionApi.list(),
    [],
  );
  const institutionList = institutions.data ?? [];
  const institutionsEmpty =
    !institutions.loading && !institutions.error && institutionList.length === 0;

  // Departments cascade on the chosen institution.
  const departments = useAsync<Department[]>(
    () =>
      values.institutionId != null
        ? departmentApi.list(values.institutionId)
        : Promise.resolve([] as Department[]),
    [values.institutionId],
  );
  const departmentList = departments.data ?? [];

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setValues((v) => {
      // Changing institution invalidates the previously chosen department.
      if (key === "institutionId") {
        return { ...v, institutionId: value as number | null, departmentId: null };
      }
      return { ...v, [key]: value };
    });
    setErrors((e) => {
      const next = { ...e };
      delete next[key];
      if (key === "institutionId") delete next.departmentId;
      return next;
    });
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
        departmentId: values.departmentId,
        institutionId: values.institutionId,
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

  const submitDisabled = loading || institutionsEmpty;

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
          {/* Institution (Select) */}
          <Field
            id="institution"
            label="Institution"
            error={errors.institutionId ?? institutions.error ?? undefined}
            required
          >
            <Select
              value={values.institutionId != null ? String(values.institutionId) : undefined}
              onValueChange={(v) => setField("institutionId", Number(v))}
              disabled={loading || institutions.loading}
            >
              <SelectTrigger
                id="institution"
                className="h-11 w-full rounded-xl"
                aria-invalid={!!errors.institutionId}
              >
                <SelectValue
                  placeholder={
                    institutions.loading
                      ? "Loading…"
                      : institutions.error
                        ? "Failed to load"
                        : "Select institution"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {institutionList.map((inst) => (
                  <SelectItem key={inst.id} value={String(inst.id)}>
                    {inst.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {/* Department (Select, cascading) */}
          <Field
            id="department"
            label="Department"
            error={errors.departmentId ?? (departments.error && values.institutionId != null ? departments.error : undefined)}
            required
          >
            <Select
              value={values.departmentId != null ? String(values.departmentId) : undefined}
              onValueChange={(v) => setField("departmentId", Number(v))}
              disabled={
                loading ||
                values.institutionId == null ||
                departments.loading
              }
            >
              <SelectTrigger
                id="department"
                className="h-11 w-full rounded-xl"
                aria-invalid={!!errors.departmentId}
              >
                <SelectValue
                  placeholder={
                    values.institutionId == null
                      ? "Select institution first"
                      : departments.loading
                        ? "Loading…"
                        : departments.error
                          ? "Failed to load"
                          : "Select department"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {departmentList.map((dept) => (
                  <SelectItem key={dept.id} value={String(dept.id)}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        {institutionsEmpty && (
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
            No institutions available yet. Please contact an administrator.
          </p>
        )}

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
          disabled={submitDisabled}
          className="w-full h-11 rounded-xl text-base font-semibold transition-all duration-200 mt-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-md hover:shadow-lg hover:shadow-violet-500/25"
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
