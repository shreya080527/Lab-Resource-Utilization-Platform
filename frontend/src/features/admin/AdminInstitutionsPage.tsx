
import * as React from "react";
import {
  Building2,
  RefreshCw,
  Plus,
  Loader2,
  Hash,
  Network,
  Layers,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

import { cn } from "@/lib/utils";
import { useAsync } from "@/hooks/use-async";
import { institutionApi, departmentApi } from "@/lib/api/equipmentApi";

import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { ListSkeleton } from "@/components/shared/Skeletons";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { Institution, Department } from "@/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function errMsg(e: unknown): string {
  if (e && typeof e === "object" && "message" in e) {
    return String((e as { message?: unknown }).message);
  }
  return "Something went wrong";
}

function fmtDate(iso: string): string {
  try {
    return format(parseISO(iso), "dd MMM yyyy");
  } catch {
    return iso;
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AdminInstitutionsPage() {
  // --- Institutions list ---
  const institutionsAsync = useAsync<Institution[]>(
    () => institutionApi.list(),
    [],
  );

  // --- Departments per institution, fetched in PARALLEL once institutions load ---
  const [departmentsByInst, setDepartmentsByInst] = React.useState<
    Record<number, Department[]>
  >({});
  const [deptLoading, setDeptLoading] = React.useState(false);
  const [deptError, setDeptError] = React.useState<string | null>(null);

  const refreshDepartments = React.useCallback(
    (institutions: Institution[]) => {
      if (institutions.length === 0) {
        setDepartmentsByInst({});
        setDeptLoading(false);
        setDeptError(null);
        return;
      }
      let active = true;
      setDeptLoading(true);
      setDeptError(null);
      Promise.all(
        institutions.map((inst) =>
          departmentApi
            .list(inst.id)
            .then((depts) => [inst.id, depts] as const)
            .catch(() => [inst.id, [] as Department[]] as const),
        ),
      )
        .then((entries) => {
          if (!active) return;
          const map: Record<number, Department[]> = {};
          for (const [id, depts] of entries) map[id] = depts;
          setDepartmentsByInst(map);
          setDeptLoading(false);
        })
        .catch((e) => {
          if (!active) return;
          setDeptError(errMsg(e));
          setDeptLoading(false);
        });
      return () => {
        active = false;
      };
    },
    [],
  );

  React.useEffect(() => {
    if (institutionsAsync.data) {
      const cleanup = refreshDepartments(institutionsAsync.data);
      return cleanup;
    }
    return undefined;
  }, [institutionsAsync.data, refreshDepartments]);

  const refetchAll = () => {
    institutionsAsync.refetch();
  };

  // --- Create Institution form ---
  const [instName, setInstName] = React.useState("");
  const [instCode, setInstCode] = React.useState("");
  const [creatingInst, setCreatingInst] = React.useState(false);

  const handleCreateInstitution = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = instName.trim();
    if (!name) {
      toast.error("Institution name is required.");
      return;
    }
    setCreatingInst(true);
    try {
      const code = instCode.trim();
      await institutionApi.create(code ? { name, code } : { name });
      toast.success("Institution created.");
      setInstName("");
      setInstCode("");
      institutionsAsync.refetch();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setCreatingInst(false);
    }
  };

  // --- Create Department form ---
  const [deptInstId, setDeptInstId] = React.useState<string>("");
  const [deptName, setDeptName] = React.useState("");
  const [creatingDept, setCreatingDept] = React.useState(false);

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    const instId = Number(deptInstId);
    const name = deptName.trim();
    if (!Number.isFinite(instId) || instId <= 0) {
      toast.error("Pick an institution first.");
      return;
    }
    if (!name) {
      toast.error("Department name is required.");
      return;
    }
    setCreatingDept(true);
    try {
      await departmentApi.create({ name, institutionId: instId });
      toast.success("Department created.");
      setDeptName("");
      // Refresh departments for that institution (side-effect; ignore the
      // returned cleanup since this is a one-shot call, not an effect).
      refreshDepartments(institutionsAsync.data ?? []);
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setCreatingDept(false);
    }
  };

  // --- Summary chips ---
  const institutions = institutionsAsync.data ?? [];
  const totalDepartments = React.useMemo(
    () =>
      Object.values(departmentsByInst).reduce(
        (sum, list) => sum + list.length,
        0,
      ),
    [departmentsByInst],
  );

  const institutionsLoading =
    institutionsAsync.loading && !institutionsAsync.data;
  const institutionsError = institutionsAsync.error;
  const showEmpty =
    !institutionsLoading &&
    !institutionsError &&
    institutions.length === 0;

  // Auto-select first institution for the department form when none selected.
  React.useEffect(() => {
    if (!deptInstId && institutions.length > 0) {
      setDeptInstId(String(institutions[0].id));
    }
  }, [institutions, deptInstId]);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Institutions & Departments"
        description="Create and manage the institutions and departments that organize your lab's equipment."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={refetchAll}
            className="gap-1.5"
          >
            <RefreshCw
              className={cn(
                "size-3.5",
                institutionsAsync.loading && "animate-spin",
              )}
            />
            Refresh
          </Button>
        }
      />

      {/* Summary chips */}
      <div className="flex flex-wrap items-center gap-2">
        <Badge
          variant="secondary"
          className="gap-1.5 rounded-full px-3 py-1 text-xs"
        >
          <Building2 className="size-3.5" />
          {institutions.length} institution
          {institutions.length === 1 ? "" : "s"}
        </Badge>
        <Badge
          variant="secondary"
          className="gap-1.5 rounded-full px-3 py-1 text-xs"
        >
          <Network className="size-3.5" />
          {totalDepartments} department{totalDepartments === 1 ? "" : "s"}
        </Badge>
      </div>

      {/* Create forms — two cards side-by-side on lg+ */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Create Institution */}
        <Card className="rounded-2xl border-border/60 p-5 shadow-soft">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/15">
              <Building2 className="size-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Create institution
              </h2>
              <p className="text-xs text-muted-foreground">
                Add a top-level organization.
              </p>
            </div>
          </div>

          <form
            onSubmit={handleCreateInstitution}
            className="mt-4 flex flex-col gap-3"
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="inst-name" className="text-xs font-medium">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="inst-name"
                value={instName}
                onChange={(e) => setInstName(e.target.value)}
                placeholder="e.g. Faculty of Science"
                maxLength={120}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="inst-code"
                className="text-xs font-medium text-muted-foreground"
              >
                Code{" "}
                <span className="text-[11px] font-normal text-muted-foreground">
                  (optional)
                </span>
              </Label>
              <div className="relative">
                <Hash className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="inst-code"
                  value={instCode}
                  onChange={(e) => setInstCode(e.target.value)}
                  placeholder="e.g. FOS"
                  className="pl-8"
                  maxLength={32}
                />
              </div>
            </div>
            <Button
              type="submit"
              size="sm"
              disabled={creatingInst}
              className="mt-1 gap-1.5 self-start rounded-lg"
            >
              {creatingInst ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Plus className="size-3.5" />
              )}
              Create institution
            </Button>
          </form>
        </Card>

        {/* Create Department */}
        <Card className="rounded-2xl border-border/60 p-5 shadow-soft">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/12 text-emerald-700 ring-1 ring-emerald-500/20 dark:text-emerald-300">
              <Network className="size-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Create department
              </h2>
              <p className="text-xs text-muted-foreground">
                Nest a department under an institution.
              </p>
            </div>
          </div>

          <form
            onSubmit={handleCreateDepartment}
            className="mt-4 flex flex-col gap-3"
          >
            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="dept-inst"
                className="text-xs font-medium text-muted-foreground"
              >
                Institution <span className="text-destructive">*</span>
              </Label>
              <Select value={deptInstId} onValueChange={setDeptInstId}>
                <SelectTrigger id="dept-inst" className="w-full">
                  <SelectValue
                    placeholder={
                      institutions.length === 0
                        ? "Create an institution first"
                        : "Select institution"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {institutions.map((inst) => (
                    <SelectItem key={inst.id} value={String(inst.id)}>
                      {inst.name}
                      {inst.code ? ` · ${inst.code}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dept-name" className="text-xs font-medium">
                Department name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="dept-name"
                value={deptName}
                onChange={(e) => setDeptName(e.target.value)}
                placeholder="e.g. Chemistry Lab"
                maxLength={120}
              />
            </div>
            <Button
              type="submit"
              size="sm"
              disabled={
                creatingDept || institutions.length === 0 || !deptInstId
              }
              className="mt-1 gap-1.5 self-start rounded-lg"
            >
              {creatingDept ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Plus className="size-3.5" />
              )}
              Create department
            </Button>
          </form>
        </Card>
      </div>

      {/* Institutions list */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Institutions
          </h2>
          <span className="text-xs text-muted-foreground">
            {institutions.length} total
          </span>
        </div>

        {institutionsLoading ? (
          <ListSkeleton count={3} />
        ) : institutionsError ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/70 bg-muted/30 px-6 py-12 text-center">
            <p className="text-sm font-medium text-foreground">
              Couldn&apos;t load institutions.
            </p>
            <p className="max-w-sm text-sm text-muted-foreground">
              {institutionsError}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={refetchAll}
              className="gap-1.5"
            >
              <RefreshCw className="size-3.5" />
              Retry
            </Button>
          </div>
        ) : showEmpty ? (
          <EmptyState
            icon={Building2}
            title="No institutions yet"
            description="Create your first institution above to get started."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {institutions.map((inst) => {
              const depts = departmentsByInst[inst.id] ?? [];
              return (
                <Card
                  key={inst.id}
                  className="rounded-2xl border-border/60 p-5 shadow-soft"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary ring-1 ring-primary/10">
                        <Building2 className="size-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold text-foreground">
                          {inst.name}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          {inst.code && (
                            <span className="inline-flex items-center gap-1">
                              <Hash className="size-3" />
                              {inst.code}
                            </span>
                          )}
                          <span>Added {fmtDate(inst.createdAt)}</span>
                          <span>· ID #{inst.id}</span>
                        </div>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="gap-1.5 rounded-full px-2.5 py-0.5 text-xs"
                    >
                      <Layers className="size-3" />
                      {depts.length} dept{depts.length === 1 ? "" : "s"}
                    </Badge>
                  </div>

                  {/* Nested departments */}
                  <div className="mt-4 border-t border-border/40 pt-3">
                    {deptLoading && depts.length === 0 ? (
                      <div className="space-y-2">
                        <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
                        <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
                      </div>
                    ) : depts.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        No departments yet.
                      </p>
                    ) : (
                      <ul className="flex flex-col gap-1.5">
                        {depts.map((dept) => (
                          <li
                            key={dept.id}
                            className="flex items-center gap-2 rounded-lg bg-muted/30 px-3 py-1.5"
                          >
                            <Network className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                            <span className="truncate text-sm text-foreground">
                              {dept.name}
                            </span>
                            <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">
                              ID #{dept.id} · {fmtDate(dept.createdAt)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </Card>
              );
            })}

            {deptError && (
              <p className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                <AlertCircle className="size-3.5" />
                Couldn&apos;t refresh some departments: {deptError}
              </p>
            )}
          </div>
        )}
      </section>

      {/* Subtle skeleton shown while department data is loading in background */}
      {deptLoading && institutions.length > 0 && (
        <p className="sr-only" aria-live="polite">
          Loading departments.
        </p>
      )}
    </div>
  );
}
