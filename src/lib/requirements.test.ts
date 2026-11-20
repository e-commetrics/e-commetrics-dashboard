import { expect, test } from "bun:test";
import { REQUIREMENT_SECTIONS, REQUIRED_KEYS, canSetStatus, requirementProgress } from "./requirements";

test("el cliente marca enviado pero no verifica ni toca lo verificado", () => {
  expect(canSetStatus(false, "pending", "sent")).toBe(true);
  expect(canSetStatus(false, "sent", "pending")).toBe(true);
  expect(canSetStatus(false, "sent", "verified")).toBe(false);
  expect(canSetStatus(false, "verified", "pending")).toBe(false);
  expect(canSetStatus(true, "verified", "pending")).toBe(true);
  expect(canSetStatus(true, "sent", "verified")).toBe(true);
});

test("claves únicas y los opcionales no cuentan en el avance", () => {
  const keys = REQUIREMENT_SECTIONS.flatMap((s) => s.items.map((i) => i.key));
  expect(new Set(keys).size).toBe(keys.length);
  expect(REQUIRED_KEYS).not.toContain("wix");
  const row = (status: "sent" | "verified") => ({ key: "", status, info: null, comment: null, updatedBy: null, updatedAt: null });
  expect(requirementProgress({ meta_page: row("verified"), google_ads: row("sent"), wix: row("verified") })).toEqual({
    total: REQUIRED_KEYS.length,
    sent: 1,
    verified: 1,
  });
});
