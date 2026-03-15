"use client";
import { createContext, useContext, useEffect, useState } from "react";

export type SpaceTheme = "full" | "stars" | "nebula" | "off";

export const THEME_OPTIONS: { value: SpaceTheme; icon: string; label: string; desc: string }[] = [
  { value: "full",   icon: "🌌", label: "Full Cosmos",  desc: "Stars, shooting stars, nebula & particles" },
  { value: "stars",  icon: "⭐", label: "Starfield",    desc: "Twinkling stars & shooting stars" },
  { value: "nebula", icon: "🌫️", label: "Nebula",       desc: "Slow drifting nebula clouds only" },
  { value: "off",    icon: "⬛", label: "Off",           desc: "No background animations" },
];

const ThemeContext = createContext<{
  theme: SpaceTheme;
  setTheme: (t: SpaceTheme) => void;
}>({ theme: "full", setTheme: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<SpaceTheme>("full");

  useEffect(() => {
    const stored = localStorage.getItem("space-theme") as SpaceTheme | null;
    if (stored && ["full", "stars", "nebula", "off"].includes(stored)) {
      setThemeState(stored);
    }
  }, []);

  const setTheme = (t: SpaceTheme) => {
    setThemeState(t);
    localStorage.setItem("space-theme", t);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useSpaceTheme = () => useContext(ThemeContext);
