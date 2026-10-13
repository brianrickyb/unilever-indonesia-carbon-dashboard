> Historical design notes. Superseded for the official-report experience by root design.md and docs/report-data-method.md on 13 October 2026.

# Week 7 capstone alignment

Reference: Dr. Eng. Niki Prastomo, Preparing the Capstone Project (2026), supplied PDF. This document maps the presentation's guidance to the existing independent manufacturing dashboard. It does not treat the presentation as instructions to upload data or claim official Unilever results.

| Presentation guidance | Dashboard implementation | Evidence still needed |
| --- | --- | --- |
| Problem statement, slides 5 and 17 | Insights & readiness describes the management decision and manufacturing context | Validate the actual stakeholder problem with the company |
| Clean dataset, slide 6 | Unit validation, missing-input checks, source notes, duplicate screening, rectangular Tableau CSV | Verified company activity records and appropriate factor references |
| Defensible calculation, slide 7 | Quantity × kg CO2e/unit ÷ 1,000; scope aggregation; unknowns excluded; tested scenario compounding | Verify real boundary, category assignments, factor gas coverage and GWP versions |
| At least 5 indicators, slide 4 | Total, three scopes, intensity, production, category coverage, avoided emissions | Consistent production denominator |
| At least 3 visualizations, slides 4 and 8 | Scope donut, source bars, treemap and scenario waterfall | Actual data before conclusions about Unilever |
| Trend chart, slide 8 | Two-period total trend and scope comparison, gated by documented adjacent baseline and confirmed comparability | Actual previous-year subtotals using the same source coverage and method |
| Red flags, slide 12 | >10% total and >15% Scope 2 change; missing data/source notes; duplicate, illustrative and coverage warnings | These are project screening rules, not legal thresholds. Three-period sustained-rise detection is not included |
| Three insights, slides 9–11 | Live hotspot, scope concentration and evidence-limit insights with observation, implication and next step | Interpret actual patterns with operational context; model does not infer causality |
| Three recommendations, slides 13–15 | Ranked standalone potential, proposed owner, first 30-day action, metric, scenario target and implementation window | Feasibility, cost, ownership agreement and actual results |
| Seven-slide story, slides 16–18 | In-app draft export and saved Markdown outline | Team names, final screenshots, verified evidence and final slide design |

## Design decisions

Preserve the established HTML/CSS/JavaScript architecture and existing analytics. Keep new assessment logic in `dist/capstone-model.mjs` and presentation rendering in `dist/capstone.mjs`, with responsive styling in `dist/capstone.css`.

Do not fabricate prior-year data. Comparable means the same organizational boundary, activity coverage, reporting period length and accounting method, including location-based Scope 2. An official complete inventory cannot be meaningfully compared to this partial sample. Editing inventory or company settings revokes the user's comparison confirmation; the values remain available for review.

Duplicates are candidates with matching normalized activity name, scope, category, source group, quantity, units and factor; they are not automatically removed. Real duplicate detection ultimately requires source record identifiers and human review.

Scope 3 category coverage counts categories with calculated rows, not complete categories. User-supplied factor status does not imply independent verification. Recommendations are proposals and rank by standalone emissions potential, not by financial return or feasibility.

## Validation

Run `npm test` (19 tests) and syntax checks for the changed modules. Browser checks cover the empty baseline, adding a comparable baseline, correct YoY values and flags, export previews, and narrow-screen layout. State remains session-only; export before refresh. Baseline notes are included in the generated presentation outline only when comparison is valid; the Tableau dataset contains the current activity inventory.
