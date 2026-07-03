import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import LockOpenOutlinedIcon from "@mui/icons-material/LockOpenOutlined";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import TimelineOutlinedIcon from "@mui/icons-material/TimelineOutlined";
import { fetchAllPlaybooks } from "../api/client.js";
import { DashboardContext } from "../App.jsx";
import { FONT_MONO, BRAND } from "../theme.js";

// Landing page: a card grid of every playbook known to the reasoning-service.
export default function PlaybooksPage() {
  const navigate = useNavigate();
  const { reloadNonce } = useContext(DashboardContext);
  const [playbooks, setPlaybooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(
    function loadPlaybooks() {
      let cancelled = false;
      setLoading(true);
      setError(null);

      fetchAllPlaybooks()
        .then(function handleData(results) {
          if (!cancelled) {
            setPlaybooks(results);
            setLoading(false);
          }
        })
        .catch(function handleError(err) {
          if (!cancelled) {
            setError(err.message || "Failed to load playbooks");
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
          Could not reach the reasoning-service. {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Playbooks
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {playbooks.length} playbook{playbooks.length === 1 ? "" : "s"} loaded. Click one to
        explore its entities and relationships.
      </Typography>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
        {playbooks.map(function renderCard(item) {
          const context = item.context;
          const displayName = context && context.name ? context.name : item.id;
          const description = context && context.description ? context.description : "";
          const entityCount = context && context.entities ? context.entities.length : 0;
          const relationshipCount =
            context && context.relationships ? context.relationships.length : 0;
          const rebacEnforced = context && context.rebac_enforced;

          return (
            <Card
              key={item.id}
              variant="outlined"
              sx={{
                width: 340,
                transition: "box-shadow 0.2s ease, border-color 0.2s ease, transform 0.2s ease",
                "&:hover": {
                  boxShadow: BRAND.shadowHover,
                  borderColor: "primary.main",
                  transform: "translateY(-2px)",
                },
              }}
            >
              <CardActionArea
                onClick={function openDetail() {
                  navigate("/playbooks/" + encodeURIComponent(item.id));
                }}
                sx={{ height: "100%" }}
              >
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
                    <Avatar
                      variant="rounded"
                      sx={{ bgcolor: "primary.light", color: "primary.main" }}
                    >
                      <AccountTreeOutlinedIcon />
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="subtitle1" fontWeight={700} noWrap>
                        {displayName}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontFamily: FONT_MONO }}
                        noWrap
                      >
                        {item.id}
                      </Typography>
                    </Box>
                  </Box>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mb: 2,
                      minHeight: 40,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {description || "No description provided."}
                  </Typography>

                  <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                    <Chip
                      size="small"
                      icon={<CategoryOutlinedIcon />}
                      label={entityCount + " entities"}
                      variant="outlined"
                    />
                    <Chip
                      size="small"
                      icon={<TimelineOutlinedIcon />}
                      label={relationshipCount + " links"}
                      variant="outlined"
                    />
                    {rebacEnforced ? (
                      <Chip
                        size="small"
                        color="secondary"
                        icon={<VerifiedUserOutlinedIcon />}
                        label="ReBAC"
                      />
                    ) : (
                      <Chip
                        size="small"
                        color="warning"
                        variant="outlined"
                        icon={<LockOpenOutlinedIcon />}
                        label="Open"
                      />
                    )}
                  </Stack>
                </CardContent>
              </CardActionArea>
            </Card>
          );
        })}
      </Box>
    </Box>
  );
}
