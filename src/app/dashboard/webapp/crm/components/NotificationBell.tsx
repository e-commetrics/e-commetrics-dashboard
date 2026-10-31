"use client";

import { useMemo, useState } from "react";
import { Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiListAppointments, apiListLeads, apiListTasks } from "../lib/api";
import { useResource } from "../lib/hooks";
import { DAY_MS, clinicToday, formatAge, formatDue, isDueWithin, isOverdue } from "../lib/format";

const SEEN_KEY = "crm.bell.seenAt";
const MAX_ITEMS = 5;

function readSeenAt(): number {
  try {
    const stored = Number(window.localStorage.getItem(SEEN_KEY));
    if (stored) return stored;
    // La primera vez solo cuenta lo que entre desde ahora, no todo el historial.
    const now = Date.now();
    window.localStorage.setItem(SEEN_KEY, String(now));
    return now;
  } catch {
    return Date.now();
  }
}

/**
 * Lo que requiere atencion: tareas vencidas o de las proximas 24 h, leads nuevos
 * desde la ultima vez que se abrio la campana y citas futuras sin pasar al CRM.
 * "Desde la ultima vez" vive en el navegador: otro equipo tiene su propia cuenta.
 */
export function NotificationBell({
  onOpenLead,
  onOpenBookings,
}: {
  onOpenLead: (id: string) => void;
  onOpenBookings: () => void;
}) {
  const tasks = useResource("bell:tasks", apiListTasks);
  const leads = useResource("bell:leads", () => apiListLeads());
  const appointments = useResource("bell:appointments", apiListAppointments);
  const [seenAt, setSeenAt] = useState(readSeenAt);

  const reload = () => {
    tasks.reload();
    leads.reload();
    appointments.reload();
  };

  const leadNames = useMemo(() => new Map((leads.data ?? []).map((lead) => [lead.id, lead.name])), [leads.data]);

  const openTasks = (tasks.data ?? []).filter((task) => !task.done && isDueWithin(task.dueAt, DAY_MS));
  const overdue = openTasks.filter((task) => isOverdue(task.dueAt));
  const dueSoon = openTasks.filter((task) => !isOverdue(task.dueAt));
  const newLeads = (leads.data ?? []).filter((lead) => new Date(lead.createdAt).getTime() > seenAt);
  const today = clinicToday();
  const bookings = (appointments.data ?? []).filter((item) => !item.leadId && item.date >= today);
  const total = overdue.length + dueSoon.length + newLeads.length + bookings.length;

  const taskItem = (task: (typeof openTasks)[number], late: boolean) => (
    <DropdownMenuItem key={task.id} onSelect={() => onOpenLead(task.leadId)} className="crm-bell-item">
      <span>{task.description}</span>
      <span className={late ? "crm-task-meta is-overdue" : "crm-task-meta"}>
        {leadNames.get(task.leadId) ? `${leadNames.get(task.leadId)} · ` : ""}
        {formatDue(task.dueAt)}
      </span>
    </DropdownMenuItem>
  );

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (open) {
          reload();
          return;
        }
        // Al cerrar se dan por vistos los leads nuevos. Las tareas y citas siguen hasta resolverse.
        const now = Date.now();
        setSeenAt(now);
        try {
          window.localStorage.setItem(SEEN_KEY, String(now));
        } catch {
          // Sin almacenamiento, vale hasta recargar.
        }
      }}
    >
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="crm-icon-btn crm-bell"
          aria-label={total > 0 ? `Notifications: ${total} need attention` : "Notifications: nothing pending"}
          title="Notifications"
        >
          <Bell size={15} aria-hidden />
          {total > 0 ? (
            <span className="crm-bell-count" aria-hidden>
              {total > 99 ? "99+" : total}
            </span>
          ) : null}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="crm-bell-menu">
        {total === 0 ? <DropdownMenuLabel className="crm-bell-empty">Nothing needs attention.</DropdownMenuLabel> : null}

        {overdue.length > 0 ? (
          <>
            <DropdownMenuLabel>Overdue ({overdue.length})</DropdownMenuLabel>
            {overdue.slice(0, MAX_ITEMS).map((task) => taskItem(task, true))}
          </>
        ) : null}

        {dueSoon.length > 0 ? (
          <>
            {overdue.length > 0 ? <DropdownMenuSeparator /> : null}
            <DropdownMenuLabel>Next 24 hours ({dueSoon.length})</DropdownMenuLabel>
            {dueSoon.slice(0, MAX_ITEMS).map((task) => taskItem(task, false))}
          </>
        ) : null}

        {newLeads.length > 0 ? (
          <>
            {overdue.length + dueSoon.length > 0 ? <DropdownMenuSeparator /> : null}
            <DropdownMenuLabel>New leads ({newLeads.length})</DropdownMenuLabel>
            {newLeads.slice(0, MAX_ITEMS).map((lead) => (
              <DropdownMenuItem key={lead.id} onSelect={() => onOpenLead(lead.id)} className="crm-bell-item">
                <span>{lead.name}</span>
                <span className="crm-task-meta">{formatAge(lead.createdAt)}</span>
              </DropdownMenuItem>
            ))}
          </>
        ) : null}

        {bookings.length > 0 ? (
          <>
            {overdue.length + dueSoon.length + newLeads.length > 0 ? <DropdownMenuSeparator /> : null}
            <DropdownMenuItem onSelect={onOpenBookings} className="crm-bell-item">
              <span>
                {bookings.length} upcoming {bookings.length === 1 ? "booking" : "bookings"} not in the CRM
              </span>
              <span className="crm-task-meta">Open Web bookings</span>
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
