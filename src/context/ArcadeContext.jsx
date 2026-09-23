import React, { createContext, useContext, useState, useCallback } from "react";

const ArcadeContext = createContext({
  isPlatformerOpen: false,
  openPlatformer: () => {},
  closePlatformer: () => {},
  triggerKonami: () => {},
  konamiActive: false,
});

export const ArcadeProvider = ({ children }) => {
  const [isPlatformerOpen, setIsPlatformerOpen] = useState(false);
  const [konamiActive, setKonamiActive] = useState(false);

  const openPlatformer = useCallback(() => {
    setIsPlatformerOpen(true);
  }, []);

  const closePlatformer = useCallback(() => {
    setIsPlatformerOpen(false);
  }, []);

  const triggerKonami = useCallback(() => {
    setKonamiActive(true);
    setTimeout(() => {
      setKonamiActive(false);
    }, 5000);
  }, []);

  return (
    <ArcadeContext.Provider
      value={{
        isPlatformerOpen,
        openPlatformer,
        closePlatformer,
        triggerKonami,
        konamiActive,
      }}
    >
      {children}
    </ArcadeContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useArcade = () => useContext(ArcadeContext);
