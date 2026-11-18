import { expect, test } from "bun:test";
import { TASK_STATUSES, isDone, openSubtaskCount } from "./types";

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
