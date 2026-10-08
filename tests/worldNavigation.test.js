import { expect, test } from "bun:test";
import {
  projectStoryHref,
  projectWorldHref,
  readProjectRequest,
} from "../src/utils/worldNavigation";

const projects = [{ id: "deepfake-forensics" }, { id: "nl-app-compiler" }];

test("world and portfolio requests resolve only known project IDs", () => {
  expect(readProjectRequest("?project=deepfake-forensics", projects)).toBe(
    projects[0],
  );
  expect(readProjectRequest("?project=nl-app-compiler", projects)).toBe(
    projects[1],
  );
  for (const search of [
    "",
    "?project=unknown",
    "?project=https://example.com",
    "?project=../contact",
    "?project=%3Cscript%3E",
    "?project=unknown&project=deepfake-forensics",
  ]) {
    expect(readProjectRequest(search, projects)).toBeNull();
  }
});

test("project links round-trip between a world destination and its portfolio story", () => {
  for (const project of projects) {
    const world = new URL(
      projectWorldHref(project.id),
      "https://portfolio.example",
    );
    const story = new URL(projectStoryHref(project.id), world.origin);
    expect(world.pathname).toBe("/world");
    expect(story.pathname).toBe("/");
    expect(story.hash).toBe(`#build-${project.id}`);
    expect(readProjectRequest(world.search, projects)).toBe(project);
    expect(readProjectRequest(story.search, projects)).toBe(project);
  }
});
