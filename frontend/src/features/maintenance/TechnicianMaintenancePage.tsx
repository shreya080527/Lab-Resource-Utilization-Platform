"use client";

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Wrench,
  Loader2,
  Play,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";

import { maintenanceApi } from "@/lib/api/maintenanceApi";
import { useAsync } from "@/hooks/use-async";
import { useAuthStore } from "@/store/authStore";
import type {
  MaintenanceRequest,
  MaintenanceResult,
  MaintenanceAction,
  User,
} from "@/types";

import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { MaintenanceRequestCard } from "@/components/shared/MaintenanceRequestCard";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const RESULTS: MaintenanceResult[] = ["PASS", "FAIL", "N/A"];

export default function TechnicianMaintenancePage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user) as User | null;

  // ─── Fetch requests assigned to this technician ───
  const {
    data: requests,
    loading,
    refetch,
  } = useAsync<MaintenanceRequest[]>(() => maintenanceApi.findMyAssigned(), []);

  // ─── Active count for the badge ───
  const { data: activeCount } = useAsync<number>(
    () => maintenanceApi.countMyActiveAssigned(),
    [],
  );

  // ─── Pending action (spinner) ───
  const [pendingAction, setPendingAction] = useState<{
    id: number;
    action: MaintenanceAction;
  } | null>(null);

  // ─── Complete dialog ───
  const [completeTarget, setCompleteTarget] =
    useState<MaintenanceRequest | null>(null);
  const [completeForm, setCompleteForm] = useState({
    result: "PASS" as MaintenanceResult,
    completionNotes: "",
  });
  const [completeSubmitting, setCompleteSubmitting] = useState(false);

  // ─── Tab: active vs. history ───
  const [tab, setTab] = useState<"active" | "history">("active");

  const { active, history } = useMemo(() => {
    if (!requests) return { active: [], history: [] };
    return {
      active: requests.filter(
        (r) => r.status === "REQUESTED" || r.status === "IN_PROGRESS",
      ),
      history: requests.filter(
        (r) => r.status === "COMPLETED" || r.status === "CANCELLED",
      ),
    };
  }, [requests]);

  async function handleAction(
    action: MaintenanceAction,
    request: MaintenanceRequest,
  ) {
    if (action === "start") {
      setPendingAction({ id: request.id, action });
      try {
        await maintenanceApi.start(request.id);
        toast.success(
          `Maintenance #${request.id} started — equipment is now UNDER_MAINTENANCE`,
        );
        await refetch();
      } catch (err) {
        const apiErr = err as { message?: string };
        toast.error(apiErr?.message ?? "Failed to start maintenance");
      } finally {
        setPendingAction(null);
      }
    } else if (action === "complete") {
      setCompleteTarget(request);
      setCompleteForm({ result: "PASS", completionNotes: "" });
    }
  }

  async function handleComplete() {
    if (!completeTarget) return;
    if (completeForm.completionNotes.trim().length < 10) {
      toast.error("Completion notes must be at least 10 characters");
      return;
    }
    setCompleteSubmitting(true);
    setPendingAction({ id: completeTarget.id, action: "complete" });
    try {
      await maintenanceApi.complete(completeTarget.id, {
        completionNotes: completeForm.completionNotes.trim(),
        result: completeForm.result,
      });
      toast.success(
        `Maintenance #${completeTarget.id} completed — equipment restored to AVAILABLE`,
      );
      setCompleteTarget(null);
      await refetch();
    } catch (err) {
      const apiErr = err as { message?: string };
      toast.error(apiErr?.message ?? "Failed to complete maintenance");
    } finally {
      setCompleteSubmitting(false);
      setPendingAction(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
      <PageHeader
        title="My Maintenance Tasks"
        description="Maintenance requests assigned to you. Start the work to put the equipment under maintenance, then complete it when finished."
      />

      {/* ─── Stats ─── */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Requested</CardTitle>
            <AlertCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {active.filter((r) => r.status === "REQUESTED").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Play className="h-4 w-4 text-cyan-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {active.filter((r) => r.status === "IN_PROGRESS").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Tabs: active vs. history ─── */}
      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as "active" | "history")}
      >
        <TabsList>
          <TabsTrigger value="active">Active ({active.length})</TabsTrigger>
          <TabsTrigger value="history">History ({history.length})</TabsTrigger>
        </TabsList>

        {/* ─── Active tab ─── */}
        <TabsContent value="active" className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : active.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="No active tasks"
              description="You have no pending or in-progress maintenance requests. Nice work!"
            />
          ) : (
            <div className="space-y-3">
              {active.map((r) => (
                <MaintenanceRequestCard
                  key={r.id}
                  request={r}
                  currentUser={user}
                  onAction={handleAction}
                  onViewEquipment={(id) => navigate(`/equipment/${id}`)}
                  pendingAction={
                    pendingAction?.id === r.id ? pendingAction.action : null
                  }
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ─── History tab ─── */}
        <TabsContent value="history" className="space-y-3">
          {history.length === 0 ? (
            <EmptyState
              icon={Wrench}
              title="No history"
              description="Completed or cancelled maintenance requests will appear here."
            />
          ) : (
            <div className="space-y-3">
              {history.map((r) => (
                <MaintenanceRequestCard
                  key={r.id}
                  request={r}
                  currentUser={user}
                  onViewEquipment={(id) => navigate(`/equipment/${id}`)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ─── Complete dialog ─── */}
      <Dialog
        open={!!completeTarget}
        onOpenChange={(open) => !open && setCompleteTarget(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              Complete Maintenance #{completeTarget?.id}
            </DialogTitle>
            <DialogDescription>
              Fill in the result and notes about the work performed. The
              equipment will be restored to AVAILABLE.
            </DialogDescription>
          </DialogHeader>

          {completeTarget && (
            <div className="space-y-4 py-2">
              {/* Equipment summary */}
              <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                <p className="font-medium">{completeTarget.equipmentName}</p>
                <p className="text-xs text-muted-foreground">
                  {completeTarget.equipmentSerial} ·{" "}
                  {completeTarget.equipmentCategory}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Started{" "}
                  {completeTarget.startedAt
                    ? formatDistanceToNow(parseISO(completeTarget.startedAt), {
                        addSuffix: true,
                      })
                    : "—"}
                </p>
              </div>

              {/* Result */}
              <div className="space-y-2">
                <Label htmlFor="result">Result *</Label>
                <Select
                  value={completeForm.result}
                  onValueChange={(v) =>
                    setCompleteForm({
                      ...completeForm,
                      result: v as MaintenanceResult,
                    })
                  }
                  disabled={completeSubmitting}
                >
                  <SelectTrigger id="result">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RESULTS.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r === "PASS"
                          ? "PASS — equipment is working"
                          : r === "FAIL"
                            ? "FAIL — equipment still has issues"
                            : "N/A — not applicable"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Completion notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Completion Notes *</Label>
                <Textarea
                  id="notes"
                  placeholder="Describe what was done, parts replaced, issues found, etc. (min 10 characters)…"
                  value={completeForm.completionNotes}
                  onChange={(e) =>
                    setCompleteForm({
                      ...completeForm,
                      completionNotes: e.target.value,
                    })
                  }
                  disabled={completeSubmitting}
                  rows={5}
                />
                <p className="text-xs text-muted-foreground">
                  {completeForm.completionNotes.length}/2000 characters
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCompleteTarget(null)}
              disabled={completeSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleComplete}
              disabled={
                completeSubmitting ||
                completeForm.completionNotes.trim().length < 10
              }
            >
              {completeSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Completing…
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Complete Maintenance
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
