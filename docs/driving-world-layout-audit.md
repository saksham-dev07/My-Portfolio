# Driving-world layout audit — 7 October 2026

The audit started with a fresh overhead screenshot of the running source,
including the lower district at camera center (2, -96). Existing changes were
preserved; the main portfolio was not modified.

## Priorities

| Finding | Change | Impact | Cost |
| --- | --- | --- | --- |
| Campus trees sit on or crowd the upper avenue | Move to garden corners outside the car corridor | High | Static placements |
| Extra brick edges intersect the PC and trophy | Remove overlapping edges | High | Fewer meshes and shapes |
| Dense ground rings compete with the About exhibit | Remove secondary courtyard, halo and radial accents | Medium | Fewer draw calls |
| Lower loop lacks an activity | Add ordered clockwise checkpoints and restart | High | Four event-based zones; no extra frame loop |
| Environment feels static | Add slight tree sway only when the camera is nearby | Medium | One bounded callback; disabled for reduced motion |

## Validation

- Existing collision and entry-pad checks pass with the revised placements.
- Path marker clearances include the new checkpoint markings.
- Circuit regression rejects out-of-order checkpoints and requires the finish.
- Browser zone checks progress through START, east, south, west and finish.
- No new model downloads, dependencies, dynamic lights or physics props.
- Existing tree geometry and materials remain shared. Wind changes object refs.
- Production build retains the existing large-chunk warning; no frame-rate
  claim is made without measurement on target hardware.
