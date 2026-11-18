import { expect, test } from "bun:test";
import { activeMentionQuery, insertMention, mentionIdsIn, splitMentions } from "./mentions";

test("detecta @ en curso", () => {
  expect(activeMentionQuery("hola @an", 8)).toEqual({ start: 5, query: "an" });
  expect(activeMentionQuery("@", 1)).toEqual({ start: 0, query: "" });
  expect(activeMentionQuery("correo a@b", 10)).toBeNull();
  expect(activeMentionQuery("hola @ana ", 10)).toBeNull();
});
test("inserta la mención", () => {
  expect(insertMention("hola @an y", 5, 8, "Ana María")).toEqual({ text: "hola @Ana María  y", caret: 16 });
});
test("el nombre más largo gana y escapa regex", () => {
  const parts = splitMentions("ok @Ana María y @J. (Dev)!", ["Ana", "Ana María", "J. (Dev)"]);
  expect(parts.filter((p) => p.mention).map((p) => p.text)).toEqual(["@Ana María", "@J. (Dev)"]);
  expect(parts.map((p) => p.text).join("")).toBe("ok @Ana María y @J. (Dev)!");
});
test("ids mencionados sin duplicados", () => {
  const m = [{ id: "1", name: "Ana" }, { id: "2", name: "Ana María" }, { id: "3", name: "Luis" }];
  expect(mentionIdsIn("@Ana María y @Ana María, @Luis", m)).toEqual(["2", "3"]);
  expect(mentionIdsIn("sin menciones", m)).toEqual([]);
});
test("sin nombres no marca nada", () => {
  expect(splitMentions("hola @x", [])).toEqual([{ text: "hola @x", mention: false }]);
});
test("no menciona dentro de otra palabra ni en correos", () => {
  const m = [{ id: "1", name: "Ana" }];
  expect(mentionIdsIn("hola @Anabel", m)).toEqual([]);
  expect(mentionIdsIn("correo@Ana", m)).toEqual([]);
  expect(mentionIdsIn("(@Ana), gracias", m)).toEqual(["1"]);
  expect(mentionIdsIn("@Ana.", m)).toEqual(["1"]);
});
