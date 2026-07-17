import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  AppBar, Box, Drawer, IconButton, List, ListItemButton, ListItemIcon, ListItemText, Toolbar, Tooltip, Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import MenuOpenIcon from "@mui/icons-material/MenuOpen";
import MenuIcon from "@mui/icons-material/Menu";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import TuneIcon from "@mui/icons-material/Tune";
import SavingsIcon from "@mui/icons-material/Savings";
import { palette } from "../theme";

const drawerWidthExpanded = 248;
const drawerWidthCollapsed = 72;

const navItems = [
  { label: "Plans", to: "/plans", icon: <PeopleAltIcon /> },
  { label: "Global Settings", to: "/settings", icon: <TuneIcon /> },
];

export default function Layout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // A temporary (overlay) drawer should close itself once the user picks a destination.
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const drawerWidth = collapsed ? drawerWidthCollapsed : drawerWidthExpanded;

  const navList = (forceExpanded: boolean) => (
    <List sx={{ px: 1, pt: 2 }}>
      {navItems.map((item) => (
        <Tooltip key={item.to} title={!forceExpanded && collapsed ? item.label : ""} placement="right">
          <ListItemButton
            component={NavLink}
            to={item.to}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              minHeight: 44,
              justifyContent: !forceExpanded && collapsed ? "center" : "flex-start",
              px: !forceExpanded && collapsed ? 1.5 : 2,
              color: "rgba(255,255,255,0.75)",
              "& .MuiListItemIcon-root": { color: "rgba(255,255,255,0.6)", minWidth: !forceExpanded && collapsed ? 0 : 40 },
              "&:hover": { backgroundColor: "rgba(255,255,255,0.06)" },
              "&.active": {
                backgroundColor: "rgba(180,145,60,0.16)",
                color: "#fff",
                borderLeft: `3px solid ${palette.gold}`,
                "& .MuiListItemIcon-root": { color: palette.goldLight },
              },
            }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            {(forceExpanded || !collapsed) && <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 600 }} />}
          </ListItemButton>
        </Tooltip>
      ))}
    </List>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: (t) => t.zIndex.drawer + 1,
          backgroundColor: palette.navy,
          borderBottom: `1px solid ${palette.navyDark}`,
        }}
      >
        <Toolbar sx={{ gap: 1.5 }}>
          <IconButton
            onClick={() => (isMobile ? setMobileOpen((o) => !o) : setCollapsed((c) => !c))}
            sx={{ color: "white", mr: 0.5 }}
            aria-label="Toggle navigation"
          >
            {!isMobile && collapsed ? <MenuIcon /> : <MenuOpenIcon />}
          </IconButton>
          <SavingsIcon sx={{ color: palette.goldLight }} />
          <Typography
            variant="h6"
            noWrap
            sx={{ fontFamily: '"Lora", serif', fontWeight: 700, letterSpacing: "0.01em" }}
          >
            Goals Planning System
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.65)", display: { xs: "none", sm: "block" } }}>
            India Financial Planning Workspace
          </Typography>
        </Toolbar>
      </AppBar>

      {isMobile ? (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            [`& .MuiDrawer-paper`]: {
              width: drawerWidthExpanded,
              boxSizing: "border-box",
              backgroundColor: palette.navy,
              color: "rgba(255,255,255,0.85)",
              borderRight: "none",
            },
          }}
        >
          <Toolbar />
          {navList(true)}
        </Drawer>
      ) : (
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            whiteSpace: "nowrap",
            transition: (t) => t.transitions.create("width", { duration: t.transitions.duration.shortest }),
            [`& .MuiDrawer-paper`]: {
              width: drawerWidth,
              boxSizing: "border-box",
              backgroundColor: palette.navy,
              color: "rgba(255,255,255,0.85)",
              borderRight: "none",
              overflowX: "hidden",
              transition: (t) => t.transitions.create("width", { duration: t.transitions.duration.shortest }),
            },
          }}
        >
          <Toolbar />
          {navList(false)}
        </Drawer>
      )}

      <Box
        component="main"
        sx={{ flexGrow: 1, display: "flex", flexDirection: "column", minHeight: "100vh", minWidth: 0, width: { xs: "100%", sm: "auto" } }}
      >
        <Toolbar />
        <Box sx={{ flexGrow: 1, p: { xs: 2, md: 4 }, overflowX: "hidden" }}>
          <Outlet />
        </Box>
        <Box
          component="footer"
          sx={{
            borderTop: `1px solid ${palette.border}`,
            py: 2,
            px: { xs: 2, md: 4 },
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 1,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            © {new Date().getFullYear()} Goals Planning System — for illustrative planning purposes only, not investment advice.
          </Typography>
          <Typography variant="caption" color="text.secondary">
            All figures in INR (₹)
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
