"use client";

import { ExternalLink, Loader2, UserPlus } from "lucide-react";
import { toast } from "react-hot-toast";
import { apiAddAppointmentToCrm, apiListAppointments } from "../lib/api";
import { useMutation, useResource } from "../lib/hooks";
import type { Appointment } from "../lib/types";
import { Badge, EmptyState, ErrorNotice, Loading, PageHeader } from "./ui";

/**
 * Pestana "Web" del pipeline: las citas del calendario de reformadental.com.
 * Solo lectura salvo "Add to CRM", que alguien del equipo pulsa a mano: el
 * calendario es publico y una cita falsa no debe volverse lead sola.
 */
export function WebBookings({ onOpenLead }: { onOpenLead: (id: string) => void }) {
  const appointments = useResource("appointments", apiListAppointments);
  const list = appointments.data ?? [];
  const pending = list.filter((a) => !a.leadId).length;

  return (
    <div style={{ height: "100%", overflow: "auto", padding: 28 }}>
      <PageHeader
        eyebrow="⎯⎯⎯  PIPELINE"
        title="Website bookings"
        subtitle={
          list.length === 0
            ? "Appointments booked on reformadental.com."
            : `${list.length} ${list.length === 1 ? "booking" : "bookings"} · ${pending} not in the CRM yet`
        }
      />

      {appointments.loading && !appointments.data ? <Loading label="Loading bookings…" /> : null}
      {appointments.error ? <ErrorNotice message={appointments.error} onRetry={appointments.reload} /> : null}

      {!appointments.loading && !appointments.error && list.length === 0 ? (
        <EmptyState title="No bookings yet." hint="Appointments booked on the website calendar show up here." />
      ) : null}

      {list.length > 0 ? (
        <div style={{ overflowX: "auto", border: "1px solid var(--ec-hairline-strong)", borderRadius: 12 }}>
          <table className="ec-table">
            <thead>
              <tr>
                <th scope="col">Appointment</th>
                <th scope="col">Patient</th>
                <th scope="col">Contact</th>
                <th scope="col">Service</th>
                <th scope="col">CRM</th>
              </tr>
            </thead>
            <tbody>
              {list.map((appointment) => (
                <BookingRow key={appointment.id} appointment={appointment} onOpenLead={onOpenLead} />
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

function BookingRow({ appointment, onOpenLead }: { appointment: Appointment; onOpenLead: (id: string) => void }) {
  const add = useMutation(() => apiAddAppointmentToCrm(appointment.id), {
    onSuccess: (result) =>
      toast.success(result.created ? `${result.lead.name} added to the CRM.` : `${result.lead.name} was already in the CRM.`),
    onError: (message) => toast.error(message),
  });

  return (
    <tr>
      <td style={{ whiteSpace: "nowrap" }}>
        <div style={{ fontWeight: 600 }}>{appointment.date}</div>
        <div style={{ fontSize: 12, color: "var(--ec-text-muted)" }}>{appointment.time}</div>
      </td>
      <td>
        <div style={{ fontWeight: 600 }}>{appointment.name}</div>
        {appointment.firstVisit ? <Badge tone="brand">First visit</Badge> : null}
      </td>
      <td style={{ fontSize: 12.5 }}>
        <div>{appointment.phone}</div>
        <div style={{ color: "var(--ec-text-muted)", overflowWrap: "anywhere" }}>{appointment.email ?? "—"}</div>
      </td>
      <td style={{ fontSize: 12.5 }}>
        <div>{appointment.service || "—"}</div>
        <div style={{ color: "var(--ec-text-muted)" }}>{appointment.insurance || "—"}</div>
      </td>
      <td style={{ whiteSpace: "nowrap" }}>
        {appointment.leadId ? (
          <button
            type="button"
            className="ec-btn-secondary"
            style={{ padding: "6px 12px", fontSize: 12 }}
            onClick={() => onOpenLead(appointment.leadId as string)}
            aria-label={`Open lead ${appointment.leadName ?? appointment.name}`}
          >
            <ExternalLink size={13} />
            {appointment.leadArchived ? "In CRM (archived)" : "In CRM"}
          </button>
        ) : (
          <button
            type="button"
            className="ec-btn-primary"
            style={{ padding: "6px 12px", fontSize: 12 }}
            disabled={add.loading}
            onClick={() => void add.run()}
            aria-label={`Add ${appointment.name} to the CRM`}
          >
            {add.loading ? <Loader2 size={13} className="animate-spin" /> : <UserPlus size={13} />}
            Add to CRM
          </button>
        )}
      </td>
    </tr>
  );
}
