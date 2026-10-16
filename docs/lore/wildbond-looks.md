# Wildbond species appearance contract (WD2 data)

These are drawing instructions, not new creature lore or a gameplay change. All 107 current species, including the three ranch hybrids, have explicit species-level `shape` and `look` metadata. Families, elements, colours, dex entries, stats and moves remain authoritative and unchanged. Existing individual variants remain independent.

## Renderer handoff

The Godot exporter already serialises these fields with SPECIES. The renderer currently uses `shape`; it does **not** draw the new `look` parts yet. Claude can adopt them incrementally without changing saves. Never persist the hints in a creature instance: resolve them from its species when drawing. Unknown look tokens should fall back to the ordinary body, rather than hiding the creature. Browser drawing remains unchanged.

`look` has four finite, symbolic part selectors. They describe structure, not exact pixel coordinates; the artist chooses placement and scale for the body. `head` includes ears, antennae, crests or jaw/tusks; `back` includes a mane, shell, canopy, wings or orbit; `tail` selects a silhouette ending; `pattern` selects a body marking. Use the existing species colour as the base and lighter/darker shades of it for markings. An ember part need not become a literal fire emitter; a warm jagged outline can convey it. An orbit is a sprite's surrounding particles, not equipment.

## Design

Young creatures have compact features that grow in their evolved forms: Cindercub's ruff becomes Blazefang's mane; Mosshog's moss bed becomes Thornback's raised thorns; Saillet's small sail expands before Stormfrill's sheltering frill. Different species remain recognisable even without their elemental colours. Regional details draw on existing dex descriptions: Ventwhisk's copper tail, Poolkit's rain rings, Bellmote's bell crown and Orchardroot's canopy. Guardians have strong outlines without adding new powers or story claims. Every shape/feature combination is unique, including hybrids.

The eleven present species assigned the new serpent, turtle, moth or treefolk bodies retain Claude's assignments. The renderer also lists Deeptide, which is not in the current browser SPECIES table; this task does not invent it. Fish remains future work.

## Vocabulary

- **head**: `bell-crown`, `branch-antlers`, `branch-crest`, `broad-crest`, `bubble-cheeks`, `bubble-crown`, `clay-beak`, `curved-tusks`, `ember-antlers`, `ember-fangs`, `feather-antennae`, `feather-crest`, `fin-crest`, `fin-ears`, `folded-ears`, `frilled-cheeks`, `glass-beak`, `glass-crest`, `glowing-tusks`, `lantern-crest`, `lantern-crown`, `leaf-crest`, `leaf-ears`, `long-tusks`, `long-whiskers`, `low-brow`, `moss-brow`, `pebble-crown`, `pennant-crest`, `pointed-cheeks`, `pointed-ears`, `reed-crest`, `round-cheeks`, `round-crest`, `round-ears`, `seed-beak`, `seed-fangs`, `short-tusks`, `small-fangs`, `stone-beak`, `stone-crown`, `stone-fangs`, `stone-jaw`, `sun-rays`, `swept-cheeks`, `swept-crest`, `swept-ears`, `tall-ears`, `tassel-antennae`, `tassel-crown`, `thorn-antlers`, `tufted-ears`, `wide-cheeks`.
- **back**: `ash-collar`, `beacon-orbit`, `broad-sail`, `broad-wings`, `cairn-ridge`, `cloud-mane`, `crust-plates`, `crystal-ridge`, `dew-collar`, `echo-mane`, `ember-ruff`, `ember-spots`, `fern-ruff`, `fin-ridge`, `flame-mane`, `flower-canopy`, `flower-mane`, `foam-orbit`, `glass-wings`, `keel-ridge`, `leaf-mane`, `leaf-wings`, `light-orbit`, `mist-ruff`, `mist-wings`, `moss-bed`, `narrow-wings`, `orchard-canopy`, `reed-bed`, `reed-ridge`, `sand-ruff`, `seed-bed`, `shaggy-ruff`, `shell-plates`, `silk-collar`, `small-sail`, `smooth`, `soft-ruff`, `soft-wings`, `soil-bed`, `spark-orbit`, `spray-mane`, `spray-ruff`, `steam-orbit`, `steam-ruff`, `stone-canopy`, `stone-mane`, `stone-paws`, `stone-ruff`, `storm-sail`, `sun-sail`, `thorn-ridge`, `wave-mane`, `wave-ridge`, `willow-canopy`, `wind-mane`.
- **tail**: `brush`, `copper`, `curled`, `fan`, `fin`, `forked`, `hook`, `lantern`, `paddle`, `plume`, `reed`, `ribbon`, `root`, `stub`, `tapered`, `tassel`, `thread`.
- **pattern**: `bands`, `bars`, `chevrons`, `cracks`, `diamonds`, `ink`, `mottled`, `rays`, `rings`, `saddle`, `socks`, `speckles`, `spots`, `swirls`, `vines`.

## Species contact sheet

| Species | Shape | Head | Back | Tail | Marking |
|---|---|---|---|---|---|
| cindercub | wolf | round-ears | ember-ruff | curled | spots |
| blazefang | wolf | pointed-ears | flame-mane | plume | chevrons |
| ripplet | lizard | bubble-cheeks | smooth | paddle | rings |
| tidewyrm | serpent | fin-crest | wave-ridge | fin | bands |
| mosshog | boar | short-tusks | moss-bed | stub | speckles |
| thornback | boar | long-tusks | thorn-ridge | stub | chevrons |
| glimmerwing | bird | glass-crest | glass-wings | forked | bars |
| pebblepaw | cat | round-ears | stone-paws | curled | socks |
| duskweaver | spider | small-fangs | silk-collar | thread | diamonds |
| bogsnap | croc | low-brow | reed-ridge | paddle | mottled |
| emberling | lizard | round-cheeks | ember-spots | tapered | spots |
| gnawhound | hyena | tall-ears | shaggy-ruff | brush | saddle |
| sunspark | sprite | sun-rays | light-orbit | ribbon | rays |
| galefoal | horse | swept-ears | wind-mane | ribbon | socks |
| elderhorn | horse | branch-antlers | leaf-mane | plume | vines |
| brineskit | lizard | wide-cheeks | shell-plates | paddle | speckles |
| shoalcrest | croc | fin-crest | wave-ridge | paddle | bars |
| dunepounce | cat | pointed-ears | sand-ruff | hook | bands |
| reedtusk | boar | curved-tusks | reed-bed | stub | bars |
| wrackjaw | hyena | stone-jaw | shell-plates | brush | speckles |
| kiteskirl | bird | swept-crest | narrow-wings | forked | chevrons |
| spindriftfoal | horse | swept-ears | spray-mane | ribbon | rings |
| foamglint | sprite | bubble-crown | foam-orbit | ribbon | rings |
| breakwatermane | wolf | fin-ears | wave-mane | fin | chevrons |
| slaglet | boar | short-tusks | crust-plates | stub | cracks |
| kilntusk | boar | glowing-tusks | crust-plates | brush | cracks |
| cragskein | spider | stone-fangs | crystal-ridge | thread | cracks |
| ventwhisk | cat | long-whiskers | steam-ruff | copper | bands |
| thermwing | bird | swept-crest | broad-wings | fan | rays |
| screegrin | hyena | stone-jaw | stone-ruff | brush | bars |
| glowmote | sprite | sun-rays | steam-orbit | ribbon | speckles |
| hearthcrown | horse | ember-antlers | flame-mane | plume | cracks |
| mistfinch | bird | round-crest | mist-wings | fan | speckles |
| cloudharrier | bird | swept-crest | broad-wings | forked | bands |
| cirrusmane | horse | swept-ears | cloud-mane | plume | swirls |
| shalecat | cat | pointed-ears | stone-ruff | hook | cracks |
| fogtail | cat | round-ears | mist-ruff | lantern | mottled |
| pallweaver | spider | small-fangs | silk-collar | thread | bars |
| gritbeak | bird | stone-beak | narrow-wings | fan | cracks |
| lanternwisp | sprite | lantern-crown | light-orbit | ribbon | bars |
| lanterncrest | bird | lantern-crest | broad-wings | fan | rays |
| reedlet | lizard | reed-crest | smooth | reed | bars |
| ferrycrest | croc | broad-crest | wave-ridge | paddle | chevrons |
| siltjaw | turtle | moss-brow | shell-plates | paddle | mottled |
| rillwhisk | serpent | long-whiskers | fin-ridge | fin | rings |
| orchardroot | treefolk | branch-antlers | orchard-canopy | root | vines |
| gustreed | bird | reed-crest | narrow-wings | ribbon | bars |
| duskcord | spider | seed-fangs | silk-collar | thread | vines |
| glassbill | bird | glass-beak | glass-wings | forked | rings |
| stillwake | croc | broad-crest | smooth | fin | rings |
| hushpup | hyena | tall-ears | soft-ruff | brush | socks |
| hushmane | hyena | tall-ears | echo-mane | brush | chevrons |
| umbrelace | spider | small-fangs | silk-collar | thread | swirls |
| flintroot | treefolk | stone-crown | stone-canopy | root | cracks |
| ledgewhisk | cat | long-whiskers | smooth | hook | socks |
| bellmote | sprite | bell-crown | light-orbit | tassel | rings |
| dripdart | lizard | round-cheeks | smooth | tapered | rings |
| chimespark | sprite | bell-crown | spark-orbit | tassel | rays |
| undertone | hyena | folded-ears | echo-mane | brush | bands |
| clovercolt | horse | leaf-ears | leaf-mane | ribbon | spots |
| bloomcourser | horse | leaf-ears | flower-mane | plume | vines |
| tilthtusk | boar | curved-tusks | soil-bed | stub | vines |
| hemglow | sprite | tassel-crown | light-orbit | tassel | bars |
| pennantlark | bird | pennant-crest | broad-wings | ribbon | chevrons |
| ribbonstride | horse | swept-ears | wind-mane | ribbon | chevrons |
| dawntassel | moth | tassel-antennae | broad-wings | tassel | rays |
| meadowmantle | treefolk | branch-antlers | flower-canopy | root | vines |
| shoalpup | wolf | round-ears | spray-ruff | paddle | socks |
| soundhowl | wolf | fin-ears | wave-mane | paddle | rings |
| keeljaw | croc | low-brow | keel-ridge | paddle | bars |
| chartwing | bird | swept-crest | narrow-wings | forked | spots |
| moorweft | spider | stone-fangs | silk-collar | thread | speckles |
| inkwhisk | cat | long-whiskers | smooth | hook | ink |
| buoyglint | sprite | lantern-crown | light-orbit | tassel | bars |
| isleglimmer | sprite | pebble-crown | spark-orbit | ribbon | spots |
| watchlight | sprite | lantern-crown | beacon-orbit | ribbon | rays |
| fernruff | wolf | leaf-ears | fern-ruff | brush | vines |
| briarwatch | wolf | leaf-ears | thorn-ridge | plume | vines |
| poolkit | cat | round-ears | spray-ruff | curled | rings |
| rilllynx | cat | tufted-ears | spray-ruff | hook | rings |
| hearthlaugh | hyena | tall-ears | ember-ruff | brush | rays |
| cairnclasp | turtle | stone-crown | shell-plates | stub | cracks |
| bogbough | turtle | moss-brow | willow-canopy | paddle | vines |
| tumbletusk | boar | short-tusks | seed-bed | curled | swirls |
| slatehoof | horse | swept-ears | stone-mane | brush | cracks |
| kilnchirp | bird | clay-beak | narrow-wings | fan | socks |
| dewspinner | spider | small-fangs | dew-collar | thread | rings |
| veilmote | moth | feather-antennae | soft-wings | tassel | mottled |
| flintpup | wolf | round-ears | stone-ruff | stub | cracks |
| cairnhound | wolf | pointed-ears | cairn-ridge | brush | cracks |
| ridgewarden | wolf | tufted-ears | cairn-ridge | plume | chevrons |
| seedpip | bird | seed-beak | narrow-wings | fan | spots |
| hedgelark | bird | leaf-crest | leaf-wings | forked | vines |
| boughchorus | bird | branch-crest | leaf-wings | plume | vines |
| saillet | lizard | round-cheeks | small-sail | tapered | bars |
| draftscale | lizard | swept-cheeks | broad-sail | ribbon | bars |
| stormfrill | lizard | frilled-cheeks | storm-sail | ribbon | chevrons |
| sunfrill | lizard | frilled-cheeks | sun-sail | ribbon | rays |
| fogsail | moth | feather-antennae | mist-wings | ribbon | bands |
| cinderstitch | spider | ember-fangs | ash-collar | thread | chevrons |
| laughrill | hyena | folded-ears | spray-ruff | brush | rings |
| fordfoal | horse | swept-ears | spray-mane | brush | socks |
| lynxhound | cat | tufted-ears | shaggy-ruff | brush | saddle |
| drakelet | lizard | feather-crest | narrow-wings | tapered | bars |
| bramblestag | horse | thorn-antlers | thorn-ridge | brush | vines |
