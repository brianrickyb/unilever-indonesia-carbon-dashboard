# Carbon Ledger implementation plan

Goal: a working separate dashboard for the Unilever Indonesia manufacturing case study.
Architecture: static HTML/CSS and browser ES modules. Pure calculation model shared with Node tests; UI keeps state in memory.
Spec: design.md.

1. Write failing tests for totals, explicit zero vs missing data, rejected invalid input, Scope 3 coverage, and overlapping reduction scenarios.
2. Implement dist/model.mjs (data and calculation functions), then run tests.
3. Create dist/index.html, dist/tokens.css, dist/style.css and dist/app.mjs with an immediately useful overview; serve and show first preview.
4. Complete activity editing, category coverage, reduction sliders, CSV export, methodology and optional read-only WebMCP summary tool.
5. Check UI paths and responsive widths, model tests and syntax. Package and publish the private Site using the native Sites workflow.

Review focus: zero totals never yield NaN; unknown data never becomes zero; scenario savings cannot exceed baseline; text input never becomes HTML; scope categories cannot disagree with activity scope.
