
import * as React from "react";
import {
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  Boxes,
  Building2,
  UserCircle,
} from "lucide-react";
import { toast } from "sonner";

import { useRouter } from "@/store/router";
import { useAsync } from "@/hooks/use-async";
import { equipmentApi } from "@/lib/api/equipmentApi";

import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ListSkeleton } from "@/components/shared/Skeletons";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import { EQUIPMENT_STATUSES } from "@/types";
import type { Equipment, EquipmentStatus } from "@/types";

// ---------------------------------------------------------------------------
// Status label helper (title-case, mirrors equipmentStatusConfig labels but
// without pulling another dependency in)
// ---------------------------------------------------------------------------

function statusLabel(s: string): string {
  return s
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ---------------------------------------------------------------------------
// Row actions (shared between table row and mobile card)
// ---------------------------------------------------------------------------

function RowActions({
  equipment,
  statusBusy,
  onEdit,
  onStatusChange,
  onDelete,
}: {
  equipment: Equipment;
  statusBusy: boolean;
  onEdit: () => void;
  onStatusChange: (status: EquipmentStatus) => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Button
        variant="ghost"
        size="sm"
        className="size-8 rounded-lg p-0"
        onClick={onEdit}
        aria-label={`Edit ${equipment.equipmentName}`}
        title="Edit"
      >
        <Pencil className="size-4" />
      </Button>

      <Select
        value={equipment.status}
        onValueChange={(v) => onStatusChange(v as EquipmentStatus)}
        disabled={statusBusy}
      >
        <SelectTrigger
          size="sm"
          className="h-8 w-[150px] rounded-lg text-xs"
          aria-label={`Change status for ${equipment.equipmentName}`}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {EQUIPMENT_STATUSES.map((s) => (
            <SelectItem key={s} value={s} className="text-xs">
              {statusLabel(s)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        variant="ghost"
        size="sm"
        className="size-8 rounded-lg p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
        onClick={onDelete}
        aria-label={`Delete ${equipment.equipmentName}`}
        title="Delete"
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Equipment list (table on sm+, stacked cards on mobile)
// ---------------------------------------------------------------------------

function EquipmentList({
  data,
  loading,
  error,
  statusBusyId,
  onEdit,
  onStatusChange,
  onDelete,
  onRetry,
  onAdd,
}: {
  data: Equipment[];
  loading: boolean;
  error: string | null;
  statusBusyId: number | null;
  onEdit: (e: Equipment) => void;
  onStatusChange: (e: Equipment, status: EquipmentStatus) => void;
  onDelete: (e: Equipment) => void;
  onRetry: () => void;
  onAdd: () => void;
}) {
  if (loading) return <ListSkeleton count={4} />;

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/70 bg-muted/30 px-6 py-12 text-center">
        <p className="text-sm font-medium text-foreground">
          Couldn’t load equipment.
        </p>
        <p className="max-w-sm text-sm text-muted-foreground">{error}</p>
        <Button variant="outline" size="sm" onClick={onRetry} className="gap-1.5">
          <RefreshCw className="size-3.5" />
          Retry
        </Button>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <EmptyState
        icon={Boxes}
        title="No equipment yet"
        description="Add your first piece of lab equipment to get started."
        action={
          <Button size="sm" onClick={onAdd} className="gap-1.5">
            <Plus className="size-4" />
            Add equipment
          </Button>
        }
      />
    );
  }

  return (
    <>
      {/* Desktop / tablet table */}
      <div className="hidden overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft sm:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="pl-4">Equipment</TableHead>
              <TableHead>Institution</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Added by</TableHead>
              <TableHead className="pr-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((e) => (
              <TableRow key={e.id} className="hover:bg-muted/40">
                <TableCell className="pl-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
                      <Boxes className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {e.equipmentName}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        S/N {e.serial} · {e.category}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {e.institution || "—"}
                </TableCell>
                <TableCell>
                  <StatusBadge status={e.status} type="equipment" />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {e.addedBy || "—"}
                </TableCell>
                <TableCell className="pr-4">
                  <div className="flex justify-end">
                    <RowActions
                      equipment={e}
                      statusBusy={statusBusyId === e.id}
                      onEdit={() => onEdit(e)}
                      onStatusChange={(s) => onStatusChange(e, s)}
                      onDelete={() => onDelete(e)}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile stacked cards */}
      <div className="flex flex-col gap-3 sm:hidden">
        {data.map((e) => (
          <Card
            key={e.id}
            className="gap-3 rounded-2xl border-border/60 p-4 shadow-soft"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
                  <Boxes className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {e.equipmentName}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    S/N {e.serial} · {e.category}
                  </p>
                  <div className="mt-2">
                    <StatusBadge status={e.status} type="equipment" />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 rounded-xl bg-muted/30 px-3 py-2.5 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="size-3.5 shrink-0" />
                <span className="truncate text-foreground/90">
                  {e.institution || "—"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <UserCircle className="size-3.5 shrink-0" />
                <span className="truncate text-foreground/90">
                  {e.addedBy || "—"}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 rounded-lg"
                onClick={() => onEdit(e)}
              >
                <Pencil className="size-3.5" />
                Edit
              </Button>
              <div className="flex items-center gap-1.5">
                <Select
                  value={e.status}
                  onValueChange={(v) => onStatusChange(e, v as EquipmentStatus)}
                  disabled={statusBusyId === e.id}
                >
                  <SelectTrigger
                    size="sm"
                    className="h-8 w-[140px] rounded-lg text-xs"
                    aria-label={`Change status for ${e.equipmentName}`}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EQUIPMENT_STATUSES.map((s) => (
                      <SelectItem key={s} value={s} className="text-xs">
                        {statusLabel(s)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="sm"
                  className="size-8 rounded-lg p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => onDelete(e)}
                  aria-label={`Delete ${e.equipmentName}`}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function ManageEquipmentPage() {
  const { navigate } = useRouter();

  const allAsync = useAsync(() => equipmentApi.getAllEquipment(), []);
  const mineAsync = useAsync(() => equipmentApi.getMyEquipment(), []);

  const [tab, setTab] = React.useState<"all" | "mine">("all");
  const [statusBusyId, setStatusBusyId] = React.useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Equipment | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const refetchBoth = React.useCallback(() => {
    allAsync.refetch();
    mineAsync.refetch();
  }, [allAsync, mineAsync]);

  const handleStatusChange = async (
    equipment: Equipment,
    status: EquipmentStatus,
  ) => {
    if (status === equipment.status) return;
    setStatusBusyId(equipment.id);
    try {
      await equipmentApi.updateEquipmentStatus(equipment.id, status);
      toast.success("Status updated");
      refetchBoth();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: unknown }).message)
          : "Something went wrong";
      toast.error(msg);
    } finally {
      setStatusBusyId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await equipmentApi.deleteEquipment(deleteTarget.id);
      toast.success("Equipment deleted");
      setDeleteTarget(null);
      refetchBoth();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: unknown }).message)
          : "Something went wrong";
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  const goAdd = () => navigate("/manager/equipment/new");
  const goEdit = (e: Equipment) =>
    navigate(`/manager/equipment/${e.id}/edit`);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Manage Equipment"
        description="Add, edit, and track the status of lab equipment."
        actions={
          <Button onClick={goAdd} className="gap-1.5">
            <Plus className="size-4" />
            Add equipment
          </Button>
        }
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as "all" | "mine")}>
        <TabsList className="h-9">
          <TabsTrigger value="all">All equipment</TabsTrigger>
          <TabsTrigger value="mine">My equipment</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <EquipmentList
            data={allAsync.data ?? []}
            loading={allAsync.loading}
            error={allAsync.error}
            statusBusyId={statusBusyId}
            onEdit={goEdit}
            onStatusChange={handleStatusChange}
            onDelete={(e) => setDeleteTarget(e)}
            onRetry={allAsync.refetch}
            onAdd={goAdd}
          />
        </TabsContent>

        <TabsContent value="mine" className="mt-4">
          <EquipmentList
            data={mineAsync.data ?? []}
            loading={mineAsync.loading}
            error={mineAsync.error}
            statusBusyId={statusBusyId}
            onEdit={goEdit}
            onStatusChange={handleStatusChange}
            onDelete={(e) => setDeleteTarget(e)}
            onRetry={mineAsync.refetch}
            onAdd={goAdd}
          />
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(v) => {
          if (!deleting) setDeleteTarget(v ? deleteTarget : null);
        }}
        title="Delete equipment?"
        description={
          deleteTarget ? (
            <>
              This will permanently remove{" "}
              <span className="font-semibold text-foreground">
                {deleteTarget.equipmentName}
              </span>{" "}
              and its bookings.
            </>
          ) : undefined
        }
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}
