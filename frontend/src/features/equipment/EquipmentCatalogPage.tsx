
import * as React from "react";
import {
  Boxes,
  Search,
  RotateCw,
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAsync } from "@/hooks/use-async";
import {
  equipmentApi,
  institutionApi,
  departmentApi,
} from "@/lib/api/equipmentApi";
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
import type {
  Equipment,
  EquipmentStatus,
  EquipmentFilter,
  Page,
  Department,
} from "@/types";

const ALL = "__all__";
const PAGE_SIZE = 12;

interface FilterState {
  search: string;
  category: string;
  institutionId: number | null;
  departmentId: number | null;
  status: EquipmentStatus | null;
  tag: string | null;
  page: number;
  size: number;
}

const INITIAL_FILTER: FilterState = {
  search: "",
  category: "",
  institutionId: null,
  departmentId: null,
  status: null,
  tag: null,
  page: 0,
  size: PAGE_SIZE,
};

export default function EquipmentCatalogPage() {
  const { navigate } = useRouter();
  const { user } = useAuthStore();
  const canBook = user ? ROLE_PERMISSIONS[user.role].canBook : false;

  // Draft text inputs (committed on Enter / Search button click).
  const [searchInput, setSearchInput] = React.useState("");
  // The committed filter state — used to build the API filter.
  const [filter, setFilter] = React.useState<FilterState>(INITIAL_FILTER);

  // Supporting data for the filter selects.
  const institutionsAsync = useAsync(() => institutionApi.list(), []);
  const tagsAsync = useAsync(() => equipmentApi.listAllTags(), []);

  // Cascading departments — refetch when institutionId changes.
  const departmentsAsync = useAsync(
    () =>
      filter.institutionId != null
        ? departmentApi.list(filter.institutionId)
        : Promise.resolve([] as Department[]),
    [filter.institutionId],
  );

  // Build the API filter from the committed filter state.
  const apiFilter: EquipmentFilter = React.useMemo(() => {
    const f: EquipmentFilter = {
      page: filter.page,
      size: filter.size,
    };
    if (filter.search.trim()) f.search = filter.search.trim();
    if (filter.category.trim()) f.category = filter.category.trim();
    if (filter.institutionId != null) f.institutionId = filter.institutionId;
    if (filter.departmentId != null) f.departmentId = filter.departmentId;
    if (filter.status) f.status = filter.status;
    if (filter.tag) f.tag = filter.tag;
    return f;
  }, [filter]);

  // Main filtered+paginated fetch.
  const { data, loading, error, refetch } = useAsync(
    () => equipmentApi.filter(apiFilter),
    [apiFilter],
  );

  const page: Page<Equipment> | undefined = data;
  const items = page?.content ?? [];
  const totalElements = page?.totalElements ?? 0;
  const totalPages = page?.totalPages ?? 0;
  const currentPage = page?.currentPage ?? 0;

  // ---- Filter change handlers --------------------------------------------
  // Each non-pagination handler resets to page 0 so the user sees the top
  // of the freshly-filtered result set.
  const commitSearch = () => {
    setFilter((f) => ({ ...f, search: searchInput, page: 0 }));
  };

  const onSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commitSearch();
    }
  };

  const setCategoryInput = (v: string) => {
    setFilter((f) => ({ ...f, category: v, page: 0 }));
  };

  const setInstitution = (v: string) => {
    const id = v === ALL ? null : Number(v);
    setFilter((f) => ({
      ...f,
      institutionId: id,
      departmentId: null, // reset cascading department
      page: 0,
    }));
  };

  const setDepartment = (v: string) => {
    const id = v === ALL ? null : Number(v);
    setFilter((f) => ({ ...f, departmentId: id, page: 0 }));
  };

  const setStatus = (v: string) => {
    setFilter((f) => ({
      ...f,
      status: v === ALL ? null : (v as EquipmentStatus),
      page: 0,
    }));
  };

  const setTag = (v: string) => {
    setFilter((f) => ({
      ...f,
      tag: v === ALL ? null : v,
      page: 0,
    }));
  };

  const goToPage = (p: number) => {
    if (totalPages <= 0) return;
    const clamped = Math.max(0, Math.min(p, totalPages - 1));
    setFilter((f) => ({ ...f, page: clamped }));
  };

  const resetFilters = () => {
    setSearchInput("");
    setFilter(INITIAL_FILTER);
  };

  const hasFilters =
    filter.search.trim() !== "" ||
    filter.category.trim() !== "" ||
    filter.institutionId != null ||
    filter.departmentId != null ||
    filter.status !== null ||
    filter.tag !== null;

  const isEmpty = !loading && !error && items.length === 0;
  const institutionSelected = filter.institutionId != null;
  const departments = departmentsAsync.data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Equipment"
        description="Browse and book shared lab equipment across your institution."
      />

      {/* Filters bar (enhanced with gradients) */}
      <div className="rounded-2xl border border-border/40 bg-gradient-to-br from-card to-violet-50/30 dark:to-violet-950/10 p-4 shadow-md">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {/* Search (committed on Enter / Search button) */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-violet-500" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={onSearchKeyDown}
              placeholder="Search by name, category or serial…"
              className="rounded-xl pl-10 border-violet-200 focus:border-violet-400 focus:ring-violet-200"
              aria-label="Search equipment"
            />
          </div>

          {/* Category (text input, commits on change) */}
          <Input
            value={filter.category}
            onChange={(e) => setCategoryInput(e.target.value)}
            placeholder="Filter by category"
            className="rounded-xl border-violet-200 focus:border-violet-400 focus:ring-violet-200"
            aria-label="Filter by category"
          />

          {/* Institution select */}
          <Select
            value={institutionSelected ? String(filter.institutionId) : ALL}
            onValueChange={setInstitution}
          >
            <SelectTrigger
              className="w-full rounded-xl border-violet-200 focus:ring-violet-200"
              aria-label="Filter by institution"
            >
              <SelectValue placeholder="All institutions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All institutions</SelectItem>
              {(institutionsAsync.data ?? []).map((i) => (
                <SelectItem key={i.id} value={String(i.id)}>
                  {i.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Department select (cascading — disabled until institution chosen) */}
          <Select
            value={filter.departmentId != null ? String(filter.departmentId) : ALL}
            onValueChange={setDepartment}
            disabled={!institutionSelected}
          >
            <SelectTrigger
              className="w-full rounded-xl border-violet-200 focus:ring-violet-200"
              aria-label="Filter by department"
            >
              <SelectValue
                placeholder={
                  institutionSelected
                    ? "All departments"
                    : "Select institution first"
                }
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All departments</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d.id} value={String(d.id)}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status select (includes BOOKED) */}
          <Select
            value={filter.status ?? ALL}
            onValueChange={setStatus}
          >
            <SelectTrigger
              className="w-full rounded-xl border-violet-200 focus:ring-violet-200"
              aria-label="Filter by status"
            >
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All statuses</SelectItem>
              {EQUIPMENT_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {equipmentStatusConfig(s).label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Tag select */}
          <Select
            value={filter.tag ?? ALL}
            onValueChange={setTag}
          >
            <SelectTrigger
              className="w-full rounded-xl border-violet-200 focus:ring-violet-200"
              aria-label="Filter by tag"
            >
              <SelectValue placeholder="All tags" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All tags</SelectItem>
              {(tagsAsync.data ?? []).map((t) => (
                <SelectItem key={t.id} value={t.name}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={commitSearch}
              className="h-8 gap-1.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-md text-white"
            >
              <Search className="size-3" />
              Search
            </Button>
            <p className="text-xs text-muted-foreground font-medium">
              {loading
                ? "Loading…"
                : `${totalElements} item${totalElements === 1 ? "" : "s"}`}
            </p>
          </div>
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="h-8 gap-1.5 rounded-xl text-xs text-muted-foreground hover:bg-violet-50 dark:hover:bg-violet-950/30"
            >
              <Filter className="size-3" />
              Clear filters
            </Button>
          )}
        </div>
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
          <Button
            onClick={refetch}
            variant="outline"
            size="sm"
            className="gap-1.5 rounded-lg"
          >
            <RotateCw className="size-3.5" />
            Retry
          </Button>
        </div>
      ) : isEmpty ? (
        <EmptyState
          icon={hasFilters ? Search : Boxes}
          title={hasFilters ? "No matches" : "No equipment yet"}
          description={
            hasFilters
              ? "Try adjusting your search or filters to find what you’re looking for."
              : "Check back later or ask your lab manager to add equipment."
          }
          action={
            hasFilters ? (
              <Button
                variant="outline"
                size="sm"
                onClick={resetFilters}
                className="rounded-lg"
              >
                Clear filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((e) => (
              <EquipmentCard
                key={e.id}
                equipment={e}
                canBook={canBook}
                onView={(eq) => navigate(`/equipment/${eq.id}`)}
                onBook={(eq) =>
                  navigate(`/bookings/new?equipmentId=${eq.id}`)
                }
              />
            ))}
          </div>

          {/* Pagination — prev / next + "Page X of Y" from Page response */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage <= 0}
                className="gap-1.5 rounded-lg"
              >
                <ChevronLeft className="size-4" />
                Prev
              </Button>
              <p className="text-sm text-muted-foreground">
                Page {currentPage + 1} of {totalPages}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= totalPages - 1}
                className="gap-1.5 rounded-lg"
              >
                Next
                <ChevronRight className="size-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
