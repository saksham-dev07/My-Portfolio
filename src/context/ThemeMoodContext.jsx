import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useState,
} from "react";

const ThemeMoodContext = createContext({
  mood: "cyber",
  toggleLightDark: () => {},
});
export const ThemeMoodProvider = ({ children }) => {
  const [mood, setMood] = useState(() => {
    try {
      return localStorage.getItem("portfolio_mood") === "light"
        ? "light"
        : "cyber";
    } catch {
      return "cyber";
    }
  });
  useLayoutEffect(() => {
    document.documentElement.dataset.mood = mood;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", mood === "light" ? "#f5f4ed" : "#111219");
    try {
      localStorage.setItem("portfolio_mood", mood);
    } catch {
      /* Storage may be unavailable. */
    }
  }, [mood]);
  const toggleLightDark = useCallback(
    () => setMood((current) => (current === "light" ? "cyber" : "light")),
    [],
  );
  return (
    <ThemeMoodContext.Provider value={{ mood, toggleLightDark }}>
      {children}
    </ThemeMoodContext.Provider>
  );
};
export const useThemeMood = () => useContext(ThemeMoodContext);
