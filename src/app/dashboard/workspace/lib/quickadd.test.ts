import { expect, test } from "bun:test";
import { activeShortcut, parseQuickAdd } from "./quickadd";

// Viernes 20 de noviembre de 2026.
const today = new Date(2026, 10, 20);
const members = [
  { id: "1", name: "Karen Valdez" },
  { id: "2", name: "Kevin" },
  { id: "3", name: "Juan González" },
];
const ctx = { today, labels: ["Diseño", "Client"], members };

test("prioridad, fecha, label y persona salen del título", () => {
  expect(parseQuickAdd("Revisar landing p1 mañana @diseño +karen", ctx)).toEqual({
    title: "Revisar landing",
    priority: "urgent",
    dueDate: "2026-11-21",
    labels: ["Diseño"],
    assigneeIds: ["1"],
  });
});

test("fechas: hoy, día de la semana (hoy incluido), d/m y '25 nov'", () => {
  expect(parseQuickAdd("a hoy", ctx).dueDate).toBe("2026-11-20");
  expect(parseQuickAdd("a viernes", ctx).dueDate).toBe("2026-11-20");
  expect(parseQuickAdd("a lunes", ctx).dueDate).toBe("2026-11-23");
  expect(parseQuickAdd("a Miércoles", ctx).dueDate).toBe("2026-11-25");
  expect(parseQuickAdd("a 25/11", ctx).dueDate).toBe("2026-11-25");
  // Ya pasó este año: el siguiente.
  expect(parseQuickAdd("a 3/2", ctx).dueDate).toBe("2027-02-03");
  expect(parseQuickAdd("a 25 nov", ctx)).toMatchObject({ title: "a", dueDate: "2026-11-25" });
  expect(parseQuickAdd("a 31/2", ctx)).toMatchObject({ title: "a 31/2" });
  expect(parseQuickAdd("a 1/1/27", ctx).dueDate).toBe("2027-01-01");
});

test("lo que no se reconoce se queda en el título", () => {
  // "+k" coincide con dos personas; "+zz" con nadie; "marzo" y "mar" solos no son fecha.
  expect(parseQuickAdd("Plan de marzo y mar +k +zz p9 @", ctx)).toEqual({
    title: "Plan de marzo y mar +k +zz p9 @",
    labels: [],
    assigneeIds: [],
  });
});

test("labels nuevas se crean tal cual y no se repiten", () => {
  expect(parseQuickAdd("x @Nueva @nueva @client", ctx).labels).toEqual(["Nueva", "Client"]);
});

test("detecta el atajo que se está escribiendo", () => {
  expect(activeShortcut("Hola @dis", 9)).toEqual({ start: 5, sigil: "@", query: "dis" });
  expect(activeShortcut("Hola +", 6)).toEqual({ start: 5, sigil: "+", query: "" });
  expect(activeShortcut("correo@algo", 11)).toBeNull();
});
