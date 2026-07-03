import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Tooltip from "@mui/material/Tooltip";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import LockOpenOutlinedIcon from "@mui/icons-material/LockOpenOutlined";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import TimelineOutlinedIcon from "@mui/icons-material/TimelineOutlined";
import AltRouteOutlinedIcon from "@mui/icons-material/AltRouteOutlined";
import ArrowForwardOutlinedIcon from "@mui/icons-material/ArrowForwardOutlined";
import { fetchPlaybookContext } from "../api/client.js";
import { DashboardContext } from "../App.jsx";
import PlaybookGraph from "../components/PlaybookGraph.jsx";
import { FONT_MONO, BRAND } from "../theme.js";

// Small titled section used inside the right-hand details panel.
function DetailSection({ icon, title, children }) {
  return (
    <Box sx={{ mb: 2.5 }}>
      <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", mb: 1 }}>
        {icon}
        <Typography
          variant="overline"
          color="text.secondary"
          sx={{ fontWeight: 700, letterSpacing: "0.06em" }}
        >
          {title}
        </Typography>
      </Stack>
      {children}
    </Box>
  );
}

// Detail page: playbook header, entity/relationship graph, and a details panel.
export default function PlaybookDetailPage() {
  const { playbookId } = useParams();
  const navigate = useNavigate();
  const { reloadNonce } = useContext(DashboardContext);
  const [context, setContext] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEntity, setSelectedEntity] = useState(null);

  useEffect(
    function loadContext() {
      let cancelled = false;
      setLoading(true);
      setError(null);
      setSelectedEntity(null);

      fetchPlaybookContext(playbookId)
        .then(function handleData(data) {
          if (!cancelled) {
            setContext(data);
            setLoading(false);
          }
        })
        .catch(function handleError(err) {
          if (!cancelled) {
            setError(err.message || "Failed to load playbook");
            setLoading(false);
          }
        });

      return function cleanup() {
        cancelled = true;
      };
    },
    [playbookId, reloadNonce]
  );

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !context) {
    return (
      <Box sx={{ p: 3 }}>
        <Button
          startIcon={<ArrowBackOutlinedIcon />}
          onClick={function goBack() {
            navigate("/playbooks");
          }}
          sx={{ mb: 2 }}
        >
          Back to playbooks
        </Button>
        <Alert severity="error">{error || "Playbook not found."}</Alert>
      </Box>
    );
  }

  const entitySources = context.entity_sources || {};

  // Collect the distinct source keys used by this playbook for the routing view.
  const sourceKeys = [];
  Object.keys(entitySources).forEach(function collect(entityName) {
    const key = entitySources[entityName];
    if (key && sourceKeys.indexOf(key) === -1) {
      sourceKeys.push(key);
    }
  });

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <Box sx={{ px: 3, pt: 2.5, pb: 2 }}>
        <Button
          startIcon={<ArrowBackOutlinedIcon />}
          onClick={function goBack() {
            navigate("/playbooks");
          }}
          sx={{ mb: 1.5 }}
        >
          Back to playbooks
        </Button>

        <Stack
          direction="row"
          spacing={1.5}
          sx={{ alignItems: "center", flexWrap: "wrap" }}
        >
          <Typography variant="h5">{context.name || playbookId}</Typography>
          <Chip
            size="small"
            label={context.id || playbookId}
            variant="outlined"
            sx={{ fontFamily: FONT_MONO }}
          />
          {context.rebac_enforced ? (
            <Chip
              size="small"
              color="secondary"
              icon={<VerifiedUserOutlinedIcon />}
              label={"ReBAC · subject: " + (context.rebac_subject_entity || "—")}
            />
          ) : (
            <Chip
              size="small"
              color="warning"
              variant="outlined"
              icon={<LockOpenOutlinedIcon />}
              label="No access control"
            />
          )}
        </Stack>

        {context.description ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, maxWidth: 900 }}>
            {context.description}
          </Typography>
        ) : null}
      </Box>

      {/* Graph + details */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          gap: 2,
          px: 3,
          pb: 3,
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <PlaybookGraph
            context={context}
            selectedEntity={selectedEntity}
            onSelectEntity={setSelectedEntity}
          />
        </Box>

        <Paper
          variant="outlined"
          sx={{
            width: 320,
            flexShrink: 0,
            borderRadius: 3,
            p: 2,
            overflow: "auto",
          }}
        >
          <DetailSection
            icon={<CategoryOutlinedIcon fontSize="small" color="action" />}
            title={"Entities · " + context.entities.length}
          >
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {context.entities.map(function renderEntity(entity) {
                const sourceKey = entitySources[entity.name] || "";
                const isSubject =
                  context.rebac_enforced && entity.name === context.rebac_subject_entity;
                const isSelected = entity.name === selectedEntity;
                return (
                  <Box
                    key={entity.name}
                    onClick={function selectEntity() {
                      setSelectedEntity(entity.name);
                    }}
                    sx={{
                      cursor: "pointer",
                      border: "1px solid",
                      borderColor: isSelected
                        ? "primary.main"
                        : isSubject
                        ? "secondary.main"
                        : "divider",
                      bgcolor: isSelected ? "primary.light" : "background.default",
                      borderRadius: 2,
                      px: 1,
                      py: 0.75,
                    }}
                  >
                    <Typography variant="body2" fontWeight={600}>
                      {entity.display_name || entity.name}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontFamily: FONT_MONO }}
                    >
                      {"id: " + (entity.identifier_field || "—")}
                      {sourceKey ? " · " + sourceKey : ""}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </DetailSection>

          <Divider sx={{ my: 1.5 }} />

          <DetailSection
            icon={<TimelineOutlinedIcon fontSize="small" color="action" />}
            title={"Relationships · " + context.relationships.length}
          >
            {context.relationships.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No relationships.
              </Typography>
            ) : (
              context.relationships.map(function renderRelationship(relationship) {
                return (
                  <Tooltip
                    key={relationship.name}
                    arrow
                    placement="left"
                    slotProps={{
                      tooltip: {
                        sx: {
                          bgcolor: "background.paper",
                          color: "text.primary",
                          border: "1px solid",
                          borderColor: "divider",
                          boxShadow: BRAND.shadow,
                        },
                      },
                      arrow: {
                        sx: {
                          color: "background.paper",
                        },
                      },
                    }}
                    title={
                      <Stack
                        direction="row"
                        spacing={0.5}
                        sx={{ alignItems: "center", py: 0.25 }}
                      >
                        <Chip
                          size="small"
                          label={relationship.subject_entity_name}
                          sx={{ fontFamily: FONT_MONO, height: 20 }}
                        />
                        <ArrowForwardOutlinedIcon sx={{ fontSize: 14 }} />
                        <Chip
                          size="small"
                          label={relationship.object_entity_name}
                          sx={{ fontFamily: FONT_MONO, height: 20 }}
                        />
                      </Stack>
                    }
                  >
                    <Stack
                      direction="row"
                      spacing={0.75}
                      sx={{
                        alignItems: "center",
                        py: 0.6,
                        px: 0.75,
                        borderRadius: "3px",
                        cursor: "default",
                        "&:hover": { bgcolor: BRAND.skySoft },
                      }}
                    >
                      <ArrowForwardOutlinedIcon fontSize="small" color="primary" />
                      <Typography
                        variant="body2"
                        sx={{ fontFamily: FONT_MONO, fontWeight: 600 }}
                      >
                        {relationship.name}
                      </Typography>
                    </Stack>
                  </Tooltip>
                );
              })
            )}
          </DetailSection>

          <Divider sx={{ my: 1.5 }} />

          <DetailSection
            icon={<AltRouteOutlinedIcon fontSize="small" color="action" />}
            title="Source routing"
          >
            {sourceKeys.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No source routing.
              </Typography>
            ) : (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {sourceKeys.map(function renderRouting(sourceKey) {
                  return (
                    <Chip
                      key={sourceKey}
                      size="small"
                      color="secondary"
                      variant="outlined"
                      label={sourceKey}
                      sx={{ fontFamily: FONT_MONO }}
                    />
                  );
                })}
              </Box>
            )}
          </DetailSection>
        </Paper>
      </Box>
    </Box>
  );
}
