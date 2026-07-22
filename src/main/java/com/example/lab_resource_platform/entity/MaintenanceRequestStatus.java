package com.example.lab_resource_platform.entity;

/**
 * Lifecycle of a maintenance request:
 *
 *   REQUESTED  ──(technician starts)──►  IN_PROGRESS  ──(technician completes)──►  COMPLETED
 *      │                                       │
 *      │                                       └──(manager cancels)──►  CANCELLED
 *      └──(manager cancels)──►  CANCELLED
 *
 * Equipment status side-effects:
 *   - REQUESTED    → equipment stays in its current status (still bookable / usable)
 *   - IN_PROGRESS  → equipment is forced to UNDER_MAINTENANCE (auto-toggled by the service)
 *   - COMPLETED    → equipment reverts to AVAILABLE (unless it was OUT_OF_SERVICE / RETIRED)
 *   - CANCELLED    → equipment reverts to its prior status (stored on the request)
 */
public enum MaintenanceRequestStatus {
    REQUESTED,
    IN_PROGRESS,
    COMPLETED,
    CANCELLED
}
