import React, { createContext, useContext, useState, useEffect } from "react";

const RoleContext = createContext({
  activeRole: "all",
  setActiveRole: () => {},
});

export const RoleProvider = ({ children }) => {
  const [activeRole, setActiveRole] = useState("all");

  useEffect(() => {
    // Check if there's a stored role or URL hash
    try {
      const saved = sessionStorage.getItem("portfolio_role");
      if (saved && ["all", "fullstack", "ai", "backend"].includes(saved)) {
        setActiveRole(saved);
      }
    } catch {
      // Ignore sessionStorage errors
    }
  }, []);

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
