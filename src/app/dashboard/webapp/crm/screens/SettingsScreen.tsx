"use client";

import { useId, useMemo, useState } from "react";
import { Info, Loader2, Plus, RefreshCw, Send, Upload, X, Zap } from "lucide-react";
import { toast } from "react-hot-toast";
import {
  apiCapiTest,
  apiCheckToken,
  apiImportCsv,
  apiListLeads,
  apiMessagingTest,
  apiSaveNotifyEmails,
  apiSettings,
  apiSync,
  apiToggleRule,
  statusOf,
} from "../lib/api";
import { useMutation, useResource } from "../lib/hooks";
import { isChannelDisabled } from "../lib/channels";
import { CHANNEL_LABEL, formatDateTime, formatFieldLabel } from "../lib/format";
import type { AutomationRule, Lead, MessageChannel, MessageTemplate, SettingsPayload } from "../lib/types";
import { useCrmSession } from "../lib/session";
import { TeamSettings } from "../components/TeamSettings";
import { TemplateEditor } from "../components/TemplateEditor";
import {
  Badge,
  ErrorNotice,
  InlineResult,
  Loading,
  Modal,
  PageHeader,
  Section,
  SelectField,
  Switch,
  TextAreaField,
  TextField,
} from "../components/ui";

type Tone = "ok" | "error" | "muted";

/** Ajustes: integraciones, reglas, plantillas y las cuatro herramientas de operacion. */
export function SettingsScreen() {
  const settings = useResource("settings", apiSettings);
  const leads = useResource("leads", apiListLeads);
  const { user } = useCrmSession();

  if (settings.loading && !settings.data) return <Loading label="Loading settings…" />;
  if (settings.error && !settings.data) {
    return (
      <div style={{ padding: 28 }}>
        <ErrorNotice message={settings.error} onRetry={settings.reload} />
      </div>
    );
  }

  const data = settings.data;
  if (!data) return <Loading />;

  return (
    <div className="crm-page crm-page-narrow">
      <PageHeader eyebrow="Configuration" title="Settings" />
      <SettingsTabs
        tabs={[
          {
            label: "Automation",
            content: (
              <>
                <Section title="Automation rules" hint="Turn each rule on or off. Changing what a rule does requires a developer.">
                  <ul className="crm-row-list">
                    {data.automationRules.map((rule) => (
                      <RuleRow key={rule.key} ruleKey={rule.key} label={rule.label} action={rule.action} enabled={rule.enabled} />
                    ))}
                  </ul>
                </Section>
                <Section title="Automatic stage changes">
                  <ScheduledGuide />
                </Section>
                <Section title="New lead notifications">
                  <NotifyEmails initial={data.syncState.notifyEmails ?? ""} />
                </Section>
              </>
            ),
          },
          {
            label: "Templates",
            content: (
              <Section title="Message templates" hint={<>Use <code>{"{{name}}"}</code> to insert the lead&apos;s name.</>}>
                <Templates templates={data.templates} />
              </Section>
            ),
          },
          {
            label: "Integrations",
            content: (
              <>
                <Section title="Integration status">
                  <IntegrationStatus data={data} />
                </Section>
                <Section title="Send a test message">
                  <MessagingTest />
                </Section>
                <Section title="Send a test Facebook event" hint="Sends a real event to Meta for the lead you choose.">
                  <CapiTest leads={leads.data ?? []} />
                </Section>
              </>
            ),
          },
          {
            label: "Import",
            content: (
              <Section title="Import leads from CSV">
                <CsvImport />
              </Section>
            ),
          },
          ...(user?.role === "admin"
            ? [{ label: "Team", content: <TeamSettings currentUserId={user.id} /> }]
            : []),
        ]}
      />
    </div>
  );
}

function SettingsTabs({ tabs }: { tabs: { label: string; content: React.ReactNode }[] }) {
  const [active, setActive] = useState(0);
  const baseId = useId();

  return (
    <>
      <div role="tablist" aria-label="Settings sections" className="ec-segmented" style={{ marginBottom: 16, flexWrap: "wrap" }}>
        {tabs.map((tab, index) => (
          <button
            key={tab.label}
            type="button"
            role="tab"
            id={`${baseId}-tab-${index}`}
            aria-selected={active === index}
            aria-controls={`${baseId}-panel-${index}`}
            className={active === index ? "active" : ""}
            onClick={() => setActive(index)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab, index) => (
        <div
          key={tab.label}
          role="tabpanel"
          id={`${baseId}-panel-${index}`}
          aria-labelledby={`${baseId}-tab-${index}`}
          hidden={active !== index}
        >
          {tab.content}
        </div>
      ))}
    </>
  );
}

// ─── Guia de Scheduled ───────────────────────────────────────────────────────

const SCHEDULED_OUTCOMES = [
  { situation: "Appointment today or later, lead in New or Contacted", result: "Moves to Scheduled" },
  { situation: "Lead already in Scheduled, Consultation, Won or Lost", result: "Stage stays the same; the appointment is noted" },
  { situation: "Appointment date already passed", result: "Stage stays the same; the appointment is noted" },
  { situation: "Several active leads share the phone or email", result: "None moves; move the right one by hand" },
  { situation: "Only an archived lead matches", result: "Stays archived; the appointment is noted" },
  { situation: "No lead matches", result: "Nothing changes; it waits in Pipeline › Web" },
  { situation: "A new lead arrives and already has an upcoming appointment", result: "Moves to Scheduled" },
];

/** Explica al equipo por que un lead cambia solo a Scheduled. Debe coincidir con planAppointment del backend. */
function ScheduledGuide() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <p className="crm-muted" style={{ margin: "0 0 12px" }}>
        Leads can move to Scheduled on their own when an appointment is booked for them.
      </p>
      <button
        type="button"
        className="ec-btn-secondary"
        onClick={() => setOpen(true)}
      >
        <Info size={13} />
        How leads move to Scheduled
      </button>

      <Modal open={open} onOpenChange={setOpen} title="How leads move to Scheduled" width={640}>
        <div style={{ display: "flex", flexDirection: "column", gap: 18, fontSize: 14 }}>
          <ol style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6 }}>
            <li>An appointment is booked on the website or in the dashboard calendar.</li>
            <li>Within about 5 minutes, the CRM checks new appointments.</li>
            <li>
              It looks for a lead with the same phone. It uses the email only when the appointment or the lead has no
              usable phone. Names are not compared.
            </li>
            <li>It applies the result below and writes &quot;Appointment booked&quot; in the lead&apos;s Activity.</li>
          </ol>

          <div className="crm-table-wrap">
            <table className="ec-table">
              <thead>
                <tr>
                  <th scope="col">Situation</th>
                  <th scope="col">Result</th>
                </tr>
              </thead>
              <tbody>
                {SCHEDULED_OUTCOMES.map((outcome) => (
                  <tr key={outcome.situation}>
                    <td>{outcome.situation}</td>
                    <td>{outcome.result}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <div className="ec-field-label" style={{ marginBottom: 6 }}>
              From Pipeline › Web
            </div>
            <p style={{ margin: 0 }}>
              &quot;Add to CRM&quot; and &quot;Add as new lead&quot; create a lead in Scheduled when the appointment is
              today or later, and in New when its date has passed.
            </p>
          </div>

          <div>
            <div className="ec-field-label" style={{ marginBottom: 6 }}>
              Good to know
            </div>
            <ul style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6 }}>
              <li>
                A moved lead gets an &quot;Appointment reminder&quot; task, due one day before the appointment. If you move
                it by hand and no upcoming appointment matches, the task is due right away.
              </li>
              <li>Facebook leads that move also send a real &quot;Scheduled&quot; event to Meta.</li>
              <li>Deleting or editing an appointment does not move the lead back. Change the stage by hand if needed.</li>
              <li>A family sharing one phone can move the wrong lead. Check Activity if a move looks wrong.</li>
            </ul>
          </div>
        </div>
      </Modal>
    </>
  );
}

// ─── Integraciones ───────────────────────────────────────────────────────────

function IntegrationStatus({ data }: { data: SettingsPayload }) {
  const [syncResult, setSyncResult] = useState<{ tone: Tone; text: string } | null>(null);
  const [tokenResult, setTokenResult] = useState<{ tone: Tone; text: string } | null>(null);

  const sync = useMutation(apiSync, {
    onSuccess: (result) => {
      setSyncResult({
        tone: result.ok ? "ok" : "error",
        text: result.ok ? `Synced. Fetched ${result.fetched}, created ${result.created}.` : `Failed: ${result.error}`,
      });
    },
    onError: (message) => setSyncResult({ tone: "error", text: message }),
  });

  const checkToken = useMutation(apiCheckToken, {
    onSuccess: (result) =>
      setTokenResult({
        tone: result.tokenValid ? "ok" : "error",
        text: result.tokenValid
          ? "Token is valid."
          : `Token invalid — ${result.tokenCheckError ?? "no reason given"}`,
      }),
    onError: (message) => setTokenResult({ tone: "error", text: message }),
  });

  const { configured, syncState } = data;

  return (
    <>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        <ConfiguredChip ok={configured.facebookLeadSync} label="Facebook lead sync" />
        {syncState.tokenValid !== null ? (
          <Badge tone={syncState.tokenValid ? "success" : "danger"}>
            Page token: {syncState.tokenValid ? "valid" : "invalid"}
          </Badge>
        ) : null}
        <ConfiguredChip ok={configured.facebookCapi} label="Facebook CAPI" />
        {configured.facebookCapiTestMode ? <Badge tone="warning">CAPI test mode ON</Badge> : null}
        <ConfiguredChip ok={configured.email} label="Email (SMTP)" />
        {isChannelDisabled("sms") ? (
          <Badge tone="neutral">SMS (Twilio): disabled</Badge>
        ) : (
          <ConfiguredChip ok={configured.sms} label="SMS (Twilio)" />
        )}
        {isChannelDisabled("whatsapp") ? (
          <Badge tone="neutral">WhatsApp (Meta): disabled</Badge>
        ) : (
          <ConfiguredChip ok={configured.whatsapp} label="WhatsApp (Meta)" />
        )}
      </div>

      <dl className="crm-dl" style={{ marginBottom: 14 }}>
        <dt>Last sync</dt>
        <dd>
          {formatDateTime(syncState.lastSyncAt)}
          {syncState.lastError ? <span className="crm-error-text"> — error: {syncState.lastError}</span> : null}
        </dd>
        <dt>Last Facebook event</dt>
        <dd>
          {formatDateTime(syncState.lastCapiAt)}
          {syncState.lastCapiError ? <span className="crm-error-text"> — error: {syncState.lastCapiError}</span> : null}
        </dd>
        <dt>Last token check</dt>
        <dd>
          {formatDateTime(syncState.tokenCheckedAt)}
          {syncState.tokenCheckError ? <span className="crm-error-text"> — error: {syncState.tokenCheckError}</span> : null}
        </dd>
      </dl>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button
          type="button"
          className="ec-btn-secondary"
          disabled={sync.loading}
          onClick={() => void sync.run()}
        >
          {sync.loading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
          Sync now
        </button>
        <button
          type="button"
          className="ec-btn-secondary"
          disabled={checkToken.loading}
          onClick={() => void checkToken.run()}
        >
          {checkToken.loading ? <Loader2 size={13} className="animate-spin" /> : null}
          Check token
        </button>
      </div>

      {syncResult ? <InlineResult tone={syncResult.tone}>{syncResult.text}</InlineResult> : null}
      {tokenResult ? <InlineResult tone={tokenResult.tone}>{tokenResult.text}</InlineResult> : null}
    </>
  );
}

function ConfiguredChip({ ok, label }: { ok: boolean; label: string }) {
  return <Badge tone={ok ? "success" : "neutral"}>{label}: {ok ? "configured" : "not configured"}</Badge>;
}

// ─── Avisos de lead nuevo ───────────────────────────────────────────────────

const splitEmails = (value: string | null) => (value ?? "").split(",").map((e) => e.trim()).filter(Boolean);

function NotifyEmails({ initial }: { initial: string }) {
  const [emails, setEmails] = useState(() => splitEmails(initial));
  const [draft, setDraft] = useState("");
  const [result, setResult] = useState<{ tone: Tone; text: string } | null>(null);

  // Cada alta o baja se guarda al momento; la lista mostrada es la que devolvio el backend.
  const save = useMutation((next: string[]) => apiSaveNotifyEmails(next.join(", ")), {
    onSuccess: (saved) => {
      setEmails(splitEmails(saved));
      setDraft("");
      setResult({ tone: "ok", text: saved ? "Saved." : "Saved. Notifications are off." });
    },
    onError: (message) => setResult({ tone: "error", text: message }),
  });

  const add = () => {
    const email = draft.trim();
    if (!email) return;
    if (emails.some((e) => e.toLowerCase() === email.toLowerCase())) {
      setResult({ tone: "error", text: `${email} is already in the list.` });
      return;
    }
    setResult(null);
    void save.run([...emails, email]);
  };

  return (
    <>
      <p className="crm-muted" style={{ margin: "0 0 12px" }}>
        Each new Facebook lead sends an email to these addresses. Manual and CSV leads do not. With no addresses,
        notifications are off.
      </p>

      {emails.length === 0 ? (
        <p className="crm-small" style={{ margin: "0 0 12px" }}>No addresses yet.</p>
      ) : (
        <ul className="crm-row-list" style={{ marginBottom: 12 }}>
          {emails.map((email) => (
            <li key={email} className="crm-row" style={{ fontSize: 14 }}>
              <span style={{ minWidth: 0, overflowWrap: "anywhere" }}>{email}</span>
              <button
                type="button"
                className="ec-btn-secondary crm-btn-sm"
                disabled={save.loading}
                aria-label={`Remove ${email}`}
                onClick={() => {
                  setResult(null);
                  void save.run(emails.filter((e) => e !== email));
                }}
              >
                <X size={13} />
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <form
        className="crm-form-row"
        onSubmit={(event) => {
          event.preventDefault();
          add();
        }}
      >
        <div className="crm-form-row-grow">
          <TextField label="Add an email" type="email" value={draft} onChange={setDraft} placeholder="frontdesk@example.com" />
        </div>
        <button type="submit" className="ec-btn-primary" disabled={save.loading || !draft.trim()}>
          {save.loading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          Add
        </button>
      </form>
      {result ? <InlineResult tone={result.tone}>{result.text}</InlineResult> : null}
    </>
  );
}

// ─── Reglas ──────────────────────────────────────────────────────────────────

function RuleRow({
  ruleKey,
  label,
  action,
  enabled,
}: {
  ruleKey: string;
  label: string;
  action: AutomationRule["action"];
  enabled: boolean;
}) {
  const [local, setLocal] = useState(enabled);
  const toggle = useMutation((next: boolean) => apiToggleRule(ruleKey, next), {
    onError: (message) => {
      toast.error(message);
      // Se revierte: el switch ya estaba visualmente cambiado y el backend no.
      setLocal(enabled);
    },
  });

  return (
    <li className="crm-row">
      <div style={{ minWidth: 0 }}>
        <div className="crm-row-title">{label}</div>
        <div className="crm-small" style={{ marginTop: 2 }}>
          {action === "send_message" ? "Sends a message" : "Creates a task"} · {local ? "On" : "Off"}
        </div>
      </div>
      <Switch
        checked={local}
        disabled={toggle.loading}
        label={`Enable ${label}`}
        onChange={(next) => {
          setLocal(next);
          void toggle.run(next);
        }}
      />
    </li>
  );
}

// ─── Plantillas ──────────────────────────────────────────────────────────────

function Templates({ templates }: { templates: MessageTemplate[] }) {
  // Se agrupan por key para que las variantes de canal de una misma plantilla
  // queden juntas, que era el criterio del original.
  const groups = useMemo(() => {
    const map = new Map<string, MessageTemplate[]>();
    for (const template of templates) {
      const list = map.get(template.key) ?? [];
      list.push(template);
      map.set(template.key, list);
    }
    return [...map.entries()];
  }, [templates]);

  if (groups.length === 0) {
    return (
      <p className="crm-muted" style={{ margin: 0 }}>
        No templates. Run <code>crm/seed.js</code> on the server.
      </p>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      {groups.map(([key, list]) => (
        <div key={key}>
          <h3 className="crm-tasks-group-title" style={{ marginBottom: 8 }}>
            {formatFieldLabel(key.replace(/-/g, " "))}
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {list.map((template) => (
              <TemplateEditor key={`${template.key}-${template.channel}`} template={template} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Test de mensajería ─────────────────────────────────────────────────────

const TEST_CHANNELS: MessageChannel[] = ["email", "sms", "whatsapp"];

function MessagingTest() {
  const [channel, setChannel] = useState<MessageChannel>("email");
  const [to, setTo] = useState("");
  const [result, setResult] = useState<{ tone: Tone; text: string } | null>(null);
  const [providerDown, setProviderDown] = useState(false);

  const send = useMutation(
    (args: { channel: MessageChannel; to: string }) => apiMessagingTest(args.channel, args.to),
    {
      onSuccess: (res) => {
        setProviderDown(false);
        setResult({ tone: res.ok ? "ok" : "error", text: res.ok ? "Sent." : `Failed: ${res.error}` });
      },
      onError: (message, error) => {
        setProviderDown(statusOf(error) === 502);
        setResult({ tone: "error", text: message });
      },
    }
  );

  return (
    <>
      <div className="crm-form-row">
        <SelectField
          label="Channel"
          value={channel}
          onChange={(next) => setChannel(next as MessageChannel)}
          options={TEST_CHANNELS.map((option) => {
            const off = isChannelDisabled(option);
            return { value: option, label: off ? `${CHANNEL_LABEL[option]} (disabled)` : CHANNEL_LABEL[option], disabled: off };
          })}
          width={150}
        />
        <div className="crm-form-row-grow">
          <TextField
            label="To"
            value={to}
            onChange={setTo}
            placeholder="email or phone with country code"
          />
        </div>
        <button
          type="button"
          className="ec-btn-primary"
          disabled={send.loading || !to.trim() || isChannelDisabled(channel)}
          onClick={() => {
            setResult(null);
            void send.run({ channel, to: to.trim() });
          }}
        >
          {send.loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          Send test
        </button>
      </div>
      {result ? (
        <InlineResult tone={result.tone}>
          {result.text}
          {providerDown ? " The provider is down, not this app." : ""}
        </InlineResult>
      ) : null}
    </>
  );
}

// ─── Test CAPI ───────────────────────────────────────────────────────────────

function CapiTest({ leads }: { leads: Pick<Lead, "id" | "name">[] }) {
  const [leadId, setLeadId] = useState("");
  const [result, setResult] = useState<{ tone: Tone; text: string } | null>(null);

  const send = useMutation((id: string) => apiCapiTest(id), {
    onSuccess: (res) =>
      setResult({
        tone: res.ok ? "ok" : "error",
        text: res.ok ? "Sent — check Events Manager › Test Events." : `Failed: ${res.error}`,
      }),
    onError: (message) => setResult({ tone: "error", text: message }),
  });

  return (
    <>
      <div className="crm-form-row">
        <SelectField
          label="Lead"
          value={leadId}
          onChange={setLeadId}
          options={leads.map((lead) => ({ value: lead.id, label: lead.name }))}
          placeholder={leads.length === 0 ? "No leads to test with" : "Choose a lead"}
          disabled={leads.length === 0}
          width={240}
        />
        <button
          type="button"
          className="ec-btn-primary"
          disabled={send.loading || !leadId}
          onClick={() => {
            setResult(null);
            void send.run(leadId);
          }}
        >
          {send.loading ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
          Send test event
        </button>
      </div>
      {result ? <InlineResult tone={result.tone}>{result.text}</InlineResult> : null}
    </>
  );
}

// ─── Import CSV ──────────────────────────────────────────────────────────────

const CSV_PLACEHOLDER = "name,email,phone\nJane Doe,jane@example.com,+15550100";

function CsvImport() {
  const [csv, setCsv] = useState("");
  const [result, setResult] = useState<{ tone: Tone; text: string } | null>(null);

  const importCsv = useMutation((text: string) => apiImportCsv(text), {
    onSuccess: (res) => {
      const skipped = [
        res.duplicates ? `${res.duplicates} already in the CRM` : "",
        res.invalid ? `${res.invalid} with invalid data` : "",
      ].filter(Boolean);
      setResult({
        tone: res.created > 0 || skipped.length === 0 ? "ok" : "error",
        text: `Imported ${res.created} ${res.created === 1 ? "lead" : "leads"}.${skipped.length ? ` Skipped ${skipped.join(" and ")}.` : ""}`,
      });
      setCsv("");
    },
    onError: (message) => setResult({ tone: "error", text: message }),
  });

  return (
    <>
      <p className="crm-muted" style={{ margin: "0 0 12px" }}>
        Paste CSV with a header row. Only <code>name</code> is required; the rest are optional. Put quotes around a
        value with a comma, like <code>&quot;Pérez, Ana&quot;</code>. Rows whose phone or email is already in the CRM
        are skipped.
      </p>
      <TextAreaField value={csv} onChange={setCsv} placeholder={CSV_PLACEHOLDER} rows={5} mono />
      <button
        type="button"
        className="ec-btn-primary"
        style={{ marginTop: 12 }}
        disabled={importCsv.loading || !csv.trim()}
        onClick={() => {
          setResult(null);
          void importCsv.run(csv);
        }}
      >
        {importCsv.loading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={14} />}
        Import
      </button>
      {result ? <InlineResult tone={result.tone}>{result.text}</InlineResult> : null}
    </>
  );
}
