"use client";

import { useEffect, useState } from "react";
import {
  Calendar,
  Check,
  CreditCard,
  FileText,
  KanbanSquare,
  Loader2,
  QrCode,
  Save,
  Settings,
  Tag,
  type LucideIcon,
} from "lucide-react";
import { toast } from "react-hot-toast";
import {
  APP_COMPONENT_LABELS,
  APP_COMPONENTS,
  fetchAppPermissions,
  saveAppPermissions,
  type AppPermission,
} from "@/lib/app-permissions";

const ICONS: Record<string, LucideIcon> = {
  QR: QrCode,
  Vcard: CreditCard,
  blogs: FileText,
  Reforma: Calendar,
  Monge: Calendar,
  PromoPalmas: Tag,
  CalendarioPalmas: Calendar,
  ScanEat: FileText,
  CRM: KanbanSquare,
};

export function AppPermissionsEditor({
  userId,
  onSaved,
}: {
  userId: string;
  onSaved?: (permissions: AppPermission[]) => void;
}) {
  const [permissions, setPermissions] = useState<AppPermission[] | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setPermissions(null);
    fetchAppPermissions(userId)
      .then((list) => !cancelled && setPermissions(list))
      .catch(() => {
        if (cancelled) return;
        setPermissions(APP_COMPONENTS.map((component) => ({ component, can_view: false })));
        toast.error("No se pudieron cargar los permisos");
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const toggle = (component: string) => {
    setPermissions((current) =>
      (current ?? []).map((permission) =>
        permission.component === component ? { ...permission, can_view: !permission.can_view } : permission
      )
    );
  };

  const save = async () => {
    if (!permissions) return;
    setSaving(true);
    try {
      await saveAppPermissions(userId, permissions);
      toast.success("Permisos actualizados");
      onSaved?.(permissions);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar permisos");
    } finally {
      setSaving(false);
    }
  };

  if (!permissions) {
    return (
      <div style={{ padding: 24, display: "flex", alignItems: "center", gap: 8, color: "var(--ec-text-muted)" }}>
        <Loader2 size={15} className="animate-spin" /> Cargando permisos...
      </div>
    );
  }

  const active = permissions.filter((permission) => permission.can_view).length;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
        <span className="font-mono-ec" style={{ fontSize: 11, color: "var(--ec-text-muted)" }}>
          {active}/{permissions.length} apps activas
        </span>
        <button type="button" className="ec-btn-primary" onClick={save} disabled={saving} style={{ padding: "7px 13px", fontSize: 12.5 }}>
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Guardar
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 9 }}>
        {permissions.map((permission) => {
          const Icon = ICONS[permission.component] ?? Settings;
          const checked = permission.can_view;
          return (
            <button
              key={permission.component}
              type="button"
              onClick={() => toggle(permission.component)}
              aria-pressed={checked}
              style={{
                textAlign: "left",
                padding: "11px 12px",
                borderRadius: 10,
                cursor: "pointer",
                border: checked ? "1.5px solid var(--ec-brand)" : "1px solid var(--ec-border)",
                background: checked ? "rgba(134,20,83,0.06)" : "var(--ec-surface-2)",
                transition: "all 150ms",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 7,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: checked ? "rgba(134,20,83,0.15)" : "var(--ec-surface-3)",
                  }}
                >
                  <Icon size={13} style={{ color: checked ? "var(--ec-brand)" : "var(--ec-text-muted)" }} />
                </span>
                <span
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 4,
                    border: checked ? "1.5px solid var(--ec-brand)" : "1.5px solid var(--ec-border)",
                    background: checked ? "var(--ec-brand)" : "transparent",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {checked ? <Check size={11} color="#fff" /> : null}
                </span>
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: checked ? "var(--ec-brand)" : "var(--ec-text)" }}>
                {APP_COMPONENT_LABELS[permission.component] ?? permission.component}
              </div>
              <div className="font-mono-ec" style={{ fontSize: 10, color: "var(--ec-text-muted)", marginTop: 3 }}>
                {checked ? "Activo" : "Inactivo"}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
