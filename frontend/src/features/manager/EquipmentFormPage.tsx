
import * as React from "react";
import {
  ArrowLeft,
  Loader2,
  Save,
  Hash,
  Boxes,
  Tag,
  Building2,
  Network,
  FileText,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { useRouter, matchRoute } from "@/store/router";
import { useAsync } from "@/hooks/use-async";
import {
  equipmentApi,
  institutionApi,
  departmentApi,
} from "@/lib/api/equipmentApi";

import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { CardSkeleton } from "@/components/shared/Skeletons";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { EquipmentInput, Department } from "@/types";

// ---------------------------------------------------------------------------
// Form state + validation
// ---------------------------------------------------------------------------

interface FormState {
  serial: string;
  equipmentName: string;
  category: string;
  description: string;
  institutionId: number | null;
  departmentId: number | null;
}

const EMPTY_FORM: FormState = {
  serial: "",
  equipmentName: "",
  category: "",
  description: "",
  institutionId: null,
  departmentId: null,
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

function validate(form: FormState): FieldErrors {
  const errs: FieldErrors = {};
  if (!form.serial.trim()) errs.serial = "Serial is required.";
  if (!form.equipmentName.trim())
    errs.equipmentName = "Equipment name is required.";
  if (!form.category.trim()) errs.category = "Category is required.";
  if (form.institutionId == null)
    errs.institutionId = "Institution is required.";
  return errs;
}

// Sentinel value for the "No department" Select item (department is optional).
const NO_DEPT = "__none__";

// ---------------------------------------------------------------------------
// Field component (icon-prefixed label + input + inline error)
// ---------------------------------------------------------------------------

function Field({
  id,
  label,
  icon: Icon,
  error,
  required,
  children,
}: {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label
        htmlFor={id}
        className="flex items-center gap-1.5 text-sm font-medium text-foreground"
      >
        <Icon className="size-3.5 text-muted-foreground" />
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {error && (
        <p className="flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="size-3" />
          {error}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function EquipmentFormPage() {
  const { path, navigate } = useRouter();

  // Determine mode from the router path.
  const editMatch = matchRoute("/manager/equipment/:id/edit", path);
  const isNew = path === "/manager/equipment/new";
  const editId = editMatch ? Number(editMatch.id) : NaN;
  const isEdit = !!editMatch && Number.isFinite(editId) && editId > 0;

  const [form, setForm] = React.useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = React.useState<FieldErrors>({});
  const [submitted, setSubmitted] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [prefilled, setPrefilled] = React.useState(false);

  // Edit mode — fetch the existing equipment by id (not list+find).
  const editAsync = useAsync(
    () =>
      isEdit
        ? equipmentApi.getEquipment(editId)
        : Promise.resolve(null),
    [isEdit, editId],
  );
  const editing = isEdit ? editAsync.data : undefined;

  // Institutions list — for the required Institution select.
  const institutionsAsync = useAsync(() => institutionApi.list(), []);

  // Cascading departments — refetch when institutionId changes.
  const departmentsAsync = useAsync(
    () =>
      form.institutionId != null
        ? departmentApi.list(form.institutionId)
        : Promise.resolve([] as Department[]),
    [form.institutionId],
  );

  // Prefill the form once edit data arrives — pull institutionId/departmentId
  // out of the nested objects on the Equipment entity.
  React.useEffect(() => {
    if (isEdit && editing && !prefilled) {
      setForm({
        serial: editing.serial,
        equipmentName: editing.equipmentName,
        category: editing.category,
        description: editing.description,
        institutionId: editing.institution?.id ?? null,
        departmentId: editing.department?.id ?? null,
      });
      setPrefilled(true);
    }
  }, [isEdit, editing, prefilled]);

  // ---------------------------------------------------------------------
  // Loading / error / not-found guards for edit mode
  // ---------------------------------------------------------------------
  const backAction = (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => navigate("/manager/equipment")}
      className="gap-1.5"
    >
      <ArrowLeft className="size-4" />
      Back
    </Button>
  );

  if (isEdit && editAsync.loading && !editAsync.data) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Edit equipment"
          description="Update the details of this lab equipment."
          actions={backAction}
        />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (isEdit && editAsync.error) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Edit equipment"
          description="Update the details of this lab equipment."
          actions={backAction}
        />
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/70 bg-muted/30 px-6 py-12 text-center">
          <p className="text-sm font-medium text-foreground">
            Couldn’t load equipment.
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">
            {editAsync.error}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={editAsync.refetch}
            className="gap-1.5"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (isEdit && !editAsync.loading && !editAsync.data) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Edit equipment"
          description="Update the details of this lab equipment."
          actions={backAction}
        />
        <EmptyState
          icon={Boxes}
          title="Equipment not found"
          description="The equipment you’re trying to edit no longer exists."
          action={
            <Button
              size="sm"
              onClick={() => navigate("/manager/equipment")}
              className="gap-1.5"
            >
              <ArrowLeft className="size-4" />
              Back to equipment
            </Button>
          }
        />
      </div>
    );
  }

  // Data loaded but prefill effect hasn't run yet — keep the skeleton on
  // screen so the user never sees a flash of empty form.
  if (isEdit && editAsync.data && !prefilled) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Edit equipment"
          description="Update the details of this lab equipment."
          actions={backAction}
        />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  // If neither mode matches, treat as not-found.
  if (!isNew && !isEdit) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Equipment" />
        <EmptyState
          icon={Boxes}
          title="Page not found"
          description="The equipment form you’re looking for doesn’t exist."
          action={
            <Button
              size="sm"
              onClick={() => navigate("/manager/equipment")}
              className="gap-1.5"
            >
              <ArrowLeft className="size-4" />
              Back to equipment
            </Button>
          }
        />
      </div>
    );
  }

  // ---------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------
  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => {
      // Changing the institution invalidates the cascading department.
      if (key === "institutionId") {
        return {
          ...f,
          institutionId: value as number | null,
          departmentId: null,
        };
      }
      return { ...f, [key]: value };
    });
    if (submitted) {
      setErrors(validate({ ...form, [key]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const payload: EquipmentInput = {
      serial: form.serial.trim(),
      equipmentName: form.equipmentName.trim(),
      category: form.category.trim(),
      description: form.description.trim(),
      institutionId: form.institutionId,
      departmentId: form.departmentId,
    };

    setSaving(true);
    try {
      if (isEdit) {
        await equipmentApi.updateEquipment(editId, payload);
        toast.success("Equipment updated");
        navigate("/manager/equipment", { replace: true });
      } else {
        const created = await equipmentApi.addEquipment(payload);
        toast.success("Equipment added");
        if (created?.id) {
          navigate(`/equipment/${created.id}`, { replace: true });
        } else {
          navigate("/manager/equipment", { replace: true });
        }
      }
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: unknown }).message)
          : "Something went wrong";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => navigate("/manager/equipment");

  const inputClass =
    "h-11 w-full rounded-xl border-border/60 bg-background text-sm shadow-xs transition-[box-shadow,border-color] focus-visible:ring-2 focus-visible:ring-ring/50";

  const institutionSelected = form.institutionId != null;
  const departments = departmentsAsync.data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={isEdit ? "Edit equipment" : "Add equipment"}
        description={
          isEdit
            ? "Update the details of this lab equipment."
            : "Register a new piece of lab equipment."
        }
        actions={
          <Button
            variant="ghost"
            size="sm"
            onClick={cancel}
            className="gap-1.5"
          >
            <ArrowLeft className="size-4" />
            Back
          </Button>
        }
      />

      <form onSubmit={handleSubmit} noValidate className="w-full">
        <Card className="mx-auto w-full max-w-2xl gap-5 rounded-2xl border-border/60 p-5 shadow-soft sm:p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              id="serial"
              label="Serial number"
              icon={Hash}
              required
              error={submitted ? errors.serial : undefined}
            >
              <Input
                id="serial"
                value={form.serial}
                onChange={(e) => update("serial", e.target.value)}
                placeholder="e.g. MIC-2024-001"
                className={cn(inputClass, "font-mono")}
                aria-invalid={!!(submitted && errors.serial)}
                autoComplete="off"
              />
            </Field>

            <Field
              id="equipmentName"
              label="Equipment name"
              icon={Boxes}
              required
              error={submitted ? errors.equipmentName : undefined}
            >
              <Input
                id="equipmentName"
                value={form.equipmentName}
                onChange={(e) => update("equipmentName", e.target.value)}
                placeholder="e.g. Confocal Microscope"
                className={inputClass}
                aria-invalid={!!(submitted && errors.equipmentName)}
                autoComplete="off"
              />
            </Field>

            <Field
              id="category"
              label="Category"
              icon={Tag}
              required
              error={submitted ? errors.category : undefined}
            >
              <Input
                id="category"
                value={form.category}
                onChange={(e) => update("category", e.target.value)}
                placeholder="e.g. Microbiology"
                className={inputClass}
                aria-invalid={!!(submitted && errors.category)}
                autoComplete="off"
              />
            </Field>

            <Field
              id="institution"
              label="Institution"
              icon={Building2}
              required
              error={submitted ? errors.institutionId : undefined}
            >
              <Select
                value={
                  institutionSelected ? String(form.institutionId) : undefined
                }
                onValueChange={(v) => update("institutionId", Number(v))}
              >
                <SelectTrigger
                  className="h-11 w-full rounded-xl"
                  aria-label="Select institution"
                >
                  <SelectValue placeholder="Select institution" />
                </SelectTrigger>
                <SelectContent>
                  {(institutionsAsync.data ?? []).map((i) => (
                    <SelectItem key={i.id} value={String(i.id)}>
                      {i.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field
              id="department"
              label="Department"
              icon={Network}
              error={undefined}
            >
              <Select
                value={
                  form.departmentId != null
                    ? String(form.departmentId)
                    : NO_DEPT
                }
                onValueChange={(v) =>
                  update("departmentId", v === NO_DEPT ? null : Number(v))
                }
                disabled={!institutionSelected}
              >
                <SelectTrigger
                  className="h-11 w-full rounded-xl"
                  aria-label="Select department"
                >
                  <SelectValue
                    placeholder={
                      institutionSelected
                        ? "No department"
                        : "Select institution first"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_DEPT}>No department</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={String(d.id)}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field
            id="description"
            label="Description"
            icon={FileText}
            error={undefined}
          >
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Optional notes about the equipment, specs, usage guidelines…"
              className="min-h-[110px] w-full rounded-xl border-border/60 bg-background text-sm shadow-xs focus-visible:ring-2 focus-visible:ring-ring/50"
            />
          </Field>

          <div className="flex flex-col-reverse gap-2 border-t border-border/60 pt-5 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={cancel}
              disabled={saving}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="gap-1.5 rounded-xl"
            >
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </Card>

        <p className="mx-auto mt-3 max-w-2xl text-center text-xs text-muted-foreground">
          {isEdit
            ? "Status, acquisition date, and added-by are managed by the system."
            : "Status defaults to Available. Acquisition date and added-by are set automatically."}
        </p>
      </form>
    </div>
  );
}
