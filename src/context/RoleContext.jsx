import { createContext, useContext, useState } from "react";
import { projects } from "../constants";

const RoleContext = createContext({
  activeRole: "all",
  setActiveRole: () => {},
});

export const RoleProvider = ({ children }) => {
  const [activeRole, setActiveRole] = useState(() => {
    // A chapter link must render its destination before browser hash scrolling.
    const chapter = projects.find(
      (project) => window.location.hash === `#build-${project.id}`,
    );
    if (chapter?.featured) return "all";
    if (chapter && ["lastmile", "scrapeverse"].includes(chapter.id))
      return "backend";
    try {
      const saved = sessionStorage.getItem("portfolio_role");
      if (saved && ["all", "fullstack", "ai", "backend"].includes(saved)) {
        return saved;
      }
    } catch {
      // Ignore sessionStorage errors
    }
    return "all";
  });

  const handleSetRole = (role) => {
    setActiveRole(role);
    try {
      sessionStorage.setItem("portfolio_role", role);
    } catch {
      // Ignore
    }
  };

  return (
    <RoleContext.Provider value={{ activeRole, setActiveRole: handleSetRole }}>
      {children}
    </RoleContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useRole = () => useContext(RoleContext);
