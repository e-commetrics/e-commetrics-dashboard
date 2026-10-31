"use client";

import { AlarmClock, Facebook, FileSpreadsheet, Mail, MoreHorizontal, Phone, UserPlus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { SOURCE_LABEL, formatAge, formatDue, isOverdue } from "../lib/format";
import type { Lead, Stage, Task } from "../lib/types";
import { Badge } from "./ui";

const SOURCE_ICON = {
  facebook: <Facebook size={13} style={{ color: "#1877F2" }} aria-hidden />,
  csv: <FileSpreadsheet size={13} style={{ color: "var(--ec-success)" }} aria-hidden />,
  manual: <UserPlus size={13} style={{ color: "var(--ec-text-muted)" }} aria-hidden />,
} as const;

/**
 * Tarjeta arrastrable del pipeline.
 *
 * `onOpen` en vez de un <Link>: la navegacion la lleva el shell con query
 * params, no un Link a una ruta que en un export estatico no se puede generar.
 *
 * El nombre es el boton que abre la ficha y su area cubre la tarjeta (ver
 * .crm-card-open::after). Una tarjeta con role="button" no podria contener los
 * enlaces de contacto ni el menu sin anidar controles.
 */
export function LeadCard({
  lead,
  nextTask,
  stages,
  onDragStart,
  onOpen,
  onMove,
}: {
  lead: Lead;
  /** La tarea abierta que vence primero, si hay. */
  nextTask: Task | null;
  stages: Stage[];
  onDragStart: (id: string) => void;
  onOpen: (id: string) => void;
  onMove: (id: string, stage: string) => void;
}) {
  const overdue = nextTask ? isOverdue(nextTask.dueAt) : false;

  return (
    <article
      draggable
      onDragStart={() => onDragStart(lead.id)}
      className={cn("crm-card", overdue && "is-urgent", lead.archivedAt && "is-archived")}
    >
      <div className="crm-card-head">
        <button type="button" className="crm-card-open" onClick={() => onOpen(lead.id)}>
          {lead.name}
        </button>
        <span className="crm-card-source" title={SOURCE_LABEL[lead.source]}>
          {SOURCE_ICON[lead.source]}
        </span>
        {/* Mover sin arrastrar: con teclado y en pantallas tactiles el arrastre no sirve. */}
        <div className="crm-card-over">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className="crm-icon-btn crm-card-menu" aria-label={`Move ${lead.name} to another stage`}>
                <MoreHorizontal size={15} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Move to</DropdownMenuLabel>
              {stages
                .filter((stage) => stage.id !== lead.stage)
                .map((stage) => (
                  <DropdownMenuItem key={stage.id} onSelect={() => onMove(lead.id, stage.id)}>
                    <span className="crm-column-dot" style={{ background: stage.color }} />
                    {stage.name}
                  </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {nextTask ? (
        <p className={cn("crm-card-task", overdue && "is-overdue")} style={{ margin: "6px 0 0" }}>
          <AlarmClock size={12} aria-hidden />
          <span>
            {nextTask.description} · {formatDue(nextTask.dueAt)}
          </span>
        </p>
      ) : null}

      <div className="crm-card-contact">
        {lead.phone ? (
          <a href={`tel:${lead.phone}`} draggable={false} className="crm-contact-link crm-card-over">
            <Phone size={12} aria-hidden />
            <span>{lead.phone}</span>
          </a>
        ) : null}
        {lead.email ? (
          <a href={`mailto:${lead.email}`} draggable={false} className="crm-contact-link crm-card-over">
            <Mail size={12} aria-hidden />
            <span>{lead.email}</span>
          </a>
        ) : null}
        {!lead.email && !lead.phone ? <span className="crm-small">No contact details</span> : null}
      </div>

      <div className="crm-card-foot">
        <span title={lead.createdAt}>{formatAge(lead.createdAt)}</span>
        {lead.archivedAt ? <Badge tone="warning">Archived</Badge> : null}
        {!lead.archivedAt && lead.campaignName ? <Badge tone="brand">{lead.campaignName}</Badge> : null}
      </div>
    </article>
  );
}
