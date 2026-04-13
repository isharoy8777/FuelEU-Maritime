# Reflection

Using AI agents was most effective when I treated them as a fast implementation assistant rather than a source of truth. It was useful for boilerplate, contract tracing, and repetitive fixes across frontend and backend, but every meaningful change still needed validation against the actual codebase.

The biggest efficiency gain came from quickly identifying mismatches between the assignment spec, the existing API contract, and the UI expectations. That saved time compared with manually stepping through each tab and endpoint from scratch. The downside was that some initial assumptions were wrong, especially around response shapes and seeded identifiers, so I had to correct them after running tests and builds.

If I did this again, I would start with stricter contract discovery and make the backend API schema the single source of truth earlier. I would also run validation sooner in the loop to catch typing and payload mismatches before they spread across multiple pages.
