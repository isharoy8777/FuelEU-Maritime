# FuelEU Maritime Frontend

React + TypeScript + Vite dashboard for FuelEU Maritime compliance workflows.

## Pages

- Routes: browse fleet data and set baseline
- Compare: baseline-relative read-only comparison
- Banking: bank/apply credits per ship
- Pooling: configure and review compliance balance redistribution

## Run

```bash
npm install
npm run dev
```

The app expects the backend API to be available at /api/v1 via Vite proxy.

## Build

```bash
npm run build
```

## Data Behavior

- Baseline changes affect Compare only.
- Banking writes affect Banking and Pooling adjusted inputs.
- Pooling records redistribution snapshots for pool history display.
- Compare remains based on original route/baseline data.
