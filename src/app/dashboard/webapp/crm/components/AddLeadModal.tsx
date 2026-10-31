"use client";

import { useState } from "react";
import { ExternalLink, Loader2, Plus } from "lucide-react";
import { toast } from "react-hot-toast";
import { apiCreateLead, apiFindDuplicates } from "../lib/api";
import { useMutation } from "../lib/hooks";
import type { LeadDuplicate, LeadSource } from "../lib/types";
import { Modal, TextField } from "./ui";

/** Alta manual de un lead. El unico camino para meter contactos que no vengan de Facebook. */
export function AddLeadModal({ onOpenLead }: { onOpenLead: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [checking, setChecking] = useState(false);
  // Con datos en esta lista, el formulario pide confirmar antes de crear.
  const [duplicates, setDuplicates] = useState<LeadDuplicate[]>([]);

  const create = useMutation(
    (input: { name: string; email: string | null; phone: string | null; source: LeadSource }) =>
      apiCreateLead(input),
    {
      onSuccess: (lead) => toast.success(`Added ${lead.name}`),
      onError: (message) => toast.error(message),
    }
  );

  function close() {
    setOpen(false);
    setName("");
    setEmail("");
    setPhone("");
    setDuplicates([]);
  }

  // El aviso nunca bloquea: si la busqueda falla, el lead se crea igual.
  async function findDuplicates(): Promise<LeadDuplicate[]> {
    if (!email.trim() && !phone.trim()) return [];
    setChecking(true);
    try {
      return await apiFindDuplicates({ email: email.trim(), phone: phone.trim() });
    } catch {
      return [];
    } finally {
      setChecking(false);
    }
  }

  async function submit(addAnyway: boolean) {
    if (!name.trim()) {
      toast.error("Name is required.");
      return;
    }
    if (!addAnyway) {
      const found = await findDuplicates();
      if (found.length > 0) {
        setDuplicates(found);
        return;
      }
    }
    // El backend exige source; "manual" es lo que distingue un lead creado desde
    // aqui de uno que Bring Facebook, y lo usa el reparto por origen del dashboard.
    const result = await create.run({
      name: name.trim(),
      email: email.trim() || null,
      phone: phone.trim() || null,
      source: "manual",
    });
    if (result) close();
  }

  const busy = checking || create.loading;

  return (
    <>
      <button type="button" className="ec-btn-primary" onClick={() => setOpen(true)}>
        <Plus size={14} />
        Add lead
      </button>

      <Modal
        open={open}
        onOpenChange={(next) => (next ? setOpen(true) : close())}
        title="Add a lead manually"
        footer={
          <>
            <button type="button" className="ec-btn-secondary" onClick={close}>
              Cancel
            </button>
            <button type="button" className="ec-btn-primary" disabled={busy} onClick={() => void submit(duplicates.length > 0)}>
              {busy ? <Loader2 size={14} className="animate-spin" /> : null}
              {duplicates.length > 0 ? "Add anyway" : "Add lead"}
            </button>
          </>
        }
      >
        <TextField label="Name" value={name} onChange={setName} placeholder="Jane Doe" required autoFocus />
        <TextField
          label="Email"
          value={email}
          onChange={(next) => {
            setEmail(next);
            setDuplicates([]);
          }}
          type="email"
          placeholder="jane@example.com"
        />
        <TextField
          label="Phone"
          value={phone}
          onChange={(next) => {
            setPhone(next);
            setDuplicates([]);
          }}
          placeholder="+1 555 0100"
        />

        {duplicates.length > 0 ? (
          <div className="crm-notice" role="alert">
            <p className="crm-row-title" style={{ margin: "0 0 8px" }}>
              This phone or email is already in the CRM
            </p>
            <ul className="crm-row-list">
              {duplicates.map((duplicate) => (
                <li key={duplicate.id} className="crm-duplicate">
                  <span>
                    {duplicate.name}
                    {duplicate.archivedAt ? " (archived)" : ""}
                  </span>
                  <button
                    type="button"
                    className="ec-btn-secondary crm-btn-sm"
                    onClick={() => {
                      close();
                      onOpenLead(duplicate.id);
                    }}
                  >
                    <ExternalLink size={13} />
                    Open existing
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </Modal>
    </>
  );
}
