"use client";

import { useState } from "react";
import { Check, KeyRound, Loader2, Plus, Trash2, X } from "lucide-react";
import { toast } from "react-hot-toast";
import { apiCreateUser, apiDeleteUser, apiListUsers, apiUpdateUser } from "../lib/api";
import { formatDateTime } from "../lib/format";
import { useMutation, useResource } from "../lib/hooks";
import type { CrmRole, TeamUser } from "../lib/types";
import { Badge, ErrorNotice, Loading, Modal, Section, SelectField, TextField } from "./ui";

const MIN_PASSWORD = 12;
const ROLE_OPTIONS = [
  { value: "staff", label: "Staff" },
  { value: "admin", label: "Admin" },
];

// Debe coincidir con las rutas que llevan requireAdmin en el backend.
const ROLE_PERMISSIONS = [
  { action: "Work leads: add, edit, move, archive, notes and tasks", admin: true, staff: true },
  { action: "Send messages to leads", admin: true, staff: true },
  { action: "See the dashboard and website bookings", admin: true, staff: true },
  { action: "Change automation rules, templates and notification emails", admin: true, staff: true },
  { action: "Sync Facebook, send test events and import CSV", admin: true, staff: true },
  { action: "Permanently delete manual, CSV and booking leads", admin: true, staff: false },
  { action: "Manage the team: users, roles and passwords", admin: true, staff: false },
];

/** El aria-label da a los lectores de pantalla lo que el icono solo dice con la vista. */
function PermissionIcon({ allowed }: { allowed: boolean }) {
  return allowed ? (
    <Check size={16} role="img" aria-label="Allowed" style={{ color: "var(--ec-success)" }} />
  ) : (
    <X size={16} role="img" aria-label="Not allowed" style={{ color: "var(--ec-danger)" }} />
  );
}

function RolesGuide() {
  return (
    <Section title="What each role can do" hint="Facebook leads cannot be deleted by anyone, because the sync would bring them back. Archive them instead.">
      <div className="crm-table-wrap">
        <table className="ec-table">
          <thead>
            <tr>
              <th scope="col">Action</th>
              <th scope="col">Admin</th>
              <th scope="col">Staff</th>
            </tr>
          </thead>
          <tbody>
            {ROLE_PERMISSIONS.map((permission) => (
              <tr key={permission.action}>
                <td>{permission.action}</td>
                <td>
                  <PermissionIcon allowed={permission.admin} />
                </td>
                <td>
                  <PermissionIcon allowed={permission.staff} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

/** Usuarios del CRM. Solo la ve un admin, y el backend lo exige por su cuenta. */
export function TeamSettings({ currentUserId }: { currentUserId: string }) {
  const users = useResource("team", apiListUsers);

  return (
    <>
      <Section title="Team">
        {users.loading && !users.data ? <Loading label="Loading team…" /> : null}
        {users.error ? <ErrorNotice message={users.error} onRetry={users.reload} /> : null}
        <ul className="crm-row-list">
          {(users.data ?? []).map((user) => (
            <UserRow key={user.id} user={user} isSelf={user.id === currentUserId} />
          ))}
        </ul>
      </Section>
      <RolesGuide />
      <Section title="Add a user" hint="Share the password privately. They can use it to sign in right away.">
        <AddUserForm />
      </Section>
    </>
  );
}

function UserRow({ user, isSelf }: { user: TeamUser; isSelf: boolean }) {
  const [resetting, setResetting] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [password, setPassword] = useState("");

  const changeRole = useMutation((role: CrmRole) => apiUpdateUser(user.id, { role }), {
    onSuccess: () => toast.success("Role updated."),
    onError: (message) => toast.error(message),
  });
  const resetPassword = useMutation(() => apiUpdateUser(user.id, { password }), {
    onSuccess: () => {
      toast.success("Password changed.");
      setResetting(false);
      setPassword("");
    },
    onError: (message) => toast.error(message),
  });
  const remove = useMutation(() => apiDeleteUser(user.id), {
    onSuccess: () => {
      toast.success(`${user.name} removed.`);
      setRemoving(false);
    },
    onError: (message) => toast.error(message),
  });

  return (
    <li className="crm-row crm-team-row">
      <div style={{ minWidth: 0, flex: 1 }}>
        <div className="crm-row-title">
          {user.name} {isSelf ? <Badge>You</Badge> : null}
        </div>
        <div className="crm-small" style={{ overflowWrap: "anywhere" }}>
          {user.email} · Last sign-in: {formatDateTime(user.lastLoginAt)}
        </div>
      </div>

      <SelectField
        label={`Role of ${user.name}`}
        hideLabel
        value={user.role}
        onChange={(next) => {
          if (next !== user.role) void changeRole.run(next as CrmRole);
        }}
        options={ROLE_OPTIONS}
        disabled={changeRole.loading}
        width={110}
      />
      <button type="button" className="crm-icon-btn" onClick={() => setResetting(true)} aria-label={`Change password of ${user.name}`} title="Change password">
        <KeyRound size={15} />
      </button>
      {isSelf ? null : (
        <button type="button" className="crm-icon-btn" onClick={() => setRemoving(true)} aria-label={`Remove ${user.name}`} title="Remove user">
          <Trash2 size={15} />
        </button>
      )}

      <Modal
        open={resetting}
        onOpenChange={setResetting}
        title={`Change password of ${user.name}`}
        footer={
          <>
            <button type="button" className="ec-btn-secondary" onClick={() => setResetting(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="ec-btn-primary"
              disabled={resetPassword.loading || password.length < MIN_PASSWORD}
              onClick={() => void resetPassword.run()}
            >
              {resetPassword.loading ? <Loader2 size={14} className="animate-spin" /> : null}
              Change password
            </button>
          </>
        }
      >
        <TextField label={`New password (at least ${MIN_PASSWORD} characters)`} type="password" value={password} onChange={setPassword} required autoFocus />
        <p className="crm-small" style={{ margin: 0 }}>
          Sessions already open stay signed in for up to 7 days. To end them now, remove the user and create it again.
        </p>
      </Modal>

      <Modal
        open={removing}
        onOpenChange={setRemoving}
        title={`Remove ${user.name}?`}
        footer={
          <>
            <button type="button" className="ec-btn-secondary" onClick={() => setRemoving(false)}>
              Cancel
            </button>
            <button type="button" className="ec-btn-danger" disabled={remove.loading} onClick={() => void remove.run()}>
              {remove.loading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              Remove user
            </button>
          </>
        }
      >
        <p style={{ margin: 0, fontSize: 14 }}>
          They will be signed out and can no longer enter the CRM. Their name stays in the activity they already logged.
        </p>
      </Modal>
    </li>
  );
}

function AddUserForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<CrmRole>("staff");

  const create = useMutation(() => apiCreateUser({ name: name.trim(), email: email.trim(), password, role }), {
    onSuccess: (user) => {
      toast.success(`${user.name} added.`);
      setName("");
      setEmail("");
      setPassword("");
      setRole("staff");
    },
    onError: (message) => toast.error(message),
  });

  return (
    <form
      className="crm-team-form"
      onSubmit={(event) => {
        event.preventDefault();
        void create.run();
      }}
    >
      <TextField label="Name" value={name} onChange={setName} required />
      <TextField label="Email" type="email" value={email} onChange={setEmail} required />
      <TextField label={`Password (${MIN_PASSWORD}+ characters)`} type="password" value={password} onChange={setPassword} required />
      <SelectField label="Role" value={role} onChange={(next) => setRole(next as CrmRole)} options={ROLE_OPTIONS} />
      <div>
        <button
          type="submit"
          className="ec-btn-primary"
          disabled={create.loading || !name.trim() || !email.trim() || password.length < MIN_PASSWORD}
        >
          {create.loading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          Add user
        </button>
      </div>
    </form>
  );
}
