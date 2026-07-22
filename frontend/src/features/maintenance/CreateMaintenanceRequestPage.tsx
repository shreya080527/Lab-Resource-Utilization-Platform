"use client";

import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, Wrench, ChevronLeft, ArrowRight } from "lucide-react";

import { maintenanceApi } from "@/lib/api/maintenanceApi";
import { equipmentApi } from "@/lib/api/equipmentApi";
import { userApi } from "@/lib/api/userApi";
import { useAsync } from "@/hooks/use-async";
import {
  MAINTENANCE_PRIORITIES,
  type MaintenancePriority,
} from "@/types";
import type { Equipment, User } from "@/types";

import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function CreateMaintenanceRequestPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedEquipmentId = searchParams.get("equipmentId");

  // ─── Form state ───
  const [form, setForm] = useState({
    equipmentId: preselectedEquipmentId ? Number(preselectedEquipmentId) : "",
    assignedToId: "",
    description: "",
    priority: "MEDIUM" as MaintenancePriority,
  });
  const [submitting, setSubmitting] = useState(false);

  // ─── Fetch equipment list (for the manager to pick from) ───
  const { data: equipmentList, loading: equipmentLoading } = useAsync<
    Equipment[]
  >(() => equipmentApi.getAllEquipment(), []);

  // ─── Fetch technicians ───
  const { data: technicians, loading: techniciansLoading } = useAsync<User[]>(
    () => userApi.listByRole("LAB_TECHNICIAN"),
    [],
  );

  // ─── Selected equipment detail ───
  const selectedEquipment = equipmentList?.find(
    (e) => e.id === Number(form.equipmentId),
  );

  function validate(): string | null {
    if (!form.equipmentId) return "Please select an equipment";
    if (!form.assignedToId) return "Please select a technician";
    if (form.description.trim().length < 10)
      return "Description must be at least 10 characters";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }

    setSubmitting(true);
    try {
      const created = await maintenanceApi.create({
        equipmentId: Number(form.equipmentId),
        assignedToId: Number(form.assignedToId),
        description: form.description.trim(),
        priority: form.priority,
      });
      toast.success(
        `Maintenance request #${created.id} created and assigned to ${created.assignedToUsername}`,
      );
      navigate("/manager/maintenance");
    } catch (err) {
      const apiErr = err as { message?: string };
      toast.error(apiErr?.message ?? "Failed to create maintenance request");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
      <Link
        to="/manager/maintenance"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to maintenance requests
      </Link>

      <PageHeader
        title="Create Maintenance Request"
        description="Raise a maintenance request for a piece of equipment and assign it to a lab technician."
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ─── Equipment selection ─── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Wrench className="h-5 w-5" />
              Equipment
            </CardTitle>
            <CardDescription>
              Select the equipment that needs maintenance.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="equipment">Equipment *</Label>
              <Select
                value={form.equipmentId ? form.equipmentId.toString() : ""}
                onValueChange={(v) =>
                  setForm({ ...form, equipmentId: Number(v) })
                }
                disabled={submitting || equipmentLoading}
              >
                <SelectTrigger id="equipment">
                  <SelectValue
                    placeholder={
                      equipmentLoading ? "Loading…" : "Select equipment"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {equipmentList
                    ?.filter((e) => e.status !== "RETIRED")
                    .map((eq) => (
                      <SelectItem key={eq.id} value={eq.id.toString()}>
                        {eq.equipmentName} ({eq.serial})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {selectedEquipment && (
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Name
                    </p>
                    <p className="mt-0.5 font-medium">
                      {selectedEquipment.equipmentName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Serial
                    </p>
                    <p className="mt-0.5 font-mono text-xs">
                      {selectedEquipment.serial}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Category
                    </p>
                    <p className="mt-0.5">{selectedEquipment.category}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Institution
                    </p>
                    <p className="mt-0.5">
                      {selectedEquipment.institution?.name ?? "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Department
                    </p>
                    <p className="mt-0.5">
                      {selectedEquipment.department?.name ?? "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Current Status
                    </p>
                    <div className="mt-0.5">
                      <StatusBadge
                        status={selectedEquipment.status}
                        type="equipment"
                      />
                    </div>
                  </div>
                </div>
                {selectedEquipment.status === "UNDER_MAINTENANCE" && (
                  <p className="mt-3 text-xs text-amber-600 dark:text-amber-400">
                    ⚠️ This equipment is already under maintenance.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ─── Technician selection ─── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Assign Technician</CardTitle>
            <CardDescription>
              Select the lab technician who will perform the maintenance.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="technician">Technician *</Label>
              <Select
                value={form.assignedToId || ""}
                onValueChange={(v) => setForm({ ...form, assignedToId: v })}
                disabled={submitting || techniciansLoading}
              >
                <SelectTrigger id="technician">
                  <SelectValue
                    placeholder={
                      techniciansLoading
                        ? "Loading…"
                        : technicians?.length === 0
                          ? "No technicians available"
                          : "Select a technician"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {technicians?.map((tech) => (
                    <SelectItem key={tech.id} value={tech.id.toString()}>
                      {tech.username} — {tech.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {technicians &&
                technicians.length === 0 &&
                !techniciansLoading && (
                  <p className="text-xs text-muted-foreground">
                    No LAB_TECHNICIAN users exist yet. Register one first.
                  </p>
                )}
            </div>
          </CardContent>
        </Card>

        {/* ─── Description + priority ─── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Details</CardTitle>
            <CardDescription>
              Describe the issue and set a priority.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority *</Label>
              <Select
                value={form.priority}
                onValueChange={(v) =>
                  setForm({ ...form, priority: v as MaintenancePriority })
                }
                disabled={submitting}
              >
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MAINTENANCE_PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe the maintenance issue or work needed (min 10 characters)…"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                disabled={submitting}
                rows={5}
              />
              <p className="text-xs text-muted-foreground">
                {form.description.length}/2000 characters
              </p>
            </div>
          </CardContent>
        </Card>

        {/* ─── Submit ─── */}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/manager/maintenance")}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating…
              </>
            ) : (
              <>
                Create Request
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
