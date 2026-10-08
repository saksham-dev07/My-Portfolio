import { Component, lazy, Suspense, useEffect, useRef, useState } from "react";
import App from "./App";
import { projects } from "./constants";
import { readExeReturn, saveExeReturn } from "./utils/exeProgress";
import {
  projectStoryHref,
  projectWorldHref,
  readProjectRequest,
} from "./utils/worldNavigation";
import "./styles/exe-entry.css";

const DrivingWorld = lazy(() => import("./experience/DrivingWorld"));
const Laboratory = lazy(() => import("./lab/Laboratory"));
const NotFound = lazy(() => import("./components/NotFound"));

const readRoute = () =>
  /^\/(world|drive|exe)\/?$/.test(location.pathname)
    ? "world"
    : /^\/lab\/?$/.test(location.pathname)
      ? "lab"
      : location.pathname === "/"
        ? "portfolio"
        : "404";

class RouteBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="exe-route-loading">
        <p>The 3D driving world could not be loaded.</p>
        <button type="button" onClick={this.props.onExit}>
          Return to portfolio
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}

export default function PortfolioRouter() {
  const [route, setRoute] = useState(readRoute);
  const isWorld = route === "world";
  const routeRef = useRef(route);
  const restore = useRef(null);

  useEffect(() => {
    routeRef.current = route;
  }, [route]);

  useEffect(() => {
    const onPop = () => {
      const next = readRoute();
      if (routeRef.current === "world" && next === "portfolio")
        restore.current = readExeReturn();
      setRoute(next);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    if (route !== "portfolio" || !restore.current) return;
    const destination = restore.current;
    restore.current = null;
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => {
        if (destination.y !== null) {
          window.scrollTo({ top: destination.y, behavior: "instant" });
          document
            .getElementById(destination.focusId || "exe-entry-link")
            ?.focus({ preventScroll: true });
        } else {
          const target =
            document.getElementById(location.hash.slice(1) || "footer") ||
            document.getElementById("projects");
          target?.scrollIntoView({ behavior: "instant", block: "start" });
          const heading = target?.querySelector("h1,h2") || target;
          heading?.setAttribute("tabindex", "-1");
          heading?.focus({ preventScroll: true });
        }
      });
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, [route]);

  const enter = (event) => {
    if (
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button > 0
    )
      return;
    event.preventDefault();
    saveExeReturn(event.currentTarget.id);
    const project = readProjectRequest(
      new URL(event.currentTarget.href).search,
      projects,
    );
    history.pushState(
      { world: true },
      "",
      project ? projectWorldHref(project.id) : "/world",
    );
    setRoute("world");
  };

  const exit = (fragment, projectId) => {
    const destination =
      typeof fragment === "string"
        ? {
            url: projectId ? projectStoryHref(projectId) : `/#${fragment}`,
            y: null,
          }
        : readExeReturn();
    restore.current = destination;
    history.replaceState({}, "", destination.url);
    setRoute("portfolio");
  };

  return route === "lab" || route === "404" ? (
    <RouteBoundary key={route} onExit={() => exit("home")}>
      <Suspense
        fallback={
          <div className="exe-route-loading" role="status">
            Opening {route === "lab" ? "the laboratory" : "a new perspective"}…
          </div>
        }
      >
        {route === "lab" ? <Laboratory /> : <NotFound />}
      </Suspense>
    </RouteBoundary>
  ) : isWorld ? (
    <RouteBoundary onExit={exit}>
      <Suspense
        fallback={
          <div className="exe-route-loading" role="status">
            <span className="mono">INITIALIZING THE DRIVING WORLD</span>
            <p>Connecting the interactive 3D world…</p>
            <button type="button" onClick={() => exit()}>
              Return to portfolio
            </button>
          </div>
        }
      >
        <DrivingWorld onExit={exit} />
      </Suspense>
    </RouteBoundary>
  ) : (
    <App onEnterExe={enter} />
  );
}
