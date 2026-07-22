"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  maintenancePriorityConfig,
  maintenanceStatusConfig,
  getAvailableMaintenanceActions,
  MAINTENANCE_ACTION_LABELS,
  MAINTENANCE_ACTION_VARIANTS,
} from "@/lib/status";
import type { MaintenanceRequest, MaintenanceAction, User } from "@/types";
import { format, parseISO } from "date-fns";
import {
  Wrench,
  Clock,
  CheckCircle2,
  XCircle,
  Play,
  User as UserIcon,
  Calendar,
} from "lucide-react";

interface MaintenanceRequestCardProps {
  request: MaintenanceRequest;
  currentUser: User | null;
  onAction?: (action: MaintenanceAction, request: MaintenanceRequest) => void;
  onViewEquipment?: (equipmentId: number) => void;
  pendingAction?: MaintenanceAction | null;
}

export function MaintenanceRequestCard({
  request,
  currentUser,
  onAction,
  onViewEquipment,
  pendingAction,
}: MaintenanceRequestCardProps) {
  const statusCfg = maintenanceStatusConfig(request.status);
  const priorityCfg = maintenancePriorityConfig(request.priority);
  const actions = getAvailableMaintenanceActions(request, currentUser);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <Wrench className="h-4 w-4 text-muted-foreground" />
              <span>#{request.id}</span>
              <span className="text-muted-foreground">·</span>
              <span>{request.equipmentName}</span>
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {request.equipmentSerial} · {request.equipmentCategory}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <Badge className={statusCfg.chip}>
              <span
                className={`mr-1.5 h-1.5 w-1.5 rounded-full ${statusCfg.dot}`}
              />
              {statusCfg.label}
            </Badge>
            <Badge variant="outline" className={priorityCfg.chip}>
              {priorityCfg.label}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Description */}
        <div>
          <p className="text-xs font-medium text-muted-foreground">
            Description
          </p>
          <p className="mt-0.5 text-sm">{request.description}</p>
        </div>

        {/* People */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              Requested by
            </p>
            <p className="mt-0.5 flex items-center gap-1.5">
              <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
              {request.requestedByUsername}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              Assigned to
            </p>
            <p className="mt-0.5 flex items-center gap-1.5">
              <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
              {request.assignedToUsername}
            </p>
          </div>
        </div>

        {/* Timeline */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="rounded-md bg-muted/40 p-2">
            <p className="font-medium text-muted-foreground">Created</p>
            <p className="mt-0.5 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(parseISO(request.createdAt), "MMM d, yyyy")}
            </p>
          </div>
          {request.startedAt && (
            <div className="rounded-md bg-cyan-500/10 p-2">
              <p className="font-medium text-cyan-700 dark:text-cyan-300">
                Started
              </p>
              <p className="mt-0.5 flex items-center gap-1">
                <Play className="h-3 w-3" />
                {format(parseISO(request.startedAt), "MMM d, HH:mm")}
              </p>
            </div>
          )}
          {request.completedAt && (
            <div className="rounded-md bg-emerald-500/10 p-2">
              <p className="font-medium text-emerald-700 dark:text-emerald-300">
                Completed
              </p>
              <p className="mt-0.5 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                {format(parseISO(request.completedAt), "MMM d, HH:mm")}
              </p>
            </div>
          )}
        </div>

        {/* Completion details */}
        {request.status === "COMPLETED" && request.completionNotes && (
          <div className="rounded-md border border-emerald-500/20 bg-emerald-500/5 p-3">
            <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
              Completion Notes · Result: {request.result}
            </p>
            <p className="mt-1 text-sm">{request.completionNotes}</p>
          </div>
        )}

        {/* Footer: view equipment + actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
          {onViewEquipment && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewEquipment(request.equipmentId)}
            >
              View Equipment
            </Button>
          )}
          {actions.length > 0 && onAction && (
            <div className="flex flex-wrap gap-2">
              {actions.map((action) => (
                <Button
                  key={action}
                  size="sm"
                  variant={MAINTENANCE_ACTION_VARIANTS[action]}
                  disabled={pendingAction !== null && pendingAction !== undefined}
                  onClick={() => onAction(action, request)}
                >
                  {pendingAction === action && (
                    <Clock className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  )}
                  {action === "cancel" && (
                    <XCircle className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  {action === "start" && (
                    <Play className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  {action === "complete" && (
                    <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  {MAINTENANCE_ACTION_LABELS[action]}
                </Button>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
