"use client";

import { useState } from "react";
import { Loader2, Pencil } from "lucide-react";
import { toast } from "react-hot-toast";
import { apiPatchLead } from "../lib/api";
import { useMutation } from "../lib/hooks";
import type { Lead } from "../lib/types";
import { Modal, TextField } from "./ui";

/** Corrige nombre, correo y telefono. No cambia la etapa ni manda nada a Meta. */
export function EditLeadModal({ lead }: { lead: Lead }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const save = useMutation(
    (input: { name: string; email: string | null; phone: string | null }) => apiPatchLead(lead.id, input),
    {
      onSuccess: () => toast.success("Lead updated."),
      onError: (message) => toast.error(message),
    }
  );

  function openModal() {
    setName(lead.name);
    setEmail(lead.email ?? "");
    setPhone(lead.phone ?? "");
    setOpen(true);
  }

  async function submit() {
    if (!name.trim()) {
      toast.error("Name is required.");
      return;
    }
    const result = await save.run({
      name: name.trim(),
      email: email.trim() || null,
      phone: phone.trim() || null,
    });
    if (result) setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        className="ec-btn-secondary crm-btn-sm"
        onClick={openModal}
      >
        <Pencil size={13} />
        Edit lead
      </button>

      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Edit lead"
        footer={
          <>
            <button type="button" className="ec-btn-secondary" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="ec-btn-primary"
              disabled={save.loading}
              onClick={() => void submit()}
            >
              {save.loading ? <Loader2 size={14} className="animate-spin" /> : null}
              Save changes
            </button>
          </>
        }
      >
        <TextField label="Name" value={name} onChange={setName} required autoFocus />
        <TextField label="Email" value={email} onChange={setEmail} type="email" />
        <TextField label="Phone" value={phone} onChange={setPhone} />
      </Modal>
    </>
  );
}
