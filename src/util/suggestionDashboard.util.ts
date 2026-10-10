import { formatTimestamp } from "@buildtheearth/bot-utils"
import { discordEpoch } from "./discordEpoch.js"

export const DASHBOARD_STATUSES: Record<string, string> = {
    "all": "All statuses",
    "open": "Unanswered",
    "in-progress": "In Progress",
    "approved": "Approved",
    "denied": "Rejected",
    "information": "More information needed",
    "forwarded": "Forwarded",
    "duplicate": "Duplicate",
    "invalid": "Invalid"
}

export interface DashboardFilters {
    query: string
    status: string
    source: "all" | "main" | "staff"
    from: string
    to: string
}

export function discordDateRange({
    from,
    to
}: Pick<DashboardFilters, "from" | "to">): string {
    if (!from && !to) return "All dates"
    const start = from ? formatTimestamp(new Date(from)) : "the beginning"
    const end = to ? new Date(to) : null
    end?.setUTCHours(23, 59, 59, 0)
    return start + " — " + (end ? formatTimestamp(end) : "no end date")
}

export function validateFilters(filters: DashboardFilters): void {
    if (
        filters.query.length > 200 ||
        !Object.hasOwn(DASHBOARD_STATUSES, filters.status) ||
        !["all", "main", "staff"].includes(filters.source)
    )
        throw new Error("Invalid search filter.")
    for (const date of [filters.from, filters.to]) {
        if (!date) continue
        const parsed = new Date(date)
        if (
            !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
            date < "2000-01-01" ||
            date > "2100-12-31" ||
            Number.isNaN(parsed.getTime()) ||
            discordEpoch(parsed).slice(0, 10) !== date
        )
            throw new Error("Enter a valid date as YYYY-MM-DD (2000–2100).")
    }
    if (filters.from && filters.to && filters.from > filters.to)
        throw new Error("The start date must be on or before the end date.")
}
