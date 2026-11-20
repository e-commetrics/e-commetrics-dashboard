import { expect, test } from "bun:test";
import { hostOf, normalizeUrl } from "./notes";

test("agrega https y acepta http(s)", () => {
  expect(normalizeUrl("figma.com/file/abc")).toBe("https://figma.com/file/abc");
  expect(normalizeUrl(" http://example.com ")).toBe("http://example.com/");
  expect(normalizeUrl("https://a.b/c?d=1")).toBe("https://a.b/c?d=1");
});
test("rechaza esquemas peligrosos y basura", () => {
  expect(normalizeUrl("javascript:alert(1)")).toBeNull();
  expect(normalizeUrl("data:text/html,hi")).toBeNull();
  expect(normalizeUrl("hola mundo")).toBeNull();
  expect(normalizeUrl("nada")).toBeNull();
  expect(normalizeUrl("")).toBeNull();
});
test("host legible", () => {
  expect(hostOf("https://www.figma.com/file/x")).toBe("figma.com");
});
