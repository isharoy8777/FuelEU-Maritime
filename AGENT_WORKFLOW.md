# AI Agent Workflow Log

## Agents Used
- GitHub Copilot

## Prompts & Outputs
- Example 1: Prompt: "Fix the Routes page crash caused by toLocaleString on undefined values."
  - Output: added a safe number formatter in `RoutesPage` and used it for fuel, distance, and emissions cells.
- Example 2: Prompt: "Make the dashboard data fetching match the FuelEU assignment spec and keep the required columns."
  - Output: I first aligned the backend and frontend contracts, then corrected mismatches found during validation, including legacy comparison support and assignment-shaped route metadata.

## Validation / Corrections
- Verified backend behavior with `npm test` in `Backend`.
- Verified frontend compilation with `npm run build` in `Frontend`.
- Corrected issues exposed by validation:
  - incompatible comparison response shape for existing tests
  - missing Vite CSS type declarations
  - unused imports/state and Tailwind utility warnings
  - routes row typing mismatch after enriching assignment fields

## Observations
- Where agent saved time: rapid tracing of frontend/backend contract mismatches and boilerplate fixes across both layers.
- Where it failed or hallucinated: initial payload assumptions for banking/pooling and comparison data shape did not fully match the existing codebase or tests, so I had to adjust after running validation.
- How tools were combined effectively: I used direct file inspection, backend test execution, and frontend build validation in a tight loop to keep changes aligned with the actual runtime contract.

## Best Practices Followed
- Used a minimal patch set and fixed root causes instead of masking errors in the UI.
- Preserved backward compatibility for the existing integration tests while exposing the assignment-shaped API responses needed by the frontend.
- Validated after each functional change instead of batching blind edits.
