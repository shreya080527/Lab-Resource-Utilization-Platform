
import * as React from "react";
import {
  ArrowLeft,
  Loader2,
  Save,
  Hash,
  Boxes,
  Tag,
  Building2,
  FileText,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { useRouter, matchRoute } from "@/store/router";
import { useAsync } from "@/hooks/use-async";
import { equipmentApi } from "@/lib/api/equipmentApi";

import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { CardSkeleton } from "@/components/shared/Skeletons";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import type { EquipmentInput } from "@/types";

// ---------------------------------------------------------------------------
// Form state + validation
// ---------------------------------------------------------------------------

interface FormState {
  serial: string;
  equipmentName: string;
  category: string;
  description: string;
  institution: string;
}

const EMPTY_FORM: FormState = {
  serial: "",
  equipmentName: "",
  category: "",
  description: "",
  institution: "",
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

function validate(form: FormState): FieldErrors {
  const errs: FieldErrors = {};
  if (!form.serial.trim()) errs.serial = "Serial is required.";
  if (!form.equipmentName.trim())
    errs.equipmentName = "Equipment name is required.";
  if (!form.category.trim()) errs.category = "Category is required.";
  if (!form.institution.trim()) errs.institution = "Institution is required.";
  return errs;
}

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

  // Fetch the full list (no GET-by-id endpoint) and find by id when editing.
  const allAsync = useAsync(
    () => (isEdit ? equipmentApi.getAllEquipment() : Promise.resolve([])),
    [isEdit, editId],
  );

  const editing: FormState | undefined = React.useMemo(() => {
    if (!isEdit || !allAsync.data) return undefined;
    const found = allAsync.data.find((e) => e.id === editId);
    if (!found) return undefined;
    return {
      serial: found.serial,
      equipmentName: found.equipmentName,
      category: found.category,
      description: found.description,
      institution: found.institution,
    };
  }, [isEdit, allAsync.data, editId]);

  const [form, setForm] = React.useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = React.useState<FieldErrors>({});
  const [submitted, setSubmitted] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [prefilled, setPrefilled] = React.useState(false);

  // Prefill the form once edit data arrives.
  React.useEffect(() => {
    if (isEdit && editing && !prefilled) {
      setForm(editing);
      setPrefilled(true);
    }
  }, [isEdit, editing, prefilled]);

  // ---------------------------------------------------------------------
  // Loading / not-found guards for edit mode
  // ---------------------------------------------------------------------
  if (isEdit && allAsync.loading && !allAsync.data) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Edit equipment"
          description="Update the details of this lab equipment."
          actions={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/manager/equipment")}
              className="gap-1.5"
            >
              <ArrowLeft className="size-4" />
              Back
            </Button>
          }
        />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (isEdit && !allAsync.loading && allAsync.data && !editing) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Edit equipment"
          description="Update the details of this lab equipment."
          actions={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/manager/equipment")}
              className="gap-1.5"
            >
              <ArrowLeft className="size-4" />
              Back
            </Button>
          }
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

  if (isEdit && allAsync.error) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Edit equipment"
          description="Update the details of this lab equipment."
          actions={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/manager/equipment")}
              className="gap-1.5"
            >
              <ArrowLeft className="size-4" />
              Back
            </Button>
          }
        />
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/70 bg-muted/30 px-6 py-12 text-center">
          <p className="text-sm font-medium text-foreground">
            Couldn’t load equipment.
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">
            {allAsync.error}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={allAsync.refetch}
            className="gap-1.5"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Data loaded and equipment found, but the prefill effect hasn't run yet.
  // Keep the skeleton on screen so the user never sees a flash of empty form.
  if (isEdit && allAsync.data && editing && !prefilled) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Edit equipment"
          description="Update the details of this lab equipment."
          actions={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/manager/equipment")}
              className="gap-1.5"
            >
              <ArrowLeft className="size-4" />
              Back
            </Button>
          }
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
  const update = (key: keyof FormState, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (submitted) {
      // Re-validate on the fly after the first submit attempt.
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
      institution: form.institution.trim(),
    };

    setSaving(true);
    try {
      if (isEdit) {
        await equipmentApi.updateEquipment(editId, payload);
        toast.success("Equipment updated");
      } else {
        await equipmentApi.addEquipment(payload);
        toast.success("Equipment added");
      }
      navigate("/manager/equipment", { replace: true });
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
              error={submitted ? errors.institution : undefined}
            >
              <Input
                id="institution"
                value={form.institution}
                onChange={(e) => update("institution", e.target.value)}
                placeholder="e.g. MIT Labs"
                className={inputClass}
                aria-invalid={!!(submitted && errors.institution)}
                autoComplete="off"
              />
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
