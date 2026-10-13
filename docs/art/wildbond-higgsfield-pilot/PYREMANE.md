# Cindercub → Pyremane: testing the promised crown

**Update:** Evan approved the Crown Mantle payoff direction. EVO-0's newer plan uses a new middle and retains Blazefang as the final name; [STARTER-STAGES.md](STARTER-STAGES.md) applies this visual direction to that planned final while preserving the original Pyremane source file and historical report.

The live Godot line is **Cindercub → Blazefang → Pyremane**. Blazefang is a middle stage. This test implements Evan's art-review rule, not a gameplay change.

**Promise:** Cindercub's modest ember ruff gathers around its shoulders like a crown that has not opened yet.

**Payoff:** Pyremane's ruff opens into a broad crown of fire that transforms the wolf's whole outline, with a powerful protective stance and plume tail; the familiar muzzle and pale chest blaze retain the same individual's identity.

## Three attempts and an honest result

| Candidate | Verdict |
|---|---|
| Hearth Crown | Insufficient final transformation. Attractive mature wolf, but too similar to the Blazefang study. |
| Storm Standard | Insufficient final transformation. Swept flame fur helps, but is still the same grown-wolf silhouette with more decoration. |
| Crown Mantle | Strongest direction: the crown frames the head and shoulders, alters the outline at equal height and visibly fulfils the base's ruff promise. Needs a clean consistent family model sheet before production. |

The first two used the generated starter sheet as an image reference. The third used a specific written anatomy/silhouette brief without an image reference, reducing the tendency to reproduce its composition. It also shifted from pixel-styled rendering toward a more illustrative finish. That is evidence of a useful silhouette direction, not approval of a new rendering style.

## Corrections before approval

- Reconcile base, middle and final ear/muzzle proportions from one individual identity sheet; the generated base's pointed ears disagree with its round-ear data brief.
- Map the original spots into the final chevrons deliberately, rather than accepting random generated markings.
- Keep the pale muzzle and chest blaze recognisable through all stages.
- Redraw the crown's three major masses consistently in side and rear views; establish its actual shoulder attachment and motion before animation.
- Harmonise the rendering style, colour ramps and outline with the rest of Wildbond; the selected image is a design reference, not a finished pixel sprite.
- Resolve alpha halos and model/animation production separately. No generated portrait supplies a mesh, rig or collision footprint.

The next approved drawing should show all three stages together and the endpoints alone at equal height. If the final reads only as a larger animal when reduced to a silhouette, revise it again.

## Review and evidence

Open [the endpoint comparison](review.html?family=pyremane). The middle is deliberately absent, so it cannot do the work of connecting base and final for the viewer. Colour, greyscale and silhouette modes are available at multiple sizes.

Sources, exact prompts and job IDs are in `pyremane/provenance.json`; hashes/bounds are in `pyremane/audit.json`. Three images were generated at an estimated total of 8.25 credits. No game code, evolution links or stats changed.
