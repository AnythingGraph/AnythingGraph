import { useContext } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import Box from "@mui/material/Box";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import Avatar from "@mui/material/Avatar";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import CableOutlinedIcon from "@mui/icons-material/CableOutlined";
import HubOutlinedIcon from "@mui/icons-material/HubOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import { DashboardContext } from "../App.jsx";
import { BRAND, FONT_MONO } from "../theme.js";

const DRAWER_WIDTH = 248;

// Menu entries for the left navigation rail.
const MENU_ITEMS = [
  { label: "Playbooks", path: "/playbooks", icon: AccountTreeOutlinedIcon },
  { label: "Connectors", path: "/connectors", icon: CableOutlinedIcon },
];

// Map the connection health status to a Material UI chip appearance.
function getStatusChipProps(status) {
  if (status === "online") {
    return { color: "success", label: "Connected" };
  }
  if (status === "offline") {
    return { color: "error", label: "Offline" };
  }
  return { color: "default", label: "Checking…" };
}

// App shell: top bar, left menu rail, and the routed page content.
export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { health, onReload } = useContext(DashboardContext);

  const statusChipProps = getStatusChipProps(health.status);

  // A menu item is active when the current path starts with its target path.
  function isMenuItemActive(path) {
    return location.pathname === path || location.pathname.startsWith(path + "/");
  }

  return (
    <Box sx={{ display: "flex", height: "100vh", bgcolor: "background.default" }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          bgcolor: "rgba(255, 255, 255, 0.92)",
          color: "text.primary",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Toolbar sx={{ display: "flex", gap: 1.5 }}>
          <Avatar
            variant="rounded"
            sx={{
              width: 36,
              height: 36,
              borderRadius: "4px",
              background: "linear-gradient(135deg, " + BRAND.sky + ", " + BRAND.coral + ")",
              boxShadow: BRAND.glowCyan,
              transform: "rotate(-3deg)",
            }}
          >
            <HubOutlinedIcon fontSize="small" />
          </Avatar>
          <Typography
            variant="h6"
            sx={{ fontFamily: FONT_MONO, fontWeight: 700, letterSpacing: "-0.02em" }}
          >
            AnythingGraph
          </Typography>

          <Box sx={{ flex: 1 }} />

          <Chip
            size="small"
            icon={<FiberManualRecordIcon sx={{ fontSize: "0.7rem !important" }} />}
            color={statusChipProps.color}
            label={statusChipProps.label}
            variant={health.status === "online" ? "filled" : "outlined"}
          />

          <Button
            size="small"
            variant="outlined"
            color="primary"
            startIcon={<RefreshOutlinedIcon />}
            onClick={onReload}
          >
            Reload
          </Button>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            boxSizing: "border-box",
            borderRight: "1px solid",
            borderColor: "divider",
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: "auto", py: 1 }}>
          <List>
            {MENU_ITEMS.map(function renderMenuItem(item) {
              const IconComponent = item.icon;
              const active = isMenuItemActive(item.path);
              return (
                <ListItem key={item.path} disablePadding sx={{ px: 1 }}>
                  <ListItemButton
                    selected={active}
                    onClick={function goToPage() {
                      navigate(item.path);
                    }}
                    sx={{
                      borderRadius: "3px",
                      borderLeft: "2px solid transparent",
                      "&.Mui-selected": {
                        color: "primary.main",
                        borderLeftColor: "primary.main",
                      },
                      "&.Mui-selected .MuiListItemIcon-root": {
                        color: "primary.main",
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <IconComponent />
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      slotProps={{
                        primary: {
                          fontFamily: FONT_MONO,
                          fontSize: "0.85rem",
                          letterSpacing: "0.02em",
                          fontWeight: active ? 700 : 500,
                        },
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Box>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          overflow: "hidden",
          backgroundColor: "background.default",
          backgroundImage:
            "linear-gradient(" +
            BRAND.gridLine +
            " 1px, transparent 1px), linear-gradient(90deg, " +
            BRAND.gridLine +
            " 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      >
        <Toolbar />
        <Box sx={{ flex: 1, minHeight: 0, overflow: "auto" }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
