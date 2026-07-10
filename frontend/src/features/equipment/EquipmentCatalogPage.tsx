
import * as React from "react";
import { Boxes, Search, RotateCw, Filter } from "lucide-react";
import { useAsync } from "@/hooks/use-async";
import { equipmentApi } from "@/lib/api/equipmentApi";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "@/store/router";
import { ROLE_PERMISSIONS } from "@/config/rolePermissions";
import { EQUIPMENT_STATUSES } from "@/types";
import { equipmentStatusConfig } from "@/lib/status";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { EquipmentCard } from "@/components/shared/EquipmentCard";
import { GridSkeleton } from "@/components/shared/Skeletons";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { EquipmentStatus } from "@/types";

const ALL = "__all__";

export default function EquipmentCatalogPage() {
  const { navigate } = useRouter();
  const { user } = useAuthStore();
  const canBook = user ? ROLE_PERMISSIONS[user.role].canBook : false;

  const { data, loading, error, refetch } = useAsync(
    () => equipmentApi.getAllEquipment(),
    [],
  );

  // ---- Filters -------------------------------------------------------------
  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState<string>(ALL);
  const [institution, setInstitution] = React.useState<string>(ALL);
  const [status, setStatus] = React.useState<string>(ALL);

  const categories = React.useMemo(() => {
    const set = new Set<string>();
    (data ?? []).forEach((e) => set.add(e.category));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [data]);

  const institutions = React.useMemo(() => {
    const set = new Set<string>();
    (data ?? []).forEach((e) => set.add(e.institution));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [data]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data ?? []).filter((e) => {
      if (q && !`${e.equipmentName} ${e.serial}`.toLowerCase().includes(q))
        return false;
      if (category !== ALL && e.category !== category) return false;
      if (institution !== ALL && e.institution !== institution) return false;
      if (status !== ALL && e.status !== status) return false;
      return true;
    });
  }, [data, query, category, institution, status]);

  const hasFilters =
    query.trim() !== "" ||
    category !== ALL ||
    institution !== ALL ||
    status !== ALL;

  const resetFilters = () => {
    setQuery("");
    setCategory(ALL);
    setInstitution(ALL);
    setStatus(ALL);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Equipment"
        description="Browse and book shared lab equipment across your institution."
      />

      {/* Filters bar (frosted) */}
      <div className="glass rounded-2xl border border-border/60 p-3 shadow-soft sm:p-4">
        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 lg:grid-cols-4">
          {/* Search */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or serial…"
              className="rounded-lg pl-9"
              aria-label="Search equipment"
            />
          </div>

          {/* Category */}
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full rounded-lg" aria-label="Filter by category">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Institution */}
          <Select value={institution} onValueChange={setInstitution}>
            <SelectTrigger className="w-full rounded-lg" aria-label="Filter by institution">
              <SelectValue placeholder="All institutions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All institutions</SelectItem>
              {institutions.map((i) => (
                <SelectItem key={i} value={i}>
                  {i}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status */}
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full rounded-lg" aria-label="Filter by status">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All statuses</SelectItem>
              {EQUIPMENT_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {equipmentStatusConfig(s as EquipmentStatus).label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {(hasFilters || (data && data.length > 0)) && (
          <div className="mt-2.5 flex items-center justify-between gap-2 px-0.5">
            <p className="text-xs text-muted-foreground">
              {loading
                ? "Loading…"
                : `${filtered.length} of ${data?.length ?? 0} item${(data?.length ?? 0) === 1 ? "" : "s"}`}
            </p>
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="h-7 gap-1.5 rounded-lg text-xs text-muted-foreground"
              >
                <Filter className="size-3" />
                Clear filters
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Body */}
      {loading ? (
        <GridSkeleton count={6} />
      ) : error ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/70 bg-muted/30 px-6 py-14 text-center">
          <p className="text-sm text-muted-foreground">
            We couldn’t load the equipment catalog.
          </p>
          {error && (
            <p className="text-xs text-muted-foreground/80">{error}</p>
          )}
          <Button onClick={refetch} variant="outline" size="sm" className="gap-1.5 rounded-lg">
            <RotateCw className="size-3.5" />
            Retry
          </Button>
        </div>
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={Boxes}
          title="No equipment yet"
          description="Check back later or ask your lab manager to add equipment."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No matches"
          description="Try adjusting your search or filters to find what you’re looking for."
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="rounded-lg"
            >
              Clear filters
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((e) => (
            <EquipmentCard
              key={e.id}
              equipment={e}
              canBook={canBook}
              onView={(eq) => navigate(`/equipment/${eq.id}`)}
              onBook={(eq) => navigate(`/bookings/new?equipmentId=${eq.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
