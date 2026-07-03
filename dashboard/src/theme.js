import { createTheme } from "@mui/material/styles";

// Font stacks shared with the AnythingGraph website.
export const FONT_SANS = '"Space Grotesk", system-ui, -apple-system, sans-serif';
export const FONT_MONO = '"JetBrains Mono", ui-monospace, Menlo, monospace';

// Brand palette values lifted from the website (white-mode design tokens).
export const BRAND = {
  sky: "#008fa3",
  skySoft: "rgba(0, 143, 163, 0.1)",
  coral: "#d91a72",
  coralSoft: "rgba(217, 26, 114, 0.1)",
  grape: "#7c5ce0",
  grapeSoft: "rgba(124, 92, 224, 0.1)",
  mint: "#4d8c00",
  mintSoft: "rgba(77, 140, 0, 0.1)",
  sun: "#b8860b",
  sunSoft: "rgba(184, 134, 11, 0.12)",
  ink: "#12121a",
  inkSoft: "#5a5a72",
  bg: "#f4f5f9",
  bgSoft: "#eef1f6",
  surface: "#ffffff",
  border: "rgba(0, 100, 120, 0.16)",
  gridLine: "rgba(0, 100, 120, 0.06)",
  glowCyan: "0 0 16px rgba(0, 143, 163, 0.2)",
  shadow: "0 0 0 1px rgba(0, 100, 120, 0.16), 0 10px 28px rgba(18, 18, 26, 0.08)",
  shadowHover:
    "0 0 0 1px #008fa3, 0 0 20px rgba(0, 143, 163, 0.15), 0 14px 36px rgba(18, 18, 26, 0.1)",
};

// Shared Material UI theme for the dashboard, matched to the website look.
export const dashboardTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: BRAND.sky,
      light: BRAND.skySoft,
      contrastText: "#ffffff",
    },
    secondary: {
      main: BRAND.coral,
      light: BRAND.coralSoft,
      contrastText: "#ffffff",
    },
    background: {
      default: BRAND.bg,
      paper: BRAND.surface,
    },
    text: {
      primary: BRAND.ink,
      secondary: BRAND.inkSoft,
    },
    divider: BRAND.border,
    success: { main: BRAND.mint },
    warning: { main: BRAND.sun },
    error: { main: "#c02648" },
  },
  typography: {
    fontFamily: FONT_SANS,
    h5: { fontWeight: 700, letterSpacing: "-0.02em" },
    h6: { fontWeight: 700, letterSpacing: "-0.02em", fontFamily: FONT_MONO },
    subtitle1: { fontWeight: 600, letterSpacing: "-0.01em" },
    subtitle2: { fontWeight: 600 },
    overline: { fontFamily: FONT_MONO, letterSpacing: "0.08em" },
  },
  shape: {
    borderRadius: 4,
  },
  components: {
    // Buttons echo the website: uppercase mono labels with sharp corners.
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          fontFamily: FONT_MONO,
          fontWeight: 600,
          fontSize: "0.76rem",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          borderRadius: 2,
        },
        outlined: {
          borderColor: BRAND.sky,
        },
      },
    },
    // Chips use square-ish corners; monospace is applied per-use for ids.
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 3,
          fontWeight: 500,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        outlined: {
          borderColor: BRAND.border,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderColor: BRAND.border,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backdropFilter: "blur(14px)",
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: BRAND.surface,
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          "&.Mui-selected": {
            backgroundColor: BRAND.skySoft,
          },
          "&.Mui-selected:hover": {
            backgroundColor: BRAND.skySoft,
          },
        },
      },
    },
  },
});
