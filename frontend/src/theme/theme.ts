import { createTheme } from "@mui/material/styles";
import { PaletteMode } from "@mui/material";

const baseTypography = {
  fontFamily: [
    "-apple-system",
    "BlinkMacSystemFont",
    '"Segoe UI"',
    "Roboto",
    '"Helvetica Neue"',
    "Arial",
    "sans-serif",
  ].join(","),
  h1: {
    fontWeight: 800,
    fontSize: "3rem",
    lineHeight: 1.2,
  },
  h2: {
    fontWeight: 700,
    fontSize: "2.25rem",
    lineHeight: 1.3,
  },
  h3: {
    fontWeight: 700,
    fontSize: "1.875rem",
    lineHeight: 1.4,
  },
  h4: {
    fontWeight: 600,
    fontSize: "1.5rem",
    lineHeight: 1.4,
  },
  h5: {
    fontWeight: 600,
    fontSize: "1.25rem",
    lineHeight: 1.5,
  },
  h6: {
    fontWeight: 600,
    fontSize: "1.125rem",
    lineHeight: 1.5,
  },
  button: {
    fontWeight: 600,
    textTransform: "none",
  },
};

export const createAppTheme = (mode: PaletteMode = "light") =>
  createTheme({
    palette: {
      mode,
      primary: {
        main: "#2563eb",
        light: "#3b82f6",
        dark: "#1d4ed8",
        contrastText: "#ffffff",
      },
      secondary: {
        main: "#6366f1",
        light: "#818cf8",
        dark: "#4f46e5",
        contrastText: "#ffffff",
      },
      error: {
        main: "#ef4444",
        light: "#f87171",
        dark: "#dc2626",
      },
      success: {
        main: "#10b981",
        light: "#34d399",
        dark: "#059669",
      },
      warning: {
        main: "#f59e0b",
        light: "#fbbf24",
        dark: "#d97706",
      },
      info: {
        main: "#3b82f6",
        light: "#60a5fa",
        dark: "#2563eb",
      },
      background: {
        default: mode === "light" ? "#f8fafc" : "#0b1221",
        paper: mode === "light" ? "#ffffff" : "#0f172a",
      },
      text: {
        primary: mode === "light" ? "#111827" : "#e5e7eb",
        secondary: mode === "light" ? "#6b7280" : "#cbd5e1",
      },
      divider: mode === "light" ? "#e5e7eb" : "#1f2937",
    },
    typography: baseTypography,
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            padding: "10px 24px",
            fontWeight: 600,
            boxShadow: "none",
            "&:hover": {
              boxShadow:
                "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
            },
          },
          contained: {
            "&:hover": {
              boxShadow:
                "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            boxShadow:
              "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
            "&:hover": {
              boxShadow:
                "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            "& .MuiOutlinedInput-root": {
              borderRadius: 12,
              "&:hover fieldset": {
                borderColor: "#2563eb",
              },
              "&.Mui-focused fieldset": {
                borderColor: "#2563eb",
                borderWidth: 2,
              },
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 16,
          },
        },
      },
    },
  });

export default createAppTheme();

