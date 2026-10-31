"use client";

import { useState } from "react";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { apiDeleteTask, apiUpdateTask } from "../lib/api";
import { toLocalInputValue } from "../lib/format";
import { useMutation } from "../lib/hooks";
import type { Task } from "../lib/types";
import { Modal, TextField } from "./ui";

/** Editar o borrar una tarea abierta. Las dos acciones quedan en Activity. */
export function EditTaskModal({ task }: { task: Task }) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [dueAt, setDueAt] = useState("");

  const save = useMutation(
    () => apiUpdateTask(task.id, { description: description.trim(), dueAt: new Date(dueAt).toISOString() }),
    {
      onSuccess: () => {
        toast.success("Task updated.");
        setOpen(false);
      },
      onError: (message) => toast.error(message),
    }
  );

  const remove = useMutation(() => apiDeleteTask(task.id), {
    onSuccess: () => {
      toast.success("Task deleted.");
      setOpen(false);
    },
    onError: (message) => toast.error(message),
  });

  function openModal() {
    setDescription(task.description);
    setDueAt(toLocalInputValue(new Date(task.dueAt)));
    setOpen(true);
  }

  const busy = save.loading || remove.loading;

  return (
    <>
      <button type="button" className="crm-icon-btn" onClick={openModal} aria-label={`Edit task "${task.description}"`} title="Edit task">
        <Pencil size={14} />
      </button>

      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Edit task"
        footer={
          <>
            <button
              type="button"
              className="ec-btn-danger"
              style={{ marginRight: "auto" }}
              disabled={busy}
              onClick={() => void remove.run()}
            >
              {remove.loading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              Delete task
            </button>
            <button type="button" className="ec-btn-secondary" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="ec-btn-primary"
              disabled={busy || !description.trim() || !dueAt}
              onClick={() => void save.run()}
            >
              {save.loading ? <Loader2 size={14} className="animate-spin" /> : null}
              Save
            </button>
          </>
        }
      >
        <TextField label="Task" value={description} onChange={setDescription} required autoFocus />
        <TextField label="Due" type="datetime-local" value={dueAt} onChange={setDueAt} required />
      </Modal>
    </>
  );
}
