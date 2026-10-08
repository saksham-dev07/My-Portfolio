import { expect, test } from "bun:test";
import { isConstrainedConnection } from "../src/utils/network.js";

test("defers optional heavy transfers for slow or data-saving connections", () => {
  for (const connection of [
    { saveData: true },
    { effectiveType: "2g" },
    { effectiveType: "3g" },
    { effectiveType: "4g", downlink: 0.8 },
    { rtt: 600 },
  ])
    expect(isConstrainedConnection(connection)).toBe(true);
  for (const connection of [
    undefined,
    {},
    { effectiveType: "4g", downlink: 10, rtt: 50 },
    { downlink: 0 },
  ])
    expect(isConstrainedConnection(connection)).toBe(false);
});
