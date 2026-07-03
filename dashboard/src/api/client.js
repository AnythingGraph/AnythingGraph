// Thin client over the ag-cli reasoning-service HTTP API.
// No new endpoints are defined here; this only reuses existing routes.

// Resolve the reasoning-service base URL from the Vite env, with a local default.
const DEFAULT_API_BASE = "http://127.0.0.1:8787";

// Return the configured base URL without a trailing slash.
export function getApiBase() {
  const configured = import.meta.env.VITE_AG_API_BASE || DEFAULT_API_BASE;
  return configured.replace(/\/+$/, "");
}

// Perform a GET request and parse the JSON body, throwing on HTTP errors.
async function getJson(path) {
  const response = await fetch(getApiBase() + path, { method: "GET" });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "HTTP " + response.status);
  }
  return response.json();
}

// Perform a POST request and parse the JSON body, throwing on HTTP errors.
async function postJson(path, body) {
  const response = await fetch(getApiBase() + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "HTTP " + response.status);
  }
  return response.json();
}

// GET /health — service liveness and whether auth is required.
export function fetchHealth() {
  return getJson("/health");
}

// GET /playbooks — array of playbook ids.
export function fetchPlaybookIds() {
  return getJson("/playbooks");
}

// GET /playbooks/{id}/context — full summary for one playbook.
export function fetchPlaybookContext(playbookId) {
  return getJson("/playbooks/" + encodeURIComponent(playbookId) + "/context");
}

// GET /sources — configured data sources (connectors) and their state.
export function fetchSources() {
  return getJson("/sources");
}

// POST /catalog/reload — reload playbooks, bindings, and profile from disk.
export function reloadCatalog() {
  return postJson("/catalog/reload", {});
}

// Load every playbook id together with its context in parallel.
export async function fetchAllPlaybooks() {
  const ids = await fetchPlaybookIds();
  const safeIds = Array.isArray(ids) ? ids : [];

  const results = await Promise.all(
    safeIds.map(async function loadOne(playbookId) {
      try {
        const context = await fetchPlaybookContext(playbookId);
        return { id: playbookId, context };
      } catch (error) {
        return { id: playbookId, context: null };
      }
    })
  );

  return results;
}
