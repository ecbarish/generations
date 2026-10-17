# Larkhaven measured blockout

Open **Play Layout.bat**. WASD/Arrows walk, Shift runs, Tab switches the overhead map view, P switches current geometry versus the proposed west branch, and E inspects a nearby anchor. The installed private pack supplies the animated trainer. A plain blockout marker appears when the optional pack is absent.

This deliberately uses simple blocks to test geography and collision before polished scenery. Larkhaven and Thornwood Trail are extracted from the existing map cells, with their doors, NPC/item anchors, signs and paddock. A two-cell-wide study connector aligns the existing town north exit with the trail south entrance. The source coordinates are retained in `layout.json`; the temporary common display coordinates do not replace runtime exit landings.

**Planned mode** opens one candidate west-edge tile into candidate Millgrass Lane geometry. The Larkburrow mouth stays closed. Dewcut and the north continuation are labels/reserved connections, not implemented destination maps. Current mode restores the old west tree boundary. This is a local study aligned with the existing connected-region graph; it does not turn the old adventure into the full region.

There are no battles, inn/shop interiors, item pickups, NPC dialogue or saves in this blockout. E reports existing roles and future connection requirements for design inspection. Use the separate town study for functioning service/interior examples. No production map or public PCK changes.

Regenerate/check from the repo root:

```text
node docs/research/wildbond-layout/build-plan.cjs
node docs/research/wildbond-layout/checks.cjs
Godot --headless --path wildbond-godot --script res://tests/layout_plan/checks.gd
```

The HTML design board in `docs/research/wildbond-layout/index.html` shows the measured plan, the existing connected-region schematic, and the generated art reference. The measured data and regional graph govern topology; the painting is mood only.
