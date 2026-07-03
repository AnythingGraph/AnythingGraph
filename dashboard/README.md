# AnythingGraph Dashboard

A React + Material UI web dashboard for `ag-cli`. It reads everything from the local
**reasoning-service** HTTP API — it does **not** define any of its own endpoints.

## Features

- **Left menu bar** with two sections: **Playbooks** and **Connectors**.
- **Playbooks** landing page listing every playbook, with a detail page per playbook that
  renders an interactive graph of entities and relationships.
- **Connectors** page listing every configured data source (PostgreSQL, MySQL, Salesforce,
  MongoDB, CSV, REST…) with its connection status.

## Prerequisites

The `ag-cli` reasoning-service must be running (default `http://127.0.0.1:8787`), e.g. via
`./start-all.sh` in the parent `ag-cli` folder.

## Getting started

```bash
cd dashboard
npm install
npm run dev
```

The dev server opens at `http://localhost:5173`.

## Configuration

The reasoning-service base URL defaults to `http://127.0.0.1:8787`. To override it, copy
`.env.example` to `.env` and set `VITE_AG_API_BASE`.

## Reused API endpoints

| UI area | Endpoint |
| --- | --- |
| Connection status | `GET /health` |
| Playbooks list | `GET /playbooks` + `GET /playbooks/{id}/context` |
| Playbook graph / detail | `GET /playbooks/{id}/context` |
| Connectors | `GET /sources` |
| Reload button | `POST /catalog/reload` |
