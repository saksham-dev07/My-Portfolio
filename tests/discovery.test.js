import { afterEach, expect, test } from "bun:test";
import { discover, readDiscovery } from "../src/utils/discovery";

const originalStorage = globalThis.localStorage;
const originalWindow = globalThis.window;
afterEach(() => {
  globalThis.localStorage = originalStorage;
  globalThis.window = originalWindow;
});
test("filters corrupted progress, prevents duplicate fragments and ignores unknown IDs", () => {
  let stored = JSON.stringify({
    fragments: ["lab", "lab", "fake"],
    achievements: ["fake"],
  });
  globalThis.localStorage = {
    getItem: () => stored,
    setItem: (_, value) => {
      stored = value;
    },
  };
  globalThis.window = { dispatchEvent: () => true };
  expect(readDiscovery().fragments).toEqual(["lab"]);
  discover("lab");
  discover("fake");
  discover("footer");
  expect(readDiscovery().fragments).toEqual(["lab", "footer"]);
  discover("button-presser", "achievements");
  expect(readDiscovery().achievements).toEqual(["button-presser"]);
});
test("malformed and unavailable storage do not break interactions", () => {
  globalThis.localStorage = {
    getItem: () => "{broken",
    setItem: () => {
      throw new Error("disabled");
    },
  };
  globalThis.window = { dispatchEvent: () => true };
  expect(() => discover("notebook")).not.toThrow();
  expect(readDiscovery().fragments).toContain("notebook");
});
