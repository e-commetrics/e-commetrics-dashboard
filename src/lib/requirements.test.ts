import { expect, test } from "bun:test";
import { REQUIREMENT_SECTIONS, REQUIRED_KEYS, canSetStatus, requiredKeys, requirementProgress, statusAfterInfo, withCustom } from "./requirements";

test("solo el equipo verifica o deshace; nadie salta de pendiente a verificado", () => {
  expect(canSetStatus(true, "sent", "verified")).toBe(true);
  expect(canSetStatus(true, "verified", "sent")).toBe(true);
  expect(canSetStatus(true, "pending", "verified")).toBe(false);
  expect(canSetStatus(true, "sent", "pending")).toBe(false);
  expect(canSetStatus(false, "sent", "verified")).toBe(false);
  expect(canSetStatus(false, "pending", "sent")).toBe(false);
});

test("llenar información pasa a enviado, vaciarla regresa a pendiente, verificado no cambia", () => {
  expect(statusAfterInfo("pending", true)).toBe("sent");
  expect(statusAfterInfo("sent", false)).toBe("pending");
  expect(statusAfterInfo("verified", false)).toBe("verified");
});

test("claves únicas y los opcionales no cuentan en el avance", () => {
  const keys = REQUIREMENT_SECTIONS.flatMap((s) => s.items.map((i) => i.key));
  expect(new Set(keys).size).toBe(keys.length);
  expect(REQUIRED_KEYS).not.toContain("wix");
  const row = (status: "sent" | "verified") => ({ key: "", status, info: null, info2: null, comment: null, updatedBy: null, updatedAt: null });
  expect(requirementProgress({ meta_page: row("verified"), google_ads: row("sent"), wix: row("verified") })).toEqual({
    total: REQUIRED_KEYS.length,
    sent: 1,
    verified: 1,
  });
});

test("los requisitos propios van al final de su sección y cuentan si la sección no es opcional", () => {
  const sections = withCustom([
    { key: "custom_1", section: "meta", label: "Threads" },
    { key: "custom_2", section: "optional", label: "Shopify" },
  ]);
  expect(sections.find((s) => s.id === "meta")!.items.at(-1)).toMatchObject({ key: "custom_1", custom: true });
  const keys = requiredKeys(sections);
  expect(keys).toContain("custom_1");
  expect(keys).not.toContain("custom_2");
});

test("valida los ajustes del vault", async () => {
  const { DEFAULT_VAULT_SETTINGS, vaultSettingsError } = await import("./requirements");
  expect(vaultSettingsError(DEFAULT_VAULT_SETTINGS)).toBeNull();
  expect(vaultSettingsError({ ...DEFAULT_VAULT_SETTINGS, metaBusinessId: "12a45" })).toBe("metaBusinessId");
  expect(vaultSettingsError({ ...DEFAULT_VAULT_SETTINGS, googleEmail: "sin-arroba" })).toBe("googleEmail");
  expect(vaultSettingsError({ ...DEFAULT_VAULT_SETTINGS, clientNote: "x".repeat(301) })).toBe("clientNote");
});
