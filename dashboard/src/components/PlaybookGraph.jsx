import { useEffect, useRef, useState, useCallback } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { BRAND, FONT_MONO, FONT_SANS } from "../theme.js";

// Graph colours aligned with the AnythingGraph website palette.
const EDGE_COLOR = "rgba(0, 100, 120, 0.3)";
const NODE_BORDER = "rgba(0, 100, 120, 0.3)";

// Build graph nodes and edges from a playbook context summary.
function buildGraphModel(context) {
  const entitySources = context.entity_sources || {};
  const subjectEntity = context.rebac_enforced ? context.rebac_subject_entity : null;
  const entityCount = context.entities.length;

  const nodes = context.entities.map(function toNode(entity, index) {
    const angle = (index / Math.max(1, entityCount)) * Math.PI * 2;
    return {
      name: entity.name,
      displayName: entity.display_name || entity.name,
      identifier: entity.identifier_field || "",
      sourceKey: entitySources[entity.name] || "",
      isSubject: entity.name === subjectEntity,
      x: 400 + Math.cos(angle) * 210,
      y: 300 + Math.sin(angle) * 190,
      vx: 0,
      vy: 0,
    };
  });

  const nodeByName = {};
  nodes.forEach(function indexNode(node) {
    nodeByName[node.name] = node;
  });

  const edges = [];
  context.relationships.forEach(function toEdge(relationship) {
    const fromNode = nodeByName[relationship.subject_entity_name];
    const toNode = nodeByName[relationship.object_entity_name];
    if (fromNode && toNode) {
      edges.push({
        fromName: fromNode.name,
        toName: toNode.name,
        name: relationship.name,
      });
    }
  });

  return { nodes, edges };
}

// Run a simple force-directed layout, mutating node positions in place.
function runForceLayout(nodes, edges, width, height) {
  const centerX = width / 2;
  const centerY = height / 2;
  const iterations = 200;
  const repulsionStrength = 14000;
  const attractionStrength = 0.04;
  const idealDistance = 280;
  const centerStrength = 0.018;
  const damping = 0.82;
  const minNodeGap = 60;

  const nodeByName = {};
  const dimensionsByName = {};
  nodes.forEach(function indexNode(node) {
    nodeByName[node.name] = node;
    dimensionsByName[node.name] = getNodeDimensions(node);
  });

  for (let step = 0; step < iterations; step += 1) {
    // Repel every pair of nodes.
    for (let i = 0; i < nodes.length; i += 1) {
      for (let j = i + 1; j < nodes.length; j += 1) {
        const nodeA = nodes[i];
        const nodeB = nodes[j];
        const deltaX = nodeA.x - nodeB.x;
        const deltaY = nodeA.y - nodeB.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY) || 1;
        const force = repulsionStrength / (distance * distance);
        const unitX = deltaX / distance;
        const unitY = deltaY / distance;
        nodeA.vx += unitX * force;
        nodeA.vy += unitY * force;
        nodeB.vx -= unitX * force;
        nodeB.vy -= unitY * force;
      }
    }

    // Attract connected nodes toward the ideal spacing.
    edges.forEach(function pullEdge(edge) {
      const fromNode = nodeByName[edge.fromName];
      const toNode = nodeByName[edge.toName];
      const deltaX = toNode.x - fromNode.x;
      const deltaY = toNode.y - fromNode.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY) || 1;
      const displacement = (distance - idealDistance) * attractionStrength;
      const unitX = deltaX / distance;
      const unitY = deltaY / distance;
      fromNode.vx += unitX * displacement;
      fromNode.vy += unitY * displacement;
      toNode.vx -= unitX * displacement;
      toNode.vy -= unitY * displacement;
    });

    // Pull toward the center, integrate, damp, and clamp inside the canvas.
    nodes.forEach(function integrate(node) {
      node.vx += (centerX - node.x) * centerStrength;
      node.vy += (centerY - node.y) * centerStrength;
      node.x += node.vx;
      node.y += node.vy;
      node.vx *= damping;
      node.vy *= damping;
      node.x = Math.max(80, Math.min(width - 80, node.x));
      node.y = Math.max(55, Math.min(height - 55, node.y));
    });

    // Hard separation: push apart any node boxes that overlap (plus a gap).
    for (let i = 0; i < nodes.length; i += 1) {
      for (let j = i + 1; j < nodes.length; j += 1) {
        const nodeA = nodes[i];
        const nodeB = nodes[j];
        const dimsA = dimensionsByName[nodeA.name];
        const dimsB = dimensionsByName[nodeB.name];
        const minGapX = dimsA.width / 2 + dimsB.width / 2 + minNodeGap;
        const minGapY = dimsA.height / 2 + dimsB.height / 2 + minNodeGap;
        const gapX = nodeA.x - nodeB.x;
        const gapY = nodeA.y - nodeB.y;
        const overlapX = minGapX - Math.abs(gapX);
        const overlapY = minGapY - Math.abs(gapY);

        // Only resolve when the boxes overlap on both axes.
        if (overlapX > 0 && overlapY > 0) {
          // Separate along the axis needing the least movement.
          if (overlapX < overlapY) {
            const shift = (overlapX / 2) * (gapX >= 0 ? 1 : -1);
            nodeA.x += shift;
            nodeB.x -= shift;
          } else {
            const shift = (overlapY / 2) * (gapY >= 0 ? 1 : -1);
            nodeA.y += shift;
            nodeB.y -= shift;
          }
        }
      }
    }
  }
}

// Find the point on a node's rectangle border along the direction toward a
// target point, so edges attach to the side of the box instead of its center.
function getBoundaryPoint(node, dimensions, targetX, targetY) {
  const deltaX = targetX - node.x;
  const deltaY = targetY - node.y;
  if (deltaX === 0 && deltaY === 0) {
    return { x: node.x, y: node.y };
  }
  const halfWidth = dimensions.width / 2;
  const halfHeight = dimensions.height / 2;
  const scaleX = deltaX !== 0 ? halfWidth / Math.abs(deltaX) : Infinity;
  const scaleY = deltaY !== 0 ? halfHeight / Math.abs(deltaY) : Infinity;
  const scale = Math.min(scaleX, scaleY);
  return {
    x: node.x + deltaX * scale,
    y: node.y + deltaY * scale,
  };
}

// Compute a node box size from its text content.
function getNodeDimensions(node) {
  const longest = Math.max(
    node.displayName.length,
    node.identifier ? node.identifier.length + 4 : 0,
    node.sourceKey ? node.sourceKey.length + 4 : 0
  );
  const width = Math.max(128, Math.min(224, longest * 8 + 30));
  const height = node.sourceKey ? 66 : 52;
  return { width, height };
}

// Interactive SVG graph of a playbook's entities and relationships.
export default function PlaybookGraph({ context, selectedEntity, onSelectEntity }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const dragStateRef = useRef(null);
  const [size, setSize] = useState({ width: 800, height: 560 });
  const [model, setModel] = useState({ nodes: [], edges: [] });

  // Track the container size so the layout can fill the available space.
  useEffect(function observeContainerSize() {
    function measure() {
      if (!containerRef.current) {
        return;
      }
      const rect = containerRef.current.getBoundingClientRect();
      setSize({
        width: Math.max(420, rect.width),
        height: Math.max(420, rect.height),
      });
    }
    measure();
    window.addEventListener("resize", measure);
    return function cleanup() {
      window.removeEventListener("resize", measure);
    };
  }, []);

  // Rebuild the model and re-run layout whenever the playbook or size changes.
  useEffect(
    function rebuildModel() {
      if (!context) {
        setModel({ nodes: [], edges: [] });
        return;
      }
      const built = buildGraphModel(context);
      runForceLayout(built.nodes, built.edges, size.width, size.height);
      setModel(built);
    },
    [context, size.width, size.height]
  );

  // Convert a client (screen) point into SVG coordinate space.
  const clientToSvgPoint = useCallback(function clientToSvgPoint(clientX, clientY) {
    const svg = svgRef.current;
    const point = svg.createSVGPoint();
    point.x = clientX;
    point.y = clientY;
    return point.matrixTransform(svg.getScreenCTM().inverse());
  }, []);

  // Begin dragging a node; distinguish a click from an actual drag.
  function handleNodePointerDown(event, nodeName) {
    event.preventDefault();
    event.stopPropagation();
    const startPoint = clientToSvgPoint(event.clientX, event.clientY);
    const draggedNode = model.nodes.find(function match(node) {
      return node.name === nodeName;
    });
    if (!draggedNode) {
      return;
    }
    dragStateRef.current = {
      nodeName,
      offsetX: draggedNode.x - startPoint.x,
      offsetY: draggedNode.y - startPoint.y,
      moved: false,
    };

    function onMove(moveEvent) {
      const dragState = dragStateRef.current;
      if (!dragState) {
        return;
      }
      const movePoint = clientToSvgPoint(moveEvent.clientX, moveEvent.clientY);
      dragState.moved = true;
      setModel(function updatePositions(previous) {
        const nextNodes = previous.nodes.map(function moveNode(node) {
          if (node.name !== dragState.nodeName) {
            return node;
          }
          let nextX = movePoint.x + dragState.offsetX;
          let nextY = movePoint.y + dragState.offsetY;
          nextX = Math.max(80, Math.min(size.width - 80, nextX));
          nextY = Math.max(55, Math.min(size.height - 55, nextY));
          return { ...node, x: nextX, y: nextY };
        });
        return { nodes: nextNodes, edges: previous.edges };
      });
    }

    function onUp() {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      const dragState = dragStateRef.current;
      if (dragState && !dragState.moved && onSelectEntity) {
        onSelectEntity(dragState.nodeName);
      }
      dragStateRef.current = null;
    }

    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
  }

  const nodeByName = {};
  model.nodes.forEach(function indexNode(node) {
    nodeByName[node.name] = node;
  });

  return (
    <Box
      ref={containerRef}
      sx={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: 420,
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        background:
          "radial-gradient(circle at 30% 20%, #ffffff, " + BRAND.bg + ")",
        overflow: "hidden",
      }}
    >
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox={"0 0 " + size.width + " " + size.height}
        style={{ display: "block" }}
      >
        <defs>
          <marker
            id="graph-arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" fill={EDGE_COLOR} />
          </marker>
        </defs>

        {model.edges.map(function renderEdge(edge, index) {
          const fromNode = nodeByName[edge.fromName];
          const toNode = nodeByName[edge.toName];
          if (!fromNode || !toNode) {
            return null;
          }
          // Attach each end to the border of its node facing the other node.
          const fromDimensions = getNodeDimensions(fromNode);
          const toDimensions = getNodeDimensions(toNode);
          const start = getBoundaryPoint(fromNode, fromDimensions, toNode.x, toNode.y);
          const end = getBoundaryPoint(toNode, toDimensions, fromNode.x, fromNode.y);
          const midX = (start.x + end.x) / 2;
          const midY = (start.y + end.y) / 2;
          return (
            <g key={"edge-" + index}>
              <line
                x1={start.x}
                y1={start.y}
                x2={end.x}
                y2={end.y}
                stroke={EDGE_COLOR}
                strokeWidth={1.5}
                markerEnd="url(#graph-arrow)"
              />
              <text
                x={midX}
                y={midY - 5}
                textAnchor="middle"
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: 10,
                  fill: BRAND.inkSoft,
                }}
              >
                {edge.name}
              </text>
            </g>
          );
        })}

        {model.nodes.map(function renderNode(node) {
          const dimensions = getNodeDimensions(node);
          const boxX = node.x - dimensions.width / 2;
          const boxY = node.y - dimensions.height / 2;
          const isSelected = node.name === selectedEntity;

          let strokeColor = NODE_BORDER;
          let fillColor = "#ffffff";
          let strokeWidth = 1.5;
          if (node.isSubject) {
            strokeColor = BRAND.sky;
            fillColor = BRAND.skySoft;
            strokeWidth = 2;
          }
          if (isSelected) {
            strokeColor = BRAND.coral;
            strokeWidth = 2.5;
          }

          return (
            <g
              key={"node-" + node.name}
              style={{ cursor: "grab" }}
              onPointerDown={function onDown(event) {
                handleNodePointerDown(event, node.name);
              }}
            >
              <rect
                x={boxX}
                y={boxY}
                width={dimensions.width}
                height={dimensions.height}
                rx={12}
                fill={fillColor}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
              />
              <text
                x={node.x}
                y={boxY + 22}
                textAnchor="middle"
                style={{
                  fontFamily: FONT_SANS,
                  fontSize: 13,
                  fontWeight: 700,
                  fill: BRAND.ink,
                }}
              >
                {node.displayName}
              </text>
              {node.identifier ? (
                <text
                  x={node.x}
                  y={boxY + 38}
                  textAnchor="middle"
                  style={{
                    fontFamily: FONT_MONO,
                    fontSize: 10,
                    fill: BRAND.inkSoft,
                  }}
                >
                  {"id: " + node.identifier}
                </text>
              ) : null}
              {node.sourceKey ? (
                <text
                  x={node.x}
                  y={boxY + 54}
                  textAnchor="middle"
                  style={{
                    fontFamily: FONT_MONO,
                    fontSize: 9,
                    fill: BRAND.sky,
                  }}
                >
                  {"\u25C6 " + node.sourceKey}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>

      {model.nodes.length === 0 ? (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography color="text.secondary">No entities to display.</Typography>
        </Box>
      ) : (
        <Typography
          variant="caption"
          sx={{
            position: "absolute",
            left: 12,
            bottom: 10,
            color: "text.secondary",
            bgcolor: "rgba(255,255,255,0.8)",
            px: 1,
            py: 0.25,
            borderRadius: 999,
            pointerEvents: "none",
          }}
        >
          Drag nodes to rearrange · click a node for details
        </Typography>
      )}
    </Box>
  );
}
