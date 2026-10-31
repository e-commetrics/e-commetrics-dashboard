"use client";

import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "react-hot-toast";
import { apiSaveTemplate } from "../lib/api";
import { useMutation } from "../lib/hooks";
import { CHANNEL_LABEL } from "../lib/format";
import type { MessageChannel, MessageTemplate } from "../lib/types";
import { Badge, TextAreaField, TextField } from "./ui";

/** Borrador local de una plantilla. El backend solo guarda lo que se pulsa Save. */
type Draft = { subject: string; text: string };

/**
 * Editor de una plantilla.
 *
 * Ojo al body: el endpoint llama `text` al cuerpo del mensaje, mientras que la
 * columna y el tipo usan `body`. Es la unica asimetria del contrato y ya esta
 * traducida en api.ts, no hay que propagarla.
 */
export function TemplateEditor({ template }: { template: MessageTemplate }) {
  const [draft, setDraft] = useState<Draft>({
    subject: template.subject ?? "",
    text: template.body,
  });

  const save = useMutation(
    (args: { key: string; channel: MessageChannel; text: string; subject?: string }) =>
      apiSaveTemplate(args),
    {
      onSuccess: () => toast.success(`Saved ${template.key} (${CHANNEL_LABEL[template.channel]}).`),
      onError: (message) => toast.error(message),
    }
  );

  const dirty = draft.text !== template.body || draft.subject !== (template.subject ?? "");

  return (
    <div className="crm-row" style={{ display: "block", padding: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
        <span className="crm-row-title">{template.label}</span>
        <Badge>{CHANNEL_LABEL[template.channel]}</Badge>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {template.channel === "email" ? (
          <TextField
            label="Subject"
            value={draft.subject}
            onChange={(subject) => setDraft((prev) => ({ ...prev, subject }))}
          />
        ) : null}

        <TextAreaField
          label="Message"
          value={draft.text}
          onChange={(text) => setDraft((prev) => ({ ...prev, text }))}
          rows={4}
        />

        {template.channel === "whatsapp" && template.whatsappTemplateName ? (
          <p style={{ fontSize: 12, color: "var(--ec-warning)", margin: 0 }}>
            Sends as Meta template <strong>{template.whatsappTemplateName}</strong>. The text above is
            only a preview — Meta ignores it and uses its own approved copy.
          </p>
        ) : null}

        <div>
          <button
            type="button"
            className="ec-btn-primary crm-btn-sm"
            disabled={!dirty || save.loading}
            onClick={() =>
              void save.run({
                key: template.key,
                channel: template.channel,
                text: draft.text,
                subject: template.channel === "email" ? draft.subject : undefined,
              })
            }
          >
            {save.loading ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
