# AI Agent Workflow Log

## Agents Used

- GitHub Copilot

## High-Impact Prompts and Outcomes

- Prompt: Fix runtime crashes in Routes and Banking pages.
  - Outcome: added null-safe rendering and guarded async flows to prevent undefined/null failures.
- Prompt: Align backend/frontend contracts with assignment columns and behavior.
  - Outcome: normalized route/comparison payloads, baseline persistence, and typed client mappings.
- Prompt: Make banking and pooling behavior consistent with data-effect rules.
  - Outcome: banking updates adjusted compliance state; pooling reads adjusted data and persists redistribution snapshots.

## Validation Performed

- Backend tests executed with npm test.
- Frontend build checks executed with npm run build.
- File-level diagnostics run after targeted controller/page edits.

## Corrections Made During Validation

- Fixed id vs routeId baseline matching in comparison flow.
- Corrected comparison baseline row selection and display consistency.
- Stabilized pooling updates to reflect banking-driven adjusted CB and pool redistribution state.
- Addressed type and wiring gaps in API client/shared types.

## Observations

- Biggest time savings came from fast contract tracing across controller, repository, and page layers.
- Most errors came from implicit assumptions about response shape or identifier consistency.
- Tight inspect-edit-validate loops consistently produced safer results than large batched edits.

## Best Practices Followed

- Prefer root-cause fixes over UI-level masking.
- Keep compatibility for existing behavior while evolving APIs.
- Validate immediately after each critical change.
- Keep feature effects explicit to avoid accidental cross-page coupling.
