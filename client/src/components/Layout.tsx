import { NavLink, Outlet } from "react-router-dom";
import { AppBar, Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography } from "@mui/material";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import TuneIcon from "@mui/icons-material/Tune";
import SavingsIcon from "@mui/icons-material/Savings";

const drawerWidth = 240;

const navItems = [
  { label: "Clients", to: "/clients", icon: <PeopleAltIcon /> },
  { label: "Global Settings", to: "/settings", icon: <TuneIcon /> },
];

export default function Layout() {
  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }} color="primary" elevation={0}>
        <Toolbar sx={{ gap: 1 }}>
          <SavingsIcon />
          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 700 }}>
            Goals Planning System
          </Typography>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: "border-box" },
        }}
      >
        <Toolbar />
        <List sx={{ px: 1, pt: 1 }}>
          {navItems.map((item) => (
            <ListItemButton
              key={item.to}
              component={NavLink}
              to={item.to}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                "&.active": { backgroundColor: "primary.main", color: "white", "& .MuiListItemIcon-root": { color: "white" } },
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, bgcolor: "background.default", minHeight: "100vh" }}>
        <Toolbar />
        <Box sx={{ p: { xs: 2, md: 4 } }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
