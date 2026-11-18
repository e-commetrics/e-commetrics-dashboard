import { expect, test } from "bun:test";
import { TASK_STATUSES, byPriority, isDone, openSubtaskCount } from "./types";

test("orden de estados", () => {
  expect([...TASK_STATUSES]).toEqual(["todo", "pending", "in_progress", "done", "review", "accepted", "rejected", "blocked"]);
});
test("grupo terminada", () => {
  expect(TASK_STATUSES.filter(isDone)).toEqual(["done", "review", "accepted"]);
});
test("subtareas abiertas", () => {
  expect(openSubtaskCount([{ status: "done" }, { status: "rejected" }, { status: "blocked" }, { status: "review" }])).toBe(2);
  expect(openSubtaskCount([])).toBe(0);
});
test("orden por prioridad: urgente a baja, empate por posicion", () => {
  const tasks = [
    { id: "a", priority: "low", position: 0 },
    { id: "b", priority: "normal", position: 2 },
    { id: "c", priority: "urgent", position: 5 },
    { id: "d", priority: "normal", position: 1 },
    { id: "e", priority: "high", position: 3 },
  ] as const;
  expect([...tasks].sort(byPriority).map((t) => t.id)).toEqual(["c", "e", "d", "b", "a"]);
});
