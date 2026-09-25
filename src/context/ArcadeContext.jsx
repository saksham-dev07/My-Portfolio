import { createContext, useCallback, useContext, useState } from "react";

const ArcadeContext = createContext({
  isSignalRunOpen: false,
  openSignalRun: () => {},
  closeSignalRun: () => {},
  // Legacy aliases to prevent runtime issues during refactoring
  isPlatformerOpen: false,
  openPlatformer: () => {},
  closePlatformer: () => {},
  triggerKonami: () => {},
  konamiActive: false,
});

export const ArcadeProvider = ({ children }) => {
  const [isSignalRunOpen, setIsSignalRunOpen] = useState(false);
  const [konamiActive, setKonamiActive] = useState(false);

  const openSignalRun = useCallback(() => {
    setIsSignalRunOpen(true);
  }, []);

  const closeSignalRun = useCallback(() => {
    setIsSignalRunOpen(false);
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
        isSignalRunOpen,
        openSignalRun,
        closeSignalRun,
        // Legacy aliases
        isPlatformerOpen: isSignalRunOpen,
        openPlatformer: openSignalRun,
        closePlatformer: closeSignalRun,
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
