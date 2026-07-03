import { useState, useEffect, useCallback, createContext } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "./components/DashboardLayout.jsx";
import PlaybooksPage from "./pages/PlaybooksPage.jsx";
import PlaybookDetailPage from "./pages/PlaybookDetailPage.jsx";
import ConnectorsPage from "./pages/ConnectorsPage.jsx";
import { fetchHealth, reloadCatalog } from "./api/client.js";

// Shared context so every page can read connection health and trigger a reload.
export const DashboardContext = createContext(null);

// Root component: owns connection state and defines the route table.
export default function App() {
  const [health, setHealth] = useState({ status: "checking" });
  const [reloadNonce, setReloadNonce] = useState(0);

  // Ping /health and record whether the service is reachable.
  const checkHealth = useCallback(async function checkHealth() {
    setHealth({ status: "checking" });
    try {
      const data = await fetchHealth();
      setHealth({ status: "online", authRequired: Boolean(data.auth_required) });
    } catch (error) {
      setHealth({ status: "offline" });
    }
  }, []);

  useEffect(
    function runInitialHealthCheck() {
      checkHealth();
    },
    [checkHealth]
  );

  // Reload the catalog from disk, then refresh health and re-fetch page data.
  const handleReload = useCallback(
    async function handleReload() {
      try {
        await reloadCatalog();
      } catch (error) {
        // Ignore reload failures here; the connection chip will reflect status.
      }
      await checkHealth();
      setReloadNonce(function bump(previous) {
        return previous + 1;
      });
    },
    [checkHealth]
  );

  return (
    <DashboardContext.Provider value={{ health, reloadNonce, onReload: handleReload }}>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/playbooks" replace />} />
          <Route path="playbooks" element={<PlaybooksPage />} />
          <Route path="playbooks/:playbookId" element={<PlaybookDetailPage />} />
          <Route path="connectors" element={<ConnectorsPage />} />
          <Route path="*" element={<Navigate to="/playbooks" replace />} />
        </Route>
      </Routes>
    </DashboardContext.Provider>
  );
}
