import { createTheme } from "@mui/material/styles";

// A "private banking" palette: deep navy for structure/trust, muted gold for accents
// and calls to action, restrained status colors so charts and chips stay legible.
export const palette = {
  navy: "#132C43",
  navyDark: "#0B1D2E",
  navyLight: "#25486A",
  gold: "#B4913C",
  goldLight: "#D4B968",
  paper: "#FFFFFF",
  backgroundDefault: "#F3F5F8",
  border: "#E2E6EC",
  textPrimary: "#152233",
  textSecondary: "#5B6B7F",
  success: "#1E7F5C",
  warning: "#B4791C",
  error: "#B23B3B",
};

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: palette.navy, light: palette.navyLight, dark: palette.navyDark, contrastText: "#FFFFFF" },
    secondary: { main: palette.gold, light: palette.goldLight, dark: "#8E7130", contrastText: "#1A1204" },
    success: { main: palette.success },
    warning: { main: palette.warning },
    error: { main: palette.error },
    background: { default: palette.backgroundDefault, paper: palette.paper },
    text: { primary: palette.textPrimary, secondary: palette.textSecondary },
    divider: palette.border,
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: '"Inter", "Segoe UI", Roboto, sans-serif',
    h4: { fontWeight: 800, letterSpacing: "-0.02em" },
    h5: { fontWeight: 700, letterSpacing: "-0.01em" },
    h6: { fontWeight: 700 },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600, color: palette.textSecondary },
    button: { fontWeight: 600 },
  },
  shadows: [
    "none",
    "0 1px 2px rgba(15,36,54,0.06)",
    "0 1px 3px rgba(15,36,54,0.08)",
    "0 2px 6px rgba(15,36,54,0.08)",
    "0 2px 8px rgba(15,36,54,0.09)",
    "0 4px 10px rgba(15,36,54,0.10)",
    "0 4px 12px rgba(15,36,54,0.10)",
    "0 6px 16px rgba(15,36,54,0.11)",
    "0 6px 18px rgba(15,36,54,0.12)",
    "0 8px 20px rgba(15,36,54,0.12)",
    "0 8px 22px rgba(15,36,54,0.13)",
    "0 10px 24px rgba(15,36,54,0.13)",
    "0 10px 26px rgba(15,36,54,0.14)",
    "0 12px 28px rgba(15,36,54,0.14)",
    "0 12px 30px rgba(15,36,54,0.15)",
    "0 14px 32px rgba(15,36,54,0.15)",
    "0 14px 34px rgba(15,36,54,0.16)",
    "0 16px 36px rgba(15,36,54,0.16)",
    "0 16px 38px rgba(15,36,54,0.17)",
    "0 18px 40px rgba(15,36,54,0.17)",
    "0 18px 42px rgba(15,36,54,0.18)",
    "0 20px 44px rgba(15,36,54,0.18)",
    "0 20px 46px rgba(15,36,54,0.19)",
    "0 22px 48px rgba(15,36,54,0.19)",
    "0 22px 50px rgba(15,36,54,0.20)",
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: palette.backgroundDefault },
        "::selection": { backgroundColor: "rgba(180,145,60,0.25)" },
      },
    },
    MuiPaper: {
      styleOverrides: { root: { backgroundImage: "none" } },
    },
    MuiCard: {
      defaultProps: { variant: "outlined" },
      styleOverrides: {
        root: {
          borderColor: palette.border,
          borderRadius: 14,
          transition: "box-shadow 0.15s ease, border-color 0.15s ease",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { textTransform: "none", fontWeight: 600, borderRadius: 8, paddingInline: 16 },
        containedPrimary: {
          boxShadow: "none",
          "&:hover": { boxShadow: "0 4px 10px rgba(19,44,67,0.25)" },
        },
        outlined: { borderWidth: 1.5, "&:hover": { borderWidth: 1.5 } },
      },
    },
    MuiTextField: { defaultProps: { size: "small" } },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: "#FCFDFE",
          "& fieldset": { borderColor: palette.border },
          "&:hover fieldset": { borderColor: palette.navyLight },
          "&.Mui-focused fieldset": { borderColor: palette.navy, borderWidth: 1.5 },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: { root: { fontWeight: 500 } },
    },
    MuiChip: {
      styleOverrides: { root: { fontWeight: 600, borderRadius: 6 } },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          "& .MuiTableCell-root": {
            fontWeight: 700,
            fontSize: "0.72rem",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            color: palette.textSecondary,
            backgroundColor: "#F7F9FB",
            borderBottom: `1px solid ${palette.border}`,
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: { root: { borderBottom: `1px solid ${palette.border}` } },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          "&:hover": { backgroundColor: "rgba(19,44,67,0.03)" },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: { height: 3, borderRadius: 3, backgroundColor: palette.gold },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          fontSize: "0.9rem",
          "&.Mui-selected": { color: palette.navy },
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: { root: { fontWeight: 700, fontSize: "1.15rem" } },
    },
    MuiDialog: {
      styleOverrides: { paper: { borderRadius: 16 } },
    },
    MuiAlert: {
      styleOverrides: { root: { borderRadius: 10 } },
    },
  },
});
