import { useState, useEffect, useContext } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Avatar from "@mui/material/Avatar";
import Tooltip from "@mui/material/Tooltip";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import StorageOutlinedIcon from "@mui/icons-material/StorageOutlined";
import CloudOutlinedIcon from "@mui/icons-material/CloudOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import ApiOutlinedIcon from "@mui/icons-material/ApiOutlined";
import DatasetOutlinedIcon from "@mui/icons-material/DatasetOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutlineOutlined";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import { fetchSources } from "../api/client.js";
import { DashboardContext } from "../App.jsx";
import { FONT_MONO } from "../theme.js";

// Metadata describing how each adapter should be labelled and iconised.
const ADAPTER_META = {
  sql: { label: "PostgreSQL", icon: StorageOutlinedIcon },
  mysql: { label: "MySQL", icon: StorageOutlinedIcon },
  mssql: { label: "SQL Server", icon: StorageOutlinedIcon },
  mongodb: { label: "MongoDB", icon: DatasetOutlinedIcon },
  soql: { label: "Salesforce", icon: CloudOutlinedIcon },
  csv: { label: "CSV file", icon: DescriptionOutlinedIcon },
  rest: { label: "REST API", icon: ApiOutlinedIcon },
};

// Resolve the friendly label and icon for a given adapter key.
function getAdapterMeta(adapter) {
  return ADAPTER_META[adapter] || { label: adapter, icon: DatasetOutlinedIcon };
}

// Derive a connection-status descriptor from a source summary.
function getConnectionStatus(source) {
  const hasConnection = source.has_dsn || source.has_instance_url;
  if (hasConnection) {
    return { label: "Connected", color: "success", icon: CheckCircleOutlineIcon };
  }
  // /sources only reports dsn / instance_url, so file- and url-based adapters
  // are shown as neutral rather than misreported as missing credentials.
  if (source.adapter === "csv") {
    return { label: "File-based", color: "default", icon: InsertDriveFileOutlinedIcon };
  }
  if (source.adapter === "rest") {
    return { label: "URL-based", color: "default", icon: InsertDriveFileOutlinedIcon };
  }
  return { label: "Needs credentials", color: "warning", icon: ErrorOutlineIcon };
}

// Connectors page: every configured data source and its connection status.
export default function ConnectorsPage() {
  const { reloadNonce } = useContext(DashboardContext);
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(
    function loadSources() {
      let cancelled = false;
      setLoading(true);
      setError(null);

      fetchSources()
        .then(function handleData(data) {
          if (!cancelled) {
            setSources(Array.isArray(data) ? data : []);
            setLoading(false);
          }
        })
        .catch(function handleError(err) {
          if (!cancelled) {
            setError(err.message || "Failed to load connectors");
            setLoading(false);
          }
        });

      return function cleanup() {
        cancelled = true;
      };
    },
    [reloadNonce]
  );

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Could not load connectors. {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Connectors
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {sources.length} data source{sources.length === 1 ? "" : "s"} defined in the active
        profile.
      </Typography>

      {sources.length === 0 ? (
        <Alert severity="info">No connectors are configured in the current profile.</Alert>
      ) : (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
          {sources.map(function renderConnector(source) {
            const meta = getAdapterMeta(source.adapter);
            const status = getConnectionStatus(source);
            const IconComponent = meta.icon;
            const StatusIcon = status.icon;

            return (
              <Paper
                key={source.source_id}
                variant="outlined"
                sx={{
                  width: 320,
                  borderRadius: 3,
                  p: 2,
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.5,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Avatar
                    variant="rounded"
                    sx={{ bgcolor: "secondary.light", color: "secondary.main" }}
                  >
                    <IconComponent />
                  </Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="subtitle1" fontWeight={700} noWrap>
                      {meta.label}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontFamily: FONT_MONO }}
                      noWrap
                    >
                      {source.source_id}
                    </Typography>
                  </Box>
                </Box>

                <Stack
                  direction="row"
                  sx={{ alignItems: "center", justifyContent: "space-between" }}
                >
                  <Chip
                    size="small"
                    label={source.adapter}
                    variant="outlined"
                    sx={{ fontFamily: FONT_MONO }}
                  />
                  <Tooltip title={source.authoring_next_step || ""}>
                    <Chip
                      size="small"
                      color={status.color}
                      icon={<StatusIcon />}
                      label={status.label}
                      variant={status.color === "default" ? "outlined" : "filled"}
                    />
                  </Tooltip>
                </Stack>
              </Paper>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
