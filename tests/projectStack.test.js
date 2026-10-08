import { expect, test } from "bun:test";
import { canStackProjects } from "../src/utils/projectStack.js";

test("project stacking adapts to available viewport space instead of a 730px cutoff", () => {
  const cards = [472, 472, 472, 472];
  expect(canStackProjects(1280, 720, cards)).toBe(true);
  expect(canStackProjects(1280, 800, cards)).toBe(true);
  expect(canStackProjects(1280, 640, cards)).toBe(true);
  expect(canStackProjects(1280, 600, cards)).toBe(false);
  expect(canStackProjects(390, 844, cards)).toBe(false);
  expect(canStackProjects(1280, 720, [472, 650])).toBe(false);
  expect(canStackProjects(1280, 720, [])).toBe(false);
  expect(canStackProjects(1280, 720, [0])).toBe(false);
});
