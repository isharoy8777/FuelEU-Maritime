# FuelEU Maritime

Minimal full-stack FuelEU Maritime compliance platform with a React + TypeScript + TailwindCSS frontend and a Node.js + TypeScript + PostgreSQL backend.

## Overview

The project models FuelEU Maritime route compliance, comparison, banking, and pooling flows with a hexagonal architecture:

- Core domain and use-cases stay framework-free.
- HTTP and database adapters sit at the edges.
- The frontend consumes API contracts from the backend and renders the dashboard tabs.

## Architecture Summary

### Backend

- `Backend/src/core` — domain entities, application use-cases, and ports
- `Backend/src/adapters/inbound/http` — Express controllers
- `Backend/src/adapters/outbound/postgres` — Prisma repositories
- `Backend/src/infrastructure` — server/bootstrap and DB wiring

### Frontend

- `Frontend/src/ui` — React pages, layout, context, and reusable components
- `Frontend/src/adapters/api` — API client
- `Frontend/src/shared` — types and hooks

## Setup & Run

### Backend

```bash
cd Backend
npm install
npm run dev
```

### Frontend

```bash
cd Frontend
npm install
npm run dev
```

## Tests

### Backend

```bash
cd Backend
npm test
```

### Frontend

```bash
cd Frontend
npm run build
```

## Sample API Requests

### Routes

`GET /api/v1/routes`

Response shape:

```json
{
  "success": true,
  "data": [
    {
      "id": "R001",
      "routeId": "R001",
      "vesselName": "Container Alpha",
      "vesselType": "Container",
      "fuelType": "HFO",
      "year": 2024,
      "ghgIntensity": 91,
      "fuelConsumption": 5000,
      "distance": 12000,
      "totalEmissions": 4500,
      "isBaseline": true
    }
  ]
}
```

### Comparison

`GET /api/v1/routes/comparison?baselineId=R001`

### Banking

- `GET /api/v1/compliance/cb?shipId=R001&year=2024`
- `GET /api/v1/banking/records?shipId=R001&year=2024`
- `POST /api/v1/banking/bank`
- `POST /api/v1/banking/apply`

### Pooling

- `GET /api/v1/compliance/adjusted-cb?year=2025`
- `POST /api/v1/pools`

## Screenshots / Sample Output

No screenshots are included in this repository snapshot. The frontend dashboard exposes the four required tabs:

- Routes
- Compare
- Banking
- Pooling

## Notes

- The backend currently supports the existing integration tests and the assignment-aligned frontend payloads.
- Seed data is aligned to the five-route dataset from the brief.
