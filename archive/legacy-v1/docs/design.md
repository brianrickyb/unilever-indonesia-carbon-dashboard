> Historical design notes. Superseded for the official-report experience by root design.md and docs/report-data-method.md on 13 October 2026.

# Carbon Ledger — manufacturing dashboard

Separate, dependency-free browser dashboard requested on 6 October 2026. Unilever Indonesia is the case-study context, not the owner or endorser. Default sample quantities and factors are illustrative and clearly identified as such. No figures are portrayed as Unilever's inventory.

Overview, activity editor, reduction planner and methodology are views of one local session. No account, uploads, remote data storage, or external AI service. Users can export an auditable CSV of the current inventory. Refresh resets the session; visible notice explains this. Existing parent project remains untouched.

Calculate activity quantity times kg CO2e per declared activity unit, then divide by 1000 for metric tonnes. Missing quantity/factor is unknown, distinct from explicit zero. Reject non-finite, negative or mismatched inputs. Scope 2 is location-based; market-based reporting is not implemented. Never treat certificates as physical grid-emission reductions. Biogenic CO2 and offsets are outside the calculated total; these require separate accounting.

Represent all 15 Scope 3 categories as calculated, incomplete, not assessed or not applicable. Default scenario assesses purchased goods, upstream freight, waste, business travel and commuting; other categories remain unassessed. Subtotals from known rows are explicitly partial when anything is unknown. Inventory is a screening estimate, not a verified corporate report.

Reduction recommendations are deterministic and linked to activity source groups. Every enabled intervention multiplies affected source emissions by (1-reduction/100), sequentially if multiple interventions target the same source. Display projected gross emissions, avoided emissions, and percentage. Rank actions by standalone impact; no savings or payback claimed without cost data. Estimated impacts are assumptions, not forecasts.

UI: navy sidebar, cool paper, cobalt controls, orange/blue/teal scope colours; Space Grotesk headings and Inter body with system fallbacks. Semantic controls, responsive layout, visible focus, reduced-motion support. No promotional imagery.

Sources: GHG Protocol Corporate Standard; Scope 3 Calculation Guidance; Unilever Indonesia 2025 Sustainability Report. The report states Scope 3 was not yet published. Reference-only sources must not imply the illustrative factors came from those documents.
