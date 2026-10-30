"use client";

import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { apiDeleteLead } from "../lib/api";
import { useMutation } from "../lib/hooks";
import type { Lead } from "../lib/types";
import { Modal } from "./ui";

/** Borrado definitivo con confirmacion. Los leads de Facebook no lo ofrecen: el sync los recrearia. */
export function DeleteLeadModal({ lead, onDeleted }: { lead: Lead; onDeleted: () => void }) {
  const [open, setOpen] = useState(false);

  const remove = useMutation(() => apiDeleteLead(lead.id), {
    onSuccess: () => {
      toast.success(`${lead.name} deleted.`);
      onDeleted();
    },
    onError: (message) => toast.error(message),
  });

  if (lead.source === "facebook" || lead.fbLeadgenId) return null;

  return (
    <>
      <button
        type="button"
        className="ec-btn-danger"
        style={{ padding: "8px 14px", fontSize: 13 }}
        onClick={() => setOpen(true)}
      >
        <Trash2 size={13} />
        Delete
      </button>

      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Delete this lead?"
        footer={
          <>
            <button type="button" className="ec-btn-secondary" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="ec-btn-danger"
              disabled={remove.loading}
              onClick={() => void remove.run()}
            >
              {remove.loading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              Delete permanently
            </button>
          </>
        }
      >
        <p style={{ margin: 0, fontSize: 13.5 }}>
          <strong>{lead.name}</strong> and its notes, tasks and activity will be deleted. This cannot be undone. To
          only hide the lead, use Archive.
        </p>
      </Modal>
    </>
  );
}
