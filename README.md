# FuelEU Maritime

Full-stack FuelEU Maritime compliance dashboard built with React + TypeScript frontend and Node.js + TypeScript + Prisma backend.

## Project Status

Project implementation is complete for the core assignment flows:

- Routes baseline selection
- Compare against selected baseline
- Banking surplus/apply actions
- Pooling redistribution with persisted pool members

## Final Data-Effect Rules

The implementation follows this page-level data contract:

- Routes: changing baseline affects Compare only
- Compare: read-only, no writes
- Banking: updates banking/compliance state and impacts Pooling inputs
- Pooling: performs redistribution for pooling view/history and does not rewrite Compare baseline/raw data

## Architecture

### Backend

- Backend/src/core: domain models, use-cases, ports
- Backend/src/adapters/inbound/http: Express controllers
- Backend/src/adapters/outbound/postgres: Prisma repositories
- Backend/src/infrastructure: app bootstrap, routing, DB client

### Frontend

- Frontend/src/ui/pages: Routes, Compare, Banking, Pooling
- Frontend/src/adapters/api: typed API client
- Frontend/src/shared: app types and async hooks

## Run Locally

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

## Verify

```bash
cd Backend
npm test
```

```bash
cd Frontend
npm run build
```

## API Endpoints

### Routes + Compare

- GET /api/v1/routes
- POST /api/v1/routes/:id/baseline
- GET /api/v1/routes/comparison?baselineId=<shipId>

### Banking

- GET /api/v1/compliance/cb?shipId=<shipId>&year=<year>
- GET /api/v1/banking/records?shipId=<shipId>&year=<year>
- GET /api/v1/banking/totals?year=<year>
- POST /api/v1/banking/bank
- POST /api/v1/banking/apply

### Pooling

- GET /api/v1/compliance/adjusted-cb?year=<year>
- GET /api/v1/pools
- POST /api/v1/pools

## Notes

- Baseline selection is persisted in routes and consumed by compare.
- Compare uses original route data and baseline reference.
- Banking actions persist compliance delta updates and are reflected in adjusted CB feeds.
- Pooling stores member-level cbBefore/cbAfter redistribution snapshots.
