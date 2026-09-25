import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { MOODS } from "../constants/moods";

const ThemeMoodContext = createContext({
  mood: "cyber",
  setMood: () => {},
  toggleLightDark: () => {},
  moods: MOODS,
});

export const ThemeMoodProvider = ({ children }) => {
  const [mood, setMoodState] = useState("cyber");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("portfolio_mood");
      if (
        saved &&
        ["cyber", "light", "hacker", "chill", "chaotic"].includes(saved)
      ) {
        setMoodState(saved);
        document.documentElement.setAttribute("data-mood", saved);
      } else {
        document.documentElement.setAttribute("data-mood", "cyber");
      }
    } catch {
      document.documentElement.setAttribute("data-mood", "cyber");
    }
  }, []);

  const setMood = useCallback(
    (newMood, eventOrCoords) => {
      if (!["cyber", "light", "hacker", "chill", "chaotic"].includes(newMood))
        return;
      if (newMood === mood) return;

      const isReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      // Direct update helper
      const applyTheme = () => {
        setMoodState(newMood);
        document.documentElement.setAttribute("data-mood", newMood);
        try {
          localStorage.setItem("portfolio_mood", newMood);
        } catch {
          // Ignore localStorage error
        }
      };

      // If browser doesn't support View Transitions or user prefers reduced motion
      if (
        typeof document === "undefined" ||
        !document.startViewTransition ||
        isReducedMotion
      ) {
        applyTheme();
        return;
      }

      // Determine circular expansion epicenter (x, y)
      let x = window.innerWidth / 2;
      let y = window.innerHeight / 2;

      if (eventOrCoords) {
        if (
          eventOrCoords.currentTarget &&
          typeof eventOrCoords.currentTarget.getBoundingClientRect ===
            "function"
        ) {
          const rect = eventOrCoords.currentTarget.getBoundingClientRect();
          x = rect.left + rect.width / 2;
          y = rect.top + rect.height / 2;
        } else if (
          typeof eventOrCoords.clientX === "number" &&
          typeof eventOrCoords.clientY === "number" &&
          (eventOrCoords.clientX !== 0 || eventOrCoords.clientY !== 0)
        ) {
          x = eventOrCoords.clientX;
          y = eventOrCoords.clientY;
        } else if (eventOrCoords.touches?.[0]) {
          x = eventOrCoords.touches[0].clientX;
          y = eventOrCoords.touches[0].clientY;
        } else if (
          typeof eventOrCoords.x === "number" &&
          typeof eventOrCoords.y === "number"
        ) {
          x = eventOrCoords.x;
          y = eventOrCoords.y;
        }
      }

      // Radius to the furthest corner of viewport
      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y),
      );

      const transition = document.startViewTransition(() => {
        applyTheme();
      });

      transition.ready.then(() => {
        const clipPath = [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${endRadius}px at ${x}px ${y}px)`,
        ];
        document.documentElement.animate(
          {
            clipPath: clipPath,
          },
          {
            duration: 1500, // Slowed down so user can properly see the circular wave reveal
            easing: "cubic-bezier(0.22, 1, 0.36, 1)",
            pseudoElement: "::view-transition-new(root)",
          },
        );
      });
    },
    [mood],
  );

  const toggleLightDark = useCallback(
    (eventOrCoords) => {
      const nextMood = mood === "light" ? "cyber" : "light";
      setMood(nextMood, eventOrCoords);
    },
    [mood, setMood],
  );

  return (
    <ThemeMoodContext.Provider
      value={{ mood, setMood, toggleLightDark, moods: MOODS }}
    >
      {children}
    </ThemeMoodContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useThemeMood = () => useContext(ThemeMoodContext);
