// Both experiences accept destinations from their own project catalogue only.
export function readProjectRequest(search, projects) {
  const id = new URLSearchParams(search).get("project");
  return projects.find((project) => project.id === id) || null;
}

export function projectWorldHref(id) {
  return `/world?project=${encodeURIComponent(id)}`;
}

export function projectStoryHref(id) {
  const encoded = encodeURIComponent(id);
  return `/?project=${encoded}#build-${encoded}`;
}
