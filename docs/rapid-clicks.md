# Rapid input in visitor journeys

Three trusted clicks on the same DOM control within 1.2 seconds produce one rapid-input group. A group is counted once; its input may have completed successfully. Different controls with the same label do not form a group.

The existing `rg` event field and `rage_count` database column remain the total group count for compatibility. Their values do not establish frustration or a product failure. The console and generated reports use the neutral label **rapid clicks**.

New behavior carriers also include `props.rc`, a bounded target sample:

```json
{"rc":[{"s":"button.zoom|Zoom in","n":2,"r":1},{"s":"button.connect|Connect","n":1}]}
```

Each `n` counts rapid-input groups, rather than individual clicks. `r: 1` identifies a control deliberately marked as repeatable:

```html
<button data-pvuv-repeatable="true">Zoom in</button>
```

Use this marker for controls such as zoom and undo that support successive actions. The marker preserves ordinary click totals and rapid-input totals. Journeys disclose repeatable controls separately from other controls, without declaring either group a confirmed failure. Consider errors and ineffective-click evidence alongside the input pattern when investigating a visit.

Samples are bounded per carrier, with overflow grouped under `(other)` and long payload samples shortened to fit the existing ingestion limit. The console labels any remaining groups without targets. Historical rows keep their original counts and are never assigned a target based on nearby click totals.

Validation: `npm run test:behavior` and `npm run typecheck`. `npm run build:sdk` builds the SDK and refreshes the console's SDK endpoints. No database migration is needed.
