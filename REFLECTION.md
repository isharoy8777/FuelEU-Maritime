# Reflection

This project succeeded because the implementation loop stayed grounded in real code behavior: inspect current contracts, apply focused changes, then validate immediately.

## What Worked Well

- Fast root-cause tracing across frontend and backend for route/comparison/banking/pooling mismatches.
- Incremental fixes with quick diagnostics reduced regression risk.
- Compatibility-first backend updates allowed the UI and tests to keep working while contracts were improved.

## Key Improvements Completed

- Baseline persistence is now aligned across Routes and Compare.
- Compare behavior is read-only and tied to selected baseline data.
- Banking is ship-driven, with surplus/apply actions persisted and reflected in adjusted CB data.
- Pooling supports live redistribution and persisted member snapshots (cbBefore/cbAfter).
- Fleet-level totals and stronger null-safe rendering were added in the frontend.

## Lessons Learned

- Canonical identifiers must be consistent end-to-end; mixing id and routeId creates subtle UI mismatches.
- Validation must happen continuously, not after batching many edits.
- For cross-page behavior rules, writing explicit data-effect contracts early prevents accidental coupling.

## What I Would Do Earlier Next Time

- Lock API contracts first and generate shared types from the backend shape.
- Add explicit integration tests for page-effect rules:
  - baseline affects compare only
  - banking affects pooling inputs
  - pooling does not mutate compare source data
