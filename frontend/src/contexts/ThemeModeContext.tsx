import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { CssBaseline, PaletteMode, ThemeProvider } from "@mui/material";
import { createAppTheme } from "../theme/theme";

type ThemeModeContextValue = {
  mode: PaletteMode;
  toggleMode: () => void;
};

const ThemeModeContext = createContext<ThemeModeContextValue>({
  mode: "light",
  toggleMode: () => {},
});

export const ThemeModeProvider = ({ children }: { children: React.ReactNode }) => {
  const [mode, setMode] = useState<PaletteMode>("light");

  // hydrate theme from localStorage or prefers-color-scheme
  useEffect(() => {
    const stored = localStorage.getItem("theme-mode");
    if (stored === "light" || stored === "dark") {
      setMode(stored);
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setMode("dark");
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", mode);
    localStorage.setItem("theme-mode", mode);
  }, [mode]);

  const toggleMode = () => {
    setMode((prev) => (prev === "light" ? "dark" : "light"));
  };

  const theme = useMemo(() => createAppTheme(mode), [mode]);

  return (
    <ThemeModeContext.Provider value={{ mode, toggleMode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
};

export const useThemeMode = () => useContext(ThemeModeContext);

export default ThemeModeContext;

